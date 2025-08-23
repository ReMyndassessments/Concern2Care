import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
// Helper function for checking unauthorized errors
const isUnauthorizedError = (error: Error): boolean => {
  return /^401: .*Unauthorized/.test(error.message);
};
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
import { ObjectUploader } from "@/components/ObjectUploader";
import { Edit3, Wand2, GraduationCap, AlertTriangle, Users, CalendarX, User, Calendar, MapPin, AlertCircle, ChevronDown, ChevronUp, Lightbulb, Upload, FileText, BookOpen } from "lucide-react";

const enhancedConcernFormSchema = z.object({
  studentFirstName: z.string().min(1, "First name is required"),
  studentLastInitial: z.string().length(1, "Last initial must be exactly 1 character"),
  grade: z.string().min(1, "Grade is required"),
  teacherPosition: z.string().min(1, "Teacher position is required"),
  location: z.string().min(1, "Location is required"),
  concernTypes: z.array(z.string()).min(1, "At least one concern type is required"),
  otherConcernType: z.string().optional(),
  description: z.string().min(10, "Please provide at least 10 characters of detail"),
  severityLevel: z.string().min(1, "Severity level is required"),
  actionsTaken: z.array(z.string()).default([]),
  otherActionTaken: z.string().optional(),
  
  // Student differentiation needs (optional)
  hasIep: z.boolean().default(false),
  hasDisability: z.boolean().default(false),
  disabilityType: z.string().optional(),
  isEalLearner: z.boolean().default(false),
  ealProficiency: z.string().optional(),
  isGifted: z.boolean().default(false),
  isStruggling: z.boolean().default(false),
  otherNeeds: z.string().optional(),
  
  // File uploads for better AI recommendations
  studentAssessmentFile: z.string().optional(),
  lessonPlanFile: z.string().optional(),
  
  // Task type selection for focused AI responses
  taskType: z.string().min(1, "Task type is required"),
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

const EAL_PROFICIENCY_LEVELS = [
  'Beginner',
  'Intermediate', 
  'Advanced'
];

const COMMON_DISABILITY_TYPES = [
  'ADHD',
  'Autism Spectrum',
  'Learning Disability',
  'Emotional/Behavioral',
  'Physical Disability',
  'Intellectual Disability',
  'Hearing Impairment',
  'Visual Impairment',
  'Speech/Language',
  'Other'
];

const TASK_TYPES = [
  { 
    value: 'differentiation', 
    label: 'Differentiation Task',
    description: 'Get specific strategies to adapt instruction for different learning styles, abilities, and needs'
  },
  { 
    value: 'tier2_intervention', 
    label: 'Tier 2 Intervention Task',
    description: 'Generate evidence-based behavioral and academic intervention strategies for concerning behaviors'
  }
];

export default function ConcernForm({ onConcernSubmitted }: ConcernFormProps) {
  const { user } = useAuth() as { user: UserType | undefined };
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showOtherConcern, setShowOtherConcern] = useState(false);
  const [showOtherAction, setShowOtherAction] = useState(false);
  const [showDifferentiation, setShowDifferentiation] = useState(false);
  const [studentAssessmentUploading, setStudentAssessmentUploading] = useState(false);
  const [lessonPlanUploading, setLessonPlanUploading] = useState(false);

  const form = useForm<EnhancedConcernFormData>({
    resolver: zodResolver(enhancedConcernFormSchema),
    defaultValues: {
      studentFirstName: "",
      studentLastInitial: "",
      grade: "",
      teacherPosition: "",
      location: "",
      concernTypes: [],
      otherConcernType: "",
      description: "",
      severityLevel: "",
      actionsTaken: [],
      otherActionTaken: "",
      
      // Student differentiation defaults
      hasIep: false,
      hasDisability: false,
      disabilityType: "",
      isEalLearner: false,
      ealProficiency: "",
      isGifted: false,
      isStruggling: false,
      otherNeeds: "",
      studentAssessmentFile: "",
      lessonPlanFile: "",
      taskType: "",
    },
  });

  const createConcernMutation = useMutation({
    mutationFn: async (data: EnhancedConcernFormData) => {
      // Debug: Log what data is being sent to the backend
      console.log("🚀 Frontend sending data to backend:", data);
      console.log("🎯 Differentiation fields being sent:", {
        hasIep: data.hasIep,
        hasDisability: data.hasDisability,
        disabilityType: data.disabilityType,
        isEalLearner: data.isEalLearner,
        ealProficiency: data.ealProficiency,
        isGifted: data.isGifted,
        isStruggling: data.isStruggling,
        otherNeeds: data.otherNeeds,
      });
      const response = await apiRequest("POST", "/api/concerns", data);
      return response;
    },
    onSuccess: (data: { concern: Concern; interventions: Intervention[]; recommendations?: string; disclaimer?: string }) => {
      const taskTypeLabel = form.getValues('taskType') === 'differentiation' ? 'differentiation strategies' : 'intervention recommendations';
      toast({
        title: "Success!",
        description: `Generated AI-powered ${taskTypeLabel}`,
      });
      
      // Reset form
      form.reset();
      setShowOtherConcern(false);
      setShowOtherAction(false);
      setShowDifferentiation(false);
      
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
    // Show user-friendly validation message if there are errors
    if (Object.keys(form.formState.errors).length > 0) {
      toast({
        title: "Please fill in all required fields",
        description: "Check that all fields marked with * are completed.",
        variant: "destructive",
      });
      return;
    }
    
    createConcernMutation.mutate(data);
  };

  // Check if user is at their request limit
  const isAtLimit = user && (user.supportRequestsUsed || 0) >= (user.supportRequestsLimit || 20);

  return (
    <Card className="w-full">
      <CardContent className="px-4 sm:px-6 pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className={`space-y-6 sm:space-y-8 ${isAtLimit ? 'opacity-60' : ''}`}>
            
            {/* Task Type Selection - FIRST */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">🎯</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Choose Your Task Type</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Select the type of AI-powered support you need - this will determine what information to collect:
              </p>
              
              <FormField
                control={form.control}
                name="taskType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-4"
                        disabled={isAtLimit}
                      >
                        {TASK_TYPES.map((taskType) => (
                          <div key={taskType.value} className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors">
                            <RadioGroupItem value={taskType.value} id={taskType.value} disabled={isAtLimit} className="mt-1" />
                            <div className="flex-1">
                              <label
                                htmlFor={taskType.value}
                                className="text-base font-medium text-gray-900 cursor-pointer block mb-1"
                              >
                                {taskType.label}
                              </label>
                              <p className="text-sm text-gray-600 leading-relaxed">
                                {taskType.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Show form sections only after task type is selected */}
            {form.watch('taskType') && (
              <>
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
                        <Input placeholder="Enter first name" {...field} disabled={isAtLimit} />
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
                          disabled={isAtLimit}
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
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isAtLimit}>
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

            {/* Teacher and Lesson Information */}
            <div className="bg-blue-50 rounded-lg p-4 sm:p-6">
                              </FormControl>
                              <SelectContent>
                                {COMMON_DISABILITY_TYPES.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    {form.watch('isEalLearner') && (
                      <FormField
                        control={form.control}
                        name="ealProficiency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>English Proficiency Level</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isAtLimit}>
                              <FormControl>
                                <SelectTrigger data-testid="select-eal-proficiency">
                                  <SelectValue placeholder="Select level" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {EAL_PROFICIENCY_LEVELS.map((level) => (
                                  <SelectItem key={level} value={level}>
                                    {level}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                  
                  {/* Additional Notes */}
                  <FormField
                    control={form.control}
                    name="otherNeeds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Other Learning Needs or Notes</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., visual learner, needs frequent breaks, anxiety..."
                            {...field} 
                            disabled={isAtLimit}
                            data-testid="input-other-needs"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* File Uploads */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-amber-200">
                    <FormField
                      control={form.control}
                      name="studentAssessmentFile"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Student Assessment Report
                          </FormLabel>
                          <div className="space-y-2">
                            <ObjectUploader
                              acceptedFileTypes={['.pdf', '.doc', '.docx', '.txt']}
                              onFileUploaded={(fileUrl, fileName) => {
                                field.onChange(fileUrl);
                                toast({
                                  title: "Assessment uploaded",
                                  description: `${fileName} will help generate better recommendations`,
                                });
                              }}
                              onFileRemoved={() => field.onChange("")}
                              currentFile={field.value}
                              disabled={isAtLimit || studentAssessmentUploading}
                              data-testid="upload-student-assessment"
                            >
                              Upload Assessment
                            </ObjectUploader>
                            <p className="text-xs text-amber-600">
                              Upload student reports, assessments, or evaluations (PDF, DOC, TXT)
                            </p>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Teacher and Lesson Information */}
            <div className="bg-blue-50 rounded-lg p-4 sm:p-6">
              <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-brand-blue flex-shrink-0" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900">
                  {form.watch('taskType') === 'differentiation' ? 'Lesson Details' : 'Incident Details'}
                </h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <FormField
                  control={form.control}
                  name="teacherPosition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {form.watch('taskType') === 'differentiation' ? 'Your Subject Area' : 'Your Position/Title'} <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder={form.watch('taskType') === 'differentiation' ? "e.g., Mathematics, English Language Arts" : "e.g., 3rd Grade Teacher"} {...field} disabled={isAtLimit} />
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
                        {form.watch('taskType') === 'differentiation' ? 'Class Details' : 'Location'} <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder={form.watch('taskType') === 'differentiation' ? "e.g., Grade 3, 25 students, mixed abilities" : "e.g., Classroom, Playground"} {...field} disabled={isAtLimit} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Concern Types - Only for Tier 2 Intervention */}
            {form.watch('taskType') === 'tier2_intervention' && (
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
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {CONCERN_TYPES.map((item) => (
                      <FormField
                        key={item}
                        control={form.control}
                        name="concernTypes"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={item}
                              className="flex flex-row items-start space-x-3 space-y-0 py-2 min-h-[44px]"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(item)}
                                  disabled={isAtLimit}
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
                              <FormLabel className="text-sm font-normal leading-normal cursor-pointer flex-1">
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
                        disabled={isAtLimit}
                        onCheckedChange={(checked) => setShowOtherConcern(checked === true)}
                      />
                      <label className={`text-sm font-normal ${isAtLimit ? 'text-gray-400' : ''}`}>Other (please specify)</label>
                    </div>
                    
                    {showOtherConcern && (
                      <FormField
                        control={form.control}
                        name="otherConcernType"
                        render={({ field }) => (
                          <FormItem className="mt-2">
                            <FormControl>
                              <Input placeholder="Specify other concern type" {...field} disabled={isAtLimit} />
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
            )}

            {/* Concern Description - Only for Tier 2 Intervention */}
            {form.watch('taskType') === 'tier2_intervention' && (
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
                      className="resize-none min-h-[120px] text-base"
                      {...field}
                      disabled={isAtLimit}
                    />
                  </FormControl>
                  <p className="text-xs text-gray-600">
                    Be specific and objective. This information helps generate more targeted intervention strategies.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            )}

            {/* Task-Specific Sections */}
            {form.watch('taskType') === 'tier2_intervention' && (
              <>
                {/* Severity Level - Only for Tier 2 Intervention */}
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
                          className="flex flex-col space-y-3"
                          disabled={isAtLimit}
                        >
                          {SEVERITY_LEVELS.map((level) => (
                            <div key={level.value} className="flex items-center space-x-3 py-2 min-h-[44px]">
                              <RadioGroupItem value={level.value} id={level.value} disabled={isAtLimit} />
                              <label
                                htmlFor={level.value}
                                className="text-sm font-normal leading-relaxed cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
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

                {/* Actions Taken - Only for Tier 2 Intervention */}
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
                  
                  <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                    {ACTIONS_TAKEN.map((item) => (
                      <FormField
                        key={item}
                        control={form.control}
                        name="actionsTaken"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={item}
                              className="flex flex-row items-start space-x-3 space-y-0 py-2 min-h-[44px]"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(item)}
                                  disabled={isAtLimit}
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
                              <FormLabel className="text-sm font-normal leading-normal cursor-pointer flex-1">
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
                        disabled={isAtLimit}
                        onCheckedChange={(checked) => setShowOtherAction(checked === true)}
                      />
                      <label className={`text-sm font-normal ${isAtLimit ? 'text-gray-400' : ''}`}>Other action taken (please specify)</label>
                    </div>
                    
                    {showOtherAction && (
                      <FormField
                        control={form.control}
                        name="otherActionTaken"
                        render={({ field }) => (
                          <FormItem className="mt-2">
                            <FormControl>
                              <Input placeholder="Describe other action taken" {...field} disabled={isAtLimit} />
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

                {/* Student Assessment Upload - For Tier 2 Intervention */}
                <FormField
                  control={form.control}
                  name="studentAssessmentFile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Student Assessment Data (Optional)
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Upload assessment reports or behavioral data..."
                          {...field} 
                          disabled={isAtLimit}
                          data-testid="input-student-assessment"
                        />
                      </FormControl>
                      <p className="text-xs text-gray-600">
                        Upload any assessments or behavioral data to help create targeted interventions
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </>
            )}

            {/* Differentiation Task Section */}
            {form.watch('taskType') === 'differentiation' && (
              <>
                {/* Student Learning Needs - For Differentiation */}
                <div className="bg-amber-50 rounded-lg p-4 sm:p-6">
                  <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                    <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">📚</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-medium text-gray-900">Student Learning Needs</h3>
                    <p className="text-sm text-gray-600 ml-2">(Optional - helps create better differentiation strategies)</p>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="hasIep"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isAtLimit}
                              data-testid="checkbox-has-iep"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm">Has IEP/504</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="isGifted"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isAtLimit}
                              data-testid="checkbox-is-gifted"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm">Gifted</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="isEalLearner"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isAtLimit}
                              data-testid="checkbox-is-eal"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm">EAL Learner</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="isStruggling"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isAtLimit}
                              data-testid="checkbox-is-struggling"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm">Struggling</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Lesson Plan Upload - Standalone Section for Differentiation */}
                <div className="bg-green-50 rounded-lg p-4 sm:p-6">
                  <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <FileText className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="text-base sm:text-lg font-medium text-gray-900">Lesson Plan to Adapt</h3>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="lessonPlanFile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <span>📤</span>
                          Upload Lesson Plan
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Upload a lesson plan that needs differentiation for this student"
                            {...field} 
                            disabled={isAtLimit}
                            data-testid="input-lesson-plan"
                          />
                        </FormControl>
                        <p className="text-xs text-gray-600">
                          Upload a lesson plan that needs differentiation for this student
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}
            
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
            
                </>
              )}
            
            {/* Submit Button */}
            <div className="flex justify-center sm:justify-end pt-4 sm:pt-6">
              <Button 
                type="submit" 
                disabled={createConcernMutation.isPending || isAtLimit}
                className="w-full sm:w-auto bg-brand-blue hover:bg-brand-dark-blue px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg min-h-[48px] sm:min-h-[52px] font-semibold"
                size="lg"
              >
                {createConcernMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Generating AI Recommendations...
                  </>
                ) : isAtLimit ? (
                  <>
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Request Limit Reached
                  </>
                ) : (
                  <>
                    <Wand2 className="h-5 w-5 mr-2" />
                    {form.watch('taskType') === 'differentiation' 
                      ? 'Generate Differentiation Strategies' 
                      : 'Generate Tier 2 Intervention Strategies'}
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