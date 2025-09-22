import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, Shield, UserCheck, Lock } from 'lucide-react';

// Schema for email verification step
const emailVerificationSchema = z.object({
  teacherEmail: z.string().email('Please enter a valid email address'),
});

// Schema for PIN setup (first-time users)
const pinSetupSchema = z.object({
  securityPin: z.string().length(4, 'PIN must be exactly 4 digits').regex(/^\d+$/, 'PIN must contain only numbers'),
  securityQuestion: z.string().min(1, 'Security question is required'),
  securityAnswer: z.string().min(1, 'Security answer is required'),
});

// Schema for PIN verification (returning users)
const pinVerificationSchema = z.object({
  securityPin: z.string().length(4, 'PIN must be exactly 4 digits').regex(/^\d+$/, 'PIN must contain only numbers'),
});

type EmailVerificationForm = z.infer<typeof emailVerificationSchema>;
type PinSetupForm = z.infer<typeof pinSetupSchema>;
type PinVerificationForm = z.infer<typeof pinVerificationSchema>;

interface ClassroomTeacherVerificationProps {
  onVerificationComplete: (teacherEmail: string) => void;
}

type VerificationStep = 'email' | 'pin_setup' | 'pin_verification' | 'complete';

const SECURITY_QUESTIONS = [
  "What was the name of your first pet?",
  "What elementary school did you attend?",
  "What was your childhood nickname?",
  "In what city were you born?",
  "What is your mother's maiden name?",
  "What was the make of your first car?",
  "What was the name of your favorite teacher?",
  "What street did you grow up on?"
];

