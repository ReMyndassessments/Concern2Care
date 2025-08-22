import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  Download,
  Search,
  Filter,
  AlertTriangle,
  UserCheck,
  UserX
} from "lucide-react";
import type { UserWithSchool, School } from "@shared/schema";

export default function TeacherManagement() {
  const { toast } = useToast();
  const [teachers, setTeachers] = useState<UserWithSchool[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<string>("all");
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<UserWithSchool | null>(null);

  const [newTeacher, setNewTeacher] = useState({
    email: "",
    firstName: "",
    lastName: "",
    schoolId: "",
    supportRequestsLimit: 20
  });

  const [bulkTeachers, setBulkTeachers] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [teachersData, schoolsData] = await Promise.all([
        fetch("/api/admin/users").then(r => r.json()),
        fetch("/api/admin/schools").then(r => r.json())
      ]);
      setTeachers(teachersData.filter((t: any) => !t.isAdmin));
      setSchools(schoolsData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load teacher data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeacher = async () => {
    try {
      if (!newTeacher.email || !newTeacher.firstName || !newTeacher.lastName) {
        toast({
          title: "Error",
          description: "Please fill in all required fields.",
          variant: "destructive"
        });
        return;
      }

      await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTeacher)
      });

      toast({
        title: "Success",
        description: "Teacher created successfully.",
      });

      setNewTeacher({ email: "", firstName: "", lastName: "", schoolId: "", supportRequestsLimit: 20 });
      setShowAddDialog(false);
      loadData();
    } catch (error) {
      console.error("Error creating teacher:", error);
      toast({
        title: "Error",
        description: "Failed to create teacher.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateTeacher = async () => {
    if (!editingTeacher) return;
    
    try {
      await fetch(`/api/admin/users/${editingTeacher.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: editingTeacher.email,
          firstName: editingTeacher.firstName,
          lastName: editingTeacher.lastName,
          schoolId: editingTeacher.school?.id,
          supportRequestsLimit: editingTeacher.supportRequestsLimit,
          isActive: editingTeacher.isActive
        })
      });

      toast({
        title: "Success",
        description: "Teacher updated successfully.",
      });

      setEditingTeacher(null);
      loadData();
    } catch (error) {
      console.error("Error updating teacher:", error);
      toast({
        title: "Error",
        description: "Failed to update teacher.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTeacher = async (teacherId: string) => {
    if (!confirm("Are you sure you want to delete this teacher?")) return;

    try {
      await fetch(`/api/admin/users/${teacherId}`, {
        method: "DELETE"
      });

      toast({
        title: "Success",
        description: "Teacher deleted successfully.",
      });

      loadData();
    } catch (error) {
      console.error("Error deleting teacher:", error);
      toast({
        title: "Error",
        description: "Failed to delete teacher.",
        variant: "destructive"
      });
    }
  };

  const handleBulkCreate = async () => {
    try {
      const lines = bulkTeachers.trim().split('\n');
      const teachersToCreate = [];

      for (const line of lines) {
        const parts = line.split(',').map(p => p.trim());
        if (parts.length >= 3) {
          teachersToCreate.push({
            email: parts[0],
            firstName: parts[1],
            lastName: parts[2],
            schoolId: parts[3] || "",
            supportRequestsLimit: parseInt(parts[4]) || 20
          });
        }
      }

      if (teachersToCreate.length === 0) {
        toast({
          title: "Error",
          description: "No valid teacher data found.",
          variant: "destructive"
        });
        return;
      }

      await fetch("/api/admin/users/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ users: teachersToCreate })
      });

      toast({
        title: "Success",
        description: `${teachersToCreate.length} teachers created successfully.`,
      });

      setBulkTeachers("");
      setShowBulkDialog(false);
      loadData();
    } catch (error) {
      console.error("Error bulk creating teachers:", error);
      toast({
        title: "Error",
        description: "Failed to bulk create teachers.",
        variant: "destructive"
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTeachers.length === 0) {
      toast({
        title: "Error",
        description: "Please select teachers to delete.",
        variant: "destructive"
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedTeachers.length} teachers?`)) return;

    try {
      await fetch("/api/admin/users/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: selectedTeachers })
      });

      toast({
        title: "Success",
        description: `${selectedTeachers.length} teachers deleted successfully.`,
      });

      setSelectedTeachers([]);
      loadData();
    } catch (error) {
      console.error("Error bulk deleting teachers:", error);
      toast({
        title: "Error",
        description: "Failed to bulk delete teachers.",
        variant: "destructive"
      });
    }
  };

  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = 
      teacher.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSchool = selectedSchool === "all" || teacher.school?.id === selectedSchool;
    
    return matchesSearch && matchesSchool;
  });

  const handleSelectAll = () => {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Teacher Management</h2>
          <p className="text-gray-600">Manage teacher accounts and permissions</p>
        </div>
        <div className="flex items-center space-x-2">
          <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Bulk Import
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Bulk Import Teachers</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="bulk-teachers">Teacher Data (CSV Format)</Label>
                  <p className="text-sm text-gray-500 mb-2">
                    Format: email, firstName, lastName, schoolId (optional), requestLimit (optional)
                  </p>
                  <textarea
                    id="bulk-teachers"
                    value={bulkTeachers}
                    onChange={(e) => setBulkTeachers(e.target.value)}
                    rows={10}
                    className="w-full p-3 border rounded-md font-mono text-sm"
                    placeholder="john@school.edu, John, Doe, school-123, 25&#10;jane@school.edu, Jane, Smith, school-123, 30"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleBulkCreate}>
                    Import Teachers
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-add-teacher">
                <Plus className="h-4 w-4 mr-2" />
                Add Teacher
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Teacher</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newTeacher.email}
                    onChange={(e) => setNewTeacher({...newTeacher, email: e.target.value})}
                    data-testid="input-teacher-email"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={newTeacher.firstName}
                      onChange={(e) => setNewTeacher({...newTeacher, firstName: e.target.value})}
                      data-testid="input-teacher-firstname"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={newTeacher.lastName}
                      onChange={(e) => setNewTeacher({...newTeacher, lastName: e.target.value})}
                      data-testid="input-teacher-lastname"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="school">School</Label>
                  <Select value={newTeacher.schoolId} onValueChange={(value) => setNewTeacher({...newTeacher, schoolId: value})}>
                    <SelectTrigger data-testid="select-teacher-school">
                      <SelectValue placeholder="Select school" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No School</SelectItem>
                      {schools.map(school => (
                        <SelectItem key={school.id} value={school.id}>{school.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="requestLimit">Monthly Request Limit</Label>
                  <Input
                    id="requestLimit"
                    type="number"
                    value={newTeacher.supportRequestsLimit}
                    onChange={(e) => setNewTeacher({...newTeacher, supportRequestsLimit: parseInt(e.target.value) || 20})}
                    data-testid="input-teacher-limit"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTeacher} data-testid="button-create-teacher">
                    Create Teacher
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search teachers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-teachers"
                />
              </div>
            </div>
            <div className="w-48">
              <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                <SelectTrigger data-testid="select-filter-school">
                  <SelectValue placeholder="Filter by school" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Schools</SelectItem>
                  {schools.map(school => (
                    <SelectItem key={school.id} value={school.id}>{school.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedTeachers.length > 0 && (
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected ({selectedTeachers.length})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Teachers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Teachers ({filteredTeachers.length})</span>
            </span>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={selectedTeachers.length === filteredTeachers.length && filteredTeachers.length > 0}
                onCheckedChange={handleSelectAll}
                data-testid="checkbox-select-all"
              />
              <span className="text-sm text-gray-500">Select All</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTeachers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No teachers found matching your criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 w-12">
                      <span className="sr-only">Select</span>
                    </th>
                    <th className="text-left p-3">Name</th>
                    <th className="text-left p-3">Email</th>
                    <th className="text-left p-3">School</th>
                    <th className="text-left p-3">Usage</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeachers.map((teacher) => (
                    <tr key={teacher.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <Checkbox
                          checked={selectedTeachers.includes(teacher.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedTeachers([...selectedTeachers, teacher.id]);
                            } else {
                              setSelectedTeachers(selectedTeachers.filter(id => id !== teacher.id));
                            }
                          }}
                          data-testid={`checkbox-select-${teacher.id}`}
                        />
                      </td>
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{teacher.firstName} {teacher.lastName}</div>
                        </div>
                      </td>
                      <td className="p-3 text-gray-600">{teacher.email}</td>
                      <td className="p-3">
                        {teacher.school ? (
                          <Badge variant="outline">{teacher.school.name}</Badge>
                        ) : (
                          <span className="text-gray-400">No School</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          {teacher.supportRequestsUsed || 0} / {teacher.supportRequestsLimit || 20}
                          <div className="w-16 bg-gray-200 rounded-full h-1 mt-1">
                            <div 
                              className="bg-blue-500 h-1 rounded-full" 
                              style={{ 
                                width: `${Math.min(((teacher.supportRequestsUsed || 0) / (teacher.supportRequestsLimit || 20)) * 100, 100)}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        {teacher.isActive ? (
                          <Badge className="bg-green-100 text-green-800">
                            <UserCheck className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <UserX className="h-3 w-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingTeacher(teacher)}
                            data-testid={`button-edit-${teacher.id}`}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteTeacher(teacher.id)}
                            className="text-red-600 hover:text-red-700"
                            data-testid={`button-delete-${teacher.id}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Teacher Dialog */}
      <Dialog open={editingTeacher !== null} onOpenChange={(open) => !open && setEditingTeacher(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Teacher</DialogTitle>
          </DialogHeader>
          {editingTeacher && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingTeacher.email || ""}
                  onChange={(e) => setEditingTeacher({...editingTeacher, email: e.target.value})}
                  data-testid="input-edit-email"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-firstName">First Name</Label>
                  <Input
                    id="edit-firstName"
                    value={editingTeacher.firstName || ""}
                    onChange={(e) => setEditingTeacher({...editingTeacher, firstName: e.target.value})}
                    data-testid="input-edit-firstname"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-lastName">Last Name</Label>
                  <Input
                    id="edit-lastName"
                    value={editingTeacher.lastName || ""}
                    onChange={(e) => setEditingTeacher({...editingTeacher, lastName: e.target.value})}
                    data-testid="input-edit-lastname"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-school">School</Label>
                <Select 
                  value={editingTeacher.school?.id || ""} 
                  onValueChange={(value) => {
                    const school = schools.find(s => s.id === value);
                    setEditingTeacher({...editingTeacher, school: school || null});
                  }}
                >
                  <SelectTrigger data-testid="select-edit-school">
                    <SelectValue placeholder="Select school" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No School</SelectItem>
                    {schools.map(school => (
                      <SelectItem key={school.id} value={school.id}>{school.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-requestLimit">Monthly Request Limit</Label>
                <Input
                  id="edit-requestLimit"
                  type="number"
                  value={editingTeacher.supportRequestsLimit || 20}
                  onChange={(e) => setEditingTeacher({...editingTeacher, supportRequestsLimit: parseInt(e.target.value) || 20})}
                  data-testid="input-edit-limit"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={editingTeacher.isActive !== false}
                  onCheckedChange={(checked) => setEditingTeacher({...editingTeacher, isActive: checked as boolean})}
                  data-testid="checkbox-edit-active"
                />
                <Label>Active</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingTeacher(null)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateTeacher} data-testid="button-update-teacher">
                  Update Teacher
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}