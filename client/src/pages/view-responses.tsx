import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, Clock, AlertCircle, Calendar, ArrowLeft } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { apiRequest } from '@/lib/queryClient';

export default function ViewResponses() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [teacherData, setTeacherData] = useState<any>(null);

  // Teacher lookup schema with translations
  const teacherLookupSchema = z.object({
    email: z.string().email(t('teacherLookup.emailRequired', 'Valid email is required')),
    securityPin: z.string().min(4, t('teacherLookup.pinExact', 'PIN must be exactly 4 digits')).max(4, t('teacherLookup.pinExact', 'PIN must be exactly 4 digits')).regex(/^\d{4}$/, t('teacherLookup.pinDigitsOnly', 'PIN must be 4 digits only')),
  });

  type TeacherLookupData = z.infer<typeof teacherLookupSchema>;

  const lookupForm = useForm<TeacherLookupData>({
    resolver: zodResolver(teacherLookupSchema),
    defaultValues: {
      email: '',
      securityPin: '',
    },
  });

  const onLookupSubmit = async (data: TeacherLookupData) => {
    setIsLookingUp(true);
    try {
      const response = await apiRequest({
        url: '/api/teacher/lookup',
        method: 'POST',
        body: { email: data.email, securityPin: data.securityPin },
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

  const formatProfessionalAIResponse = (markdown: string): string => {
    if (!markdown) return '';

    let html = markdown
      .replace(/^---+$/gm, '<hr class="my-4 border-gray-300">')
      .replace(/^### (\d+)\.\s*(.*?)$/gm, '<h3 class="text-lg font-semibold text-gray-900 mt-6 mb-3 border-b pb-2">$1. $2</h3>')
      .replace(/^### \*\*(.*?)\*\*/gm, '<h3 class="text-lg font-semibold text-gray-900 mt-6 mb-3 border-b pb-2">$1</h3>')
      .replace(/^### (.*?)$/gm, '<h3 class="text-lg font-semibold text-gray-900 mt-6 mb-3 border-b pb-2">$1</h3>')
      .replace(/^## (\d+)\.\s*(.*?)$/gm, '<h2 class="text-xl font-bold text-gray-900 mt-8 mb-4">$1. $2</h2>')
      .replace(/^## \*\*(.*?)\*\*/gm, '<h2 class="text-xl font-bold text-gray-900 mt-8 mb-4">$1</h2>')
      .replace(/^## (.*?)$/gm, '<h2 class="text-xl font-bold text-gray-900 mt-8 mb-4">$1</h2>')
      .replace(/^# \*\*(.*?)\*\*/gm, '<h1 class="text-2xl font-bold text-gray-900 mt-6 mb-4">$1</h1>')
      .replace(/^# (.*?)$/gm, '<h1 class="text-2xl font-bold text-gray-900 mt-6 mb-4">$1</h1>')
      .replace(/^\*\*([^:*]+):\*\*/gm, '<h4 class="text-base font-semibold text-gray-800 mt-4 mb-2">$1:</h4>')
      .replace(/^\*\*([^*]+)\*\*/gm, '<h4 class="text-base font-semibold text-gray-800 mt-3 mb-2">$1</h4>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
      .replace(/^    [-*•] (.*)/gm, '<li class="ml-8 mb-1 text-gray-700">$1</li>')
      .replace(/^  [-*•] (.*)/gm, '<li class="ml-4 mb-1 text-gray-700">$1</li>')
      .replace(/^[-*•] (.*)/gm, '<li class="mb-2 text-gray-700">$1</li>')
      .replace(/^(\d+)\. (.*)/gm, '<li class="mb-2 text-gray-700"><span class="font-medium text-gray-900">$1.</span> $2</li>')
      .replace(/\n\n/g, '</p><p class="mb-3 text-gray-700 leading-relaxed">')
      .replace(/\n/g, '<br>');

    html = '<div class="professional-content"><p class="mb-3 text-gray-700 leading-relaxed">' + html + '</p></div>';
    html = html.replace(/<p class="[^"]*"><\/p>/g, '').replace(/<p class="[^"]*"><br><\/p>/g, '');
    html = html.replace(/(<li class="[^"]*mb-2[^"]*">.*?<\/li>)/g, '<ul class="space-y-2 mb-4">$1</ul>');
    html = html.replace(/(<li class="[^"]*mb-1[^"]*">.*?<\/li>)/g, '<ul class="space-y-1 mb-3 ml-4">$1</ul>');
    html = html.replace(/(<li class="mb-2[^"]*"><span[^>]*>\d+\.<\/span>.*?<\/li>)/g, '<ol class="space-y-2 mb-4 list-decimal list-inside">$1</ol>');

    return html;
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <Link href="/">
            <Button variant="ghost" size="sm" data-testid="button-back-home">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('teacherVerification.backToHome', 'Back to Home')}
            </Button>
          </Link>
          <LanguageSwitcher />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Card className="shadow-xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900">
              {t('teacherLookup.title', 'View Your Free Student Support Responses')}
            </CardTitle>
            <CardDescription className="text-base sm:text-lg mt-2">
              {t('teacherLookup.description', 'Enter your email; to check your submitted requests and view responses.')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!teacherData ? (
              <Form {...lookupForm}>
                <form onSubmit={lookupForm.handleSubmit(onLookupSubmit)} className="space-y-4">
                  <FormField
                    control={lookupForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('teacherLookup.emailAddress', 'Email Address')}</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder={t('teacherLookup.emailPlaceholder', 'Enter your email address')}
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="none"
                            spellCheck={false}
                            readOnly
                            onFocus={(e) => e.target.removeAttribute('readonly')}
                            {...field}
                            data-testid="input-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={lookupForm.control}
                    name="securityPin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('teacherLookup.securityPin', 'Security PIN')}</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder={t('teacherLookup.pinPlaceholder', 'Enter your 4-digit PIN')}
                            maxLength={4}
                            {...field}
                            data-testid="input-pin"
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isLookingUp}
                    data-testid="button-view-submissions"
                  >
                    {isLookingUp ? t('teacherLookup.loading', 'Loading...') : t('teacherLookup.viewSubmissions', 'View My Submissions')}
                  </Button>
                </form>
              </Form>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-4 border-b">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{teacherData.teacher.firstName} {teacherData.teacher.lastName}</h3>
                    <p className="text-sm text-gray-600">{teacherData.teacher.email}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setTeacherData(null);
                      lookupForm.reset();
                    }}
                    data-testid="button-new-lookup"
                  >
                    {t('teacherLookup.newLookup', 'New Lookup')}
                  </Button>
                </div>

                {teacherData.submissions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>{t('teacherLookup.noSubmissions', 'No submissions found')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {teacherData.submissions.map((submission: any) => (
                      <Card key={submission.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-semibold text-gray-900">{submission.studentFirstName} {submission.studentLastName}</h4>
                              <p className="text-sm text-gray-600 flex items-center mt-1">
                                <Calendar className="w-3 h-3 mr-1" />
                                {formatDate(submission.submittedAt)}
                              </p>
                            </div>
                            {getStatusBadge(submission.status)}
                          </div>

                          <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <p className="text-sm text-gray-700"><strong>Concern:</strong> {submission.concernDescription}</p>
                          </div>

                          {submission.aiResponse && (
                            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                              <h5 className="font-semibold text-blue-900 mb-3">AI-Generated Support Strategies:</h5>
                              <div 
                                className="text-sm prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: formatProfessionalAIResponse(submission.aiResponse) }}
                              />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
