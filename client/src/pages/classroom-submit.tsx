import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';
import { FileText, Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

// Form validation schema
const classroomSubmissionSchema = z.object({
  teacherFirstName: z.string().min(1, 'First name is required'),
  teacherLastInitial: z.string().min(1, 'Last initial is required').max(1, 'Only one letter allowed'),
  teacherPosition: z.string().min(1, 'Position is required'),
  teacherEmail: z.string().email('Valid email is required'),
  studentFirstName: z.string().min(1, 'Student first name or initials are required'),
  studentLastInitial: z.string().min(1, 'Student last initial is required').max(1, 'Only one letter allowed'),
  studentAge: z.string().min(1, 'Student age is required'),
  studentGrade: z.string().min(1, 'Grade level is required'),
  taskType: z.enum(['differentiation', 'tier2_intervention'], {
    required_error: 'Please select a request type',
  }),
  learningProfile: z.array(z.string()).min(1, 'Please select at least one learning profile item'),
  // Additional text fields for specific learning profile items
  englishAsAdditionalLanguageDetails: z.string().optional(),
  diagnosedDisabilityDetails: z.string().optional(),
  otherLearningNeedsDetails: z.string().optional(),
  concernTypes: z.array(z.string()).min(1, 'Please select at least one concern type'),
  concernDescription: z.string().min(10, 'Please provide a detailed description (minimum 10 characters)'),
  severityLevel: z.enum(['mild', 'moderate', 'urgent'], {
    required_error: 'Please select a severity level',
  }),
  actionsTaken: z.array(z.string()).min(1, 'Please select at least one action taken'),
});

type ClassroomSubmissionForm = z.infer<typeof classroomSubmissionSchema>;

export default function ClassroomSubmit() {
  const [isFeatureEnabled, setIsFeatureEnabled] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const { toast } = useToast();

  const form = useForm<ClassroomSubmissionForm>({
    resolver: zodResolver(classroomSubmissionSchema),
    defaultValues: {
      teacherFirstName: '',
      teacherLastInitial: '',
      teacherPosition: '',
      teacherEmail: '',
      studentFirstName: '',
      studentLastInitial: '',
      studentAge: '',
      studentGrade: '',
      taskType: undefined,
      learningProfile: [],
      englishAsAdditionalLanguageDetails: '',
      diagnosedDisabilityDetails: '',
      otherLearningNeedsDetails: '',
      concernTypes: [],
      concernDescription: '',
      severityLevel: undefined,
      actionsTaken: [],
    },
  });

  // Check if Classroom Solutions feature is enabled
  useEffect(() => {
    const checkFeatureFlag = async () => {
      try {
        const response = await fetch('/api/feature-flags/enabled');
        const data = await response.json();
        const isEnabled = data.flags.some((flag: any) => 
          flag.flagName === 'classroom_solutions_enabled' && flag.isGloballyEnabled
        );
        setIsFeatureEnabled(isEnabled);
      } catch (error) {
        console.error('Error checking feature flag:', error);
        setIsFeatureEnabled(false);
      }
    };

    checkFeatureFlag();
  }, []);

  const onSubmit = async (data: ClassroomSubmissionForm) => {
    setIsSubmitting(true);
    try {
      console.log('Submitting classroom form:', data);
      
      const response = await apiRequest({
        url: '/api/classroom/submit',
        method: 'POST',
        body: data,
      });

      console.log('Submission response:', response);
      setSubmissionResult(response);
      setIsSubmitted(true);
      
      toast({
        title: "Request Submitted Successfully",
        description: "You will receive a response via email within 24-48 hours.",
      });

    } catch (error: any) {
      console.error('Submission error:', error);
      let errorMessage = 'Failed to submit request. Please try again.';
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast({
        title: "Submission Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isFeatureEnabled === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Feature not enabled
  if (!isFeatureEnabled) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Service Not Available</h1>
            <p className="text-gray-600">
              The Classroom Solutions service is currently not available. 
              Please contact your administrator for assistance.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (isSubmitted && submissionResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Request Submitted Successfully!</h1>
            <p className="text-gray-600 mb-4">
              Your classroom solutions request has been submitted and will be reviewed by our team.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Response Timeline:</strong> You will receive a personalized response via email within 24-48 hours.
              </p>
              {submissionResult.remainingRequests !== undefined && (
                <p className="text-sm text-blue-800 mt-2">
                  <strong>Remaining Requests:</strong> {submissionResult.remainingRequests} this month
                </p>
              )}
            </div>
            <p className="text-xs text-gray-500 mb-6">
              Submission ID: {submissionResult.submissionId}
            </p>
            
            {/* Navigation buttons */}
            <div className="space-y-3">
              {submissionResult.remainingRequests > 0 && (
                <Button 
                  onClick={() => {
                    setIsSubmitted(false);
                    setSubmissionResult(null);
                    form.reset();
                  }}
                  className="w-full"
                  data-testid="button-submit-another-request"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Submit Another Request
                </Button>
              )}
              
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main form
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center">
            <FileText className="h-6 w-6 text-blue-600 mr-2" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">C2C Classroom Solutions</h1>
              <p className="text-sm text-gray-600">Request Differentiation & Intervention Support</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Teacher Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">1</span>
                  Teacher Information
                </CardTitle>
                <CardDescription>
                  Please provide your contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="teacherFirstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your first name" {...field} data-testid="input-teacher-first-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="teacherLastInitial"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Initial</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="X" 
                          maxLength={1} 
                          className="uppercase" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          data-testid="input-teacher-last-initial"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="teacherPosition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position/Role</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger data-testid="select-teacher-position">
                            <SelectValue placeholder="Select your role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Classroom Teacher">Classroom Teacher</SelectItem>
                            <SelectItem value="Special Education Teacher">Special Education Teacher</SelectItem>
                            <SelectItem value="Resource Teacher">Resource Teacher</SelectItem>
                            <SelectItem value="Teaching Assistant">Teaching Assistant</SelectItem>
                            <SelectItem value="Substitute Teacher">Substitute Teacher</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="teacherEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="your.email@school.edu" 
                          {...field}
                          data-testid="input-teacher-email"
                        />
                      </FormControl>
                      <FormDescription>
                        Response will be sent to this email address
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Student Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">2</span>
                  Student Information
                </CardTitle>
                <CardDescription>
                  Basic student information (no full names for privacy)
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="studentFirstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student First Name or Initials</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Alex or A.J." 
                          {...field}
                          data-testid="input-student-first-name"
                        />
                      </FormControl>
                      <FormDescription>
                        Use first name or initials for privacy
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="studentLastInitial"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student Last Initial</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., M" 
                          maxLength={1}
                          {...field}
                          data-testid="input-student-last-initial"
                        />
                      </FormControl>
                      <FormDescription>
                        One letter only for privacy
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="studentAge"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student Age</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger data-testid="select-student-age">
                            <SelectValue placeholder="Select age" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="4">4 years old</SelectItem>
                            <SelectItem value="5">5 years old</SelectItem>
                            <SelectItem value="6">6 years old</SelectItem>
                            <SelectItem value="7">7 years old</SelectItem>
                            <SelectItem value="8">8 years old</SelectItem>
                            <SelectItem value="9">9 years old</SelectItem>
                            <SelectItem value="10">10 years old</SelectItem>
                            <SelectItem value="11">11 years old</SelectItem>
                            <SelectItem value="12">12 years old</SelectItem>
                            <SelectItem value="13">13 years old</SelectItem>
                            <SelectItem value="14">14 years old</SelectItem>
                            <SelectItem value="15">15 years old</SelectItem>
                            <SelectItem value="16">16 years old</SelectItem>
                            <SelectItem value="17">17 years old</SelectItem>
                            <SelectItem value="18">18 years old</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="studentGrade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grade Level</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger data-testid="select-student-grade">
                            <SelectValue placeholder="Select grade" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pre-K">Pre-K</SelectItem>
                            <SelectItem value="Kindergarten">Kindergarten</SelectItem>
                            <SelectItem value="1st Grade">1st Grade</SelectItem>
                            <SelectItem value="2nd Grade">2nd Grade</SelectItem>
                            <SelectItem value="3rd Grade">3rd Grade</SelectItem>
                            <SelectItem value="4th Grade">4th Grade</SelectItem>
                            <SelectItem value="5th Grade">5th Grade</SelectItem>
                            <SelectItem value="6th Grade">6th Grade</SelectItem>
                            <SelectItem value="7th Grade">7th Grade</SelectItem>
                            <SelectItem value="8th Grade">8th Grade</SelectItem>
                            <SelectItem value="9th Grade">9th Grade</SelectItem>
                            <SelectItem value="10th Grade">10th Grade</SelectItem>
                            <SelectItem value="11th Grade">11th Grade</SelectItem>
                            <SelectItem value="12th Grade">12th Grade</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Request Type */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">3</span>
                  Request Type
                </CardTitle>
                <CardDescription>
                  What type of support are you requesting?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="taskType"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Card 
                            className={`cursor-pointer border-2 transition-colors ${
                              field.value === 'differentiation' 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => field.onChange('differentiation')}
                            data-testid="card-differentiation"
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center mb-2">
                                <input 
                                  type="radio" 
                                  checked={field.value === 'differentiation'}
                                  onChange={() => field.onChange('differentiation')}
                                  className="mr-2"
                                  data-testid="radio-differentiation"
                                />
                                <h3 className="font-semibold">Differentiation Support</h3>
                              </div>
                              <p className="text-sm text-gray-600">
                                Request strategies to modify instruction, activities, or assessments 
                                to meet diverse learning needs within your classroom.
                              </p>
                            </CardContent>
                          </Card>

                          <Card 
                            className={`cursor-pointer border-2 transition-colors ${
                              field.value === 'tier2_intervention' 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => field.onChange('tier2_intervention')}
                            data-testid="card-tier2"
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center mb-2">
                                <input 
                                  type="radio" 
                                  checked={field.value === 'tier2_intervention'}
                                  onChange={() => field.onChange('tier2_intervention')}
                                  className="mr-2"
                                  data-testid="radio-tier2"
                                />
                                <h3 className="font-semibold">Tier 2 Intervention</h3>
                              </div>
                              <p className="text-sm text-gray-600">
                                Request targeted intervention strategies for students needing 
                                additional academic or behavioral support beyond general classroom instruction.
                              </p>
                            </CardContent>
                          </Card>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Learning Profile */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">4</span>
                  Student Learning Profile
                </CardTitle>
                <CardDescription>
                  Select all that apply to this student and provide additional details where applicable
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="learningProfile"
                  render={() => (
                    <FormItem>
                      <div className="space-y-4">
                        {/* Has IEP / 504 Plan */}
                        <FormField
                          control={form.control}
                          name="learningProfile"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes('Has IEP / 504 Plan')}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, 'Has IEP / 504 Plan'])
                                      : field.onChange(field.value?.filter((value) => value !== 'Has IEP / 504 Plan'))
                                  }}
                                  data-testid="checkbox-learning-has-iep-504-plan"
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">
                                Has IEP / 504 Plan
                              </FormLabel>
                            </FormItem>
                          )}
                        />

                        {/* Has Diagnosed Disability */}
                        <div className="space-y-2">
                          <FormField
                            control={form.control}
                            name="learningProfile"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes('Has Diagnosed Disability')}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, 'Has Diagnosed Disability'])
                                        : field.onChange(field.value?.filter((value) => value !== 'Has Diagnosed Disability'))
                                    }}
                                    data-testid="checkbox-learning-has-diagnosed-disability"
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal">
                                  Has Diagnosed Disability
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                          {form.watch('learningProfile')?.includes('Has Diagnosed Disability') && (
                            <FormField
                              control={form.control}
                              name="diagnosedDisabilityDetails"
                              render={({ field }) => (
                                <FormItem className="ml-6">
                                  <FormControl>
                                    <Input
                                      placeholder="Please specify the disability (e.g., ADHD, Autism, Learning Disability)"
                                      {...field}
                                      data-testid="input-diagnosed-disability-details"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </div>

                        {/* English as an Additional Language */}
                        <div className="space-y-2">
                          <FormField
                            control={form.control}
                            name="learningProfile"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes('English as an Additional Language')}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, 'English as an Additional Language'])
                                        : field.onChange(field.value?.filter((value) => value !== 'English as an Additional Language'))
                                    }}
                                    data-testid="checkbox-learning-english-as-an-additional-language"
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal">
                                  English as an Additional Language
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                          {form.watch('learningProfile')?.includes('English as an Additional Language') && (
                            <FormField
                              control={form.control}
                              name="englishAsAdditionalLanguageDetails"
                              render={({ field }) => (
                                <FormItem className="ml-6">
                                  <FormControl>
                                    <Input
                                      placeholder="Please specify the student's first language and English proficiency level"
                                      {...field}
                                      data-testid="input-english-additional-language-details"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </div>

                        {/* Gifted / Talented */}
                        <FormField
                          control={form.control}
                          name="learningProfile"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes('Gifted / Talented')}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, 'Gifted / Talented'])
                                      : field.onChange(field.value?.filter((value) => value !== 'Gifted / Talented'))
                                  }}
                                  data-testid="checkbox-learning-gifted-talented"
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">
                                Gifted / Talented
                              </FormLabel>
                            </FormItem>
                          )}
                        />

                        {/* Struggling Academically */}
                        <FormField
                          control={form.control}
                          name="learningProfile"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes('Struggling Academically')}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, 'Struggling Academically'])
                                      : field.onChange(field.value?.filter((value) => value !== 'Struggling Academically'))
                                  }}
                                  data-testid="checkbox-learning-struggling-academically"
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">
                                Struggling Academically
                              </FormLabel>
                            </FormItem>
                          )}
                        />

                        {/* Other Learning Needs or Notes */}
                        <div className="space-y-2">
                          <FormField
                            control={form.control}
                            name="learningProfile"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes('Other Learning Needs or Notes')}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, 'Other Learning Needs or Notes'])
                                        : field.onChange(field.value?.filter((value) => value !== 'Other Learning Needs or Notes'))
                                    }}
                                    data-testid="checkbox-learning-other-learning-needs-or-notes"
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal">
                                  Other Learning Needs or Notes
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                          {form.watch('learningProfile')?.includes('Other Learning Needs or Notes') && (
                            <FormField
                              control={form.control}
                              name="otherLearningNeedsDetails"
                              render={({ field }) => (
                                <FormItem className="ml-6">
                                  <FormControl>
                                    <Textarea
                                      placeholder="Please describe any other learning needs, accommodations, or important notes about this student"
                                      className="min-h-[80px]"
                                      {...field}
                                      data-testid="textarea-other-learning-needs-details"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Concerns */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">5</span>
                  Areas of Concern
                </CardTitle>
                <CardDescription>
                  Select all areas where you need support
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="concernTypes"
                  render={() => (
                    <FormItem>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                          'Academic Performance',
                          'Reading Comprehension',
                          'Math Skills',
                          'Writing Skills',
                          'Attention & Focus',
                          'Behavioral Issues',
                          'Social Interactions',
                          'Emotional Regulation',
                          'Communication Skills',
                          'Motor Skills',
                          'Organization & Study Skills',
                          'Homework Completion',
                          'Class Participation',
                          'Peer Relationships',
                          'Following Directions',
                          'Other'
                        ].map((item) => (
                          <FormField
                            key={item}
                            control={form.control}
                            name="concernTypes"
                            render={({ field }) => (
                              <FormItem
                                key={item}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(item)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, item])
                                        : field.onChange(
                                            field.value?.filter((value) => value !== item)
                                          )
                                    }}
                                    data-testid={`checkbox-concern-${item.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal">
                                  {item}
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Concern Description */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">6</span>
                  Detailed Description
                </CardTitle>
                <CardDescription>
                  Please describe the specific challenges and provide context
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="concernDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Describe the specific challenges you're observing</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Please provide specific examples of what you're observing, when these issues occur, and any patterns you've noticed. Include specific behaviors, academic challenges, or social interactions that concern you."
                          className="min-h-[100px]"
                          {...field}
                          data-testid="textarea-concern-description"
                        />
                      </FormControl>
                      <FormDescription>
                        The more detail you provide, the better we can tailor our recommendations
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="severityLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Severity Level</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger data-testid="select-severity-level">
                            <SelectValue placeholder="Select severity level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mild">Mild - Minor concerns that occasionally impact learning</SelectItem>
                            <SelectItem value="moderate">Moderate - Regular concerns that consistently impact learning</SelectItem>
                            <SelectItem value="urgent">Urgent - Severe concerns requiring immediate attention</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Actions Taken */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">7</span>
                  Actions Already Taken
                </CardTitle>
                <CardDescription>
                  Select all strategies you have already tried
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="actionsTaken"
                  render={() => (
                    <FormItem>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                          'Verbal redirection',
                          'Changed seating arrangement',
                          'Modified assignments',
                          'Extra time provided',
                          'Visual supports added',
                          'Break reminders',
                          'Peer buddy system',
                          'Parent communication',
                          'Behavioral chart/rewards',
                          'Small group instruction',
                          'One-on-one support',
                          'Consulted with colleagues',
                          'Reviewed student records',
                          'Tried different teaching strategies',
                          'Environmental modifications',
                          'None yet - just starting to observe concerns'
                        ].map((item) => (
                          <FormField
                            key={item}
                            control={form.control}
                            name="actionsTaken"
                            render={({ field }) => (
                              <FormItem
                                key={item}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(item)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, item])
                                        : field.onChange(
                                            field.value?.filter((value) => value !== item)
                                          )
                                    }}
                                    data-testid={`checkbox-action-${item.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal">
                                  {item}
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Privacy Notice */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Privacy Notice:</strong> Please do not include the student's full name or other identifying information. 
                This form is designed to protect student privacy while providing you with personalized support strategies.
              </AlertDescription>
            </Alert>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button 
                type="submit" 
                size="lg" 
                disabled={isSubmitting}
                className="min-w-[200px]"
                data-testid="button-submit-form"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Request
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
}