export function ClassroomTeacherVerification({ onVerificationComplete }: ClassroomTeacherVerificationProps) {
  const [currentStep, setCurrentStep] = useState<VerificationStep>('email');
  const [teacherEmail, setTeacherEmail] = useState<string>('');
  const [isFirstTimeUser, setIsFirstTimeUser] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Email verification form
  const emailForm = useForm<EmailVerificationForm>({
    resolver: zodResolver(emailVerificationSchema),
    defaultValues: { teacherEmail: '' },
  });

  // PIN setup form (first-time users)
  const pinSetupForm = useForm<PinSetupForm>({
    resolver: zodResolver(pinSetupSchema),
    defaultValues: {
      securityPin: '',
      securityQuestion: '',
      securityAnswer: '',
    },
  });

  // PIN verification form (returning users)
  const pinVerificationForm = useForm<PinVerificationForm>({
    resolver: zodResolver(pinVerificationSchema),
    defaultValues: { securityPin: '' },
  });

  const handleEmailSubmit = async (data: EmailVerificationForm) => {
    setIsLoading(true);
    console.log('🔍 Checking teacher enrollment for:', data.teacherEmail);

    try {
      const response = await apiRequest({
        url: '/api/classroom/check-teacher-pin-status',
        method: 'POST',
        body: { teacherEmail: data.teacherEmail },
      });

      setTeacherEmail(data.teacherEmail);
      setIsFirstTimeUser(response.isFirstTimeUser);
      
      console.log(`✅ Teacher ${data.teacherEmail} - First time user: ${response.isFirstTimeUser}`);

      if (response.isFirstTimeUser) {
        setCurrentStep('pin_setup');
        toast({
          title: "Welcome!",
          description: "Please set up your security PIN and question for future access.",
        });
      } else {
        setCurrentStep('pin_verification');
        toast({
          title: "Welcome back!",
          description: "Please enter your security PIN to continue.",
        });
      }
    } catch (error: any) {
      console.error('❌ Error checking teacher enrollment:', error);
      toast({
        title: "Enrollment Check Failed",
        description: error.message || "Unable to verify teacher enrollment. Please contact your administrator.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinSetup = async (data: PinSetupForm) => {
    setIsLoading(true);
    console.log('🔐 Setting up PIN for first-time user:', teacherEmail);
    console.log('📝 Form data being submitted:', {
      teacherEmail,
      securityPin: data.securityPin ? '****' : 'EMPTY',
      securityQuestion: data.securityQuestion || 'EMPTY',
      securityAnswer: data.securityAnswer || 'EMPTY',
      securityQuestionLength: data.securityQuestion?.length || 0,
      securityAnswerLength: data.securityAnswer?.length || 0,
    });

    // Client-side validation check
    if (!data.securityQuestion || data.securityQuestion.trim().length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select a security question.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!data.securityAnswer || data.securityAnswer.trim().length === 0) {
      toast({
        title: "Validation Error", 
        description: "Security answer is required.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      await apiRequest({
        url: '/api/classroom/enroll-teacher',
        method: 'POST',
        body: {
          teacherEmail,
          securityPin: data.securityPin,
          securityQuestion: data.securityQuestion,
          securityAnswer: data.securityAnswer,
        },
      });

      console.log('✅ PIN setup successful for:', teacherEmail);
      toast({
        title: "Setup Complete!",
        description: "Your security PIN has been created. You can now access the submission form.",
      });

      setCurrentStep('complete');
      setTimeout(() => onVerificationComplete(teacherEmail), 1000);
    } catch (error: any) {
      console.error('❌ Error setting up PIN:', error);
      toast({
        title: "Setup Failed",
        description: error.message || "Unable to set up security PIN. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinVerification = async (data: PinVerificationForm) => {
    setIsLoading(true);
    console.log('🔐 Verifying PIN for returning user:', teacherEmail);

    try {
      const response = await apiRequest({
        url: '/api/classroom/verify-teacher-pin',
        method: 'POST',
        body: {
          teacherEmail,
          securityPin: data.securityPin,
        },
      });

      if (response.success) {
        console.log('✅ PIN verification successful for:', teacherEmail);
        toast({
          title: "Access Granted!",
          description: "PIN verified successfully. Redirecting to submission form...",
        });

        setCurrentStep('complete');
        setTimeout(() => onVerificationComplete(teacherEmail), 1000);
      } else {
        toast({
          title: "Incorrect PIN",
          description: "The PIN you entered is incorrect. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('❌ Error verifying PIN:', error);
      toast({
        title: "Verification Failed",
        description: error.message || "Unable to verify PIN. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetToEmailStep = () => {
    setCurrentStep('email');
    setTeacherEmail('');
    setIsFirstTimeUser(null);
    emailForm.reset();
    pinSetupForm.reset();
    pinVerificationForm.reset();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" data-testid="verification-modal">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            {currentStep === 'email' && <UserCheck className="h-8 w-8 text-blue-600" />}
            {(currentStep === 'pin_setup' || currentStep === 'pin_verification') && <Shield className="h-8 w-8 text-green-600" />}
            {currentStep === 'complete' && <Lock className="h-8 w-8 text-green-600" />}
          </div>
          <CardTitle>
            {currentStep === 'email' && 'Teacher Verification'}
            {currentStep === 'pin_setup' && 'Security Setup'}
            {currentStep === 'pin_verification' && 'Enter Your PIN'}
            {currentStep === 'complete' && 'Access Granted'}
          </CardTitle>
          <CardDescription>
            {currentStep === 'email' && 'Please enter your email address to verify your enrollment'}
            {currentStep === 'pin_setup' && 'Set up your security PIN and question for future access'}
            {currentStep === 'pin_verification' && 'Enter your 4-digit security PIN to continue'}
            {currentStep === 'complete' && 'Redirecting to submission form...'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Email Verification Step */}
          {currentStep === 'email' && (
            <Form {...emailForm}>
              <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4">
                <FormField
                  control={emailForm.control}
                  name="teacherEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="your.email@school.edu"
                          data-testid="input-teacher-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                  data-testid="button-verify-email"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify Enrollment'
                  )}
                </Button>
              </form>
            </Form>
          )}

          {/* PIN Setup Step (First-time users) */}
          {currentStep === 'pin_setup' && (
            <Form {...pinSetupForm}>
              <form onSubmit={(e) => {
                console.log('🔍 Form submission triggered');
                console.log('🔍 Form values at submission:', pinSetupForm.getValues());
                console.log('🔍 Form errors at submission:', pinSetupForm.formState.errors);
                return pinSetupForm.handleSubmit(handlePinSetup)(e);
              }} className="space-y-4">
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm text-blue-700">
                    <strong>Welcome!</strong> Since this is your first time, please create a 4-digit PIN and select a security question for password recovery.
                  </p>
                </div>

                <FormField
                  control={pinSetupForm.control}
                  name="securityPin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Create 4-Digit PIN</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          maxLength={4}
                          placeholder="••••"
                          data-testid="input-security-pin"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={pinSetupForm.control}
                  name="securityQuestion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Security Question</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-security-question">
                            <SelectValue placeholder="Choose a security question..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SECURITY_QUESTIONS.map((question, index) => (
                            <SelectItem key={index} value={question}>
                              {question}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={pinSetupForm.control}
                  name="securityAnswer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Security Answer</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          placeholder="Your answer (case sensitive)"
                          data-testid="input-security-answer"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={resetToEmailStep}
                    className="flex-1"
                    data-testid="button-back-to-email"
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1" 
                    disabled={isLoading}
                    data-testid="button-create-pin"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create PIN'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {/* PIN Verification Step (Returning users) */}
          {currentStep === 'pin_verification' && (
            <Form {...pinVerificationForm}>
              <form onSubmit={pinVerificationForm.handleSubmit(handlePinVerification)} className="space-y-4">
                <div className="bg-green-50 p-3 rounded-md">
                  <p className="text-sm text-green-700">
                    <strong>Welcome back!</strong> Please enter your 4-digit security PIN to access the submission form.
                  </p>
                </div>

                <FormField
                  control={pinVerificationForm.control}
                  name="securityPin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Enter Your PIN</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          maxLength={4}
                          placeholder="••••"
                          data-testid="input-pin-verification"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={resetToEmailStep}
                    className="flex-1"
                    data-testid="button-back-to-email"
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1" 
                    disabled={isLoading}
                    data-testid="button-verify-pin"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify PIN'
                    )}
                  </Button>
                </div>

                <div className="text-center">
                  <Button 
                    type="button" 
                    variant="link" 
                    className="text-sm text-blue-600"
                    data-testid="link-forgot-pin"
                  >
                    Forgot your PIN?
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {/* Complete Step */}
          {currentStep === 'complete' && (
            <div className="text-center py-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-green-600" />
              <p className="text-sm text-gray-600">Loading submission form...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}