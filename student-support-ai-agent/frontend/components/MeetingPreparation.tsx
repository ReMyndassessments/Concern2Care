import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, Users, Calendar, MapPin, FileText, Download, Printer, Mail, CheckCircle, Clock, Target, User } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useParams, Link } from 'react-router-dom';
import backend from '~backend/client';
import type { SupportRequest } from '~backend/referrals/get';

export function MeetingPreparation() {
  const { referralId } = useParams<{ referralId: string }>();
  const [supportRequest, setSupportRequest] = useState<SupportRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (referralId) {
      loadSupportRequest();
    }
  }, [referralId]);

  const loadSupportRequest = async () => {
    try {
      setLoading(true);
      const response = await backend.referrals.get({ id: parseInt(referralId!) });
      setSupportRequest(response);
    } catch (error) {
      console.error('Error loading support request:', error);
      toast({
        title: "Error",
        description: "Failed to load support request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!supportRequest) return;
    
    setIsGeneratingPDF(true);
    try {
      const response = await backend.referrals.generatePDF({
        supportRequestId: supportRequest.id
      });

      const pdfBlob = new Blob([
        Uint8Array.from(atob(response.pdfContent), c => c.charCodeAt(0))
      ], { type: 'application/pdf' });

      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = response.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "PDF Generated",
        description: "The meeting preparation document has been downloaded."
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatIncidentDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'mild':
        return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700';
      case 'moderate':
        return 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700';
      case 'urgent':
        return 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700';
      default:
        return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center animate-pulse">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
          <p className="text-gray-600 font-medium">Loading meeting preparation...</p>
        </div>
      </div>
    );
  }

  if (!supportRequest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <Card className="max-w-md border-0 bg-white/80 backdrop-blur-sm shadow-xl rounded-3xl">
          <CardContent className="text-center py-8">
            <p className="text-gray-500">Support request not found.</p>
            <Link to="/referrals" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
              Return to Support Requests
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 relative">
          {/* Decorative elements */}
          <div className="absolute top-0 left-1/4 w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute top-5 right-1/3 w-12 h-12 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full opacity-20 animate-pulse delay-1000"></div>
          
          <div className="relative">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl shadow-2xl mb-6">
              <Users className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              Student Support Meeting Preparation
            </h1>
            <p className="text-gray-600 text-lg">
              Comprehensive documentation for {supportRequest.studentFirstName} {supportRequest.studentLastInitial}.
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <Card className="border-0 bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 text-white rounded-t-3xl">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                <FileText className="h-6 w-6" />
              </div>
              Meeting Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={handleGeneratePDF}
                disabled={isGeneratingPDF}
                className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white shadow-lg rounded-2xl px-6 py-3 transform hover:scale-105 transition-all duration-200"
              >
                {isGeneratingPDF ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF Report
                  </>
                )}
              </Button>
              
              <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-white/80 rounded-2xl px-6 py-3">
                <Printer className="h-4 w-4 mr-2" />
                Print Summary
              </Button>
              
              <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-white/80 rounded-2xl px-6 py-3">
                <Mail className="h-4 w-4 mr-2" />
                Email to Team
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Student Overview */}
        <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white rounded-t-3xl">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                <User className="h-6 w-6" />
              </div>
              Student Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-xl">
                      {supportRequest.studentFirstName[0]}{supportRequest.studentLastInitial}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {supportRequest.studentFirstName} {supportRequest.studentLastInitial}.
                    </h3>
                    <p className="text-gray-600 text-lg">Grade {supportRequest.grade}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-2xl">
                    <span className="font-medium text-gray-700">Teacher:</span>
                    <span className="text-gray-600 ml-2">{supportRequest.teacher}</span>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-2xl">
                    <span className="font-medium text-gray-700">Position:</span>
                    <span className="text-gray-600 ml-2">{supportRequest.teacherPosition}</span>
                  </div>
                  <div className="bg-gradient-to-r from-pink-50 to-rose-50 p-4 rounded-2xl">
                    <span className="font-medium text-gray-700">Support Request ID:</span>
                    <span className="text-gray-600 ml-2">#{supportRequest.id}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-2xl">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  <div>
                    <span className="font-medium text-gray-700">Incident Date:</span>
                    <p className="text-gray-600">{formatIncidentDate(supportRequest.incidentDate)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-2xl">
                  <MapPin className="h-5 w-5 text-green-500" />
                  <div>
                    <span className="font-medium text-gray-700">Location:</span>
                    <p className="text-gray-600">{supportRequest.location}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-2xl">
                  <Target className="h-5 w-5 text-orange-500" />
                  <div>
                    <span className="font-medium text-gray-700">Severity:</span>
                    <Badge className={`${getSeverityColor(supportRequest.severityLevel)} ml-2 rounded-xl px-3 py-1`}>
                      {supportRequest.severityLevel.charAt(0).toUpperCase() + supportRequest.severityLevel.slice(1)}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-2xl">
                  <Clock className="h-5 w-5 text-purple-500" />
                  <div>
                    <span className="font-medium text-gray-700">Submitted:</span>
                    <p className="text-gray-600">{formatDate(supportRequest.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Concern Summary */}
        <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white rounded-t-3xl">
            <CardTitle className="text-xl">Concern Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Concern Types</h4>
              <div className="flex flex-wrap gap-3">
                {supportRequest.concernTypes.map((type, index) => (
                  <Badge key={index} variant="outline" className="bg-gradient-to-r from-orange-50 to-red-50 text-orange-700 border-orange-200 rounded-xl px-3 py-2">
                    {type}
                  </Badge>
                ))}
                {supportRequest.otherConcernType && (
                  <Badge variant="outline" className="bg-gradient-to-r from-orange-50 to-red-50 text-orange-700 border-orange-200 rounded-xl px-3 py-2">
                    {supportRequest.otherConcernType}
                  </Badge>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Detailed Description</h4>
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-2xl border border-amber-200">
                <p className="text-gray-700 leading-relaxed">
                  {supportRequest.concernDescription}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions Taken */}
        {supportRequest.actionsTaken.length > 0 && (
          <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white rounded-t-3xl">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                  <CheckCircle className="h-6 w-6" />
                </div>
                Actions Already Taken
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-3">
                {supportRequest.actionsTaken.map((action, index) => (
                  <Badge key={index} variant="outline" className="bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200 rounded-xl px-4 py-2">
                    {action}
                  </Badge>
                ))}
                {supportRequest.otherActionTaken && (
                  <Badge variant="outline" className="bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200 rounded-xl px-4 py-2">
                    {supportRequest.otherActionTaken}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Recommendations */}
        {supportRequest.aiRecommendations && (
          <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-t-3xl">
              <CardTitle className="text-xl">Recommended Tier 2 Interventions</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6 rounded-2xl border border-indigo-200">
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">
                    {supportRequest.aiRecommendations}
                  </pre>
                </div>
              </div>
              
              <Alert className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-sm text-amber-800 leading-relaxed">
                  <strong>Meeting Discussion Point:</strong> These AI-generated recommendations should be reviewed and validated by the student support team. Consider which interventions are most appropriate for implementation and what additional resources may be needed.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Meeting Checklist */}
        <Card className="border-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white rounded-t-3xl">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6" />
              </div>
              Meeting Preparation Checklist
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[
                "Review student's academic and behavioral history",
                "Gather input from other teachers who work with this student",
                "Consider parent/guardian communication and involvement",
                "Identify available resources and support staff",
                "Plan timeline for intervention implementation and progress monitoring",
                "Determine next steps if interventions are not effective"
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-white/60 rounded-2xl hover:bg-white/80 transition-colors">
                  <input type="checkbox" className="w-5 h-5 rounded-lg border-gray-300 text-green-600 focus:ring-green-500" />
                  <span className="text-sm text-green-800 font-medium">{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Back to Support Requests */}
        <div className="text-center">
          <Link 
            to="/referrals"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium bg-white/60 hover:bg-white/80 px-6 py-3 rounded-2xl transition-colors"
          >
            ← Back to All Support Requests
          </Link>
        </div>
      </div>
    </div>
  );
}
