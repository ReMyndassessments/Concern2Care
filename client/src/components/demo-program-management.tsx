import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  School, 
  Users, 
  Calendar, 
  Play,
  CheckCircle,
  Clock,
  AlertTriangle,
  Trophy,
  ArrowRight,
  Gift,
  Star
} from "lucide-react";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface DemoSchool {
  id: string;
  name: string;
  district: string | null;
  demoStartDate: Date | null;
  demoEndDate: Date | null;
  demoStatus: string;
  pilotTeacherCount: number;
  daysRemaining: number | null;
  pilotTeachers: Array<{
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    isPilotTeacher: boolean | null;
  }>;
}

const startDemoFormSchema = z.object({
  schoolId: z.string().min(1, "School selection is required"),
  demoLengthDays: z.number().min(30).max(90).default(60),
});

type StartDemoFormData = z.infer<typeof startDemoFormSchema>;

export default function DemoProgramManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isFeatureEnabled } = useFeatureFlags();
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [convertingSchool, setConvertingSchool] = useState<string | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<DemoSchool | null>(null);

  // Check if demo program feature is enabled
  const isDemoProgramEnabled = isFeatureEnabled('demo_program');

  if (!isDemoProgramEnabled) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md mx-auto">
          <School className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Demo Program Disabled</h3>
          <p className="text-gray-500">
            The demo program feature is currently disabled. Enable it in Feature Flags to access demo management.
          </p>
        </div>
      </div>
    );
  }

  // Fetch demo schools
  const { data: demoSchoolsData, isLoading } = useQuery({
    queryKey: ['/api/admin/demo-schools'],
    queryFn: async () => {
      const response = await apiRequest('/api/admin/demo-schools');
      return response;
    },
  });

  // Fetch all schools for starting new demos
  const { data: allSchoolsData } = useQuery({
    queryKey: ['/api/admin/schools'],
    queryFn: async () => {
      const response = await apiRequest('/api/admin/schools');
      return response;
    },
  });

  // Start demo mutation
  const startDemoMutation = useMutation({
    mutationFn: async ({ schoolId, demoLengthDays }: StartDemoFormData) => {
      return await apiRequest(`/api/admin/demo-schools/${schoolId}/start`, {
        method: 'POST',
        body: JSON.stringify({ demoLengthDays }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Demo Started",
        description: "Demo program has been started successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/demo-schools'] });
      setShowStartDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start demo program",
        variant: "destructive",
      });
    },
  });

  // Convert demo to full subscription mutation
  const convertDemoMutation = useMutation({
    mutationFn: async (schoolId: string) => {
      return await apiRequest(`/api/admin/demo-schools/${schoolId}/convert`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      toast({
        title: "Conversion Successful",
        description: "Demo school has been converted to full subscription.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/demo-schools'] });
      setConvertingSchool(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to convert demo school",
        variant: "destructive",
      });
      setConvertingSchool(null);
    },
  });

  // Set pilot teacher mutation
  const setPilotMutation = useMutation({
    mutationFn: async ({ teacherId, isPilot }: { teacherId: string; isPilot: boolean }) => {
      return await apiRequest(`/api/admin/teachers/${teacherId}/pilot`, {
        method: 'POST',
        body: JSON.stringify({ isPilot, discount: 50 }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Pilot Status Updated",
        description: "Teacher pilot status has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/demo-schools'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update pilot status",
        variant: "destructive",
      });
    },
  });

  const form = useForm<StartDemoFormData>({
    resolver: zodResolver(startDemoFormSchema),
    defaultValues: {
      demoLengthDays: 60,
    },
  });

  const demoSchools = demoSchoolsData?.demoSchools || [];
  const allSchools = allSchoolsData || [];
  const availableSchools = allSchools.filter((school: any) => 
    !demoSchools.some((demoSchool: DemoSchool) => demoSchool.id === school.id)
  );

  const getStatusBadge = (status: string, daysRemaining: number | null) => {
    if (status === 'active') {
      if (daysRemaining && daysRemaining <= 7) {
        return <Badge variant="destructive" className="gap-1"><AlertTriangle className="w-3 h-3" />Expiring Soon</Badge>;
      }
      return <Badge variant="default" className="gap-1 bg-green-100 text-green-800"><CheckCircle className="w-3 h-3" />Active</Badge>;
    }
    if (status === 'expired') {
      return <Badge variant="destructive" className="gap-1"><Clock className="w-3 h-3" />Expired</Badge>;
    }
    if (status === 'converted') {
      return <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-800"><Trophy className="w-3 h-3" />Converted</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="demo-program-management">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">School Demo Program</h2>
          <p className="text-muted-foreground">
            Manage 60-day trial programs for schools with pilot teacher enrollment
          </p>
        </div>
        <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
          <DialogTrigger asChild>
            <Button data-testid="button-start-demo">
              <Play className="w-4 h-4 mr-2" />
              Start New Demo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start School Demo Program</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => startDemoMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="schoolId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>School</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-school">
                            <SelectValue placeholder="Select a school" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableSchools.map((school: any) => (
                            <SelectItem key={school.id} value={school.id}>
                              {school.name} {school.district && `(${school.district})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="demoLengthDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Demo Length (Days)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="30" 
                          max="90" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          data-testid="input-demo-length"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowStartDialog(false)}
                    data-testid="button-cancel-demo"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={startDemoMutation.isPending}
                    data-testid="button-confirm-start-demo"
                  >
                    {startDemoMutation.isPending ? "Starting..." : "Start Demo"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Demo Schools Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <School className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Active Demos</p>
                <p className="text-2xl font-bold text-blue-600">
                  {demoSchools.filter((s: DemoSchool) => s.demoStatus === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Pilot Teachers</p>
                <p className="text-2xl font-bold text-green-600">
                  {demoSchools.reduce((sum: number, s: DemoSchool) => sum + s.pilotTeacherCount, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Conversions</p>
                <p className="text-2xl font-bold text-purple-600">
                  {demoSchools.filter((s: DemoSchool) => s.demoStatus === 'converted').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Demo Schools Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <School className="w-5 h-5" />
            Demo Schools ({demoSchools.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {demoSchools.length === 0 ? (
            <div className="text-center py-8">
              <School className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No demo schools found</p>
              <p className="text-sm text-gray-400">Start your first school demo program to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>School</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Days Left</TableHead>
                    <TableHead>Pilot Teachers</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {demoSchools.map((school: DemoSchool) => (
                    <TableRow key={school.id}>
                      <TableCell>
                        <div className="font-medium">{school.name}</div>
                        {school.district && (
                          <div className="text-sm text-gray-500">{school.district}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(school.demoStatus, school.daysRemaining)}
                      </TableCell>
                      <TableCell>
                        {school.demoStartDate 
                          ? format(new Date(school.demoStartDate), 'MMM dd, yyyy')
                          : 'N/A'
                        }
                      </TableCell>
                      <TableCell>
                        {school.daysRemaining !== null ? (
                          <span className={`font-medium ${
                            school.daysRemaining <= 7 ? 'text-red-600' : 
                            school.daysRemaining <= 14 ? 'text-yellow-600' : 
                            'text-green-600'
                          }`}>
                            {school.daysRemaining} days
                          </span>
                        ) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span className="font-medium">{school.pilotTeacherCount}</span>
                          <span className="text-gray-500">/ 8</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedSchool(school)}
                            data-testid={`button-view-details-${school.id}`}
                          >
                            View Details
                          </Button>
                          {school.demoStatus === 'active' && (
                            <Button
                              size="sm"
                              onClick={() => setConvertingSchool(school.id)}
                              data-testid={`button-convert-${school.id}`}
                            >
                              <ArrowRight className="w-4 h-4 mr-1" />
                              Convert
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* School Details Dialog */}
      <Dialog open={!!selectedSchool} onOpenChange={() => setSelectedSchool(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <School className="w-5 h-5" />
              {selectedSchool?.name} Demo Details
            </DialogTitle>
          </DialogHeader>
          {selectedSchool && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedSchool.demoStatus, selectedSchool.daysRemaining)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Days Remaining</Label>
                  <p className="mt-1 font-medium">
                    {selectedSchool.daysRemaining || 'N/A'}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600">Pilot Teachers ({selectedSchool.pilotTeacherCount})</Label>
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                  {selectedSchool.pilotTeachers.length === 0 ? (
                    <p className="text-sm text-gray-500">No pilot teachers assigned yet</p>
                  ) : (
                    selectedSchool.pilotTeachers.map((teacher: any) => (
                      <div key={teacher.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium">
                            {teacher.firstName} {teacher.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{teacher.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {teacher.isPilotTeacher && (
                            <Badge variant="secondary" className="gap-1">
                              <Star className="w-3 h-3" />
                              50% Discount
                            </Badge>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPilotMutation.mutate({ 
                              teacherId: teacher.id, 
                              isPilot: !teacher.isPilotTeacher 
                            })}
                            data-testid={`button-toggle-pilot-${teacher.id}`}
                          >
                            {teacher.isPilotTeacher ? 'Remove Pilot' : 'Make Pilot'}
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Convert Confirmation Dialog */}
      <AlertDialog open={!!convertingSchool} onOpenChange={() => setConvertingSchool(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convert Demo to Full Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              This will convert the demo school to a full subscription. All pilot teachers will retain their discount status.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => convertingSchool && convertDemoMutation.mutate(convertingSchool)}
              disabled={convertDemoMutation.isPending}
              data-testid="button-confirm-convert"
            >
              {convertDemoMutation.isPending ? "Converting..." : "Convert School"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}