import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
// Helper function for checking unauthorized errors
const isUnauthorizedError = (error: Error): boolean => {
  return /^401: .*Unauthorized/.test(error.message);
};
import { apiRequest } from "@/lib/queryClient";
import { insertConcernSchema, type Concern, type Intervention, type User as UserType } from "@shared/schema";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit3, Wand2, GraduationCap, AlertTriangle, Users, CalendarX, User, Calendar, MapPin, AlertCircle, ChevronDown, ChevronUp, Lightbulb, Upload, FileText, BookOpen } from "lucide-react";
import { useTranslation } from "react-i18next";

const enhancedConcernFormSchema = z.object({
  studentFirstName: z.string().min(1, "First name is required"),
  studentLastInitial: z.string().length(1, "Last initial must be exactly 1 character"),
  grade: z.string().min(1, "Grade is required"),
  teacherPosition: z.string().min(1, "Teacher position is required"),
  location: z.string().min(1, "Location is required"),
  concernTypes: z.array(z.string()).default([]),
  otherConcernType: z.string().optional(),
  description: z.string().optional(),
  severityLevel: z.string().optional(),
  actionsTaken: z.array(z.string()).default([]),
  otherActionTaken: z.string().optional(),
  
  // Student differentiation needs (optional)
  hasIep: z.boolean().default(false),
  hasDisability: z.boolean().default(false),
  disabilityType: z.string().optional(),
  isEalLearner: z.boolean().default(false),
  ealProficiency: z.string().optional(),
  isGifted: z.boolean().default(false),
  isStruggling: z.boolean().default(false),
  otherNeeds: z.string().optional(),
  
  // Text content for better AI recommendations
  studentAssessmentFile: z.string().optional(),
  lessonPlanContent: z.string().optional(),
  
  // Task type selection for focused AI responses
  taskType: z.string().min(1, "Task type is required"),
}).refine((data) => {
  // For tier2_intervention tasks, require certain fields
  if (data.taskType === 'tier2_intervention') {
    return data.concernTypes.length > 0 && 
           data.description && data.description.length >= 10 && 
           data.severityLevel;
  }
  // For differentiation tasks, no additional validation needed
  return true;
}, {
  message: "Please fill in all required fields for the selected task type",
  path: ["taskType"], // This will show the error on the taskType field
});

type EnhancedConcernFormData = z.infer<typeof enhancedConcernFormSchema>;

interface ConcernFormProps {
  onConcernSubmitted?: (concern: Concern, interventions: Intervention[], recommendations?: string, disclaimer?: string) => void;
}

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

const GRADE_OPTIONS = [
  'Pre-K', 'K', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'
];

const EAL_PROFICIENCY_LEVELS = [
  'Beginner',
  'Intermediate', 
  'Advanced'
];

const COMMON_DISABILITY_TYPES = [
  'ADHD',
  'Autism Spectrum',
  'Learning Disability',
  'Emotional/Behavioral',
  'Physical Disability',
  'Intellectual Disability',
  'Hearing Impairment',
  'Visual Impairment',
  'Speech/Language',
  'Other'
];

const TASK_TYPES = [
  { 
    value: 'differentiation', 
    label: 'Differentiation Task',
    description: 'Get specific strategies to adapt instruction for different learning styles, abilities, and needs. Focus on instructional modifications and learning accommodations.'
  },
  { 
    value: 'tier2_intervention', 
    label: 'Tier 2 Intervention Task',
    description: 'Generate evidence-based behavioral and academic intervention strategies for concerning behaviors. Focus on targeted interventions for specific behavioral or academic issues.'
  }
];

