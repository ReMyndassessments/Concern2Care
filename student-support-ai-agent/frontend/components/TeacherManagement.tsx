import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Users, Plus, MoreHorizontal, Edit, Trash2, Lock, Edit3, Trash, Download, Upload } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';
import backend from '~backend/client';
import type { UserProfile } from '~backend/users/me';
import { AddEditTeacherDialog } from './AddEditTeacherDialog';
import { AdminResetPasswordDialog } from './AdminResetPasswordDialog';
import { BulkOperationsDialog } from './BulkOperationsDialog';
import { BulkCSVUploadDialog } from './BulkCSVUploadDialog';

export function TeacherManagement() {
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [isBulkOperationsDialogOpen, setIsBulkOperationsDialogOpen] = useState(false);
  const [isBulkCSVUploadDialogOpen, setIsBulkCSVUploadDialogOpen] = useState(false);
  const [bulkOperation, setBulkOperation] = useState<'update' | 'delete'>('update');
  const [selectedTeacher, setSelectedTeacher] = useState<UserProfile | null>(null);
  const [selectedTeachers, setSelectedTeachers] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    setLoading(true);
    try {
      const response = await backend.users.listUsers();
      setTeachers(response.users);
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

  const handleAddClick = () => {
    setSelectedTeacher(null);
    setIsDialogOpen(true);
  };

  const handleEditClick = (teacher: UserProfile) => {
    setSelectedTeacher(teacher);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (teacher: UserProfile) => {
    setSelectedTeacher(teacher);
    setIsDeleteDialogOpen(true);
  };

  const handleResetPasswordClick = (teacher: UserProfile) => {
    setSelectedTeacher(teacher);
    setIsResetPasswordDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTeacher) return;
    try {
      await backend.users.deleteUserByAdmin({ id: selectedTeacher.id });
      toast({
        title: "Teacher Deleted",
        description: `${selectedTeacher.name} has been removed from the system.`,
      });
      loadTeachers(); // Refresh the list
    } catch (error) {
      console.error('Error deleting teacher:', error);
      toast({
        title: "Error",
        description: "Failed to delete teacher.",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedTeacher(null);
    }
  };

  const handleSave = (savedTeacher: UserProfile) => {
    loadTeachers(); // Refresh list after save
  };

  const handleSelectTeacher = (teacherId: number, checked: boolean) => {
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
      setSelectedTeachers(new Set(teachers.map(teacher => teacher.id)));
    } else {
      setSelectedTeachers(new Set());
    }
  };

  const handleBulkUpdate = () => {
    if (selectedTeachers.size === 0) {
      toast({
        title: "No Teachers Selected",
        description: "Please select at least one teacher to update.",
        variant: "destructive"
      });
      return;
    }
    setBulkOperation('update');
    setIsBulkOperationsDialogOpen(true);
  };

  const handleBulkDelete = () => {
    if (selectedTeachers.size === 0) {
      toast({
        title: "No Teachers Selected",
        description: "Please select at least one teacher to delete.",
        variant: "destructive"
      });
      return;
    }
    setBulkOperation('delete');
    setIsBulkOperationsDialogOpen(true);
  };

  const handleBulkOperationSuccess = () => {
    setSelectedTeachers(new Set());
    loadTeachers();
  };

  const handleBulkCSVUploadSuccess = () => {
    setSelectedTeachers(new Set());
    loadTeachers();
  };

  const handleExportTeachers = () => {
    // Create CSV content
    const headers = ['Name', 'Email', 'School Name', 'School District', 'Teacher Type', 'Subscription End Date', 'Support Requests Limit', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...teachers.map(teacher => [
        `"${teacher.name || ''}"`,
        `"${teacher.email}"`,
        `"${teacher.schoolName || ''}"`,
        `"${teacher.schoolDistrict || ''}"`,
        `"${teacher.teacherType || ''}"`,
        `"${teacher.subscriptionEndDate ? new Date(teacher.subscriptionEndDate).toLocaleDateString() : ''}"`,
        `"${teacher.supportRequestsLimit}"`,
        `"${new Date(teacher.createdAt).toLocaleDateString()}"`
      ].join(','))
    ].join('\n');

    // Create and download file
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

  const formatDate = (date?: Date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const selectedTeacherObjects = teachers.filter(teacher => selectedTeachers.has(teacher.id));
  const isAllSelected = teachers.length > 0 && selectedTeachers.size === teachers.length;
  const isPartiallySelected = selectedTeachers.size > 0 && selectedTeachers.size < teachers.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Teacher Management</h1>
            <p className="text-gray-600">Add, edit, or remove teacher accounts.</p>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/admin">
              <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl">
                Back to Dashboard
              </Button>
            </Link>
            <Button onClick={handleAddClick} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl">
              <Plus className="mr-2 h-4 w-4" /> Add Teacher
            </Button>
          </div>
        </div>

        {/* Bulk Operations Bar */}
        {selectedTeachers.size > 0 && (
          <Card className="border-0 bg-gradient-to-r from-blue-50 to-purple-50 shadow-lg rounded-2xl overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900">
                      {selectedTeachers.size} teacher{selectedTeachers.size === 1 ? '' : 's'} selected
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleBulkUpdate}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                  >
                    <Edit3 className="mr-2 h-4 w-4" />
                    Bulk Update
                  </Button>
                  <Button
                    onClick={handleBulkDelete}
                    size="sm"
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Bulk Delete
                  </Button>
                  <Button
                    onClick={() => setSelectedTeachers(new Set())}
                    size="sm"
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl"
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded-t-3xl">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Users className="h-6 w-6" />
                </div>
                All Teachers ({teachers.length})
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setIsBulkCSVUploadDialogOpen(true)}
                  size="sm"
                  variant="outline"
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20 rounded-xl"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Bulk Upload CSV
                </Button>
                <Button
                  onClick={handleExportTeachers}
                  size="sm"
                  variant="outline"
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20 rounded-xl"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={isAllSelected}
                          onCheckedChange={handleSelectAll}
                          className="rounded-lg"
                          ref={(el) => {
                            if (el) {
                              el.indeterminate = isPartiallySelected;
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>School</TableHead>
                      <TableHead>District</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Subscription End</TableHead>
                      <TableHead>Limit</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teachers.map((teacher) => {
                      const isSubActive = teacher.subscriptionEndDate ? new Date(teacher.subscriptionEndDate) > new Date() : false;
                      const isSelected = selectedTeachers.has(teacher.id);
                      
                      return (
                        <TableRow key={teacher.id} className={isSelected ? 'bg-blue-50' : ''}>
                          <TableCell>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => handleSelectTeacher(teacher.id, checked as boolean)}
                              className="rounded-lg"
                            />
                          </TableCell>
                          <TableCell className="font-medium">{teacher.name}</TableCell>
                          <TableCell>{teacher.email}</TableCell>
                          <TableCell>{teacher.schoolName || 'N/A'}</TableCell>
                          <TableCell>{teacher.schoolDistrict || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="rounded-lg">
                              {teacher.teacherType || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(teacher.subscriptionEndDate)}</TableCell>
                          <TableCell>{teacher.supportRequestsLimit}</TableCell>
                          <TableCell>
                            <Badge variant={isSubActive ? 'default' : 'destructive'} className={isSubActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {isSubActive ? 'Active' : 'Expired'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditClick(teacher)}>
                                  <Edit className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleResetPasswordClick(teacher)}>
                                  <Lock className="mr-2 h-4 w-4" /> Reset Password
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteClick(teacher)} className="text-red-600">
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <AddEditTeacherDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onSave={handleSave}
          teacher={selectedTeacher}
        />

        <AdminResetPasswordDialog
          isOpen={isResetPasswordDialogOpen}
          onClose={() => setIsResetPasswordDialogOpen(false)}
          teacher={selectedTeacher}
        />

        <BulkOperationsDialog
          isOpen={isBulkOperationsDialogOpen}
          onClose={() => setIsBulkOperationsDialogOpen(false)}
          selectedTeachers={selectedTeacherObjects}
          onSuccess={handleBulkOperationSuccess}
          operation={bulkOperation}
        />

        <BulkCSVUploadDialog
          isOpen={isBulkCSVUploadDialogOpen}
          onClose={() => setIsBulkCSVUploadDialogOpen(false)}
          onSuccess={handleBulkCSVUploadSuccess}
        />

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the teacher account for <strong>{selectedTeacher?.name}</strong> and all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
