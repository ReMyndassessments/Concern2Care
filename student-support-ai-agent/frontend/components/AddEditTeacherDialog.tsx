import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';
import type { UserProfile } from '~backend/users/me';

interface AddEditTeacherDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (teacher: UserProfile) => void;
  teacher?: UserProfile | null;
}

export function AddEditTeacherDialog({ isOpen, onClose, onSave, teacher }: AddEditTeacherDialogProps) {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    schoolName: '',
    schoolDistrict: '',
    teacherType: 'classroom',
    subscriptionEndDate: '',
    supportRequestsLimit: 20,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (teacher) {
      setFormData({
        email: teacher.email,
        name: teacher.name || '',
        password: '', // Don't pre-fill password for security
        schoolName: teacher.schoolName || '',
        schoolDistrict: teacher.schoolDistrict || '',
        teacherType: teacher.teacherType || 'classroom',
        subscriptionEndDate: teacher.subscriptionEndDate ? new Date(teacher.subscriptionEndDate).toISOString().split('T')[0] : '',
        supportRequestsLimit: teacher.supportRequestsLimit,
      });
    } else {
      // Reset form for adding a new teacher
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      setFormData({
        email: '',
        name: '',
        password: '',
        schoolName: '',
        schoolDistrict: '',
        teacherType: 'classroom',
        subscriptionEndDate: oneYearFromNow.toISOString().split('T')[0],
        supportRequestsLimit: 20,
      });
    }
  }, [teacher, isOpen]);

  const handleSave = async () => {
    if (!formData.email || !formData.name) {
      toast({
        title: "Missing Fields",
        description: "Email and Name are required.",
        variant: "destructive",
      });
      return;
    }

    if (!teacher && !formData.password) {
      toast({
        title: "Missing Password",
        description: "Password is required when creating a new teacher.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password && formData.password.length < 6) {
      toast({
        title: "Invalid Password",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      let savedTeacher;
      if (teacher) {
        // Update existing teacher
        const updateData: any = {
          id: teacher.id,
          name: formData.name,
          email: formData.email,
          schoolName: formData.schoolName,
          schoolDistrict: formData.schoolDistrict,
          teacherType: formData.teacherType,
          subscriptionEndDate: formData.subscriptionEndDate,
          supportRequestsLimit: Number(formData.supportRequestsLimit),
        };
        
        // Only include password if it's provided
        if (formData.password) {
          updateData.password = formData.password;
        }
        
        savedTeacher = await backend.users.updateUserByAdmin(updateData);
      } else {
        // Create new teacher
        savedTeacher = await backend.users.createUserByAdmin({
          email: formData.email,
          name: formData.name,
          password: formData.password,
          schoolName: formData.schoolName,
          schoolDistrict: formData.schoolDistrict,
          teacherType: formData.teacherType,
          subscriptionEndDate: formData.subscriptionEndDate,
        });
      }
      onSave(savedTeacher);
      toast({
        title: `Teacher ${teacher ? 'Updated' : 'Added'}`,
        description: `${savedTeacher.name} has been successfully saved.`,
      });
      onClose();
    } catch (error) {
      console.error('Error saving teacher:', error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        title: "Save Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg rounded-3xl">
        <DialogHeader>
          <DialogTitle>{teacher ? 'Edit Teacher' : 'Add New Teacher'}</DialogTitle>
          <DialogDescription>
            {teacher ? `Update the details for ${teacher.name}.` : 'Enter the details for the new teacher.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">Email</Label>
            <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right">
              {teacher ? 'New Password' : 'Password'}
            </Label>
            <div className="col-span-3 relative">
              <Input 
                id="password" 
                type={showPassword ? "text" : "password"}
                value={formData.password} 
                onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                placeholder={teacher ? "Leave blank to keep current password" : "Enter password"}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="schoolName" className="text-right">School</Label>
            <Input id="schoolName" value={formData.schoolName} onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="schoolDistrict" className="text-right">District</Label>
            <Input id="schoolDistrict" value={formData.schoolDistrict} onChange={(e) => setFormData({ ...formData, schoolDistrict: e.target.value })} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="teacherType" className="text-right">Type</Label>
            <Select value={formData.teacherType} onValueChange={(value) => setFormData({ ...formData, teacherType: value })}>
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="classroom">Classroom Teacher</SelectItem>
                <SelectItem value="specialist">Specialist</SelectItem>
                <SelectItem value="support">Support Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="subscriptionEndDate" className="text-right">Sub. End</Label>
            <Input id="subscriptionEndDate" type="date" value={formData.subscriptionEndDate} onChange={(e) => setFormData({ ...formData, subscriptionEndDate: e.target.value })} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="supportRequestsLimit" className="text-right">Limit</Label>
            <Input id="supportRequestsLimit" type="number" value={formData.supportRequestsLimit} onChange={(e) => setFormData({ ...formData, supportRequestsLimit: Number(e.target.value) })} className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