export default function ConcernForm({ onConcernSubmitted }: ConcernFormProps) {
  const { user } = useAuth() as { user: UserType | undefined };
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  // Helper function to translate concern types
  const getTranslatedConcernType = (type: string, t: any) => {
    const typeMap: { [key: string]: string } = {
      'Academic': t('form.academic', 'Academic'),
      'Attendance': t('form.attendance', 'Attendance'),
      'Behavior': t('form.behavior', 'Behavior'),
      'Social/Emotional': t('form.socialEmotional', 'Social/Emotional'),
      'Peer Relationships': t('form.peerRelationships', 'Peer Relationships'),
      'Family/Home': t('form.familyHome', 'Family/Home')
    };
    return typeMap[type] || type;
  };

  // Helper function to get translated severity levels
  const getTranslatedSeverityLevels = (t: any) => [
    { value: 'mild', label: t('form.mildClassroom', 'Mild – Needs classroom support') },
    { value: 'moderate', label: t('form.moderateTier2', 'Moderate – Needs Tier 2 intervention') },
    { value: 'urgent', label: t('form.urgentImmediate', 'Urgent – Immediate follow-up needed') }
  ];

  // Helper function to get translated actions taken
  const getTranslatedActionsTaken = (t: any) => [
    t('form.talkedWithStudent', 'Talked with student'),
    t('form.contactedParent', 'Contacted parent'),
    t('form.documentedOnly', 'Documented only')
  ];
  const [showOtherConcern, setShowOtherConcern] = useState(false);
  const [showOtherAction, setShowOtherAction] = useState(false);
  const [showDifferentiation, setShowDifferentiation] = useState(false);

  const form = useForm<EnhancedConcernFormData>({
    resolver: zodResolver(enhancedConcernFormSchema),
    defaultValues: {
      studentFirstName: "",
      studentLastInitial: "",
      grade: "",
      teacherPosition: "",
      location: "",
      concernTypes: [],
      otherConcernType: "",
      description: "",
      severityLevel: "",
      actionsTaken: [],
      otherActionTaken: "",
      
      // Student differentiation defaults
      hasIep: false,
      hasDisability: false,
      disabilityType: "",
      isEalLearner: false,
      ealProficiency: "",
      isGifted: false,
      isStruggling: false,
      otherNeeds: "",
      studentAssessmentFile: "",
      lessonPlanContent: "",
      taskType: "",
    },
  });

  const createConcernMutation = useMutation({
    mutationFn: async (data: EnhancedConcernFormData) => {
      // Debug: Log what data is being sent to the backend
      // Submitting concern data to generate AI recommendations
      const response = await apiRequest("POST", "/api/concerns", data);
      return response;
    },
    onSuccess: (data: { concern: Concern; interventions: Intervention[]; recommendations?: string; disclaimer?: string }) => {
      const taskTypeLabel = form.getValues('taskType') === 'differentiation' ? 'differentiation strategies' : 'intervention recommendations';
      toast({
        title: "Success!",
        description: `Generated AI-powered ${taskTypeLabel}`,
      });
      
      // Reset form
      form.reset();
      setShowOtherConcern(false);
      setShowOtherAction(false);
      setShowDifferentiation(false);
      
      // Invalidate concerns cache to refresh the recent concerns list
      queryClient.invalidateQueries({ queryKey: ["/api/concerns"] });
      
      // Call the callback with the new concern and interventions
      onConcernSubmitted?.(data.concern, data.interventions, data.recommendations, data.disclaimer);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      if (error.message.includes("429")) {
        toast({
          title: "Request Limit Reached",
          description: "You've reached your monthly limit of 20 support requests.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Error",
        description: error.message || "Failed to create concern",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EnhancedConcernFormData) => {
    // Show user-friendly validation message if there are errors
    if (Object.keys(form.formState.errors).length > 0) {
      toast({
        title: "Please fill in all required fields",
        description: "Check that all fields marked with * are completed.",
        variant: "destructive",
      });
      return;
    }
    
    createConcernMutation.mutate(data);
  };

  // Check if user is at their request limit
  const isAtLimit = user && (user.supportRequestsUsed || 0) >= (user.supportRequestsLimit || 20);

  return (
    <Card className="w-full">
      <CardContent className="px-4 sm:px-6 pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className={`space-y-6 sm:space-y-8 ${isAtLimit ? 'opacity-60' : ''}`}>
            
            {/* Task Type Selection - FIRST */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">🎯</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{t('form.chooseTaskType', 'Choose Your Task Type')}</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                {t('form.taskTypeDescription', 'Select the type of AI-powered support you need - this will determine what information to collect:')}
              </p>
              
              <FormField
                control={form.control}
                name="taskType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-4"
                        disabled={isAtLimit}
                      >
                        {TASK_TYPES.filter(taskType => 
                          !field.value || field.value === taskType.value
                        ).map((taskType) => (
                          <div key={taskType.value} className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors">
                            <RadioGroupItem value={taskType.value} id={taskType.value} disabled={isAtLimit} className="mt-1" />
                            <div className="flex-1">
                              <label
                                htmlFor={taskType.value}
                                className="text-base font-medium text-gray-900 cursor-pointer block mb-1"
                              >
                                {taskType.value === 'differentiation' ? t('form.differentiationTask', 'Differentiation Task') : t('form.tier2InterventionTask', 'Tier 2 Intervention Task')}
                              </label>
                              <p className="text-sm text-gray-600 leading-relaxed">
                                {taskType.value === 'differentiation' ? t('form.differentiationDesc', 'Get specific strategies to adapt instruction for different learning styles, abilities, and needs. Focus on instructional modifications and learning accommodations.') : t('form.tier2InterventionDesc', 'Generate evidence-based behavioral and academic intervention strategies for concerning behaviors. Focus on targeted interventions for specific behavioral or academic issues.')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Task confirmation and change option */}
            {form.watch('taskType') && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900 mb-1">{t('form.taskSelected', 'Task Selected: {{taskType}}', { taskType: TASK_TYPES.find(t => t.value === form.watch('taskType'))?.value === 'differentiation' ? t('form.differentiationTask', 'Differentiation Task') : t('form.tier2InterventionTask', 'Tier 2 Intervention Task') })}</h4>
                      <p className="text-sm text-blue-700">
                        {t('form.taskSelectionNote', 'If you need both differentiation strategies AND Tier 2 intervention recommendations for the same student, please submit separate requests. This helps ensure each task receives focused, specialized attention.')}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      form.setValue('taskType', '');
                      // Reset other conditional fields that depend on task type
                      form.setValue('concernTypes', []);
                      form.setValue('description', '');
                      form.setValue('severityLevel', '');
                      form.setValue('actionsTaken', []);
                    }}
                    className="text-blue-600 border-blue-300 hover:bg-blue-100 flex-shrink-0"
                    data-testid="button-change-task-type"
                  >
                    {t('form.changeTask', 'Change Task')}
                  </Button>
                </div>
              </div>
            )}

            {/* Show form sections only after task type is selected */}
            {form.watch('taskType') && (
              <>
                {/* Student Information Section - Mobile Responsive */}
            <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
              <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-brand-blue flex-shrink-0" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900">{t('form.studentInformation', 'Student Information')}</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <FormField
                  control={form.control}
                  name="studentFirstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('form.firstName', 'First Name')} <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder={t('form.firstNamePlaceholder', 'Enter first name')} {...field} disabled={isAtLimit} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="studentLastInitial"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('form.lastInitial', 'Last Initial')} <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={t('form.lastInitialPlaceholder', 'X')}
                          maxLength={1}
                          className="uppercase"
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          value={field.value}
                          disabled={isAtLimit}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="grade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('form.grade', 'Grade')} <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isAtLimit}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('form.gradePlaceholder', 'Select grade')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {GRADE_OPTIONS.map((grade) => (
                            <SelectItem key={grade} value={grade}>
                              {grade}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Student Learning Profile - Available for both task types */}
            {form.watch('taskType') && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 flex-shrink-0" />
                    <h3 className="text-base sm:text-lg font-medium text-gray-900">{t('form.studentLearningProfile', 'Student Learning Profile')}</h3>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDifferentiation(!showDifferentiation)}
                    disabled={isAtLimit}
                    data-testid="button-toggle-differentiation"
                  >
                    {showDifferentiation ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
                
                <p className="text-sm text-amber-700 mb-4">
                  <Lightbulb className="h-4 w-4 inline mr-1" />
                  {t('form.learningProfileNote', 'Optional: Add details about the student\'s learning needs for more personalized {{strategyType}}', { strategyType: form.watch('taskType') === 'differentiation' ? t('form.differentiationStrategies', 'differentiation strategies') : t('form.interventionRecommendations', 'intervention recommendations') })}
                </p>
                
                {showDifferentiation && (
                  <div className="space-y-4">
                    {/* Learning Support Checkboxes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="hasIep"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={isAtLimit}
                                data-testid="checkbox-has-iep"
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">
                              {t('form.hasIepPlan', 'Has IEP/504 Plan')}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="hasDisability"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={isAtLimit}
                                data-testid="checkbox-has-disability"
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">
                              {t('form.hasDiagnosedDisability', 'Has Diagnosed Disability')}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="isEalLearner"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={isAtLimit}
                                data-testid="checkbox-is-eal"
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">
                              {t('form.englishAdditionalLanguage', 'English as Additional Language')}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="isGifted"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={isAtLimit}
                                data-testid="checkbox-is-gifted"
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">
                              {t('form.giftedTalented', 'Gifted/Talented')}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="isStruggling"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={isAtLimit}
                                data-testid="checkbox-is-struggling"
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">
                              {t('form.strugglingAcademically', 'Struggling Academically')}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {/* Conditional Follow-up Fields */}
                    {form.watch('hasDisability') && (
                      <FormField
                        control={form.control}
                        name="disabilityType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type of Disability</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isAtLimit}>
                              <FormControl>
                                <SelectTrigger data-testid="select-disability-type">
                                  <SelectValue placeholder="Select disability type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {COMMON_DISABILITY_TYPES.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    {form.watch('isEalLearner') && (
                      <FormField
                        control={form.control}
                        name="ealProficiency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>English Proficiency Level</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isAtLimit}>
                              <FormControl>
                                <SelectTrigger data-testid="select-eal-proficiency">
                                  <SelectValue placeholder="Select level" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {EAL_PROFICIENCY_LEVELS.map((level) => (
                                  <SelectItem key={level} value={level}>
                                    {level}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    {/* Additional Notes */}
                    <FormField
                      control={form.control}
                      name="otherNeeds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('form.otherLearningNeeds', 'Other Learning Needs or Notes')}</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={t('form.learningNeedsPlaceholder', 'e.g., visual learner, needs frequent breaks, anxiety...')}
                              {...field} 
                              disabled={isAtLimit}
                              data-testid="input-other-needs"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Teacher and Lesson Information */}
            <div className="bg-blue-50 rounded-lg p-4 sm:p-6">
              <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-brand-blue flex-shrink-0" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900">
                  {form.watch('taskType') === 'differentiation' ? t('form.lessonDetails', 'Lesson Details') : t('form.incidentDetails', 'Incident Details')}
                </h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <FormField
                  control={form.control}
                  name="teacherPosition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {form.watch('taskType') === 'differentiation' ? t('form.yourSubjectArea', 'Your Subject Area') : t('form.yourPositionTitle', 'Your Position/Title')} <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder={form.watch('taskType') === 'differentiation' ? t('form.subjectAreaPlaceholder', 'e.g., Mathematics, English Language Arts') : t('form.positionPlaceholder', 'e.g., 3rd Grade Teacher')} {...field} disabled={isAtLimit} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {form.watch('taskType') === 'differentiation' ? t('form.classDetails', 'Class Details') : t('form.location', 'Location')} <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder={form.watch('taskType') === 'differentiation' ? t('form.classDetailsPlaceholder', 'e.g., Grade 3, 25 students, mixed abilities') : t('form.locationPlaceholder', 'e.g., Classroom, Playground')} {...field} disabled={isAtLimit} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Concern Types - Only for Tier 2 Intervention */}
            {form.watch('taskType') === 'tier2_intervention' && (
              <FormField
                control={form.control}
                name="concernTypes"
                render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">
                      {t('form.typeOfConcern', 'Type of Concern')} <span className="text-red-500">*</span>
                    </FormLabel>
                    <p className="text-sm text-gray-600">{t('form.selectAllThatApply', 'Select all that apply')}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {CONCERN_TYPES.map((item) => (
                      <FormField
                        key={item}
                        control={form.control}
                        name="concernTypes"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={item}
                              className="flex flex-row items-start space-x-3 space-y-0 py-2 min-h-[44px]"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(item)}
                                  disabled={isAtLimit}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, item])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== item
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal leading-normal cursor-pointer flex-1">
                                {getTranslatedConcernType(item, t)}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={showOtherConcern}
                        disabled={isAtLimit}
                        onCheckedChange={(checked) => setShowOtherConcern(checked === true)}
                      />
                      <label className={`text-sm font-normal ${isAtLimit ? 'text-gray-400' : ''}`}>{t('form.otherSpecify', 'Other (please specify)')}</label>
                    </div>
                    
                    {showOtherConcern && (
                      <FormField
                        control={form.control}
                        name="otherConcernType"
                        render={({ field }) => (
                          <FormItem className="mt-2">
                            <FormControl>
                              <Input placeholder={t('form.specifyOtherConcern', 'Specify other concern type')} {...field} disabled={isAtLimit} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                  
                  <FormMessage />
                </FormItem>
              )}
            />
            )}

            {/* Concern Description - Only for Tier 2 Intervention */}
            {form.watch('taskType') === 'tier2_intervention' && (
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">
                    {t('form.detailedDescription', 'Detailed Description of Concern')} <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      rows={6}
                      placeholder={t('form.descriptionPlaceholder', 'Please provide specific details about the observed behavior or concern. Include frequency, duration, context, and any patterns you\'ve noticed...')}
                      className="resize-none min-h-[120px] text-base"
                      {...field}
                      disabled={isAtLimit}
                    />
                  </FormControl>
                  <p className="text-xs text-gray-600">
                    {t('form.specificObjectiveNote', 'Be specific and objective. This information helps generate more targeted intervention strategies.')}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            )}

            {/* Task-Specific Sections */}
            {form.watch('taskType') === 'tier2_intervention' && (
              <>
                {/* Severity Level - Only for Tier 2 Intervention */}
                <FormField
                  control={form.control}
                  name="severityLevel"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-base">
                        {t('form.severityLevel', 'Severity Level')} <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-3"
                          disabled={isAtLimit}
                        >
                          {getTranslatedSeverityLevels(t).map((level) => (
                            <div key={level.value} className="flex items-center space-x-3 py-2 min-h-[44px]">
                              <RadioGroupItem value={level.value} id={level.value} disabled={isAtLimit} />
                              <label
                                htmlFor={level.value}
                                className="text-sm font-normal leading-relaxed cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
                              >
                                {level.label}
                              </label>
                            </div>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Actions Taken - Only for Tier 2 Intervention */}
                <FormField
                  control={form.control}
                  name="actionsTaken"
                  render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">
                      {t('form.actionsAlreadyTaken', 'Actions Already Taken')}
                    </FormLabel>
                    <p className="text-sm text-gray-600">{t('form.selectAllThatApply', 'Select all that apply')}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                    {getTranslatedActionsTaken(t).map((item) => (
                      <FormField
                        key={item}
                        control={form.control}
                        name="actionsTaken"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={item}
                              className="flex flex-row items-start space-x-3 space-y-0 py-2 min-h-[44px]"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(item)}
                                  disabled={isAtLimit}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, item])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== item
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal leading-normal cursor-pointer flex-1">
                                {item}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={showOtherAction}
                        disabled={isAtLimit}
                        onCheckedChange={(checked) => setShowOtherAction(checked === true)}
                      />
                      <label className={`text-sm font-normal ${isAtLimit ? 'text-gray-400' : ''}`}>{t('form.otherActionTaken', 'Other action taken (please specify)')}</label>
                    </div>
                    
                    {showOtherAction && (
                      <FormField
                        control={form.control}
                        name="otherActionTaken"
                        render={({ field }) => (
                          <FormItem className="mt-2">
                            <FormControl>
                              <Input placeholder={t('form.describeOtherAction', 'Describe other action taken')} {...field} disabled={isAtLimit} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                  
                  <FormMessage />
                </FormItem>
              )}
            />

            </>
            )}

            {/* Differentiation Task Section */}
            {form.watch('taskType') === 'differentiation' && (
              <>

                {/* Lesson Plan Upload - Standalone Section for Differentiation */}
                <div className="bg-green-50 rounded-lg p-4 sm:p-6">
                  <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <FileText className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="text-base sm:text-lg font-medium text-gray-900">{t('form.lessonPlanToAdapt', 'Lesson Plan to Adapt')}</h3>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="lessonPlanContent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          {t('form.pasteLessonPlan', 'Copy & Paste Lesson Plan')}
                        </FormLabel>
                        <div className="space-y-2">
                          <textarea
                            {...field}
                            placeholder={t('form.lessonPlanPlaceholder', 'Copy and paste your lesson plan content here. Include learning objectives, activities, materials, and any specific areas you want differentiated for this student...')}
                            className="w-full min-h-[200px] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-y"
                            disabled={isAtLimit}
                            data-testid="textarea-lesson-plan"
                          />
                          <p className="text-xs text-green-600">
                            {t('form.pasteLessonPlanDesc', 'Copy and paste your lesson plan content above. The more details you provide, the better the AI can generate differentiation strategies tailored to this student.')}
                          </p>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}
            
            {/* Usage Warning */}
            {isAtLimit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">
                      Monthly Request Limit Reached
                    </p>
                    <p className="text-sm text-red-700 mt-1">
                      You've used all {user?.supportRequestsLimit || 20} of your monthly support requests. 
                      Your limit will reset next month.
                    </p>
                  </div>
                </div>
              </div>
            )}
            </>
            )}
            
            {/* Submit Button */}
            <div className="flex justify-center sm:justify-end pt-4 sm:pt-6">
              <Button 
                type="submit" 
                disabled={createConcernMutation.isPending || isAtLimit}
                className="w-full sm:w-auto bg-brand-blue hover:bg-brand-dark-blue px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg min-h-[48px] sm:min-h-[52px] font-semibold"
                size="lg"
              >
                {createConcernMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {t('form.generatingRecommendations', 'Generating Research-Based Recommendations')}
                  </>
                ) : isAtLimit ? (
                  <>
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    {t('form.requestLimitReached', 'Request Limit Reached')}
                  </>
                ) : (
                  <>
                    <Wand2 className="h-5 w-5 mr-2" />
                    {form.watch('taskType') === 'differentiation' 
                      ? t('form.generateDifferentiationStrategies', 'Generate Differentiation Strategies')
                      : t('form.generateTier2Strategies', 'Generate Tier 2 Intervention Strategies')}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}