import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, AlertTriangle, CheckCircle, ArrowLeft, Sparkles, HelpCircle, User, Calendar, MapPin, AlertCircle, Key, ChevronDown, ChevronUp, ShoppingCart, Lock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import backend from '~backend/client';
import type { GenerateRecommendationsRequest } from '~backend/ai/generate-recommendations';
import type { FollowUpAssistanceRequest } from '~backend/ai/follow-up-assistance';

const CONCERN_TYPES = [
  'Academic',
  'Attendance', 
  'Behavior',
  'Social/Emotional',
  'Peer Relationships',
  'Family/Home'
];

const SEVERITY_LEVELS = [
  { value: 'mild', label: 'Mild – Needs classroom support' },
  { value: 'moderate', label: 'Moderate – Needs Tier 2 intervention' },
  { value: 'urgent', label: 'Urgent – Immediate follow-up needed' }
];

const ACTIONS_TAKEN = [
  'Talked with student',
  'Contacted parent',
  'Documented only'
];

export function ReferralForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    studentFirstName: '',
    studentLastInitial: '',
    grade: '',
    teacher: '',
    teacherPosition: '',
    incidentDate: '',
    location: '',
    concernTypes: [] as string[],
    otherConcernType: '',
    concernDescription: '',
    severityLevel: '',
    actionsTaken: [] as string[],
    otherActionTaken: ''
  });
  
  const [recommendations, setRecommendations] = useState<string>('');
  const [disclaimer, setDisclaimer] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [savedSupportRequestId, setSavedSupportRequestId] = useState<number | null>(null);
  
  // Follow-up assistance state
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [followUpAssistance, setFollowUpAssistance] = useState<string>('');
  const [followUpDisclaimer, setFollowUpDisclaimer] = useState<string>('');
  const [isGeneratingFollowUp, setIsGeneratingFollowUp] = useState(false);
  const [hasFollowUpAssistance, setHasFollowUpAssistance] = useState(false);
  
  // Mobile UI state
  const [expandedSections, setExpandedSections] = useState({
    student: true,
    incident: true,
    teacher: true,
    recommendations: false,
    followUp: false
  });
  
  const { toast } = useToast();

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasGenerated(false);
    setHasSaved(false);
    setHasFollowUpAssistance(false);
  };

  const handleConcernTypeChange = (concernType: string, checked: boolean) => {
    const updatedTypes = checked 
      ? [...formData.concernTypes, concernType]
      : formData.concernTypes.filter(type => type !== concernType);
    handleInputChange('concernTypes', updatedTypes);
  };

  const handleActionTakenChange = (action: string, checked: boolean) => {
    const updatedActions = checked 
      ? [...formData.actionsTaken, action]
      : formData.actionsTaken.filter(a => a !== action);
    handleInputChange('actionsTaken', updatedActions);
  };

  const generateRecommendations = async () => {
    if (!formData.studentFirstName || !formData.studentLastInitial || !formData.grade || 
        !formData.teacher || !formData.teacherPosition || !formData.incidentDate ||
        !formData.location || formData.concernTypes.length === 0 || !formData.concernDescription ||
        !formData.severityLevel) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields before generating recommendations.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const request: GenerateRecommendationsRequest = {
        studentFirstName: formData.studentFirstName,
        studentLastInitial: formData.studentLastInitial,
        grade: formData.grade,
        teacher: formData.teacher,
        teacherPosition: formData.teacherPosition,
        incidentDate: formData.incidentDate,
        location: formData.location,
        concernTypes: formData.concernTypes,
        otherConcernType: formData.otherConcernType || undefined,
        concernDescription: formData.concernDescription,
        severityLevel: formData.severityLevel,
        actionsTaken: formData.actionsTaken,
        otherActionTaken: formData.otherActionTaken || undefined
      };

      const response = await backend.ai.generateRecommendations(request);
      setRecommendations(response.recommendations);
      setDisclaimer(response.disclaimer);
      setHasGenerated(true);
      setHasSaved(false);
      setHasFollowUpAssistance(false);
      setFollowUpQuestion('');
      setFollowUpAssistance('');
      
      // Auto-expand recommendations section on mobile
      setExpandedSections(prev => ({ ...prev, recommendations: true }));
      
      toast({
        title: "Recommendations Generated",
        description: "AI recommendations have been generated successfully."
      });
    } catch (error) {
      console.error('Error generating recommendations:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate recommendations. Please try again.";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateFollowUpAssistance = async () => {
    if (!followUpQuestion.trim()) {
      toast({
        title: "Missing Question",
        description: "Please enter a specific question about implementing the interventions.",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingFollowUp(true);
    try {
      const request: FollowUpAssistanceRequest = {
        originalRecommendations: recommendations,
        specificQuestion: followUpQuestion,
        studentFirstName: formData.studentFirstName,
        studentLastInitial: formData.studentLastInitial,
        grade: formData.grade,
        concernTypes: formData.concernTypes,
        severityLevel: formData.severityLevel
      };

      const response = await backend.ai.followUpAssistance(request);
      setFollowUpAssistance(response.assistance);
      setFollowUpDisclaimer(response.disclaimer);
      setHasFollowUpAssistance(true);
      
      toast({
        title: "Follow-up Assistance Generated",
        description: "Additional implementation guidance has been generated."
      });
    } catch (error) {
      console.error('Error generating follow-up assistance:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate follow-up assistance. Please try again.";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsGeneratingFollowUp(false);
    }
  };

  const saveSupportRequest = async () => {
    if (!hasGenerated) {
      toast({
        title: "Generate Recommendations First",
        description: "Please generate AI recommendations before saving the support request.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const finalRecommendations = hasFollowUpAssistance 
        ? `${recommendations}\n\n--- FOLLOW-UP ASSISTANCE ---\n\nTeacher's Question: ${followUpQuestion}\n\nAdditional Guidance:\n${followUpAssistance}`
        : recommendations;

      const response = await backend.referrals.create({
        studentFirstName: formData.studentFirstName,
        studentLastInitial: formData.studentLastInitial,
        grade: formData.grade,
        teacher: formData.teacher,
        teacherPosition: formData.teacherPosition,
        incidentDate: formData.incidentDate,
        location: formData.location,
        concernTypes: formData.concernTypes,
        otherConcernType: formData.otherConcernType || undefined,
        concernDescription: formData.concernDescription,
        severityLevel: formData.severityLevel,
        actionsTaken: formData.actionsTaken,
        otherActionTaken: formData.otherActionTaken || undefined,
        aiRecommendations: finalRecommendations
      });

      setHasSaved(true);
      setSavedSupportRequestId(response.id);
      toast({
        title: "Support Request Saved",
        description: "The support request form has been saved successfully."
      });
    } catch (error) {
      console.error('Error saving support request:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save support request. Please try again.";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      studentFirstName: '',
      studentLastInitial: '',
      grade: '',
      teacher: '',
      teacherPosition: '',
      incidentDate: '',
      location: '',
      concernTypes: [],
      otherConcernType: '',
      concernDescription: '',
      severityLevel: '',
      actionsTaken: [],
      otherActionTaken: ''
    });
    setRecommendations('');
    setDisclaimer('');
    setHasGenerated(false);
    setHasSaved(false);
    setSavedSupportRequestId(null);
    setFollowUpQuestion('');
    setFollowUpAssistance('');
    setFollowUpDisclaimer('');
    setHasFollowUpAssistance(false);
    
    // Reset expanded sections
    setExpandedSections({
      student: true,
      incident: true,
      teacher: true,
      recommendations: false,
      followUp: false
    });
  };

  const formatRecommendations = (text: string) => {
    const lines = text.split('\n');
    const formattedLines = lines.map((line, index) => {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) return null;
      
      // Check for follow-up assistance section
      if (trimmedLine === '--- FOLLOW-UP ASSISTANCE ---') {
        return (
          <div key={index} className="border-t border-blue-300 mt-6 pt-6">
            <h3 className="text-lg font-semibold text-blue-700 mb-3">
              Follow-up Implementation Assistance
            </h3>
          </div>
        );
      }
      
      if (trimmedLine.startsWith('Teacher\'s Question:')) {
        return (
          <div key={index} className="bg-blue-50 p-3 rounded-lg mb-3">
            <h4 className="text-sm font-medium text-blue-800 mb-1">Teacher's Question:</h4>
            <p className="text-sm text-blue-700">{trimmedLine.replace('Teacher\'s Question:', '').trim()}</p>
          </div>
        );
      }
      
      if (trimmedLine === 'Additional Guidance:') {
        return (
          <h4 key={index} className="text-base font-medium text-gray-800 mt-3 mb-2">
            Additional Guidance:
          </h4>
        );
      }
      
      // Main headings
      if (trimmedLine.startsWith('##') || trimmedLine.startsWith('# ')) {
        return (
          <h3 key={index} className="text-lg font-semibold text-gray-900 mt-6 mb-3 first:mt-0">
            {trimmedLine.replace(/^#+\s*/, '')}
          </h3>
        );
      }
      
      // Sub-headings
      if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
        return (
          <h4 key={index} className="text-base font-medium text-gray-800 mt-4 mb-2">
            {trimmedLine.replace(/\*\*/g, '')}
          </h4>
        );
      }
      
      // Numbered lists
      if (/^\d+\./.test(trimmedLine)) {
        return (
          <div key={index} className="mb-2">
            <span className="font-medium text-gray-900">{trimmedLine}</span>
          </div>
        );
      }
      
      // Bullet points
      if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('• ')) {
        return (
          <div key={index} className="ml-4 mb-1 flex items-start">
            <span className="text-gray-400 mr-2 mt-1.5 text-xs">•</span>
            <span className="text-gray-700">{trimmedLine.replace(/^[-•]\s*/, '')}</span>
          </div>
        );
      }
      
      // Regular paragraphs
      return (
        <p key={index} className="text-gray-700 mb-3 leading-relaxed">
          {trimmedLine}
        </p>
      );
    }).filter(Boolean);
    
    return formattedLines;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-8">
        {/* Back Button */}
        <div className="flex items-center">
          <Link 
            to="/" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 font-medium transition-colors hover:bg-white/60 px-3 py-2 rounded-xl touch-manipulation active:scale-95"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </div>

        {/* Header */}
        <div className="text-center relative">
          {/* Decorative elements - hidden on mobile */}
          <div className="hidden sm:block absolute top-0 left-1/4 w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-20 animate-pulse"></div>
          <div className="hidden sm:block absolute top-5 right-1/3 w-12 h-12 bg-gradient-to-br from-pink-400 to-orange-500 rounded-full opacity-20 animate-pulse delay-1000"></div>
          
          <div className="relative">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl sm:rounded-3xl shadow-xl mb-3 sm:mb-4">
              <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Student Concern Form
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              For AI-Generated Tier 2 Interventions
            </p>
          </div>
        </div>

        {/* Student Information */}
        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl sm:rounded-3xl overflow-hidden">
          <CardHeader 
            className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded-t-2xl sm:rounded-t-3xl cursor-pointer touch-manipulation active:scale-[0.99] transition-transform sm:cursor-default"
            onClick={() => toggleSection('student')}
          >
            <CardTitle className="flex items-center justify-between text-lg sm:text-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center">
                  <User className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                Student Information
              </div>
              <div className="sm:hidden">
                {expandedSections.student ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className={`p-4 sm:p-6 space-y-4 sm:space-y-6 ${expandedSections.student ? 'block' : 'hidden sm:block'}`}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="grade" className="text-sm font-medium text-gray-700">
                  Grade *
                </Label>
                <Input
                  id="grade"
                  value={formData.grade}
                  onChange={(e) => handleInputChange('grade', e.target.value)}
                  placeholder="e.g., 3rd, 7th, 11th"
                  className="border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500 text-base touch-manipulation"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                  First Name *
                </Label>
                <Input
                  id="firstName"
                  value={formData.studentFirstName}
                  onChange={(e) => handleInputChange('studentFirstName', e.target.value)}
                  placeholder="Enter first name"
                  className="border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500 text-base touch-manipulation"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastInitial" className="text-sm font-medium text-gray-700">
                  Last Initial *
                </Label>
                <Input
                  id="lastInitial"
                  value={formData.studentLastInitial}
                  onChange={(e) => handleInputChange('studentLastInitial', e.target.value)}
                  placeholder="Enter last initial"
                  maxLength={1}
                  className="border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500 text-base touch-manipulation"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Incident/Concern */}
        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl sm:rounded-3xl overflow-hidden">
          <CardHeader 
            className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white rounded-t-2xl sm:rounded-t-3xl cursor-pointer touch-manipulation active:scale-[0.99] transition-transform sm:cursor-default"
            onClick={() => toggleSection('incident')}
          >
            <CardTitle className="flex items-center justify-between text-lg sm:text-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                Incident/Concern
              </div>
              <div className="sm:hidden">
                {expandedSections.incident ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className={`p-4 sm:p-6 space-y-4 sm:space-y-6 ${expandedSections.incident ? 'block' : 'hidden sm:block'}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="incidentDate" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date *
                </Label>
                <Input
                  id="incidentDate"
                  type="date"
                  value={formData.incidentDate}
                  onChange={(e) => handleInputChange('incidentDate', e.target.value)}
                  className="border-gray-200 rounded-xl focus:border-orange-500 focus:ring-orange-500 text-base touch-manipulation"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location *
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="e.g., Classroom, Cafeteria, Hallway"
                  className="border-gray-200 rounded-xl focus:border-orange-500 focus:ring-orange-500 text-base touch-manipulation"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-sm font-medium text-gray-700">
                Type of Concern (check one or more) *
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {CONCERN_TYPES.map((type) => (
                  <div key={type} className="flex items-center space-x-3 p-3 sm:p-3 rounded-xl bg-gradient-to-r from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 transition-colors touch-manipulation active:scale-95">
                    <Checkbox
                      id={`concern-${type}`}
                      checked={formData.concernTypes.includes(type)}
                      onCheckedChange={(checked) => handleConcernTypeChange(type, checked as boolean)}
                      className="rounded-lg"
                    />
                    <Label htmlFor={`concern-${type}`} className="text-sm text-gray-700 font-medium cursor-pointer">
                      {type}
                    </Label>
                  </div>
                ))}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="otherConcern" className="text-sm font-medium text-gray-700">
                  Other (specify):
                </Label>
                <Input
                  id="otherConcern"
                  value={formData.otherConcernType}
                  onChange={(e) => handleInputChange('otherConcernType', e.target.value)}
                  placeholder="Specify other concern type"
                  className="border-gray-200 rounded-xl focus:border-orange-500 focus:ring-orange-500 text-base touch-manipulation"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="concernDescription" className="text-sm font-medium text-gray-700">
                Details of Concern *
              </Label>
              <Textarea
                id="concernDescription"
                value={formData.concernDescription}
                onChange={(e) => handleInputChange('concernDescription', e.target.value)}
                placeholder="Please briefly describe the situation, behavior, or challenge"
                rows={4}
                className="border-gray-200 rounded-xl focus:border-orange-500 focus:ring-orange-500 resize-none text-base touch-manipulation"
              />
            </div>

            <div className="space-y-4">
              <Label className="text-sm font-medium text-gray-700">
                Severity Level *
              </Label>
              <RadioGroup 
                value={formData.severityLevel} 
                onValueChange={(value) => handleInputChange('severityLevel', value)}
                className="space-y-3"
              >
                {SEVERITY_LEVELS.map((level) => (
                  <div key={level.value} className="flex items-center space-x-3 p-3 rounded-xl bg-gradient-to-r from-yellow-50 to-orange-50 hover:from-yellow-100 hover:to-orange-100 transition-colors touch-manipulation active:scale-95">
                    <RadioGroupItem value={level.value} id={`severity-${level.value}`} className="border-orange-400" />
                    <Label htmlFor={`severity-${level.value}`} className="text-sm text-gray-700 font-medium flex-1 cursor-pointer">
                      {level.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-4">
              <Label className="text-sm font-medium text-gray-700">
                Actions Taken Already (optional)
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {ACTIONS_TAKEN.map((action) => (
                  <div key={action} className="flex items-center space-x-3 p-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition-colors touch-manipulation active:scale-95">
                    <Checkbox
                      id={`action-${action}`}
                      checked={formData.actionsTaken.includes(action)}
                      onCheckedChange={(checked) => handleActionTakenChange(action, checked as boolean)}
                      className="rounded-lg"
                    />
                    <Label htmlFor={`action-${action}`} className="text-sm text-gray-700 font-medium cursor-pointer">
                      {action}
                    </Label>
                  </div>
                ))}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="otherAction" className="text-sm font-medium text-gray-700">
                  Other (specify):
                </Label>
                <Input
                  id="otherAction"
                  value={formData.otherActionTaken}
                  onChange={(e) => handleInputChange('otherActionTaken', e.target.value)}
                  placeholder="Specify other action taken"
                  className="border-gray-200 rounded-xl focus:border-green-500 focus:ring-green-500 text-base touch-manipulation"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Teacher Information */}
        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl sm:rounded-3xl overflow-hidden">
          <CardHeader 
            className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white rounded-t-2xl sm:rounded-t-3xl cursor-pointer touch-manipulation active:scale-[0.99] transition-transform sm:cursor-default"
            onClick={() => toggleSection('teacher')}
          >
            <CardTitle className="flex items-center justify-between text-lg sm:text-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center">
                  <User className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                Teacher Information
              </div>
              <div className="sm:hidden">
                {expandedSections.teacher ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className={`p-4 sm:p-6 space-y-4 sm:space-y-6 ${expandedSections.teacher ? 'block' : 'hidden sm:block'}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="teacher" className="text-sm font-medium text-gray-700">
                  Name *
                </Label>
                <Input
                  id="teacher"
                  value={formData.teacher}
                  onChange={(e) => handleInputChange('teacher', e.target.value)}
                  placeholder="Enter teacher name"
                  className="border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-emerald-500 text-base touch-manipulation"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="teacherPosition" className="text-sm font-medium text-gray-700">
                  Position *
                </Label>
                <Input
                  id="teacherPosition"
                  value={formData.teacherPosition}
                  onChange={(e) => handleInputChange('teacherPosition', e.target.value)}
                  placeholder="e.g., 3rd Grade Teacher, Math Teacher"
                  className="border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-emerald-500 text-base touch-manipulation"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Button 
            onClick={generateRecommendations}
            disabled={isGenerating}
            className="flex-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-xl rounded-2xl py-4 sm:py-6 text-base sm:text-lg font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                Generating Magic...
              </>
            ) : (
              <>
                <Sparkles className="mr-3 h-5 w-5" />
                Generate AI Recommendations
              </>
            )}
          </Button>
          
          {hasGenerated && (
            <Button 
              onClick={saveSupportRequest}
              disabled={isSaving || hasSaved}
              variant={hasSaved ? "outline" : "default"}
              className={hasSaved 
                ? "border-green-500 text-green-600 rounded-2xl py-4 sm:py-6 px-6 sm:px-8 touch-manipulation active:scale-95" 
                : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-xl rounded-2xl py-4 sm:py-6 px-6 sm:px-8 transform hover:scale-105 transition-all duration-200 touch-manipulation active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              }
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : hasSaved ? (
                <>
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Saved Successfully!
                </>
              ) : (
                'Save Support Request'
              )}
            </Button>
          )}
          
          <Button 
            onClick={resetForm} 
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-white/80 rounded-2xl py-4 sm:py-6 px-6 sm:px-8 touch-manipulation active:scale-95"
          >
            Reset Form
          </Button>
        </div>

        {/* Success Actions */}
        {hasSaved && savedSupportRequestId && (
          <Card className="border-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 shadow-xl rounded-2xl sm:rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white rounded-t-2xl sm:rounded-t-3xl">
              <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                Support Request Saved Successfully!
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <Button
                  onClick={() => navigate('/referrals')}
                  className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white shadow-lg rounded-2xl px-6 py-3 touch-manipulation active:scale-95"
                >
                  View All Support Requests
                </Button>
                <Button
                  onClick={resetForm}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-white/80 rounded-2xl px-6 py-3 touch-manipulation active:scale-95"
                >
                  Create Another Support Request
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recommendations Display */}
        {recommendations && (
          <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl sm:rounded-3xl overflow-hidden">
            <CardHeader 
              className="bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white rounded-t-2xl sm:rounded-t-3xl cursor-pointer touch-manipulation active:scale-[0.99] transition-transform sm:cursor-default"
              onClick={() => toggleSection('recommendations')}
            >
              <CardTitle className="flex items-center justify-between text-lg sm:text-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center">
                    <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  AI-Generated Recommendations
                </div>
                <div className="sm:hidden">
                  {expandedSections.recommendations ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className={`p-4 sm:p-6 space-y-4 sm:space-y-6 ${expandedSections.recommendations ? 'block' : 'hidden sm:block'}`}>
              <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 p-4 sm:p-6 rounded-2xl border border-purple-200">
                <div className="prose max-w-none text-sm sm:text-base">
                  {formatRecommendations(recommendations + (hasFollowUpAssistance ? `\n\n--- FOLLOW-UP ASSISTANCE ---\n\nTeacher's Question: ${followUpQuestion}\n\nAdditional Guidance:\n${followUpAssistance}` : ''))}
                </div>
              </div>
              
              {disclaimer && (
                <Alert className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <AlertDescription className="text-xs sm:text-sm text-amber-800 leading-relaxed">
                    {disclaimer}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Follow-up Assistance Section */}
        {hasGenerated && (
          <Card className="border-0 bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 shadow-xl rounded-2xl sm:rounded-3xl overflow-hidden">
            <CardHeader 
              className="bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 text-white rounded-t-2xl sm:rounded-t-3xl cursor-pointer touch-manipulation active:scale-[0.99] transition-transform sm:cursor-default"
              onClick={() => toggleSection('followUp')}
            >
              <CardTitle className="flex items-center justify-between text-lg sm:text-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center">
                    <HelpCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  Need Implementation Help?
                </div>
                <div className="sm:hidden">
                  {expandedSections.followUp ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className={`p-4 sm:p-6 space-y-4 sm:space-y-6 ${expandedSections.followUp ? 'block' : 'hidden sm:block'}`}>
              <p className="text-blue-800 font-medium text-sm sm:text-base">
                Ask a specific question about implementing any of the recommended interventions and get detailed guidance.
              </p>
              
              <div className="space-y-2">
                <Label htmlFor="followUpQuestion" className="text-sm font-medium text-blue-900">
                  Your Implementation Question
                </Label>
                <Textarea
                  id="followUpQuestion"
                  value={followUpQuestion}
                  onChange={(e) => setFollowUpQuestion(e.target.value)}
                  placeholder="e.g., How do I set up a behavior chart for this student? What materials do I need for the sensory break area? How often should I check in with the student?"
                  rows={3}
                  className="border-blue-200 rounded-xl focus:border-blue-500 focus:ring-blue-500 resize-none bg-white/80 text-base touch-manipulation"
                />
              </div>
              
              <Button 
                onClick={generateFollowUpAssistance}
                disabled={isGeneratingFollowUp || !followUpQuestion.trim()}
                className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white shadow-lg rounded-2xl py-3 px-6 transform hover:scale-105 transition-all duration-200 touch-manipulation active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isGeneratingFollowUp ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Getting Assistance...
                  </>
                ) : (
                  <>
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Get Implementation Assistance
                  </>
                )}
              </Button>
              
              {hasFollowUpAssistance && followUpDisclaimer && (
                <Alert className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl mt-4">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-xs sm:text-sm text-amber-800 leading-relaxed">
                    {followUpDisclaimer}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
