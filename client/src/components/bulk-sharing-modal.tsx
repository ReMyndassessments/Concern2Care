import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Share2, Mail, User, FileText, Send } from "lucide-react";
import { Concern, User as UserType } from "@shared/schema";

interface BulkSharingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedConcerns: Concern[];
  onSuccess?: () => void;
}

export default function BulkSharingModal({
  open,
  onOpenChange,
  selectedConcerns,
  onSuccess,
}: BulkSharingModalProps) {
  const { user } = useAuth() as { user: UserType | undefined };
  const { toast } = useToast();
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [message, setMessage] = useState("");

  const bulkShareMutation = useMutation({
    mutationFn: async (data: {
      concernIds: string[];
      recipientEmail: string;
      recipientName: string;
      message: string;
      senderName: string;
    }) => {
      const response = await apiRequest("POST", "/api/concerns/bulk-share", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Requests Shared Successfully",
        description: `${selectedConcerns.length} support requests have been shared with ${recipientName || recipientEmail}`,
      });
      
      // Reset form
      setRecipientEmail("");
      setRecipientName("");
      setMessage("");
      
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Sharing Failed",
        description: error.message || "Failed to share support requests",
        variant: "destructive",
      });
    },
  });

  const handleShare = () => {
    if (!recipientEmail.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter a recipient email address",
        variant: "destructive",
      });
      return;
    }

    if (selectedConcerns.length === 0) {
      toast({
        title: "No Requests Selected",
        description: "Please select at least one support request to share",
        variant: "destructive",
      });
      return;
    }

    const senderName = user?.firstName && user?.lastName 
      ? `${user.firstName} ${user.lastName}`
      : user?.email || "Teacher";

    bulkShareMutation.mutate({
      concernIds: selectedConcerns.map(c => c.id),
      recipientEmail: recipientEmail.trim(),
      recipientName: recipientName.trim(),
      message: message.trim(),
      senderName,
    });
  };

  const concernTypeColors = {
    academic: "bg-blue-100 text-blue-800 border-blue-200",
    behavior: "bg-amber-100 text-amber-800 border-amber-200", 
    "social-emotional": "bg-purple-100 text-purple-800 border-purple-200",
    attendance: "bg-red-100 text-red-800 border-red-200",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Share2 className="h-4 w-4 text-white" />
            </div>
            <span>Share Support Requests with Staff</span>
          </DialogTitle>
          <DialogDescription>
            Share {selectedConcerns.length} selected support requests with a colleague or administrator via email.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <div className="space-y-6">
            {/* Selected Requests Preview */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Selected Requests ({selectedConcerns.length})
              </Label>
              <ScrollArea className="h-32 border rounded-lg p-3 bg-gray-50">
                <div className="space-y-2">
                  {selectedConcerns.map((concern) => (
                    <div key={concern.id} className="flex items-center justify-between text-sm bg-white rounded-lg p-2 border">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">
                          {concern.studentFirstName} {concern.studentLastInitial}.
                        </span>
                        <span className="text-gray-500">Grade {concern.grade}</span>
                      </div>
                      <div className="flex space-x-1">
                        {(concern.concernTypes as string[] || []).slice(0, 2).map((type) => (
                          <Badge 
                            key={type}
                            className={`text-xs ${concernTypeColors[type.toLowerCase() as keyof typeof concernTypeColors] || concernTypeColors.academic}`}
                          >
                            {type}
                          </Badge>
                        ))}
                        {(concern.concernTypes as string[] || []).length > 2 && (
                          <Badge className="text-xs bg-gray-100 text-gray-600">
                            +{(concern.concernTypes as string[] || []).length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Recipient Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="recipientEmail" className="text-sm font-medium mb-2 block">
                  Recipient Email <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="recipientEmail"
                    type="email"
                    placeholder="colleague@school.edu"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="recipientName" className="text-sm font-medium mb-2 block">
                  Recipient Name (Optional)
                </Label>
                <Input
                  id="recipientName"
                  placeholder="Dr. Smith"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                />
              </div>
            </div>

            {/* Personal Message */}
            <div>
              <Label htmlFor="message" className="text-sm font-medium mb-2 block">
                Personal Message (Optional)
              </Label>
              <Textarea
                id="message"
                placeholder="Hi [Name], I'm sharing these support requests for our upcoming student support team meeting. Please review before we discuss intervention strategies."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Add a personal note to provide context for the shared requests
              </p>
            </div>

            {/* Sharing Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    What will be shared:
                  </p>
                  <ul className="text-sm text-blue-700 mt-1 list-disc list-inside">
                    <li>Student information (first name, last initial, grade)</li>
                    <li>Concern details and descriptions</li>
                    <li>AI-generated intervention recommendations</li>
                    <li>Implementation guidance and follow-up questions</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={bulkShareMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            disabled={bulkShareMutation.isPending || !recipientEmail.trim() || selectedConcerns.length === 0}
            className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white"
          >
            {bulkShareMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sharing...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Share {selectedConcerns.length} Request{selectedConcerns.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}