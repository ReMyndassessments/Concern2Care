import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Send, X } from "lucide-react";

interface EmailSharingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  concernId: string;
  studentName: string;
}

interface StaffMember {
  email: string;
  name: string;
  role: string;
}

// Mock staff members - in a real app, this would come from an API
const staffMembers: StaffMember[] = [
  {
    email: "maria.rodriguez@school.edu",
    name: "Dr. Maria Rodriguez",
    role: "School Counselor",
  },
  {
    email: "james.chen@school.edu", 
    name: "Dr. James Chen",
    role: "School Psychologist",
  },
  {
    email: "sarah.williams@school.edu",
    name: "Sarah Williams",
    role: "Special Education Coordinator",
  },
  {
    email: "michael.brown@school.edu",
    name: "Michael Brown",
    role: "Assistant Principal",
  },
];

export default function EmailSharingModal({ 
  open, 
  onOpenChange, 
  concernId, 
  studentName 
}: EmailSharingModalProps) {
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  const shareMutation = useMutation({
    mutationFn: async () => {
      const recipients = staffMembers.filter(staff => 
        selectedStaff.includes(staff.email)
      );
      
      if (recipients.length === 0) {
        throw new Error("Please select at least one recipient");
      }
      
      const response = await apiRequest("POST", `/api/concerns/${concernId}/share`, {
        recipients,
        message: message.trim() || undefined,
      });
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Report Shared Successfully",
        description: `Report sent to ${selectedStaff.length} recipient${selectedStaff.length === 1 ? '' : 's'}`,
      });
      
      // Reset form and close modal
      setSelectedStaff([]);
      setMessage("");
      onOpenChange(false);
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
      
      toast({
        title: "Failed to Share Report",
        description: error.message || "An error occurred while sharing the report",
        variant: "destructive",
      });
    },
  });

  const handleStaffSelection = (email: string, checked: boolean) => {
    if (checked) {
      setSelectedStaff(prev => [...prev, email]);
    } else {
      setSelectedStaff(prev => prev.filter(e => e !== email));
    }
  };

  const handleSend = () => {
    shareMutation.mutate();
  };

  const handleClose = () => {
    if (!shareMutation.isPending) {
      setSelectedStaff([]);
      setMessage("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Share Report with Staff</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={shareMutation.isPending}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Share the concern report for <strong>{studentName}</strong> with selected staff members.
            </p>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block">
              Select Recipients
            </Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {staffMembers.map((staff) => (
                <div
                  key={staff.email}
                  className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <Checkbox
                    id={staff.email}
                    checked={selectedStaff.includes(staff.email)}
                    onCheckedChange={(checked) => 
                      handleStaffSelection(staff.email, checked as boolean)
                    }
                    disabled={shareMutation.isPending}
                  />
                  <Label 
                    htmlFor={staff.email}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="text-sm font-medium text-gray-900">
                      {staff.name}
                    </div>
                    <div className="text-xs text-gray-600">
                      {staff.role} • {staff.email}
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="emailMessage" className="text-sm font-medium text-gray-700 mb-2 block">
              Additional Message (Optional)
            </Label>
            <Textarea 
              id="emailMessage"
              rows={3}
              placeholder="Add any additional context or notes for the recipients..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={shareMutation.isPending}
              className="resize-none"
            />
          </div>

          {selectedStaff.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800">
                Please select at least one staff member to share the report with.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button 
            variant="outline"
            onClick={handleClose}
            disabled={shareMutation.isPending}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSend}
            disabled={shareMutation.isPending || selectedStaff.length === 0}
            className="bg-brand-blue hover:bg-brand-dark-blue"
          >
            {shareMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Report
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
