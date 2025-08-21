import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { insertConcernSchema, type Concern, type Intervention, type User as UserType } from "@shared/schema";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit3, Wand2, GraduationCap, AlertTriangle, Users, CalendarX, User, Calendar, MapPin, AlertCircle } from "lucide-react";

const enhancedConcernFormSchema = insertConcernSchema.extend({
  studentFirstName: z.string().min(1, "First name is required"),
  studentLastInitial: z.string().length(1, "Last initial must be exactly 1 character"),
  grade: z.string().min(1, "Grade is required"),
  teacherPosition: z.string().min(1, "Teacher position is required"),
  incidentDate: z.string().min(1, "Incident date is required"),
  location: z.string().min(1, "Location is required"),
  concernTypes: z.array(z.string()).min(1, "At least one concern type is required"),
  otherConcernType: z.string().optional(),
  description: z.string().min(10, "Please provide at least 10 characters of detail"),
  severityLevel: z.string().min(1, "Severity level is required"),
  actionsTaken: z.array(z.string()).default([]),
  otherActionTaken: z.string().optional(),
});

type EnhancedConcernFormData = z.infer<typeof enhancedConcernFormSchema>;

interface ConcernFormProps {
  onConcernSubmitted?: (concern: Concern, interventions: Intervention[], recommendations?: string, disclaimer?: string) => void;
}

const CONCERN_TYPES = [
  'Academic',
  'Attendance', 
  'Behavior',
  'Social/Emotional',
  'Peer Relationships',
  'Family/Home'
];

const SEVERITY_LEVELS = [
  { value: 'mild', label: 'Mild – Needs classroom support' },
  { value: 'moderate', label: 'Moderate – Needs Tier 2 intervention' },
  { value: 'urgent', label: 'Urgent – Immediate follow-up needed' }
];

const ACTIONS_TAKEN = [
  'Talked with student',
  'Contacted parent',
  'Documented only'
];

const GRADE_OPTIONS = [
  'Pre-K', 'K', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'
];

