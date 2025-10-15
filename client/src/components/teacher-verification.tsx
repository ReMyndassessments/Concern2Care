import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';
import { Mail, Loader2, Home, X } from 'lucide-react';
import SimplePinSetup from './simple-pin-setup';
import { useTranslation } from 'react-i18next';

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const pinSchema = z.object({
  pin: z.string().min(4, 'PIN must be 4 digits').max(4, 'PIN must be 4 digits').regex(/^\d{4}$/, 'PIN must be 4 digits'),
});

type EmailForm = z.infer<typeof emailSchema>;
type PinForm = z.infer<typeof pinSchema>;

interface TeacherVerificationProps {
  onVerificationComplete: (teacherEmail: string) => void;
}

const registrationSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  position: z.string().min(1, 'Position is required'),
  school: z.string().optional(),
});

type RegistrationForm = z.infer<typeof registrationSchema>;

export default function TeacherVerification({ onVerificationComplete }: TeacherVerificationProps) {
  const [currentStep, setCurrentStep] = useState<'email' | 'register' | 'pin_setup' | 'pin_entry' | 'complete'>('email');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [pinDigits, setPinDigits] = useState(['', '', '', '']);
  const { toast } = useToast();
  const { t } = useTranslation();

  const form = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: '',
    },
  });

  const pinForm = useForm<PinForm>({
    resolver: zodResolver(pinSchema),
    defaultValues: {
      pin: '',
    },
  });

  const registrationForm = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      position: '',
      school: '',
    },
  });

  const checkTeacherStatus = async (data: EmailForm) => {
    setIsChecking(true);
    try {
      const response = await apiRequest({
        url: '/api/classroom/check-teacher',
        method: 'POST',
        body: { email: data.email },
      });

      setTeacherEmail(data.email);

      if (response.isNew) {
        // New teacher - needs PIN setup
        setCurrentStep('pin_setup');
      } else {
        // Existing teacher - must verify their PIN
        // Clear the PIN form to prevent autocomplete issues
        pinForm.reset({ pin: '' });
        setCurrentStep('pin_entry');
      }
    } catch (error: any) {
      console.error('Teacher check error:', error);
      toast({
        title: t('teacherVerification.verificationFailed', 'Verification Failed'),
        description: error?.message || t('teacherVerification.verificationFailedDesc', 'Unable to verify teacher. Please contact support.'),
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleRegistration = async (data: RegistrationForm) => {
    setIsRegistering(true);
    try {
      const response = await apiRequest({
        url: '/api/classroom/register',
        method: 'POST',
        body: data,
      });

      setTeacherEmail(data.email);
      toast({
        title: 'Registration Successful!',
        description: 'Please set up your 4-digit PIN to secure your account.',
      });
      setCurrentStep('pin_setup');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: 'Registration Failed',
        description: error?.message || 'Unable to register. Please try again.',
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const verifyPin = async () => {
    const pin = pinDigits.join('');
    if (pin.length !== 4) {
      toast({
        title: t('teacherVerification.pinVerificationFailed', 'PIN Verification Failed'),
        description: t('teacherVerification.pinVerificationFailedDesc', 'Please enter all 4 digits.'),
        variant: "destructive",
      });
      return;
    }
    
    setIsVerifyingPin(true);
    try {
      await apiRequest({
        url: '/api/classroom/verify-pin',
        method: 'POST',
        body: { teacherEmail: teacherEmail, pin: pin },
      });
      
      // PIN verified successfully, proceed to form
      onVerificationComplete(teacherEmail);
    } catch (error: any) {
      console.error('PIN verification error:', error);
      toast({
        title: t('teacherVerification.pinVerificationFailed', 'PIN Verification Failed'),
        description: error?.message || t('teacherVerification.pinVerificationFailedDesc', 'Invalid PIN. Please try again.'),
        variant: "destructive",
      });
    } finally {
      setIsVerifyingPin(false);
    }
  };

  const handleDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1); // Only last digit, numbers only
    const newDigits = [...pinDigits];
    newDigits[index] = digit;
    setPinDigits(newDigits);
    
    // Auto-focus next input
    if (digit && index < 3) {
      const nextInput = document.querySelector(`[data-digit-index="${index + 1}"]`) as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }
  };

  // Clear PIN digits when entering PIN step
  useEffect(() => {
    if (currentStep === 'pin_entry') {
      setPinDigits(['', '', '', '']);
    }
  }, [currentStep]);

  const handlePinSetupComplete = () => {
    // PIN setup complete, proceed to form
    onVerificationComplete(teacherEmail);
  };

  // Email verification step
  if (currentStep === 'email') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center relative">
            <button
              onClick={() => window.location.href = '/'}
              className="absolute right-0 top-0 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              data-testid="button-close-verification"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>{t('teacherVerification.title', 'Teacher Verification')}</CardTitle>
            <CardDescription>
              {t('teacherVerification.emailDescription', 'Enter your email address to access the classroom solutions form')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(checkTeacherStatus)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('teacherVerification.emailLabel', 'Email Address')}</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder={t('teacherVerification.emailPlaceholder', 'teacher@school.edu')}
                          {...field}
                          data-testid="input-teacher-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-3">
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isChecking}
                    data-testid="button-verify-email"
                  >
                    {isChecking ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('teacherVerification.verifying', 'Verifying...')}
                      </>
                    ) : (
                      t('teacherVerification.continue', 'Continue')
                    )}
                  </Button>
                  
                  <div className="text-center text-sm text-gray-600">
                    New here?{' '}
                    <button
                      type="button"
                      onClick={() => setCurrentStep('register')}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                      data-testid="link-register"
                    >
                      Sign up for free
                    </button>
                  </div>
                  
                  <Button 
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => window.location.href = '/'}
                    data-testid="button-back-home"
                  >
                    <Home className="mr-2 h-4 w-4" />
                    {t('teacherVerification.backToHome', 'Back to Home')}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Registration step
  if (currentStep === 'register') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center relative">
            <button
              onClick={() => setCurrentStep('email')}
              className="absolute right-0 top-0 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              data-testid="button-close-registration"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>Sign Up for Free</CardTitle>
            <CardDescription>
              Create your account to access Free Student Support for Schools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...registrationForm}>
              <form onSubmit={registrationForm.handleSubmit(handleRegistration)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={registrationForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} data-testid="input-register-first-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registrationForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} data-testid="input-register-last-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={registrationForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="teacher@school.edu" {...field} data-testid="input-register-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registrationForm.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position/Role</FormLabel>
                      <FormControl>
                        <Input placeholder="3rd Grade Teacher" {...field} data-testid="input-register-position" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registrationForm.control}
                  name="school"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>School (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Lincoln Elementary" {...field} data-testid="input-register-school" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isRegistering}
                  data-testid="button-submit-registration"
                >
                  {isRegistering ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    'Create Free Account'
                  )}
                </Button>

                <div className="text-center text-sm text-gray-600">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setCurrentStep('email')}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                    data-testid="link-login"
                  >
                    Sign in
                  </button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // PIN setup step (only for new teachers)
  if (currentStep === 'pin_setup') {
    return (
      <SimplePinSetup 
        teacherEmail={teacherEmail}
        onComplete={handlePinSetupComplete}
      />
    );
  }

  // PIN entry step (for existing teachers)
  if (currentStep === 'pin_entry') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center relative">
            <button
              onClick={() => setCurrentStep('email')}
              className="absolute right-0 top-0 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              data-testid="button-close-pin-entry"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>{t('teacherVerification.enterPinTitle', 'Enter Your PIN')}</CardTitle>
            <CardDescription>
              {t('teacherVerification.enterPinDescription', 'Please enter your 4-digit PIN to access the classroom solutions form')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-4 block">
                  {t('teacherVerification.pinLabel', '4-Digit PIN')}
                </label>
                <div className="flex justify-center space-x-4">
                  {pinDigits.map((digit, index) => (
                    <input
                      key={`digit-${index}`}
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(index, e.target.value)}
                      data-digit-index={index}
                      className="w-12 h-12 text-center text-xl font-mono border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      data-testid={`input-pin-digit-${index}`}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={verifyPin}
                  className="w-full"
                  disabled={isVerifyingPin || pinDigits.join('').length !== 4}
                  data-testid="button-verify-pin"
                >
                  {isVerifyingPin ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('teacherVerification.verifyingPin', 'Verifying PIN...')}
                    </>
                  ) : (
                    t('teacherVerification.verifyPin', 'Verify PIN')
                  )}
                </Button>
                
                <Button 
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setCurrentStep('email')}
                  data-testid="button-back-email"
                >
                  {t('teacherVerification.backToEmail', 'Back to Email')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // This should never be reached as we redirect in the handlers above
  return null;
}