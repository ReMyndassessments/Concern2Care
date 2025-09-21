import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, FileText, Users, Clock, Check, Mail, LogOut, Info, Search, AlertCircle, CheckCircle2, Calendar } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from "@/hooks/use-toast";

// Contact form schema
const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  organization: z.string().optional(),
  inquiryType: z.enum(['information', 'individual_registration', 'school_registration', 'district_registration', 'other'], {
    required_error: 'Please select an inquiry type',
  }),
  message: z.string().min(10, 'Please provide a detailed message (minimum 10 characters)'),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

// Teacher lookup schema
const teacherLookupSchema = z.object({
  email: z.string().email('Valid email is required'),
});

type TeacherLookupData = z.infer<typeof teacherLookupSchema>;

// Teacher Lookup Component
function TeacherLookup() {
  const { toast } = useToast();
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [teacherData, setTeacherData] = useState<any>(null);

  const lookupForm = useForm<TeacherLookupData>({
    resolver: zodResolver(teacherLookupSchema),
    defaultValues: {
      email: '',
    },
  });

  const onLookupSubmit = async (data: TeacherLookupData) => {
    setIsLookingUp(true);
    try {
      const response = await apiRequest({
        url: '/api/teacher/lookup',
        method: 'POST',
        body: { email: data.email },
      });

      if (response.success) {
        setTeacherData(response);
        if (response.submissions.length === 0) {
          toast({
            title: "No submissions found",
            description: response.message,
            variant: "default",
          });
        } else {
          toast({
            title: "Submissions found",
            description: `Found ${response.submissions.length} submission(s)`,
            variant: "default",
          });
        }
      }
    } catch (error: any) {
      console.error('Teacher lookup error:', error);
      toast({
        title: "Lookup failed",
        description: error.message || "Failed to look up submissions",
        variant: "destructive",
      });
    } finally {
      setIsLookingUp(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    if (status === 'approved' || status === 'auto_sent') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Ready
        </span>
      );
    } else if (status === 'pending') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" />
          Processing
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          Submitted
        </span>
      );
    }
  };

  return (
    <div>
      <Form {...lookupForm}>
        <form onSubmit={lookupForm.handleSubmit(onLookupSubmit)} className="space-y-4">
          <FormField
            control={lookupForm.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    {...field}
                    data-testid="input-teacher-lookup-email"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button
            type="submit"
            disabled={isLookingUp}
            className="w-full"
            data-testid="button-lookup-submissions"
          >
            <Search className="w-4 h-4 mr-2" />
            {isLookingUp ? 'Looking up...' : 'View My Submissions'}
          </Button>
        </form>
      </Form>

      {/* Results */}
      {teacherData && (
        <div className="mt-6 space-y-4">
          {teacherData.teacher && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Welcome, {teacherData.teacher.firstName}!</h4>
              <div className="text-sm text-blue-800">
                <p>Total submissions: {teacherData.summary.total}</p>
                <p>Ready: {teacherData.summary.ready} | Processing: {teacherData.summary.pending}</p>
              </div>
            </div>
          )}

          {teacherData.submissions.length > 0 ? (
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Your Submissions</h4>
              {teacherData.submissions.map((submission: any, index: number) => (
                <div key={submission.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h5 className="font-medium text-gray-900">
                        Student Request #{teacherData.submissions.length - index}
                      </h5>
                      <p className="text-sm text-gray-600">
                        {submission.taskType === 'tier2_intervention' ? 'Tier 2 Intervention' : 'Differentiation'} - {submission.severityLevel} priority
                      </p>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      {getStatusBadge(submission.status)}
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(submission.submittedAt)}
                      </div>
                    </div>
                  </div>
                  
                  {submission.aiResponse && (
                    <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex items-center justify-between mb-3">
                        <h6 className="font-medium text-green-900">✅ Your Personalized Response</h6>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => {
                            navigator.clipboard.writeText(submission.aiResponse);
                            toast({
                              title: "Copied!",
                              description: "Response copied to clipboard",
                              variant: "default",
                            });
                          }}
                          data-testid={`button-copy-response-${submission.id}`}
                        >
                          Copy Response
                        </Button>
                      </div>
                      <div className="text-sm text-green-800 whitespace-pre-wrap bg-white p-3 rounded border max-h-60 overflow-y-auto leading-relaxed">
                        {submission.aiResponse}
                      </div>
                    </div>
                  )}
                  
                  {submission.status === 'pending' && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm text-yellow-800">
                        Your request is being processed. The personalized response will be available here once ready.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : teacherData.teacher && (
            <div className="text-center py-6 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No submissions found for your email address.</p>
              <p className="text-sm mt-1">You may need to register first.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Landing() {
  const { t } = useTranslation();
  const { isAuthenticated, user, isLoading } = useAuth();
  const { toast } = useToast();
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);

  // Contact form
  const contactForm = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      email: '',
      organization: '',
      inquiryType: undefined,
      message: '',
    },
  });

  // Fetch QR code from API
  const { data: qrCodeData, isLoading: qrLoading } = useQuery<{
    success: boolean;
    qrCode: string;
    submissionUrl: string;
  }>({
    queryKey: ['/api/classroom/qr-code'],
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.isAdmin) {
        window.location.replace('/admin');
      } else {
        window.location.replace('/home');
      }
    }
  }, [isLoading, isAuthenticated, user]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      queryClient.removeQueries({ queryKey: ["/api/auth/user"] });
      // Stay on landing page after logout
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const onContactSubmit = async (data: ContactFormData) => {
    setIsSubmittingContact(true);
    try {
      await apiRequest('/api/contact-request', {
        method: 'POST',
        body: data,
      });

      toast({
        title: "Request Submitted",
        description: "Thank you for your inquiry. We'll get back to you within 24-48 hours.",
      });

      contactForm.reset();
      setIsContactModalOpen(false);
    } catch (error) {
      console.error('Contact form submission failed:', error);
      toast({
        title: "Submission Failed",
        description: "There was an error sending your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingContact(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-purple-200 rounded-full opacity-60 animate-pulse"></div>
        <div className="absolute top-40 right-16 w-24 h-24 bg-green-200 rounded-full opacity-50 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-32 right-32 w-40 h-40 bg-pink-200 rounded-full opacity-40 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-20 left-20 w-28 h-28 bg-blue-200 rounded-full opacity-50 animate-pulse" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-yellow-200 rounded-full opacity-30 animate-pulse" style={{animationDelay: '3s'}}></div>
        <div className="absolute top-32 right-1/3 w-20 h-20 bg-indigo-200 rounded-full opacity-40 animate-pulse" style={{animationDelay: '1.5s'}}></div>
      </div>

      {/* Header */}
      <header className="relative z-10 py-4 sm:py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex justify-between items-center">
          <div className="flex-1"></div>
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline">
                  Welcome, {user?.firstName || user?.email?.split('@')[0]}
                </span>
                {user?.isAdmin ? (
                  <Button 
                    onClick={() => window.location.href = '/admin'}
                    size="sm"
                    variant="outline"
                    className="px-2 sm:px-4 py-2 text-xs sm:text-sm"
                  >
                    Admin
                  </Button>
                ) : (
                  <Button 
                    onClick={() => window.location.href = '/home'}
                    size="sm"
                    variant="outline"
                    className="px-2 sm:px-4 py-2 text-xs sm:text-sm"
                  >
                    Dashboard
                  </Button>
                )}
                <Button 
                  onClick={handleLogout}
                  size="sm"
                  variant="ghost"
                  className="text-gray-600 hover:text-red-600 px-2 sm:px-4 py-2 text-xs sm:text-sm"
                >
                  <LogOut className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            ) : (
              <Button 
                onClick={() => window.location.href = '/login'}
                size="sm"
                className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-semibold px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm"
              >
                {t('auth.teacherSignIn')}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 py-8 sm:py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl mb-6 sm:mb-8">
            <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
          </div>
          
          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4 sm:mb-6 leading-tight">
            Concern2Care
          </h1>
          
          {/* Tagline */}
          <p className="text-lg sm:text-xl md:text-2xl text-gray-700 mb-2 font-medium px-2">
            {t('landing.tagline')}
          </p>
        </div>
      </section>

      {/* Main Content Card */}
      <section className="relative z-10 pb-12 sm:pb-16 md:pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg p-6 sm:p-8 md:p-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight px-2">
              {t('landing.mainHeading')}
            </h2>
            
            <p className="text-base sm:text-lg text-gray-700 mb-6 sm:mb-8 leading-relaxed px-2 max-w-3xl mx-auto">
              {t('landing.description')}
            </p>
            
            {/* For Teachers and Administrators */}
            <div className="grid md:grid-cols-2 gap-6 mb-8 text-left">
              <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                <p className="text-base text-gray-700 leading-relaxed">
                  {t('landing.forTeachers')}
                </p>
              </div>
              <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                <p className="text-base text-gray-700 leading-relaxed">
                  {t('landing.forAdmins')}
                </p>
              </div>
            </div>
            
            <Button 
              size="lg"
              onClick={() => window.location.href = '/login'}
              className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white text-base sm:text-lg px-8 sm:px-12 py-3 sm:py-4 rounded-xl font-medium shadow-lg w-full sm:w-auto"
            >
              🔐 {t('landing.secureLogin')}
            </Button>
            
            <p className="text-xs sm:text-sm text-gray-500 mt-4 sm:mt-6 px-2">
              {t('landing.ferpaCompliant')}
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative z-10 py-12 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 text-center">
            <div className="px-2">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
                <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-purple-600" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 md:mb-3">{t('features.instantAI')}</h3>
              <p className="text-sm md:text-base text-gray-600">
                {t('features.instantAIDesc')}
              </p>
            </div>

            <div className="px-2">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
                <FileText className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 md:mb-3">{t('features.documentation')}</h3>
              <p className="text-sm md:text-base text-gray-600">
                {t('features.documentationDesc')}
              </p>
            </div>

            <div className="px-2">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
                <Users className="w-6 h-6 md:w-8 md:h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 md:mb-3">{t('features.collaboration')}</h3>
              <p className="text-sm md:text-base text-gray-600">
                {t('features.collaborationDesc')}
              </p>
            </div>

            <div className="px-2">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6">
                <Clock className="w-6 h-6 md:w-8 md:h-8 text-pink-600" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 md:mb-3">{t('features.saveTime')}</h3>
              <p className="text-sm md:text-base text-gray-600">
                {t('features.saveTimeDesc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t('pricing.title')}</h2>
            <p className="text-lg sm:text-xl text-gray-600 mb-2">{t('pricing.subtitle')}</p>
            <p className="text-sm sm:text-base text-gray-600">{t('pricing.description')}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {/* Standard Plan: 1-200 Teachers */}
            <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border-2 border-purple-500 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-purple-500 text-white px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-medium">{t('pricing.popular')}</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{t('pricing.standardPlan')}</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4">{t('pricing.standardRange')}</p>
              <div className="mb-6">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">$10<span className="text-base sm:text-lg text-gray-600">/teacher/month</span></div>
                <p className="text-sm sm:text-base text-gray-600">{t('pricing.annual')}</p>
                <p className="text-sm sm:text-base text-green-600 font-medium">{t('pricing.save10')}</p>
              </div>
              <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                <li className="flex items-start"><Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" /><span className="text-sm sm:text-base">{t('pricing.features.aiRecommendations')}</span></li>
                <li className="flex items-start"><Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" /><span className="text-sm sm:text-base">{t('pricing.features.supportRequests')}</span></li>
                <li className="flex items-start"><Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" /><span className="text-sm sm:text-base">{t('pricing.features.pdfGeneration')}</span></li>
                <li className="flex items-start"><Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" /><span className="text-sm sm:text-base">{t('pricing.features.emailSharing')}</span></li>
                <li className="flex items-start"><Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" /><span className="text-sm sm:text-base">{t('pricing.features.prioritySupport')}</span></li>
                <li className="flex items-start"><Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" /><span className="text-sm sm:text-base">{t('pricing.features.analytics')}</span></li>
                <li className="flex items-start"><Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" /><span className="text-sm sm:text-base">{t('pricing.features.bulkManagement')}</span></li>
                <li className="flex items-start"><Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" /><span className="text-sm sm:text-base">{t('pricing.features.training')}</span></li>
              </ul>
              <Button className="w-full bg-purple-600 hover:bg-purple-700">{t('pricing.getStarted')}</Button>
            </div>

            {/* Enterprise Plan: 200+ Teachers */}
            <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-200">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{t('pricing.enterprise')}</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4">{t('pricing.enterpriseRange')}</p>
              <div className="mb-6">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">{t('pricing.custom')}</div>
                <p className="text-sm sm:text-base text-gray-600">{t('pricing.customPricing')}</p>
              </div>
              <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                <li className="flex items-start"><Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" /><span className="text-sm sm:text-base">{t('pricing.features.everythingInStandard')}</span></li>
                <li className="flex items-start"><Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" /><span className="text-sm sm:text-base">{t('pricing.features.accountManager')}</span></li>
                <li className="flex items-start"><Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" /><span className="text-sm sm:text-base">{t('pricing.features.whiteLabel')}</span></li>
                <li className="flex items-start"><Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" /><span className="text-sm sm:text-base">{t('pricing.features.apiAccess')}</span></li>
                <li className="flex items-start"><Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" /><span className="text-sm sm:text-base">{t('pricing.features.customDevelopment')}</span></li>
                <li className="flex items-start"><Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" /><span className="text-sm sm:text-base">{t('pricing.features.reporting')}</span></li>
                <li className="flex items-start"><Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" /><span className="text-sm sm:text-base">{t('pricing.features.support24')}</span></li>
                <li className="flex items-start"><Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" /><span className="text-sm sm:text-base">{t('pricing.features.onsiteSupport')}</span></li>
              </ul>
              <Button className="w-full bg-purple-600 hover:bg-purple-700">{t('pricing.getStarted')}</Button>
            </div>
          </div>
        </div>
      </section>


      {/* What's Included */}
      <section className="py-12 sm:py-16 md:py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t('included.title')}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('included.coreFeatures')}</h3>
              <ul className="space-y-3">
                <li className="flex items-start"><Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" /><span className="text-sm sm:text-base">{t('included.aiRecommendations')}</span></li>
                <li className="flex items-start"><Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" /><span className="text-sm sm:text-base">{t('included.pdfGeneration')}</span></li>
                <li className="flex items-start"><Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" /><span className="text-sm sm:text-base">{t('included.emailSharing')}</span></li>
                <li className="flex items-start"><Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" /><span className="text-sm sm:text-base">{t('included.supportRequests')}</span></li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('included.securitySupport')}</h3>
              <ul className="space-y-3">
                <li className="flex items-start"><Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" /><span className="text-sm sm:text-base">{t('included.secureStorage')}</span></li>
                <li className="flex items-start"><Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" /><span className="text-sm sm:text-base">{t('included.updates')}</span></li>
                <li className="flex items-start"><Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" /><span className="text-sm sm:text-base">{t('included.customerSupport')}</span></li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* Classroom Solutions Program */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-6">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Classroom Solutions Program
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Specialized intervention support for K-12 teachers worldwide, delivered through our expert review process
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h3>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm mr-4">1</div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Submit Your Request</h4>
                    <p className="text-gray-600">Teachers access our form via QR code to submit student concerns and intervention requests</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm mr-4">2</div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Expert Review</h4>
                    <p className="text-gray-600">Our administrators review AI-generated strategies for quality and safety</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm mr-4">3</div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Receive Interventions</h4>
                    <p className="text-gray-600">Approved, evidence-based Tier 2 intervention strategies delivered directly to teachers</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Program Features</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Evidence-based Tier 2 intervention strategies</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Expert review and quality assurance</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Safety keyword monitoring and alerts</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>QR code access for easy teacher submission</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Professional report generation and delivery</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Global reach for K-12 educators</span>
                </li>
              </ul>
              
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-center">
                  <h4 className="font-semibold text-blue-900 mb-2">Contact Information</h4>
                  <p className="text-blue-800 text-sm">
                    For more information on the Classroom Solutions Program, Individual, School, and District Teacher Registration, Contact us at info@remynd.online
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code for Teacher Submissions */}
          <div className="mt-12 text-center">
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Access for Registered Teachers</h3>
              <p className="text-gray-600 mb-6">Scan the QR code or visit the URL to submit intervention requests:</p>
              
              <div className="mb-6">
                <div className="bg-gray-100 rounded-lg p-4 inline-block">
                  {qrLoading ? (
                    <div className="w-48 h-48 mx-auto flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : qrCodeData?.qrCode ? (
                    <img 
                      src={qrCodeData.qrCode} 
                      alt="Classroom Solutions QR Code" 
                      className="w-48 h-48 mx-auto"
                    />
                  ) : (
                    <div className="w-48 h-48 mx-auto flex items-center justify-center text-gray-500">
                      QR Code unavailable
                    </div>
                  )}
                </div>
              </div>
              
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  if (qrCodeData?.submissionUrl) {
                    window.open(qrCodeData.submissionUrl, '_blank');
                  }
                }}
                data-testid="button-access-form"
                disabled={qrLoading || !qrCodeData?.submissionUrl}
              >
                {qrLoading ? 'Loading...' : 'Access Submission Form'}
              </Button>
            </div>
          </div>
        </div>

        {/* Teacher Response Lookup Section */}
        <div className="mt-12 max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">View Your Responses</h3>
            <p className="text-gray-600 mb-6 text-center">Enter your email to check your submitted requests and view approved responses.</p>
            
            <TeacherLookup />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-br from-purple-600 to-blue-600">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">{t('cta.title')}</h2>
          <p className="hidden sm:block text-xl sm:text-2xl text-purple-100 mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed">{t('cta.subtitle')}</p>
          <p className="block sm:hidden text-xl text-purple-100 mb-8 leading-relaxed">{t('cta.subtitleMobile')}</p>
          <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 font-semibold px-8 py-4 text-lg w-full sm:w-auto min-h-[56px] rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">{t('cta.getQuote')}</Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 sm:py-16 bg-gray-900 text-center">
        <div className="max-w-4xl mx-auto px-6 sm:px-8">
          <p className="text-gray-300 mb-6 text-base sm:text-lg">
            <Mail className="w-5 h-5 inline mr-2" />
            {t('cta.questions')}
          </p>
          <p className="text-gray-400 text-sm sm:text-base mb-3">{t('footer.copyright')}</p>
          <p className="text-gray-500 text-sm sm:text-base">{t('footer.poweredBy')}</p>
        </div>
      </footer>
    </div>
  );
}