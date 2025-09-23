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

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type EmailForm = z.infer<typeof emailSchema>;

interface TeacherVerificationProps {
  onVerificationComplete: (teacherEmail: string) => void;
}

export default function TeacherVerification({ onVerificationComplete }: TeacherVerificationProps) {
  const [currentStep, setCurrentStep] = useState<'email' | 'pin_setup' | 'complete'>('email');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  const form = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: '',
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
        // Existing teacher - PIN already set up, go directly to form
        onVerificationComplete(data.email);
      }
    } catch (error: any) {
      console.error('Teacher check error:', error);
      toast({
        title: "Verification Failed",
        description: error?.message || "Unable to verify teacher. Please contact support.",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
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
            <CardTitle>Teacher Verification</CardTitle>
            <CardDescription>
              Enter your email address to access the classroom solutions form
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
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="teacher@school.edu"
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
                        Verifying...
                      </>
                    ) : (
                      "Continue"
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
                    Back to Home
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

  // This should never be reached as we redirect in the handlers above
  return null;
}