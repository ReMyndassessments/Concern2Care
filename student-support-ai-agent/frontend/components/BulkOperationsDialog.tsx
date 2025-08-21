import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Users, AlertTriangle, CheckCircle, Trash2, Edit } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';
import type { UserProfile } from '~backend/users/me';

interface BulkOperationsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTeachers: UserProfile[];
  onSuccess: () => void;
  operation: 'update' | 'delete';
}

export function BulkOperationsDialog({ isOpen, onClose, selectedTeachers, onSuccess, operation }: BulkOperationsDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [updateData, setUpdateData] = useState({
    subscriptionEndDate: '',
    supportRequestsLimit: '',
    schoolName: '',
    schoolDistrict: ''
  });
  const [results, setResults] = useState<{ success: boolean; updatedCount?: number; deletedCount?: number; errors: string[] } | null>(null);
  const { toast } = useToast();

  const handleBulkUpdate = async () => {
    if (selectedTeachers.length === 0) {
      toast({
        title: "No Teachers Selected",
        description: "Please select at least one teacher to update.",
        variant: "destructive"
      });
      return;
    }

    // Check if at least one field is filled
    const hasUpdates = updateData.subscriptionEndDate || 
                      updateData.supportRequestsLimit || 
                      updateData.schoolName || 
                      updateData.schoolDistrict;

    if (!hasUpdates) {
      toast({
        title: "No Updates Specified",
        description: "Please specify at least one field to update.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      const teacherIds = selectedTeachers.map(teacher => teacher.id);
      const updates: any = {};
      
      if (updateData.subscriptionEndDate) {
        updates.subscriptionEndDate = updateData.subscriptionEndDate;
      }
      if (updateData.supportRequestsLimit) {
        updates.supportRequestsLimit = parseInt(updateData.supportRequestsLimit);
      }
      if (updateData.schoolName) {
        updates.schoolName = updateData.schoolName;
      }
      if (updateData.schoolDistrict) {
        updates.schoolDistrict = updateData.schoolDistrict;
      }

      const response = await backend.admin.bulkUpdateTeachers({
        teacherIds,
        updates
      });

      setResults(response);
      
      if (response.success) {
        toast({
          title: "Bulk Update Successful",
          description: `Successfully updated ${response.updatedCount} teachers.`
        });
        onSuccess();
      } else {
        toast({
          title: "Bulk Update Completed with Errors",
          description: `Updated ${response.updatedCount} teachers, but ${response.errors.length} failed.`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error performing bulk update:', error);
      toast({
        title: "Bulk Update Failed",
        description: "An error occurred while updating teachers.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTeachers.length === 0) {
      toast({
        title: "No Teachers Selected",
        description: "Please select at least one teacher to delete.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      const teacherIds = selectedTeachers.map(teacher => teacher.id);
      
      const response = await backend.admin.bulkDeleteTeachers({
        teacherIds
      });

      setResults(response);
      
      if (response.success) {
        toast({
          title: "Bulk Delete Successful",
          description: `Successfully deleted ${response.deletedCount} teachers.`
        });
        onSuccess();
      } else {
        toast({
          title: "Bulk Delete Completed with Errors",
          description: `Deleted ${response.deletedCount} teachers, but ${response.errors.length} failed.`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error performing bulk delete:', error);
      toast({
        title: "Bulk Delete Failed",
        description: "An error occurred while deleting teachers.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setResults(null);
    setUpdateData({
      subscriptionEndDate: '',
      supportRequestsLimit: '',
      schoolName: '',
      schoolDistrict: ''
    });
    onClose();
  };

  const isUpdate = operation === 'update';
  const isDelete = operation === 'delete';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isUpdate ? (
              <>
                <Edit className="h-5 w-5 text-blue-600" />
                Bulk Update Teachers
              </>
            ) : (
              <>
                <Trash2 className="h-5 w-5 text-red-600" />
                Bulk Delete Teachers
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isUpdate 
              ? `Update ${selectedTeachers.length} selected teacher${selectedTeachers.length === 1 ? '' : 's'}.`
              : `Delete ${selectedTeachers.length} selected teacher${selectedTeachers.length === 1 ? '' : 's'} permanently.`
            }
          </DialogDescription>
        </DialogHeader>

        {results ? (
          <div className="space-y-4">
            <Alert className={`border-2 rounded-2xl ${results.success ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
              {results.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              )}
              <AlertDescription className={results.success ? 'text-green-800' : 'text-amber-800'}>
                <strong>Operation Results:</strong>
                <br />
                {isUpdate ? (
                  <>Successfully updated: {results.updatedCount} teachers</>
                ) : (
                  <>Successfully deleted: {results.deletedCount} teachers</>
                )}
                {results.errors.length > 0 && (
                  <>
                    <br />
                    Errors: {results.errors.length}
                  </>
                )}
              </AlertDescription>
            </Alert>

            {results.errors.length > 0 && (
              <div className="max-h-32 overflow-y-auto">
                <h4 className="font-medium text-red-800 mb-2">Errors:</h4>
                <ul className="space-y-1 text-sm text-red-700">
                  {results.errors.map((error, index) => (
                    <li key={index} className="bg-red-50 p-2 rounded">
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Selected Teachers Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-2xl border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">Selected Teachers ({selectedTeachers.length})</span>
              </div>
              <div className="max-h-24 overflow-y-auto">
                <div className="text-sm text-blue-800 space-y-1">
                  {selectedTeachers.map(teacher => (
                    <div key={teacher.id} className="flex justify-between">
                      <span>{teacher.name}</span>
                      <span className="text-blue-600">{teacher.email}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {isUpdate && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Fill in the fields you want to update. Leave fields empty to keep current values.
                </p>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="subscriptionEndDate">Subscription End Date</Label>
                    <Input
                      id="subscriptionEndDate"
                      type="date"
                      value={updateData.subscriptionEndDate}
                      onChange={(e) => setUpdateData(prev => ({ ...prev, subscriptionEndDate: e.target.value }))}
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supportRequestsLimit">Support Requests Limit</Label>
                    <Input
                      id="supportRequestsLimit"
                      type="number"
                      min="1"
                      max="100"
                      value={updateData.supportRequestsLimit}
                      onChange={(e) => setUpdateData(prev => ({ ...prev, supportRequestsLimit: e.target.value }))}
                      placeholder="e.g., 20"
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="schoolName">School Name</Label>
                    <Input
                      id="schoolName"
                      value={updateData.schoolName}
                      onChange={(e) => setUpdateData(prev => ({ ...prev, schoolName: e.target.value }))}
                      placeholder="e.g., Lincoln Elementary"
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="schoolDistrict">School District</Label>
                    <Input
                      id="schoolDistrict"
                      value={updateData.schoolDistrict}
                      onChange={(e) => setUpdateData(prev => ({ ...prev, schoolDistrict: e.target.value }))}
                      placeholder="e.g., Springfield School District"
                      className="rounded-xl"
                    />
                  </div>
                </div>
              </div>
            )}

            {isDelete && (
              <Alert className="border-red-200 bg-red-50 rounded-2xl">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Warning:</strong> This action cannot be undone. All selected teachers and their associated data will be permanently deleted.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <DialogFooter>
          {results ? (
            <Button onClick={handleClose} className="w-full rounded-xl">
              Close
            </Button>
          ) : (
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isProcessing}
                className="flex-1 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={isUpdate ? handleBulkUpdate : handleBulkDelete}
                disabled={isProcessing}
                className={`flex-1 rounded-xl ${isDelete ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isUpdate ? 'Updating...' : 'Deleting...'}
                  </>
                ) : (
                  <>
                    {isUpdate ? (
                      <>
                        <Edit className="mr-2 h-4 w-4" />
                        Update Teachers
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Teachers
                      </>
                    )}
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
