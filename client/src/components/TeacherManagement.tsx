import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Users, Plus, MoreHorizontal, Edit, Trash2, Download, Upload, Settings, UserCheck, UserX, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BulkCSVUploadDialog } from './BulkCSVUploadDialog';
import { apiRequest } from '@/lib/queryClient';

interface Teacher {
  id: string;
  name: string;
  email: string;
  firstName: string;
  lastName: string;
  school: string;
  supportRequestsUsed: number;
  supportRequestsLimit: number;
  additionalRequests: number;
  totalLimit: number;
  isAdmin: boolean;
  role: string;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

export function TeacherManagement() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeachers, setSelectedTeachers] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isCSVUploadOpen, setIsCSVUploadOpen] = useState(false);
  const [isBulkUpdateDialogOpen, setIsBulkUpdateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddTeacherDialogOpen, setIsAddTeacherDialogOpen] = useState(false);
  const [bulkUpdateSettings, setBulkUpdateSettings] = useState({
    supportRequestsLimit: '',
    isActive: '',
    school: ''
  });
  const [newTeacherData, setNewTeacherData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    school: '',
    supportRequestsLimit: '50',
    isActive: true
  });
  const { toast } = useToast();

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('/api/admin/teachers');
      setTeachers(response.teachers);
    } catch (error) {
      console.error('Error loading teachers:', error);
      toast({
        title: "Error",
        description: "Failed to load teachers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTeacher = (teacherId: string, checked: boolean) => {
    setSelectedTeachers(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(teacherId);
      } else {
        newSet.delete(teacherId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const filteredTeachers = getFilteredTeachers();
      setSelectedTeachers(new Set(filteredTeachers.map(teacher => teacher.id)));
    } else {
      setSelectedTeachers(new Set());
    }
  };

  const getFilteredTeachers = () => {
    return teachers.filter(teacher => {
      const matchesSearch = teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (teacher.school && teacher.school.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && teacher.isActive) ||
                           (statusFilter === 'inactive' && !teacher.isActive);
      
      return matchesSearch && matchesStatus;
    });
  };

  const handleBulkUpdate = async () => {
    try {
      const updates: any = {};
      
      if (bulkUpdateSettings.supportRequestsLimit) {
        updates.supportRequestsLimit = parseInt(bulkUpdateSettings.supportRequestsLimit);
      }
      
      if (bulkUpdateSettings.isActive) {
        updates.isActive = bulkUpdateSettings.isActive === 'true';
      }
      
      if (bulkUpdateSettings.school) {
        updates.school = bulkUpdateSettings.school;
      }

      await apiRequest('/api/admin/teachers/bulk-update', {
        method: 'POST',
        body: JSON.stringify({
          teacherIds: Array.from(selectedTeachers),
          updates
        }),
      });

      toast({
        title: "Success",
        description: `Updated ${selectedTeachers.size} teachers successfully.`,
      });

      setSelectedTeachers(new Set());
      setIsBulkUpdateDialogOpen(false);
      setBulkUpdateSettings({ supportRequestsLimit: '', isActive: '', school: '' });
      loadTeachers();
    } catch (error) {
      console.error('Bulk update error:', error);
      toast({
        title: "Error",
        description: "Failed to update teachers.",
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async () => {
    try {
      await apiRequest('/api/admin/teachers/bulk-delete', {
        method: 'DELETE',
        body: JSON.stringify({
          teacherIds: Array.from(selectedTeachers)
        }),
      });

      toast({
        title: "Success",
        description: `Deleted ${selectedTeachers.size} teachers successfully.`,
      });

      setSelectedTeachers(new Set());
      setIsDeleteDialogOpen(false);
      loadTeachers();
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast({
        title: "Error",
        description: "Failed to delete teachers.",
        variant: "destructive",
      });
    }
  };

  const handleAddTeacher = async () => {
    try {
      const response = await apiRequest('/api/admin/teachers', {
        method: 'POST',
        body: newTeacherData
      });

      toast({
        title: "Success",
        description: `Teacher ${newTeacherData.firstName} ${newTeacherData.lastName} has been created successfully.`,
      });

      setIsAddTeacherDialogOpen(false);
      setNewTeacherData({
        firstName: '',
        lastName: '',
        email: '',
        school: '',
        supportRequestsLimit: '50',
        isActive: true
      });
      loadTeachers();
    } catch (error: any) {
      console.error('Add teacher error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create teacher.",
        variant: "destructive",
      });
    }
  };

  const handleExportTeachers = () => {
    const filteredTeachers = getFilteredTeachers();
    const headers = ['Name', 'Email', 'School', 'Support Limit', 'Additional Requests', 'Status', 'Last Login', 'Created'];
    const csvContent = [
      headers.join(','),
      ...filteredTeachers.map(teacher => [
        `"${teacher.name}"`,
        `"${teacher.email}"`,
        `"${teacher.school || ''}"`,
        teacher.supportRequestsLimit,
        teacher.additionalRequests,
        teacher.isActive ? 'Active' : 'Inactive',
        `"${teacher.lastLoginAt ? new Date(teacher.lastLoginAt).toLocaleDateString() : 'Never'}"`,
        `"${new Date(teacher.createdAt).toLocaleDateString()}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `teachers-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: "Teachers data has been exported to CSV file."
    });
  };

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredTeachers = getFilteredTeachers();
  const isAllSelected = filteredTeachers.length > 0 && selectedTeachers.size === filteredTeachers.length;
  const isPartiallySelected = selectedTeachers.size > 0 && selectedTeachers.size < filteredTeachers.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" data-testid="loading-teachers">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading teachers...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="teacher-management">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Teacher Management</h2>
          <p className="text-gray-600">Manage teacher accounts and permissions.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadTeachers} data-testid="button-refresh">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => setIsCSVUploadOpen(true)} data-testid="button-upload-csv">
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <Button variant="outline" onClick={handleExportTeachers} data-testid="button-export">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setIsAddTeacherDialogOpen(true)} data-testid="button-add-teacher">
            <Plus className="mr-2 h-4 w-4" />
            Add Teacher
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search teachers by name, email, or school..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value: 'all' | 'active' | 'inactive') => setStatusFilter(value)}>
              <SelectTrigger className="w-40" data-testid="select-status-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedTeachers.size > 0 && (
        <Card className="bg-blue-50 border-blue-200" data-testid="bulk-operations-bar">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-blue-900">
                  {selectedTeachers.size} teacher{selectedTeachers.size !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsBulkUpdateDialogOpen(true)} data-testid="button-bulk-update">
                  <Settings className="mr-2 h-4 w-4" />
                  Bulk Update
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setIsDeleteDialogOpen(true)} data-testid="button-bulk-delete">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Selected
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedTeachers(new Set())} data-testid="button-clear-selection">
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Teachers ({filteredTeachers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    ref={checkbox => {
                      if (checkbox) checkbox.indeterminate = isPartiallySelected;
                    }}
                    data-testid="checkbox-select-all"
                  />
                </TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead>School</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeachers.map((teacher) => (
                <TableRow key={teacher.id} data-testid={`teacher-row-${teacher.id}`}>
                  <TableCell>
                    <Checkbox
                      checked={selectedTeachers.has(teacher.id)}
                      onCheckedChange={(checked) => handleSelectTeacher(teacher.id, Boolean(checked))}
                      data-testid={`checkbox-select-${teacher.id}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium" data-testid={`teacher-name-${teacher.id}`}>{teacher.name}</div>
                      <div className="text-sm text-gray-500" data-testid={`teacher-email-${teacher.id}`}>{teacher.email}</div>
                      {teacher.isAdmin && (
                        <Badge variant="secondary" className="text-xs">Admin</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell data-testid={`teacher-school-${teacher.id}`}>
                    {teacher.school || 'Not specified'}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm" data-testid={`teacher-usage-${teacher.id}`}>
                        {teacher.supportRequestsUsed} / {teacher.totalLimit} requests
                      </div>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${Math.min((teacher.supportRequestsUsed / teacher.totalLimit) * 100, 100)}%`
                          }}
                        />
                      </div>
                      {teacher.additionalRequests > 0 && (
                        <div className="text-xs text-green-600">
                          +{teacher.additionalRequests} bonus
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={teacher.isActive ? "default" : "secondary"}
                      data-testid={`teacher-status-${teacher.id}`}
                    >
                      {teacher.isActive ? (
                        <>
                          <UserCheck className="mr-1 h-3 w-3" />
                          Active
                        </>
                      ) : (
                        <>
                          <UserX className="mr-1 h-3 w-3" />
                          Inactive
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell data-testid={`teacher-last-login-${teacher.id}`}>
                    {formatDate(teacher.lastLoginAt)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" data-testid={`button-actions-${teacher.id}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Teacher
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Settings className="mr-2 h-4 w-4" />
                          Grant Requests
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Teacher
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredTeachers.length === 0 && (
            <div className="text-center py-8 text-gray-500" data-testid="no-teachers-message">
              {searchTerm || statusFilter !== 'all' ? 'No teachers match your search criteria.' : 'No teachers found.'}
            </div>
          )}
        </CardContent>
      </Card>

      <BulkCSVUploadDialog 
        open={isCSVUploadOpen}
        onOpenChange={setIsCSVUploadOpen}
        onSuccess={loadTeachers}
      />

      <AlertDialog open={isBulkUpdateDialogOpen} onOpenChange={setIsBulkUpdateDialogOpen}>
        <AlertDialogContent data-testid="bulk-update-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Bulk Update Teachers</AlertDialogTitle>
            <AlertDialogDescription>
              Update settings for {selectedTeachers.size} selected teachers. Leave fields empty to keep current values.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Support Requests Limit</label>
              <Input
                type="number"
                placeholder="Leave empty to keep current"
                value={bulkUpdateSettings.supportRequestsLimit}
                onChange={(e) => setBulkUpdateSettings({...bulkUpdateSettings, supportRequestsLimit: e.target.value})}
                data-testid="input-bulk-limit"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select 
                value={bulkUpdateSettings.isActive} 
                onValueChange={(value) => setBulkUpdateSettings({...bulkUpdateSettings, isActive: value})}
              >
                <SelectTrigger data-testid="select-bulk-status">
                  <SelectValue placeholder="Select status or leave unchanged" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Keep current status</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">School</label>
              <Input
                placeholder="Leave empty to keep current"
                value={bulkUpdateSettings.school}
                onChange={(e) => setBulkUpdateSettings({...bulkUpdateSettings, school: e.target.value})}
                data-testid="input-bulk-school"
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-bulk-update">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkUpdate}
              data-testid="button-confirm-bulk-update"
            >
              Update {selectedTeachers.size} Teachers
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent data-testid="bulk-delete-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Teachers</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete {selectedTeachers.size} selected teachers? 
              This action cannot be undone and will also delete all their concerns and reports.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-delete"
            >
              Delete {selectedTeachers.size} Teachers
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isAddTeacherDialogOpen} onOpenChange={setIsAddTeacherDialogOpen}>
        <AlertDialogContent data-testid="add-teacher-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Add New Teacher</AlertDialogTitle>
            <AlertDialogDescription>
              Create a new teacher account with the details below.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">First Name *</label>
                <Input
                  placeholder="Enter first name"
                  value={newTeacherData.firstName}
                  onChange={(e) => setNewTeacherData({...newTeacherData, firstName: e.target.value})}
                  data-testid="input-first-name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Last Name *</label>
                <Input
                  placeholder="Enter last name"
                  value={newTeacherData.lastName}
                  onChange={(e) => setNewTeacherData({...newTeacherData, lastName: e.target.value})}
                  data-testid="input-last-name"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Email Address *</label>
              <Input
                type="email"
                placeholder="Enter email address"
                value={newTeacherData.email}
                onChange={(e) => setNewTeacherData({...newTeacherData, email: e.target.value})}
                data-testid="input-email"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">School</label>
              <Input
                placeholder="Enter school name"
                value={newTeacherData.school}
                onChange={(e) => setNewTeacherData({...newTeacherData, school: e.target.value})}
                data-testid="input-school"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Support Requests Limit</label>
              <Input
                type="number"
                placeholder="50"
                value={newTeacherData.supportRequestsLimit}
                onChange={(e) => setNewTeacherData({...newTeacherData, supportRequestsLimit: e.target.value})}
                data-testid="input-support-limit"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={newTeacherData.isActive}
                onCheckedChange={(checked) => setNewTeacherData({...newTeacherData, isActive: Boolean(checked)})}
                data-testid="checkbox-active"
              />
              <label className="text-sm font-medium">Active account</label>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-add">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleAddTeacher}
              data-testid="button-confirm-add"
              disabled={!newTeacherData.firstName || !newTeacherData.lastName || !newTeacherData.email}
            >
              Create Teacher
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}