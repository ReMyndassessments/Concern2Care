import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';
import { 
  Users, 
  UserPlus, 
  Edit, 
  Trash2, 
  RefreshCcw, 
  QrCode,
  CheckCircle,
  XCircle,
  Loader2,
  Key
} from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ClassroomEnrolledTeacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  school?: string;
  requestsUsed: number;
  requestsLimit: number;
  lastUsageReset?: string;
  isActive: boolean;
  enrolledBy: string;
  enrolledAt: string;
  createdAt: string;
  updatedAt: string;
}

// Form schemas
const enrolledTeacherSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  position: z.string().min(1, "Position is required"),
  school: z.string().optional(),
  requestsLimit: z.number().min(1).max(50).default(5),
  isActive: z.boolean().default(true)
});

const pinChangeSchema = z.object({
  newPin: z.string().regex(/^\d{4}$/, "PIN must be exactly 4 digits")
});

type EnrolledTeacherFormData = z.infer<typeof enrolledTeacherSchema>;
type PinChangeFormData = z.infer<typeof pinChangeSchema>;

export default function ClassroomTeacherEnrollment() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<ClassroomEnrolledTeacher | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showQrDialog, setShowQrDialog] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [qrCodeImage, setQrCodeImage] = useState("");
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pinChangeTeacher, setPinChangeTeacher] = useState<ClassroomEnrolledTeacher | null>(null);
  const [currentPin, setCurrentPin] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Function to generate QR code
  const generateQrCode = async () => {
    setIsGeneratingQr(true);
    try {
      const response = await apiRequest('/api/admin/classroom/qr-code');
      setQrCodeImage(response.qrCode);
      setQrCodeUrl(response.url);
      setShowQrDialog(true);
      
      toast({
        title: "QR Code Generated",
        description: "Teachers can now use this QR code to access the submission form"
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: "Error",
        description: "Failed to generate QR code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingQr(false);
    }
  };

  // TanStack Query for data fetching
  const { data: teachers = [], isLoading } = useQuery<ClassroomEnrolledTeacher[]>({
    queryKey: ['/api/admin/classroom/teachers'],
    queryFn: async () => {
      const response = await apiRequest('/api/admin/classroom/teachers');
      return response.teachers || [];
    }
  });

  // Forms
  const addForm = useForm<EnrolledTeacherFormData>({
    resolver: zodResolver(enrolledTeacherSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      position: "",
      school: "",
      requestsLimit: 5,
      isActive: true
    }
  });

  const editForm = useForm<EnrolledTeacherFormData>({
    resolver: zodResolver(enrolledTeacherSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      position: "",
      school: "",
      requestsLimit: 5,
      isActive: true
    }
  });

  const pinForm = useForm<PinChangeFormData>({
    resolver: zodResolver(pinChangeSchema),
    defaultValues: {
      newPin: ""
    }
  });

  // Filter teachers based on search
  const filteredTeachers = teachers.filter(teacher =>
    `${teacher.firstName} ${teacher.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Mutations
  const addTeacherMutation = useMutation({
    mutationFn: async (data: EnrolledTeacherFormData) => {
      return await apiRequest("/api/admin/classroom/teachers", {
        method: "POST",
        body: data
      });
    },
    onSuccess: (response, data) => {
      toast({
        title: "Success",
        description: `${data.firstName} ${data.lastName} has been enrolled in Classroom Solutions`
      });
      setShowAddDialog(false);
      addForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/classroom/teachers'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to enroll teacher",
        variant: "destructive"
      });
    }
  });

  const editTeacherMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EnrolledTeacherFormData }) => {
      return await apiRequest(`/api/admin/classroom/teachers/${id}`, {
        method: "PUT",
        body: data
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Teacher updated successfully"
      });
      setShowEditDialog(false);
      setSelectedTeacher(null);
      editForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/classroom/teachers'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update teacher",
        variant: "destructive"
      });
    }
  });

  const deleteTeacherMutation = useMutation({
    mutationFn: async (teacherId: string) => {
      return await apiRequest(`/api/admin/classroom/teachers/${teacherId}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/classroom/teachers'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove teacher",
        variant: "destructive"
      });
    }
  });

  const resetUsageMutation = useMutation({
    mutationFn: async (teacherId: string) => {
      return await apiRequest(`/api/admin/classroom/teachers/${teacherId}/reset-usage`, {
        method: "POST"
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Usage reset successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/classroom/teachers'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reset usage",
        variant: "destructive"
      });
    }
  });

  const changePinMutation = useMutation({
    mutationFn: async ({ teacherId, newPin }: { teacherId: string; newPin: string }) => {
      return await apiRequest(`/api/admin/classroom/teachers/${teacherId}/change-pin`, {
        method: "POST",
        body: { newPin }
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "PIN changed successfully"
      });
      setShowPinDialog(false);
      setPinChangeTeacher(null);
      pinForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to change PIN",
        variant: "destructive"
      });
    }
  });

  // Handlers
  const handleAddTeacher = (data: EnrolledTeacherFormData) => {
    addTeacherMutation.mutate(data);
  };

  const handleEditTeacher = (data: EnrolledTeacherFormData) => {
    if (!selectedTeacher) return;
    editTeacherMutation.mutate({ id: selectedTeacher.id, data });
  };

  const handleDeleteTeacher = (teacher: ClassroomEnrolledTeacher) => {
    if (!confirm(`Are you sure you want to remove ${teacher.firstName} ${teacher.lastName} from the Classroom Solutions program?`)) {
      return;
    }
    deleteTeacherMutation.mutate(teacher.id);
    toast({
      title: "Success",
      description: `${teacher.firstName} ${teacher.lastName} has been removed from the program`
    });
  };

  const handleResetUsage = (teacher: ClassroomEnrolledTeacher) => {
    resetUsageMutation.mutate(teacher.id);
  };

  const handleChangePinClick = async (teacher: ClassroomEnrolledTeacher) => {
    setPinChangeTeacher(teacher);
    pinForm.reset();
    setCurrentPin(null);
    setShowPinDialog(true);
    
    // Fetch current PIN
    try {
      const response = await apiRequest(`/api/admin/classroom/teachers/${teacher.id}/pin`);
      setCurrentPin(response.currentPin);
    } catch (error) {
      console.error('Failed to fetch current PIN:', error);
      toast({
        title: "Warning",
        description: "Could not fetch current PIN",
        variant: "destructive"
      });
    }
  };

  const handleChangePinSubmit = (data: PinChangeFormData) => {
    if (!pinChangeTeacher) return;
    changePinMutation.mutate({ teacherId: pinChangeTeacher.id, newPin: data.newPin });
  };


  const handleEditClick = (teacher: ClassroomEnrolledTeacher) => {
    setSelectedTeacher(teacher);
    editForm.reset({
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      email: teacher.email,
      position: teacher.position,
      school: teacher.school || "",
      requestsLimit: teacher.requestsLimit,
      isActive: teacher.isActive
    });
    setShowEditDialog(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading enrolled teachers...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Classroom Solutions Enrollment</h2>
          <p className="text-muted-foreground">
            Manage teachers enrolled in the QR-code Classroom Solutions program
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={generateQrCode} variant="outline" data-testid="button-generate-qr" disabled={isGeneratingQr}>
            {isGeneratingQr ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <QrCode className="h-4 w-4 mr-2" />
            )}
            {isGeneratingQr ? "Generating..." : "QR Code"}
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-teacher">
                <UserPlus className="h-4 w-4 mr-2" />
                Enroll Teacher
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Enroll Teacher in Classroom Solutions</DialogTitle>
              </DialogHeader>
              <Form {...addForm}>
                <form onSubmit={addForm.handleSubmit(handleAddTeacher)} className="space-y-4">
                  <Alert>
                    <AlertDescription>
                      <strong>Note:</strong> This enrolls teachers in the QR-code Classroom Solutions program only. 
                      This is separate from main app user accounts.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={addForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Enter first name" 
                              data-testid="input-add-first-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={addForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Enter last name" 
                              data-testid="input-add-last-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={addForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="email" 
                            placeholder="teacher@school.edu" 
                            data-testid="input-add-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={addForm.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Position/Role *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="e.g., 3rd Grade Teacher, Special Education Teacher" 
                            data-testid="input-add-position"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={addForm.control}
                    name="school"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>School/Organization</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="School name (optional)" 
                            data-testid="input-add-school"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={addForm.control}
                    name="requestsLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Request Limit</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            min="1" 
                            max="50"
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 5)}
                            data-testid="input-add-limit"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={addTeacherMutation.isPending}
                      data-testid="button-confirm-add"
                    >
                      {addTeacherMutation.isPending ? "Enrolling..." : "Enroll Teacher"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Enrolled</p>
                <p className="text-2xl font-bold">{teachers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{teachers.filter(t => t.isActive).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Inactive</p>
                <p className="text-2xl font-bold">{teachers.filter(t => !t.isActive).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <RefreshCcw className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">{teachers.reduce((sum, t) => sum + t.requestsUsed, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex justify-between items-center">
        <Input
          placeholder="Search enrolled teachers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
          data-testid="input-search-teachers"
        />
      </div>

      {/* Teachers Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Enrolled</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeachers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <Users className="h-8 w-8 text-gray-400" />
                        <p className="text-gray-500">No enrolled teachers found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTeachers.map((teacher) => (
                    <TableRow key={teacher.id}>
                      <TableCell>
                        <div className="font-medium">
                          {teacher.firstName} {teacher.lastName}
                        </div>
                        {teacher.school && (
                          <div className="text-sm text-muted-foreground">{teacher.school}</div>
                        )}
                      </TableCell>
                      <TableCell>{teacher.email}</TableCell>
                      <TableCell>{teacher.position}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm ${teacher.requestsUsed >= teacher.requestsLimit ? 'text-red-600' : 'text-gray-600'}`}>
                            {teacher.requestsUsed} / {teacher.requestsLimit}
                          </span>
                          {teacher.requestsUsed >= teacher.requestsLimit && (
                            <Badge variant="destructive" className="text-xs">Limit Reached</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={teacher.isActive ? "default" : "secondary"}>
                          {teacher.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {new Date(teacher.enrolledAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClick(teacher)}
                            data-testid={`button-edit-${teacher.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResetUsage(teacher)}
                            disabled={teacher.requestsUsed === 0}
                            data-testid={`button-reset-${teacher.id}`}
                          >
                            <RefreshCcw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleChangePinClick(teacher)}
                            data-testid={`button-change-pin-${teacher.id}`}
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteTeacher(teacher)}
                            className="text-red-600 hover:text-red-700"
                            data-testid={`button-delete-${teacher.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>


      {/* Edit Teacher Dialog */}
      {selectedTeacher && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Enrolled Teacher</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleEditTeacher)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-edit-first-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-edit-last-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={editForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" data-testid="input-edit-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position/Role</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-position" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="school"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>School/Organization</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-school" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="requestsLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Request Limit</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          min="1" 
                          max="50"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 5)}
                          data-testid="input-edit-limit"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          data-testid="checkbox-edit-active"
                        />
                      </FormControl>
                      <FormLabel>Active (can submit requests)</FormLabel>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={editTeacherMutation.isPending}
                    data-testid="button-confirm-edit"
                  >
                    {editTeacherMutation.isPending ? "Updating..." : "Update Teacher"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}

      {/* QR Code Dialog */}
      <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Classroom Solutions QR Code</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Teachers can scan this QR code or visit the URL to submit requests:
              </p>
              
              <div className="bg-gray-100 p-4 rounded-lg mb-4">
                {qrCodeImage ? (
                  <div className="w-64 h-64 mx-auto flex items-center justify-center">
                    <img 
                      src={qrCodeImage} 
                      alt="QR Code for Classroom Solutions" 
                      className="w-full h-full object-contain"
                      data-testid="img-qr-code"
                    />
                  </div>
                ) : (
                  <div className="w-48 h-48 bg-white mx-auto flex items-center justify-center border-2 border-dashed border-gray-300">
                    <div className="text-center">
                      <QrCode className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p className="text-xs text-gray-500">QR Code would display here</p>
                      <p className="text-xs text-gray-400 mt-1">QR generation will be implemented</p>
                    </div>
                  </div>
                )}
              </div>
              
              {qrCodeUrl && (
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-sm font-mono text-blue-800 break-all">
                    {qrCodeUrl}
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex justify-center space-x-2">
              {qrCodeUrl && (
                <Button 
                  onClick={() => {
                    navigator.clipboard.writeText(qrCodeUrl);
                    toast({
                      title: "Copied!",
                      description: "URL copied to clipboard"
                    });
                  }}
                  variant="outline"
                >
                  Copy URL
                </Button>
              )}
              <Button variant="outline" onClick={() => setShowQrDialog(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* PIN Change Dialog */}
      {pinChangeTeacher && (
        <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Change PIN for {pinChangeTeacher.firstName} {pinChangeTeacher.lastName}</DialogTitle>
            </DialogHeader>
            
            <Form {...pinForm}>
              <form onSubmit={pinForm.handleSubmit(handleChangePinSubmit)} className="space-y-4">
                {/* Current PIN Display */}
                <div className="space-y-2">
                  <Label>Current PIN</Label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md border">
                    {currentPin ? (
                      <span className="text-lg font-mono font-semibold tracking-wider" data-testid="text-current-pin">
                        {currentPin}
                      </span>
                    ) : (
                      <span className="text-gray-500 text-sm" data-testid="text-pin-loading">
                        Loading current PIN...
                      </span>
                    )}
                  </div>
                </div>

                <FormField
                  control={pinForm.control}
                  name="newPin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New 4-Digit PIN</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={4}
                          placeholder="Enter 4-digit PIN"
                          data-testid="input-new-pin"
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                            field.onChange(value);
                          }}
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
                    onClick={() => setShowPinDialog(false)}
                    data-testid="button-cancel-pin-change"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={changePinMutation.isPending || pinForm.watch('newPin').length !== 4}
                    data-testid="button-confirm-pin-change"
                  >
                    {changePinMutation.isPending ? "Changing..." : "Change PIN"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}