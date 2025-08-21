import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { insertConcernSchema, type Concern, type Intervention, type User } from "@shared/schema";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit3, Wand2, GraduationCap, AlertTriangle, Users, CalendarX } from "lucide-react";

const concernFormSchema = insertConcernSchema.extend({
  studentFirstName: z.string().min(1, "First name is required"),
  studentLastInitial: z.string().length(1, "Last initial must be exactly 1 character"),
  concernType: z.enum(["academic", "behavior", "social-emotional", "attendance"]),
  description: z.string().min(10, "Please provide at least 10 characters of detail"),
});

type ConcernFormData = z.infer<typeof concernFormSchema>;

interface ConcernFormProps {
  onConcernSubmitted?: (concern: Concern, interventions: Intervention[]) => void;
}

const concernTypes = [
  {
    value: "academic" as const,
    label: "Academic",
    icon: GraduationCap,
    description: "Learning difficulties, comprehension issues"
  },
  {
    value: "behavior" as const,
    label: "Behavior", 
    icon: AlertTriangle,
    description: "Disruptive behavior, classroom management"
  },
  {
    value: "social-emotional" as const,
    label: "Social-Emotional",
    icon: Users,
    description: "Peer interactions, emotional regulation"
  },
  {
    value: "attendance" as const,
    label: "Attendance",
    icon: CalendarX,
    description: "Chronic absences, tardiness"
  }
];

export default function ConcernForm({ onConcernSubmitted }: ConcernFormProps) {
  const { user } = useAuth() as { user: User | undefined };
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ConcernFormData>({
    resolver: zodResolver(concernFormSchema),
    defaultValues: {
      studentFirstName: "",
      studentLastInitial: "",
      concernType: undefined,
      description: "",
    },
  });

  const createConcernMutation = useMutation({
    mutationFn: async (data: ConcernFormData) => {
      const response = await apiRequest("POST", "/api/concerns", data);
      return await response.json();
    },
    onSuccess: (data: { concern: Concern; interventions: Intervention[] }) => {
      toast({
        title: "Success!",
        description: `Generated ${data.interventions.length} intervention strategies`,
      });
      
      // Reset form
      form.reset();
      
      // Invalidate concerns cache to refresh the recent concerns list
      queryClient.invalidateQueries({ queryKey: ["/api/concerns"] });
      
      // Call the callback with the new concern and interventions
      onConcernSubmitted?.(data.concern, data.interventions);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      if (error.message.includes("429")) {
        toast({
          title: "Request Limit Reached",
          description: "You've reached your monthly limit of 20 support requests.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Error",
        description: error.message || "Failed to create concern",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ConcernFormData) => {
    console.log("🚀 Form submitted with data:", data);
    console.log("🚀 Form errors:", form.formState.errors);
    console.log("🚀 Form is valid:", form.formState.isValid);
    createConcernMutation.mutate(data);
  };

  // Check if user is at their request limit
  const isAtLimit = user && (user.supportRequestsUsed || 0) >= (user.supportRequestsLimit || 20);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-brand-blue/10 rounded-lg flex items-center justify-center">
            <Edit3 className="h-4 w-4 text-brand-blue" />
          </div>
          <span>Document Student Concern</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Student Information Section */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Student Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="studentFirstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        First Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter first name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="studentLastInitial"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Last Initial <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter last initial"
                          maxLength={1}
                          className="uppercase"
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          value={field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Concern Type Selection */}
            <FormField
              control={form.control}
              name="concernType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Concern Type <span className="text-red-500">*</span>
                  </FormLabel>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {concernTypes.map((type) => {
                      const IconComponent = type.icon;
                      const isSelected = field.value === type.value;
                      
                      return (
                        <label 
                          key={type.value}
                          className="relative cursor-pointer"
                        >
                          <input 
                            type="radio" 
                            value={type.value}
                            checked={isSelected}
                            onChange={() => field.onChange(type.value)}
                            className="sr-only peer" 
                          />
                          <div className={`
                            border-2 rounded-lg p-3 text-center transition-colors
                            ${isSelected 
                              ? 'border-brand-blue bg-brand-blue/5' 
                              : 'border-gray-200 hover:border-brand-blue'
                            }
                          `}>
                            <IconComponent className={`
                              h-6 w-6 mx-auto mb-2
                              ${isSelected ? 'text-brand-blue' : 'text-gray-600'}
                            `} />
                            <div className="text-sm font-medium text-gray-900">
                              {type.label}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Concern Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Concern Description <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      rows={4}
                      placeholder="Provide specific details about the concern. Include observable behaviors, frequency, duration, and context..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-gray-600 mt-1">
                    Be specific and objective. This information helps generate more targeted intervention strategies.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Usage Warning */}
            {isAtLimit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">
                      Monthly Request Limit Reached
                    </p>
                    <p className="text-sm text-red-700 mt-1">
                      You've used all {user.supportRequestsLimit || 20} of your monthly support requests. 
                      Your limit will reset next month.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Submit Button */}
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={createConcernMutation.isPending || isAtLimit}
                className="bg-brand-blue hover:bg-brand-dark-blue px-6 py-3"
              >
                {createConcernMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate AI Strategies
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
