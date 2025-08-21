import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, AlertTriangle, Search, ArrowLeft, FileText, Share2, Mail, Download, Users, Printer, Calendar, MapPin, User, ChevronDown, ChevronUp, Wifi, WifiOff } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';
import backend from '~backend/client';
import type { SupportRequest } from '~backend/referrals/list';

export function ReferralList() {
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);
  const [cachedSupportRequests, setCachedSupportRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacherFilter, setTeacherFilter] = useState('');
  const [selectedSupportRequest, setSelectedSupportRequest] = useState<SupportRequest | null>(null);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailForm, setEmailForm] = useState({
    recipientEmail: '',
    senderName: '',
    message: ''
  });
  const [isSharing, setIsSharing] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [expandedSupportRequests, setExpandedSupportRequests] = useState<Set<number>>(new Set());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { toast } = useToast();

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Reload data when coming back online
      if (cachedSupportRequests.length === 0) {
        loadSupportRequests();
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [cachedSupportRequests.length]);

  useEffect(() => {
    loadSupportRequests();
  }, [teacherFilter]);

  // Cache support requests in localStorage
  useEffect(() => {
    if (supportRequests.length > 0) {
      localStorage.setItem('cachedSupportRequests', JSON.stringify(supportRequests));
      setCachedSupportRequests(supportRequests);
    }
  }, [supportRequests]);

  // Load cached support requests on mount
  useEffect(() => {
    const cached = localStorage.getItem('cachedSupportRequests');
    if (cached) {
      try {
        const parsedCached = JSON.parse(cached);
        setCachedSupportRequests(parsedCached);
        if (!isOnline) {
          setSupportRequests(parsedCached);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error parsing cached support requests:', error);
      }
    }
  }, [isOnline]);

  const loadSupportRequests = async () => {
    if (!isOnline) {
      // Use cached data when offline
      const filtered = cachedSupportRequests.filter(supportRequest => 
        !teacherFilter || supportRequest.teacher.toLowerCase().includes(teacherFilter.toLowerCase())
      );
      setSupportRequests(filtered);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await backend.referrals.list({
        limit: 50,
        teacher: teacherFilter || undefined
      });
      setSupportRequests(response.supportRequests);
    } catch (error) {
      console.error('Error loading support requests:', error);
      
      // Fall back to cached data if available
      if (cachedSupportRequests.length > 0) {
        const filtered = cachedSupportRequests.filter(supportRequest => 
          !teacherFilter || supportRequest.teacher.toLowerCase().includes(teacherFilter.toLowerCase())
        );
        setSupportRequests(filtered);
        toast({
          title: "Using Offline Data",
          description: "Showing cached support requests. Connect to internet for latest data.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to load support requests. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleSupportRequestExpansion = (supportRequestId: number) => {
    setExpandedSupportRequests(prev => {
      const newSet = new Set(prev);
      if (newSet.has(supportRequestId)) {
        newSet.delete(supportRequestId);
      } else {
        newSet.add(supportRequestId);
      }
      return newSet;
    });
  };

  const handleEmailShare = async () => {
    if (!isOnline) {
      toast({
        title: "Offline Mode",
        description: "Email sharing requires an internet connection.",
        variant: "destructive"
      });
      return;
    }

    if (!selectedSupportRequest || !emailForm.recipientEmail || !emailForm.senderName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsSharing(true);
    try {
      const response = await backend.referrals.shareEmail({
        supportRequestId: selectedSupportRequest.id,
        recipientEmail: emailForm.recipientEmail,
        senderName: emailForm.senderName,
        message: emailForm.message || undefined
      });

      if (response.success) {
        toast({
          title: "Email Sent",
          description: response.message
        });
        setIsEmailDialogOpen(false);
        setEmailForm({ recipientEmail: '', senderName: '', message: '' });
      } else {
        toast({
          title: "Error",
          description: response.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error sharing email:', error);
      toast({
        title: "Error",
        description: "Failed to send email. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleGeneratePDF = async (supportRequest: SupportRequest) => {
    if (!isOnline) {
      toast({
        title: "Offline Mode",
        description: "PDF generation requires an internet connection.",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingPDF(true);
    try {
      const response = await backend.referrals.generatePDF({
        supportRequestId: supportRequest.id
      });

      // Create a blob from the base64 PDF content
      const pdfBlob = new Blob([
        Uint8Array.from(atob(response.pdfContent), c => c.charCodeAt(0))
      ], { type: 'application/pdf' });

      // Create download link
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
        description: "The support request PDF has been downloaded successfully."
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

  const handlePrintView = (supportRequest: SupportRequest) => {
    // Open a new window with a print-friendly view
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const concernTypes = supportRequest.concernTypes.concat(supportRequest.otherConcernType ? [supportRequest.otherConcernType] : []);
    const actionsTaken = supportRequest.actionsTaken.concat(supportRequest.otherActionTaken ? [supportRequest.otherActionTaken] : []);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Student Support Request - ${supportRequest.studentFirstName} ${supportRequest.studentLastInitial}.</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 20px; }
          .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { color: #2563eb; margin: 0; }
          .section { margin-bottom: 25px; page-break-inside: avoid; }
          .section-title { background-color: #f3f4f6; padding: 10px; border-left: 4px solid #2563eb; font-weight: bold; margin-bottom: 15px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px; }
          .info-item { margin-bottom: 10px; }
          .info-label { font-weight: bold; }
          .info-value { margin-top: 5px; padding: 8px; background-color: #f9fafb; border-radius: 4px; }
          .concern-description { background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; }
          .recommendations { background-color: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; }
          .badge { display: inline-block; padding: 4px 8px; background-color: #e5e7eb; border-radius: 4px; font-size: 12px; margin-right: 8px; }
          .disclaimer { background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; margin-top: 20px; font-size: 12px; color: #991b1b; }
          @media print { body { margin: 0; } .section { page-break-inside: avoid; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Student Support Request</h1>
          <p><strong>Concern2Care</strong> - AI-Powered Student Support System</p>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="section">
          <div class="section-title">Student Information</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Student Name:</div>
              <div class="info-value">${supportRequest.studentFirstName} ${supportRequest.studentLastInitial}.</div>
            </div>
            <div class="info-item">
              <div class="info-label">Grade:</div>
              <div class="info-value">${supportRequest.grade}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Teacher:</div>
              <div class="info-value">${supportRequest.teacher}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Position:</div>
              <div class="info-value">${supportRequest.teacherPosition}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Incident Details</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Date:</div>
              <div class="info-value">${formatIncidentDate(supportRequest.incidentDate)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Location:</div>
              <div class="info-value">${supportRequest.location}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Severity:</div>
              <div class="info-value">${supportRequest.severityLevel.charAt(0).toUpperCase() + supportRequest.severityLevel.slice(1)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Support Request ID:</div>
              <div class="info-value">#${supportRequest.id}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Concern Types</div>
          <div>
            ${concernTypes.map(type => `<span class="badge">${type}</span>`).join('')}
          </div>
        </div>

        <div class="section">
          <div class="section-title">Concern Description</div>
          <div class="concern-description">${supportRequest.concernDescription}</div>
        </div>

        ${actionsTaken.length > 0 ? `
        <div class="section">
          <div class="section-title">Actions Already Taken</div>
          <div>
            ${actionsTaken.map(action => `<span class="badge">${action}</span>`).join('')}
          </div>
        </div>
        ` : ''}

        ${supportRequest.aiRecommendations ? `
        <div class="section">
          <div class="section-title">AI-Generated Recommendations</div>
          <div class="recommendations">
            <pre style="white-space: pre-wrap; font-family: Arial, sans-serif;">${supportRequest.aiRecommendations}</pre>
          </div>
          <div class="disclaimer">
            <strong>⚠️ DISCLAIMER:</strong> These AI-generated recommendations are for informational purposes only and should not replace professional educational assessment.
          </div>
        </div>
        ` : ''}

        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatIncidentDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'mild':
        return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200';
      case 'moderate':
        return 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border-yellow-200';
      case 'urgent':
        return 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border-red-200';
      default:
        return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-200';
    }
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
            <h4 className="text-base font-semibold text-blue-700 mb-3">
              Follow-up Implementation Assistance
            </h4>
          </div>
        );
      }
      
      if (trimmedLine.startsWith('Teacher\'s Question:')) {
        return (
          <div key={index} className="bg-blue-100 p-3 rounded-lg mb-3">
            <h5 className="text-sm font-medium text-blue-800 mb-1">Teacher's Question:</h5>
            <p className="text-sm text-blue-700">{trimmedLine.replace('Teacher\'s Question:', '').trim()}</p>
          </div>
        );
      }
      
      if (trimmedLine === 'Additional Guidance:') {
        return (
          <h5 key={index} className="text-sm font-medium text-blue-800 mt-3 mb-2">
            Additional Guidance:
          </h5>
        );
      }
      
      if (trimmedLine.startsWith('##') || trimmedLine.startsWith('# ')) {
        return (
          <h4 key={index} className="text-base font-semibold text-gray-900 mt-4 mb-2 first:mt-0">
            {trimmedLine.replace(/^#+\s*/, '')}
          </h4>
        );
      }
      
      if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
        return (
          <h5 key={index} className="text-sm font-medium text-gray-800 mt-3 mb-1">
            {trimmedLine.replace(/\*\*/g, '')}
          </h5>
        );
      }
      
      if (/^\d+\./.test(trimmedLine)) {
        return (
          <div key={index} className="mb-1">
            <span className="font-medium text-gray-900 text-sm">{trimmedLine}</span>
          </div>
        );
      }
      
      if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('• ')) {
        return (
          <div key={index} className="ml-3 mb-1 flex items-start">
            <span className="text-gray-400 mr-2 mt-1 text-xs">•</span>
            <span className="text-gray-700 text-sm">{trimmedLine.replace(/^[-•]\s*/, '')}</span>
          </div>
        );
      }
      
      return (
        <p key={index} className="text-gray-700 mb-2 leading-relaxed text-sm">
          {trimmedLine}
        </p>
      );
    }).filter(Boolean);
    
    return formattedLines;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-8">
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
          <div className="hidden sm:block absolute top-0 left-1/4 w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full opacity-20 animate-pulse"></div>
          <div className="hidden sm:block absolute top-5 right-1/3 w-12 h-12 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full opacity-20 animate-pulse delay-1000"></div>
          
          <div className="relative">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl sm:rounded-3xl shadow-xl mb-3 sm:mb-4">
              <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Student Support Requests
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              View and manage submitted student support requests
            </p>
          </div>
        </div>

        {/* Offline Notice */}
        {!isOnline && (
          <Alert className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl">
            <WifiOff className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 text-sm">
              <strong>Offline Mode</strong>
              <br />
              You're viewing cached support requests. Some features like PDF generation and email sharing are unavailable offline.
            </AlertDescription>
          </Alert>
        )}

        {/* Filter */}
        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl sm:rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-600 via-slate-600 to-gray-700 text-white rounded-t-2xl sm:rounded-t-3xl">
            <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center">
                <Search className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              Filter Support Requests
              {!isOnline && (
                <div className="ml-auto flex items-center text-amber-200 text-sm">
                  <WifiOff className="h-4 w-4 mr-1" />
                  Offline
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="max-w-md">
              <Label htmlFor="teacherFilter" className="text-sm font-medium text-gray-700">
                Filter by Teacher
              </Label>
              <Input
                id="teacherFilter"
                value={teacherFilter}
                onChange={(e) => setTeacherFilter(e.target.value)}
                placeholder="Enter teacher name to filter..."
                className="mt-2 border-gray-200 rounded-xl focus:border-gray-500 focus:ring-gray-500 text-base touch-manipulation"
              />
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl sm:rounded-3xl flex items-center justify-center animate-pulse">
                <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-white" />
              </div>
              <p className="text-gray-600 font-medium text-sm sm:text-base">Loading support requests...</p>
            </div>
          </div>
        ) : supportRequests.length === 0 ? (
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl sm:rounded-3xl">
            <CardContent className="text-center py-12 sm:py-16">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4">
                <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <p className="text-gray-500 text-base sm:text-lg">
                {teacherFilter 
                  ? `No support requests found for teacher "${teacherFilter}"`
                  : "No support requests have been submitted yet."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          /* Support Requests List */
          <div className="space-y-4 sm:space-y-6">
            {supportRequests.map((supportRequest) => {
              const isExpanded = expandedSupportRequests.has(supportRequest.id);
              return (
                <Card key={supportRequest.id} className="border-0 bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl sm:rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                  <CardHeader 
                    className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded-t-2xl sm:rounded-t-3xl cursor-pointer touch-manipulation active:scale-[0.99] transition-transform"
                    onClick={() => toggleSupportRequestExpansion(supportRequest.id)}
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-3 flex-1">
                          <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center">
                              <User className="h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                            <div className="flex-1">
                              <div>{supportRequest.studentFirstName} {supportRequest.studentLastInitial}.</div>
                              <div className="text-sm text-blue-100 font-normal">
                                Grade {supportRequest.grade} • ID: {supportRequest.id}
                              </div>
                            </div>
                          </CardTitle>
                          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-blue-100">
                            <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-lg">
                              <User className="h-3 w-3" />
                              <span>{supportRequest.teacher}</span>
                            </div>
                            <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-lg">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(supportRequest.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge className={`${getSeverityBadgeColor(supportRequest.severityLevel)} rounded-xl px-2 py-1 font-medium text-xs`}>
                            {supportRequest.severityLevel.charAt(0).toUpperCase() + supportRequest.severityLevel.slice(1)}
                          </Badge>
                          <div className="flex items-center">
                            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                          </div>
                        </div>
                      </div>

                      {/* Meeting Preparation Actions - Always visible */}
                      <div className="pt-3 border-t border-white/20">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                            <Users className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-medium">Meeting Preparation</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGeneratePDF(supportRequest);
                            }}
                            disabled={isGeneratingPDF || !isOnline}
                            className="text-xs bg-white/10 border-white/30 text-white hover:bg-white/20 rounded-xl touch-manipulation active:scale-95"
                          >
                            {isGeneratingPDF ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <Download className="h-3 w-3 mr-1" />
                            )}
                            PDF
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePrintView(supportRequest);
                            }}
                            className="text-xs bg-white/10 border-white/30 text-white hover:bg-white/20 rounded-xl touch-manipulation active:scale-95"
                          >
                            <Printer className="h-3 w-3 mr-1" />
                            Print
                          </Button>
                          
                          <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!isOnline) {
                                    toast({
                                      title: "Offline Mode",
                                      description: "Email sharing requires an internet connection.",
                                      variant: "destructive"
                                    });
                                    return;
                                  }
                                  setSelectedSupportRequest(supportRequest);
                                }}
                                disabled={!isOnline}
                                className="text-xs bg-white/10 border-white/30 text-white hover:bg-white/20 rounded-xl touch-manipulation active:scale-95"
                              >
                                <Mail className="h-3 w-3 mr-1" />
                                Email
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md rounded-3xl mx-4">
                              <DialogHeader>
                                <DialogTitle>Share Support Request via Email</DialogTitle>
                                <DialogDescription>
                                  Send this support request to colleagues for the student support meeting.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="recipientEmail">Recipient Email *</Label>
                                  <Input
                                    id="recipientEmail"
                                    type="email"
                                    value={emailForm.recipientEmail}
                                    onChange={(e) => setEmailForm(prev => ({ ...prev, recipientEmail: e.target.value }))}
                                    placeholder="colleague@school.edu"
                                    className="rounded-xl text-base touch-manipulation"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="senderName">Your Name *</Label>
                                  <Input
                                    id="senderName"
                                    value={emailForm.senderName}
                                    onChange={(e) => setEmailForm(prev => ({ ...prev, senderName: e.target.value }))}
                                    placeholder="Your full name"
                                    className="rounded-xl text-base touch-manipulation"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="message">Message (optional)</Label>
                                  <Textarea
                                    id="message"
                                    value={emailForm.message}
                                    onChange={(e) => setEmailForm(prev => ({ ...prev, message: e.target.value }))}
                                    placeholder="Additional context for the meeting..."
                                    rows={3}
                                    className="rounded-xl resize-none text-base touch-manipulation"
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  onClick={handleEmailShare}
                                  disabled={isSharing}
                                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl touch-manipulation active:scale-95"
                                >
                                  {isSharing ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Sending...
                                    </>
                                  ) : (
                                    <>
                                      <Mail className="h-4 w-4 mr-2" />
                                      Send Email
                                    </>
                                  )}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {isExpanded && (
                    <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                      {/* Incident Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-900 flex items-center gap-2 text-sm sm:text-base">
                            <Calendar className="h-4 w-4 text-blue-500" />
                            Incident Date
                          </h4>
                          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-xl">
                            <p className="text-sm text-gray-700">{formatIncidentDate(supportRequest.incidentDate)}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-900 flex items-center gap-2 text-sm sm:text-base">
                            <MapPin className="h-4 w-4 text-green-500" />
                            Location
                          </h4>
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-xl">
                            <p className="text-sm text-gray-700">{supportRequest.location}</p>
                          </div>
                        </div>
                      </div>

                      {/* Concern Types */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900 text-sm sm:text-base">Concern Types</h4>
                        <div className="flex flex-wrap gap-2">
                          {supportRequest.concernTypes.map((type, index) => (
                            <Badge key={index} variant="outline" className="bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border-purple-200 rounded-xl px-2 py-1 text-xs">
                              {type}
                            </Badge>
                          ))}
                          {supportRequest.otherConcernType && (
                            <Badge variant="outline" className="bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border-purple-200 rounded-xl px-2 py-1 text-xs">
                              {supportRequest.otherConcernType}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Concern Description */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900 text-sm sm:text-base">Concern Description</h4>
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-2xl border border-amber-200">
                          <p className="text-gray-700 text-sm leading-relaxed">
                            {supportRequest.concernDescription}
                          </p>
                        </div>
                      </div>

                      {/* Actions Taken */}
                      {supportRequest.actionsTaken.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-900 text-sm sm:text-base">Actions Already Taken</h4>
                          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-2xl border border-indigo-200">
                            <div className="flex flex-wrap gap-2">
                              {supportRequest.actionsTaken.map((action, index) => (
                                <Badge key={index} variant="outline" className="bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-700 border-indigo-300 rounded-xl px-2 py-1 text-xs">
                                  {action}
                                </Badge>
                              ))}
                              {supportRequest.otherActionTaken && (
                                <Badge variant="outline" className="bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-700 border-indigo-300 rounded-xl px-2 py-1 text-xs">
                                  {supportRequest.otherActionTaken}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* AI Recommendations */}
                      {supportRequest.aiRecommendations && (
                        <div className="space-y-4">
                          <h4 className="font-medium text-gray-900 text-sm sm:text-base">AI-Generated Recommendations</h4>
                          <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4 sm:p-6 rounded-2xl border border-emerald-200">
                            <div className="prose max-w-none text-sm">
                              {formatRecommendations(supportRequest.aiRecommendations)}
                            </div>
                          </div>
                          
                          <Alert className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                            <AlertDescription className="text-xs text-amber-800 leading-relaxed">
                              ⚠️ IMPORTANT DISCLAIMER: These AI-generated recommendations are for informational purposes only and should not replace professional educational assessment. Please refer this student to your school's student support department for proper evaluation and vetting. All AI-generated suggestions must be reviewed and approved by qualified educational professionals before implementation.
                            </AlertDescription>
                          </Alert>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
