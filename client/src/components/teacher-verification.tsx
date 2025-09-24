import { useState } from 'react';
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

export default function TeacherVerification({ onVerificationComplete }: TeacherVerificationProps) {
  const [currentStep, setCurrentStep] = useState<'email' | 'pin_setup' | 'pin_entry' | 'complete'>('email');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
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

  const verifyPin = async (data: PinForm) => {
    setIsVerifyingPin(true);
    try {
      await apiRequest({
        url: '/api/classroom/verify-pin',
        method: 'POST',
        body: { teacherEmail: teacherEmail, pin: data.pin },
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
    // Force clear the PIN field on render
    if (pinForm.getValues().pin && pinForm.getValues().pin.includes('@')) {
      pinForm.setValue('pin', '');
    }
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
            <Form {...pinForm}>
              <form onSubmit={pinForm.handleSubmit(verifyPin)} className="space-y-4">
                <FormField
                  control={pinForm.control}
                  name="pin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('teacherVerification.pinLabel', '4-Digit PIN')}</FormLabel>
                      <FormControl>
                        <Input
                          key="pin-input-field"
                          type="password"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="••••"
                          maxLength={4}
                          autoComplete="new-password"
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck={false}
                          value={field.value || ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                            field.onChange(value);
                          }}
                          onBlur={field.onBlur}
                          name={field.name}
                          className="text-center text-lg tracking-widest font-mono"
                          data-testid="input-teacher-pin"
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
                    disabled={isVerifyingPin}
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
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // This should never be reached as we redirect in the handlers above
  return null;
}