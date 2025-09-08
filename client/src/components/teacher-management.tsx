import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Users, 
  Plus, 
  Edit2, 
  Trash2, 
  Mail, 
  School, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Download,
  FileText,
  Database,
  Key,
  Upload,
  Eye,
  EyeOff
} from "lucide-react";

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  schoolDistrict?: string;
  primaryGrade?: string;
  primarySubject?: string;
  teacherType?: string;
  supportRequestsLimit: number;
  supportRequestsUsed: number;
  additionalRequests: number;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

interface NewTeacher {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  schoolDistrict: string;
  primaryGrade: string;
  primarySubject: string;
  teacherType: string;
  supportRequestsLimit: number;
  isActive: boolean;
}

export default function TeacherManagement() {
  const { toast } = useToast();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [newTeacher, setNewTeacher] = useState<NewTeacher>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",

    schoolDistrict: "",
    primaryGrade: "",
    primarySubject: "",
    teacherType: "Classroom Teacher",
    supportRequestsLimit: 20,
    isActive: true
  });
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [exportLoading, setExportLoading] = useState<string | null>(null);
  const [showBulkExport, setShowBulkExport] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState<{[key: string]: string}>({});
  const [passwordTeacher, setPasswordTeacher] = useState<Teacher | null>(null);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      const response = await apiRequest("/api/admin/teachers");
      setTeachers(response.teachers || []);
    } catch (error: any) {
      console.error("Error loading teachers:", error);
      toast({
        title: "Error",
        description: "Failed to load teachers",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeacher = async () => {
    try {
      if (!newTeacher.firstName || !newTeacher.lastName || !newTeacher.email || !newTeacher.password || 
          !newTeacher.primaryGrade || !newTeacher.primarySubject || !newTeacher.teacherType) {
        toast({
          title: "Error",
          description: "Please fill in all required fields marked with *",
          variant: "destructive"
        });
        return;
      }

      if (newTeacher.password.length < 6) {
        toast({
          title: "Error", 
          description: "Password must be at least 6 characters long",
          variant: "destructive"
        });
        return;
      }

      const response = await apiRequest("/api/admin/teachers", {
        method: "POST",
        body: newTeacher
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Teacher added successfully"
        });
        setShowAddDialog(false);
        setNewTeacher({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
      
          schoolDistrict: "",
          primaryGrade: "",
          primarySubject: "",
          teacherType: "Classroom Teacher",
          supportRequestsLimit: 20,
          isActive: true
        });
        loadTeachers();
      }
    } catch (error: any) {
      console.error("Error adding teacher:", error);
      
      // Handle the specific case where teacher already exists
      if (error.status === 409 && error.existingTeacher) {
        const existingTeacher = error.existingTeacher;
        toast({
          title: "Teacher Already Exists",
          description: `${existingTeacher.name} (${existingTeacher.email}) is already in the system at ${existingTeacher.school}. You can edit the existing teacher instead.`,
          variant: "destructive"
        });
        
        // Find and select the existing teacher in the list to help user locate them
        const existingInList = teachers.find(t => t.email === existingTeacher.email);
        if (existingInList) {
          setSelectedTeacher(existingInList);
          setShowEditDialog(true);
          setShowAddDialog(false);
        }
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to add teacher",
          variant: "destructive"
        });
      }
    }
  };

  const handleEditTeacher = async () => {
    if (!selectedTeacher) return;

    try {
      const response = await apiRequest(`/api/admin/teachers/${selectedTeacher.id}`, {
        method: "PUT",
        body: {
          firstName: selectedTeacher.firstName,
          lastName: selectedTeacher.lastName,
          email: selectedTeacher.email,
          supportRequestsLimit: selectedTeacher.supportRequestsLimit,
          isActive: selectedTeacher.isActive
        }
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Teacher updated successfully"
        });
        setShowEditDialog(false);
        setSelectedTeacher(null);
        loadTeachers();
      }
    } catch (error: any) {
      console.error("Error updating teacher:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update teacher",
        variant: "destructive"
      });
    }
  };

  const handlePasswordReset = async (teacher: Teacher) => {
    try {
      const response = await apiRequest(`/api/admin/teachers/${teacher.id}/password-reset`, {
        method: "POST"
      });

      if (response.success) {
        toast({
          title: "Password Reset Sent",
          description: `Password reset email sent to ${teacher.email}`,
        });
      }
    } catch (error: any) {
      console.error("Error sending password reset:", error);
      toast({
        title: "Password Reset Failed",
        description: error.message || "Failed to send password reset email",
        variant: "destructive"
      });
    }
  };

  const handleChangePassword = (teacher: Teacher) => {
    setPasswordTeacher(teacher);
    setNewPassword("");
    setShowPasswordDialog(true);
  };

  const handleBulkUpload = () => {
    fileInputRef.current?.click();
  };

  const handleDownloadTemplate = () => {
    // Create CSV template content that matches database structure
    const csvTemplate = `first name,last name,email,password,school,school district,primary grade,primary subject,teacher type,support requests limit
John,Smith,john.smith@school.edu,,Lincoln Elementary,Springfield District,3rd Grade,Mathematics,Classroom Teacher,20
Mary,Johnson,mary.johnson@school.edu,TempPass123,Lincoln Elementary,Springfield District,5th Grade,English Language Arts,Classroom Teacher,25
Robert,Davis,robert.davis@school.edu,,Lincoln Elementary,Springfield District,K-5,Special Education,Special Education Teacher,30
Sarah,Wilson,sarah.wilson@school.edu,,Lincoln Elementary,Springfield District,4th Grade,Science,Classroom Teacher,20
Michael,Brown,michael.brown@school.edu,,Lincoln Elementary,Springfield District,2nd Grade,Reading,Classroom Teacher,20`;

    // Create and download the file
    const blob = new Blob([csvTemplate], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'teacher_upload_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Template Downloaded",
      description: "CSV template has been downloaded. Fill it out and upload to add multiple teachers at once.",
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a CSV file.",
        variant: "destructive"
      });
      return;
    }

    try {
      const fileContent = await file.text();
      const base64Content = btoa(fileContent);

      const response = await apiRequest('/api/admin/teachers/bulk-csv-upload', {
        method: 'POST',
        body: {
          csvData: base64Content,
          filename: file.name,
          schoolName: 'Import',
          sendCredentials: false
        }
      });

      if (response.successfulImports > 0) {
        toast({
          title: "Bulk Upload Successful",
          description: `Successfully imported ${response.successfulImports} teachers. ${response.errors?.length || 0} errors encountered.`,
        });
        loadTeachers(); // Refresh the teacher list
      } else {
        toast({
          title: "Upload Failed",
          description: response.summary || "No teachers were imported.",
          variant: "destructive"
        });
      }

      if (response.errors && response.errors.length > 0) {
        console.error('Upload errors:', response.errors);
      }
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload CSV file.",
        variant: "destructive"
      });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordTeacher) return;
    
    try {
      if (!newPassword) {
        toast({
          title: "Error",
          description: "Please enter a new password",
          variant: "destructive"
        });
        return;
      }

      if (newPassword.length < 6) {
        toast({
          title: "Error",
          description: "Password must be at least 6 characters long",
          variant: "destructive"
        });
        return;
      }

      const response = await apiRequest(`/api/admin/teachers/${passwordTeacher.id}/change-password`, {
        method: "POST",
        body: { newPassword }
      });
      
      // Always close dialog and show success message since API returned 200
      toast({
        title: "Password Changed",
        description: `Password updated successfully for ${passwordTeacher.firstName} ${passwordTeacher.lastName}`,
      });
      setShowPasswordDialog(false);
      setPasswordTeacher(null);
      setNewPassword("");
      
      if (!response.success) {
        toast({
          title: "Password Change Failed",
          description: response.message || "Failed to change password",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast({
        title: "Password Change Failed",
        description: error.message || "Failed to change password",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTeacher = async (teacher: Teacher) => {
    if (!confirm(`Are you sure you want to delete ${teacher.firstName} ${teacher.lastName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiRequest(`/api/admin/teachers/${teacher.id}`, {
        method: "DELETE"
      });

      toast({
        title: "Success",
        description: "Teacher deleted successfully"
      });
      loadTeachers();
    } catch (error: any) {
      console.error("Error deleting teacher:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete teacher",
        variant: "destructive"
      });
    }
  };


  const handleGenerateAndShowPassword = async (teacher: Teacher) => {
    try {
      const response = await apiRequest(`/api/admin/teachers/${teacher.id}/generate-password`, {
        method: "POST"
      });

      if (response.success && response.newPassword) {
        setRevealedPasswords(prev => ({
          ...prev,
          [teacher.id]: response.newPassword
        }));
        toast({
          title: "Password Generated",
          description: `New password generated for ${teacher.firstName} ${teacher.lastName}`
        });
        loadTeachers(); // Refresh the list
      }
    } catch (error: any) {
      console.error("Error generating password:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate password",
        variant: "destructive"
      });
    }
  };

  const filteredTeachers = teachers.filter(teacher =>
    teacher.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleExportTeacher = async (teacherId: string, format: 'csv' | 'json' = 'csv') => {
    try {
      setExportLoading(teacherId);
      const response = await fetch(`/api/admin/export/teacher/${teacherId}?format=${format}`);
      
      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const teacher = teachers.find(t => t.id === teacherId);
      const teacherName = teacher ? `${teacher.firstName}_${teacher.lastName}` : 'teacher';
      const filename = `${teacherName}_data_export.${format}`;
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: `Teacher data exported successfully`
      });
    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: "Error",
        description: "Failed to export teacher data",
        variant: "destructive"
      });
    } finally {
      setExportLoading(null);
    }
  };

  const handleBulkExport = async (format: 'csv' | 'json' = 'csv') => {
    if (selectedTeachers.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one teacher to export",
        variant: "destructive"
      });
      return;
    }

    try {
      setExportLoading('bulk');
      const response = await apiRequest('/api/admin/export/teachers/bulk', {
        method: 'POST',
        body: { teacherIds: selectedTeachers, format }
      });
      
      const blob = new Blob([format === 'csv' ? response : JSON.stringify(response, null, 2)], {
        type: format === 'csv' ? 'text/csv' : 'application/json'
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `bulk_teacher_export_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: `${selectedTeachers.length} teachers exported successfully`
      });
      setSelectedTeachers([]);
    } catch (error: any) {
      console.error('Bulk export error:', error);
      toast({
        title: "Error",
        description: "Failed to export teachers data",
        variant: "destructive"
      });
    } finally {
      setExportLoading(null);
    }
  };

  const toggleTeacherSelection = (teacherId: string) => {
    setSelectedTeachers(prev => 
      prev.includes(teacherId)
        ? prev.filter(id => id !== teacherId)
        : [...prev, teacherId]
    );
  };

  const selectAllTeachers = () => {
    if (selectedTeachers.length === filteredTeachers.length) {
      setSelectedTeachers([]);
    } else {
      setSelectedTeachers(filteredTeachers.map(t => t.id));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center space-x-2 text-lg md:text-xl">
                <Users className="h-5 w-5" />
                <span>Teacher Management</span>
              </CardTitle>
              <p className="text-xs md:text-sm text-gray-600 mt-1">
                Manage teacher accounts and permissions
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-brand-blue hover:bg-brand-blue/90" data-testid="button-add-teacher">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Teacher
                  </Button>
                </DialogTrigger>
              </Dialog>
              <Button onClick={handleBulkUpload} variant="outline" data-testid="button-bulk-upload">
                <Upload className="h-4 w-4 mr-2" />
                Bulk Upload CSV
              </Button>
              <Button onClick={handleDownloadTemplate} variant="outline" data-testid="button-download-template">
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                data-testid="file-input-bulk-upload"
              />
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogContent className="sm:max-w-[500px] mx-4 sm:mx-0 max-h-[90vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>Add New Teacher</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 overflow-y-auto flex-1 pr-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={newTeacher.firstName}
                        onChange={(e) => setNewTeacher({...newTeacher, firstName: e.target.value})}
                        placeholder="Enter first name"
                        data-testid="input-firstname"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={newTeacher.lastName}
                        onChange={(e) => setNewTeacher({...newTeacher, lastName: e.target.value})}
                        placeholder="Enter last name"
                        data-testid="input-lastname"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newTeacher.email}
                      onChange={(e) => setNewTeacher({...newTeacher, email: e.target.value})}
                      placeholder="Enter email address"
                      data-testid="input-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="new-password"
                      value={newTeacher.password}
                      onChange={(e) => setNewTeacher({...newTeacher, password: e.target.value})}
                      placeholder="Enter password (min 6 characters)"
                      data-testid="input-password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="schoolDistrict">School District</Label>
                    <Input
                      id="schoolDistrict"
                      value={newTeacher.schoolDistrict}
                      onChange={(e) => setNewTeacher({...newTeacher, schoolDistrict: e.target.value})}
                      placeholder="Enter school district (optional for private/standalone schools)"
                      data-testid="input-school-district"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primaryGrade">Primary Grade *</Label>
                      <Input
                        id="primaryGrade"
                        value={newTeacher.primaryGrade}
                        onChange={(e) => setNewTeacher({...newTeacher, primaryGrade: e.target.value})}
                        placeholder="e.g., 3rd Grade, K-5"
                        data-testid="input-primary-grade"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="primarySubject">Primary Subject *</Label>
                      <Input
                        id="primarySubject"
                        value={newTeacher.primarySubject}
                        onChange={(e) => setNewTeacher({...newTeacher, primarySubject: e.target.value})}
                        placeholder="e.g., Mathematics, ELA"
                        data-testid="input-primary-subject"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="teacherType">Teacher Type *</Label>
                    <select
                      id="teacherType"
                      value={newTeacher.teacherType}
                      onChange={(e) => setNewTeacher({...newTeacher, teacherType: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue"
                      data-testid="select-teacher-type"
                    >
                      <option value="Classroom Teacher">Classroom Teacher</option>
                      <option value="Special Education Teacher">Special Education Teacher</option>
                      <option value="ESL Teacher">ESL Teacher</option>
                      <option value="Reading Specialist">Reading Specialist</option>
                      <option value="Math Specialist">Math Specialist</option>
                      <option value="Counselor">Counselor</option>
                      <option value="Administrator">Administrator</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="requestLimit">Request Limit</Label>
                    <Input
                      id="requestLimit"
                      type="number"
                      min="1"
                      value={newTeacher.supportRequestsLimit}
                      onChange={(e) => setNewTeacher({...newTeacher, supportRequestsLimit: parseInt(e.target.value) || 20})}
                      data-testid="input-request-limit"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={newTeacher.isActive}
                      onCheckedChange={(checked: boolean) => setNewTeacher({...newTeacher, isActive: checked})}
                      data-testid="checkbox-active"
                    />
                    <Label>Active Account</Label>
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={() => setShowAddDialog(false)} data-testid="button-cancel">
                      Cancel
                    </Button>
                    <Button onClick={handleAddTeacher} data-testid="button-save-teacher">
                      Add Teacher
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Search and Controls */}
      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex-1 max-w-md">
              <Label htmlFor="search" className="text-sm font-medium">Search Teachers</Label>
              <Input
                id="search"
                placeholder="Search by name, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1"
                data-testid="input-search"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <div className="text-lg font-bold text-brand-blue">{filteredTeachers.length}</div>
                  <div className="text-xs text-gray-500">
                    {filteredTeachers.length === 1 ? 'Teacher' : 'Teachers'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{teachers.filter(t => t.isActive).length}</div>
                  <div className="text-xs text-gray-500">Active</div>
                </div>
              </div>
              
              <Button
                variant="outline"
                onClick={() => setShowBulkExport(!showBulkExport)}
                data-testid="button-show-bulk-export"
              >
                <Database className="h-4 w-4 mr-2" />
                Show Bulk Export
              </Button>
            </div>
          </div>
          
          {showBulkExport && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
              {selectedTeachers.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkExport('csv')}
                    disabled={exportLoading === 'bulk'}
                    data-testid="button-bulk-export-csv"
                  >
                    {exportLoading === 'bulk' ? 'Exporting...' : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV ({selectedTeachers.length})
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkExport('json')}
                    disabled={exportLoading === 'bulk'}
                    data-testid="button-bulk-export-json"
                  >
                    {exportLoading === 'bulk' ? 'Exporting...' : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Export JSON ({selectedTeachers.length})
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Teachers Table */}
      <Card>
        <CardContent className="p-0">
          {/* Mobile Card View */}
          <div className="block md:hidden p-4 space-y-4">
            {filteredTeachers.map((teacher) => (
              <Card key={teacher.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-sm">{teacher.firstName} {teacher.lastName}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{teacher.email}</p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {revealedPasswords[teacher.id] ? `Password: ${revealedPasswords[teacher.id]}` : "Password: ****"}
                      </Badge>
                    </div>
                    <Badge variant={teacher.isActive ? "default" : "secondary"} className="text-xs">
                      {teacher.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground">Requests Used:</span>
                      <div className="font-medium">{teacher.supportRequestsUsed}/{teacher.supportRequestsLimit + (teacher.additionalRequests || 0)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Joined:</span>
                      <div className="font-medium">{formatDate(teacher.createdAt)}</div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t">
                    {showBulkExport && (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedTeachers.includes(teacher.id)}
                          onCheckedChange={() => toggleTeacherSelection(teacher.id)}
                          data-testid={`checkbox-select-${teacher.id}`}
                        />
                        <Label className="text-xs">Select for export</Label>
                      </div>
                    )}
                    <div className="flex justify-end gap-1 flex-wrap">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleExportTeacher(teacher.id, 'csv')}
                        disabled={exportLoading === teacher.id}
                        className="text-xs"
                        data-testid={`button-export-csv-${teacher.id}`}
                        title="Export teacher data as CSV"
                      >
                        {exportLoading === teacher.id ? '...' : <Download className="h-3 w-3" />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setSelectedTeacher(teacher);
                          setShowEditDialog(true);
                        }}
                        className="text-xs"
                        data-testid={`button-edit-${teacher.id}`}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteTeacher(teacher)}
                        className="text-red-600 hover:text-red-800 text-xs"
                        data-testid={`button-delete-${teacher.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {showBulkExport && (
                    <TableHead className="w-[50px] text-xs lg:text-sm">
                      <Checkbox
                        checked={selectedTeachers.length === filteredTeachers.length && filteredTeachers.length > 0}
                        onCheckedChange={selectAllTeachers}
                        data-testid="checkbox-select-all"
                      />
                    </TableHead>
                  )}
                  <TableHead className="min-w-[120px] text-xs lg:text-sm">Name</TableHead>
                  <TableHead className="min-w-[180px] text-xs lg:text-sm">Email</TableHead>
                  <TableHead className="min-w-[80px] text-xs lg:text-sm">Requests</TableHead>
                  <TableHead className="min-w-[60px] text-xs lg:text-sm">Status</TableHead>
                  <TableHead className="min-w-[120px] text-xs lg:text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {filteredTeachers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={showBulkExport ? 7 : 6} className="text-center py-8">
                    <div className="flex flex-col items-center space-y-2">
                      <Users className="h-8 w-8 text-gray-400" />
                      <p className="text-gray-500">No teachers found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTeachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    {showBulkExport && (
                      <TableCell>
                        <Checkbox
                          checked={selectedTeachers.includes(teacher.id)}
                          onCheckedChange={() => toggleTeacherSelection(teacher.id)}
                          data-testid={`checkbox-select-${teacher.id}`}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="font-medium text-xs lg:text-sm">
                        {teacher.firstName} {teacher.lastName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Mail className="h-3 w-3 text-gray-400" />
                        <span className="text-xs lg:text-sm truncate max-w-[150px]">{teacher.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs lg:text-sm">
                        <span className="font-medium">{teacher.supportRequestsUsed || 0}</span>
                        <span className="text-gray-500"> / {teacher.supportRequestsLimit + (teacher.additionalRequests || 0)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={teacher.isActive ? "default" : "secondary"}
                        className={`text-xs ${teacher.isActive ? "bg-green-100 text-green-800" : ""}`}
                      >
                        {teacher.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExportTeacher(teacher.id, 'csv')}
                          disabled={exportLoading === teacher.id}
                          className="h-6 w-6 p-0"
                          data-testid={`button-export-csv-${teacher.id}`}
                          title="Export teacher data as CSV"
                        >
                          {exportLoading === teacher.id ? (
                            <div className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full" />
                          ) : (
                            <Download className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTeacher(teacher);
                            setShowEditDialog(true);
                          }}
                          className="h-6 w-6 p-0"
                          data-testid={`button-edit-${teacher.id}`}
                          title="Edit teacher"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleChangePassword(teacher)}
                          className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:border-blue-300"
                          data-testid={`button-change-password-${teacher.id}`}
                          title="Change password"
                        >
                          <Key className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteTeacher(teacher)}
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:border-red-300"
                          data-testid={`button-delete-${teacher.id}`}
                          title="Delete teacher"
                        >
                          <Trash2 className="h-3 w-3" />
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

      {/* Edit Dialog */}
      {selectedTeacher && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-[500px] mx-4 sm:mx-0">
            <DialogHeader>
              <DialogTitle>Edit Teacher</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editFirstName">First Name</Label>
                  <Input
                    id="editFirstName"
                    value={selectedTeacher.firstName}
                    onChange={(e) => setSelectedTeacher({...selectedTeacher, firstName: e.target.value})}
                    data-testid="input-edit-firstname"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editLastName">Last Name</Label>
                  <Input
                    id="editLastName"
                    value={selectedTeacher.lastName}
                    onChange={(e) => setSelectedTeacher({...selectedTeacher, lastName: e.target.value})}
                    data-testid="input-edit-lastname"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editEmail">Email</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={selectedTeacher.email}
                  onChange={(e) => setSelectedTeacher({...selectedTeacher, email: e.target.value})}
                  data-testid="input-edit-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editRequestLimit">Request Limit</Label>
                <Input
                  id="editRequestLimit"
                  type="number"
                  min="1"
                  value={selectedTeacher.supportRequestsLimit}
                  onChange={(e) => setSelectedTeacher({...selectedTeacher, supportRequestsLimit: parseInt(e.target.value) || 20})}
                  data-testid="input-edit-request-limit"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedTeacher.isActive}
                  onCheckedChange={(checked: boolean) => setSelectedTeacher({...selectedTeacher, isActive: checked})}
                  data-testid="checkbox-edit-active"
                />
                <Label>Active Account</Label>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowEditDialog(false)} data-testid="button-cancel-edit">
                  Cancel
                </Button>
                <Button onClick={handleEditTeacher} data-testid="button-save-edit">
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Password Change Dialog */}
      {passwordTeacher && (
        <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
          <DialogContent className="sm:max-w-[400px] mx-4 sm:mx-0">
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Change password for <strong>{passwordTeacher.firstName} {passwordTeacher.lastName}</strong>
              </p>
              {/* Current Password Display */}
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="flex space-x-2">
                  <Input
                    id="currentPassword"
                    type="text"
                    value={revealedPasswords[passwordTeacher.id] || "****"}
                    readOnly
                    className="font-mono bg-gray-50"
                    data-testid="input-current-password"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateAndShowPassword(passwordTeacher)}
                    disabled={!!revealedPasswords[passwordTeacher.id]}
                    data-testid="button-show-current-password"
                    title="Generate and show current password"
                  >
                    {revealedPasswords[passwordTeacher.id] ? "Shown" : "Show"}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Enter new password (minimum 6 characters)"
                  value={newPassword || ""}
                  onChange={(e) => setNewPassword(e.target.value)}
                  data-testid="input-new-password"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowPasswordDialog(false)} 
                  data-testid="button-cancel-password"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handlePasswordChange} 
                  data-testid="button-save-password"
                  disabled={!newPassword || newPassword.length < 6}
                >
                  Change Password
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}