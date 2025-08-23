import { useState, useEffect } from "react";
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
  CheckCircle
} from "lucide-react";

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  school: string;
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
  school: string;
  supportRequestsLimit: number;
  isActive: boolean;
}

export default function TeacherManagement() {
  const { toast } = useToast();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
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
    school: "",
    supportRequestsLimit: 20,
    isActive: true
  });

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
      if (!newTeacher.firstName || !newTeacher.lastName || !newTeacher.email || !newTeacher.password) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
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
          school: "",
          supportRequestsLimit: 20,
          isActive: true
        });
        loadTeachers();
      }
    } catch (error: any) {
      console.error("Error adding teacher:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add teacher",
        variant: "destructive"
      });
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
          school: selectedTeacher.school,
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

  const filteredTeachers = teachers.filter(teacher =>
    teacher.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.school.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Teacher Management</span>
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Manage teacher accounts and permissions
              </p>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="bg-brand-blue hover:bg-brand-blue/90" data-testid="button-add-teacher">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Teacher
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add New Teacher</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
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
                      value={newTeacher.password}
                      onChange={(e) => setNewTeacher({...newTeacher, password: e.target.value})}
                      placeholder="Enter password (min 6 characters)"
                      data-testid="input-password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="school">School</Label>
                    <Input
                      id="school"
                      value={newTeacher.school}
                      onChange={(e) => setNewTeacher({...newTeacher, school: e.target.value})}
                      placeholder="Enter school name"
                      data-testid="input-school"
                    />
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

      {/* Search and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-2">
          <CardContent className="p-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Teachers</Label>
              <Input
                id="search"
                placeholder="Search by name, email, or school..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search"
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Teachers</p>
                <p className="text-2xl font-bold">{teachers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold">{teachers.filter(t => t.isActive).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Teachers Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>School</TableHead>
                <TableHead>Requests</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeachers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex flex-col items-center space-y-2">
                      <Users className="h-8 w-8 text-gray-400" />
                      <p className="text-gray-500">No teachers found</p>
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
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{teacher.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <School className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{teacher.school || "Not specified"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <span className="font-medium">{teacher.supportRequestsUsed || 0}</span>
                        <span className="text-gray-500"> / {teacher.supportRequestsLimit + (teacher.additionalRequests || 0)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={teacher.isActive ? "default" : "secondary"}
                        className={teacher.isActive ? "bg-green-100 text-green-800" : ""}
                      >
                        {teacher.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{formatDate(teacher.createdAt)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTeacher(teacher);
                            setShowEditDialog(true);
                          }}
                          data-testid={`button-edit-${teacher.id}`}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteTeacher(teacher)}
                          className="text-red-600 hover:text-red-700 hover:border-red-300"
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
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {selectedTeacher && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-[500px]">
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
                <Label htmlFor="editSchool">School</Label>
                <Input
                  id="editSchool"
                  value={selectedTeacher.school}
                  onChange={(e) => setSelectedTeacher({...selectedTeacher, school: e.target.value})}
                  data-testid="input-edit-school"
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
    </div>
  );
}