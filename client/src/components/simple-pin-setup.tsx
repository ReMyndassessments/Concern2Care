import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';
import { Shield, Loader2 } from 'lucide-react';

const pinSetupSchema = z.object({
  pin: z.string().length(4, 'PIN must be exactly 4 digits').regex(/^\d{4}$/, 'PIN must contain only numbers'),
  confirmPin: z.string().length(4, 'PIN must be exactly 4 digits').regex(/^\d{4}$/, 'PIN must contain only numbers'),
}).refine((data) => data.pin === data.confirmPin, {
  message: "PINs don't match",
  path: ["confirmPin"],
});

type PinSetupForm = z.infer<typeof pinSetupSchema>;

interface SimplePinSetupProps {
  teacherEmail: string;
  onComplete: () => void;
}

export default function SimplePinSetup({ teacherEmail, onComplete }: SimplePinSetupProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<PinSetupForm>({
    resolver: zodResolver(pinSetupSchema),
    defaultValues: {
      pin: '',
      confirmPin: '',
    },
  });

  const onSubmit = async (data: PinSetupForm) => {
    setIsSubmitting(true);
    try {
      await apiRequest({
        url: '/api/classroom/setup-pin',
        method: 'POST',
        body: {
          teacherEmail,
          pin: data.pin,
        },
      });

      toast({
        title: "PIN Setup Complete",
        description: "Your PIN has been set up successfully. You can now access the form.",
      });

      onComplete();
    } catch (error: any) {
      console.error('PIN setup error:', error);
      toast({
        title: "Setup Failed",
        description: error?.message || "Failed to set up PIN. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <Shield className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle>Security Setup</CardTitle>
          <CardDescription>
            Set up your 4-digit PIN for future access to your responses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertDescription>
              <strong>Welcome!</strong> Since this is your first time, please create a 4-digit PIN. You'll use this PIN to retrieve your responses later.
            </AlertDescription>
          </Alert>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="pin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Create 4-Digit PIN</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••"
                        maxLength={4}
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                          field.onChange(value);
                        }}
                        className="text-center text-lg tracking-widest"
                        data-testid="input-pin"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm PIN</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••"
                        maxLength={4}
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                          field.onChange(value);
                        }}
                        className="text-center text-lg tracking-widest"
                        data-testid="input-confirm-pin"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting}
                data-testid="button-create-pin"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  "Create PIN"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}