export default function ConcernForm({ onConcernSubmitted }: ConcernFormProps) {
  const { user } = useAuth() as { user: UserType | undefined };
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showOtherConcern, setShowOtherConcern] = useState(false);
  const [showOtherAction, setShowOtherAction] = useState(false);

  const form = useForm<EnhancedConcernFormData>({
    resolver: zodResolver(enhancedConcernFormSchema),
    defaultValues: {
      studentFirstName: "",
      studentLastInitial: "",
      grade: "",
      teacherPosition: "",
      incidentDate: new Date().toISOString().split('T')[0], // Auto-populate with today's date
      location: "",
      concernTypes: [],
      otherConcernType: "",
      description: "",
      severityLevel: "",
      actionsTaken: [],
      otherActionTaken: "",
    },
  });

  const createConcernMutation = useMutation({
    mutationFn: async (data: EnhancedConcernFormData) => {
      const response = await apiRequest("POST", "/api/concerns", data);
      return await response.json();
    },
    onSuccess: (data: { concern: Concern; interventions: Intervention[]; recommendations?: string; disclaimer?: string }) => {
      toast({
        title: "Success!",
        description: `Generated AI-powered intervention recommendations`,
      });
      
      // Reset form
      form.reset();
      setShowOtherConcern(false);
      setShowOtherAction(false);
      
      // Invalidate concerns cache to refresh the recent concerns list
      queryClient.invalidateQueries({ queryKey: ["/api/concerns"] });
      
      // Call the callback with the new concern and interventions
      onConcernSubmitted?.(data.concern, data.interventions, data.recommendations, data.disclaimer);
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

  const onSubmit = (data: EnhancedConcernFormData) => {
    console.log("🚀 Enhanced form submitted with data:", data);
    createConcernMutation.mutate(data);
  };

  // Check if user is at their request limit
  const isAtLimit = user && (user.supportRequestsUsed || 0) >= (user.supportRequestsLimit || 20);

  return (
    <Card className="w-full">
      <CardContent className="px-4 sm:px-6 pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
            
            {/* Student Information Section - Mobile Responsive */}
            <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
              <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-brand-blue flex-shrink-0" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900">Student Information</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <FormField
                  control={form.control}
                  name="studentFirstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        First Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter first name" {...field} />
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
                          placeholder="X"
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
                
                <FormField
                  control={form.control}
                  name="grade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Grade <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select grade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {GRADE_OPTIONS.map((grade) => (
                            <SelectItem key={grade} value={grade}>
                              {grade}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Teacher and Incident Information */}
            <div className="bg-blue-50 rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Calendar className="h-5 w-5 text-brand-blue" />
                <h3 className="text-lg font-medium text-gray-900">Incident Details</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="teacherPosition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Your Position/Title <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 3rd Grade Teacher" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="incidentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Incident Date <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Location <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Classroom, Playground" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Concern Types */}
            <FormField
              control={form.control}
              name="concernTypes"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">
                      Type of Concern <span className="text-red-500">*</span>
                    </FormLabel>
                    <p className="text-sm text-gray-600">Select all that apply</p>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {CONCERN_TYPES.map((item) => (
                      <FormField
                        key={item}
                        control={form.control}
                        name="concernTypes"
                        render={({ field }) => {
                          return (
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
                                          field.value?.filter(
                                            (value) => value !== item
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">
                                {item}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={showOtherConcern}
                        onCheckedChange={(checked) => setShowOtherConcern(checked === true)}
                      />
                      <label className="text-sm font-normal">Other (please specify)</label>
                    </div>
                    
                    {showOtherConcern && (
                      <FormField
                        control={form.control}
                        name="otherConcernType"
                        render={({ field }) => (
                          <FormItem className="mt-2">
                            <FormControl>
                              <Input placeholder="Specify other concern type" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                  
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Severity Level */}
            <FormField
              control={form.control}
              name="severityLevel"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-base">
                    Severity Level <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-2"
                    >
                      {SEVERITY_LEVELS.map((level) => (
                        <div key={level.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={level.value} id={level.value} />
                          <label
                            htmlFor={level.value}
                            className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {level.label}
                          </label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
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
                  <FormLabel className="text-base">
                    Detailed Description of Concern <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      rows={6}
                      placeholder="Please provide specific details about the observed behavior or concern. Include frequency, duration, context, and any patterns you've noticed..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-gray-600">
                    Be specific and objective. This information helps generate more targeted intervention strategies.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions Taken */}
            <FormField
              control={form.control}
              name="actionsTaken"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">
                      Actions Already Taken
                    </FormLabel>
                    <p className="text-sm text-gray-600">Select all that apply</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {ACTIONS_TAKEN.map((item) => (
                      <FormField
                        key={item}
                        control={form.control}
                        name="actionsTaken"
                        render={({ field }) => {
                          return (
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
                                          field.value?.filter(
                                            (value) => value !== item
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">
                                {item}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={showOtherAction}
                        onCheckedChange={(checked) => setShowOtherAction(checked === true)}
                      />
                      <label className="text-sm font-normal">Other action taken (please specify)</label>
                    </div>
                    
                    {showOtherAction && (
                      <FormField
                        control={form.control}
                        name="otherActionTaken"
                        render={({ field }) => (
                          <FormItem className="mt-2">
                            <FormControl>
                              <Input placeholder="Describe other action taken" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                  
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
                      You've used all {user?.supportRequestsLimit || 20} of your monthly support requests. 
                      Your limit will reset next month.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                disabled={createConcernMutation.isPending || isAtLimit}
                className="bg-brand-blue hover:bg-brand-dark-blue px-8 py-3 text-lg"
                size="lg"
              >
                {createConcernMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Generating AI Recommendations...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-5 w-5 mr-2" />
                    Generate Tier 2 Intervention Strategies
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