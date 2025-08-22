import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  MessageSquare, 
  Calendar, 
  User,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { InterventionWithProgressNotes, ProgressNote } from "@shared/schema";
import { format } from 'date-fns';

interface ProgressNotesSectionProps {
  intervention: InterventionWithProgressNotes;
  isCompact?: boolean;
}

interface AddNoteFormProps {
  interventionId: string;
  onClose: () => void;
}

function AddNoteForm({ interventionId, onClose }: AddNoteFormProps) {
  const [note, setNote] = useState("");
  const [outcome, setOutcome] = useState("");
  const [nextSteps, setNextSteps] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createNoteMutation = useMutation({
    mutationFn: async (noteData: { interventionId: string; note: string; outcome?: string; nextSteps?: string }) => {
      return apiRequest('/api/progress-notes', {
        method: 'POST',
        body: JSON.stringify(noteData),
      });
    },
    onSuccess: () => {
      // Invalidate and refetch intervention data
      queryClient.invalidateQueries({ queryKey: ['/api/concerns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/progress-notes'] });
      toast({
        title: "Success",
        description: "Progress note added successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add progress note",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;

    createNoteMutation.mutate({
      interventionId,
      note: note.trim(),
      outcome: outcome || undefined,
      nextSteps: nextSteps.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Progress Note *</label>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Describe what was implemented, observed outcomes, student response, etc..."
          className="min-h-[100px]"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Outcome</label>
        <Select value={outcome} onValueChange={setOutcome}>
          <SelectTrigger>
            <SelectValue placeholder="Select outcome (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="positive">Positive - Strategy working well</SelectItem>
            <SelectItem value="mixed">Mixed - Some improvement, needs adjustment</SelectItem>
            <SelectItem value="needs_adjustment">Needs Adjustment - Strategy requires changes</SelectItem>
            <SelectItem value="no_change">No Change - No significant impact observed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Next Steps</label>
        <Textarea
          value={nextSteps}
          onChange={(e) => setNextSteps(e.target.value)}
          placeholder="What are the planned next steps or modifications? (optional)"
          className="min-h-[80px]"
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={!note.trim() || createNoteMutation.isPending}
        >
          {createNoteMutation.isPending ? "Adding..." : "Add Note"}
        </Button>
      </div>
    </form>
  );
}

function ProgressNoteItem({ note, interventionId }: { note: ProgressNote; interventionId: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editNote, setEditNote] = useState(note.note);
  const [editOutcome, setEditOutcome] = useState(note.outcome || "");
  const [editNextSteps, setEditNextSteps] = useState(note.nextSteps || "");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateNoteMutation = useMutation({
    mutationFn: async (updates: { note: string; outcome?: string; nextSteps?: string }) => {
      return apiRequest(`/api/progress-notes/${note.id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/concerns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/progress-notes'] });
      toast({ title: "Progress note updated successfully" });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update progress note",
        variant: "destructive",
      });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/progress-notes/${note.id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/concerns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/progress-notes'] });
      toast({ title: "Progress note deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete progress note",
        variant: "destructive",
      });
    },
  });

  const handleUpdate = () => {
    if (!editNote.trim()) return;
    
    updateNoteMutation.mutate({
      note: editNote.trim(),
      outcome: editOutcome || undefined,
      nextSteps: editNextSteps.trim() || undefined,
    });
  };

  const getOutcomeBadgeColor = (outcome: string | undefined) => {
    switch (outcome) {
      case 'positive': return 'bg-green-100 text-green-800';
      case 'mixed': return 'bg-yellow-100 text-yellow-800';
      case 'needs_adjustment': return 'bg-orange-100 text-orange-800';
      case 'no_change': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const formatOutcome = (outcome: string | undefined) => {
    switch (outcome) {
      case 'positive': return 'Positive';
      case 'mixed': return 'Mixed Results';
      case 'needs_adjustment': return 'Needs Adjustment';
      case 'no_change': return 'No Change';
      default: return outcome;
    }
  };

  if (isEditing) {
    return (
      <div className="border rounded-lg p-3 bg-gray-50">
        <div className="space-y-3">
          <Textarea
            value={editNote}
            onChange={(e) => setEditNote(e.target.value)}
            className="min-h-[80px]"
          />
          
          <Select value={editOutcome} onValueChange={setEditOutcome}>
            <SelectTrigger>
              <SelectValue placeholder="Select outcome (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No outcome selected</SelectItem>
              <SelectItem value="positive">Positive</SelectItem>
              <SelectItem value="mixed">Mixed</SelectItem>
              <SelectItem value="needs_adjustment">Needs Adjustment</SelectItem>
              <SelectItem value="no_change">No Change</SelectItem>
            </SelectContent>
          </Select>

          <Textarea
            value={editNextSteps}
            onChange={(e) => setEditNextSteps(e.target.value)}
            placeholder="Next steps (optional)"
            className="min-h-[60px]"
          />

          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={handleUpdate}
              disabled={!editNote.trim() || updateNoteMutation.isPending}
            >
              {updateNoteMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-l-2 border-l-blue-200 pl-3 py-2 bg-gray-50 rounded-r-lg">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2 text-xs text-gray-600">
          <Calendar className="h-3 w-3" />
          <span>{note.createdAt ? format(new Date(note.createdAt), 'MMM d, yyyy') : 'Unknown date'}</span>
          {note.outcome && (
            <Badge className={`text-xs ${getOutcomeBadgeColor(note.outcome)}`}>
              {formatOutcome(note.outcome)}
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setIsEditing(true)}
            data-testid={`button-edit-note-${note.id}`}
          >
            <Edit2 className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
            onClick={() => deleteNoteMutation.mutate()}
            disabled={deleteNoteMutation.isPending}
            data-testid={`button-delete-note-${note.id}`}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      <p className="text-sm text-gray-700 mb-2">{note.note}</p>
      
      {note.nextSteps && (
        <div className="text-xs text-gray-600 bg-blue-50 rounded p-2">
          <strong>Next Steps:</strong> {note.nextSteps}
        </div>
      )}
    </div>
  );
}

export default function ProgressNotesSection({ intervention, isCompact = false }: ProgressNotesSectionProps) {
  const [isExpanded, setIsExpanded] = useState(!isCompact);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const progressNotes = intervention.progressNotes || [];

  if (isCompact && progressNotes.length === 0) {
    return (
      <div className="mt-3 pt-3 border-t border-gray-100">
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Progress Note
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Progress Note</DialogTitle>
            </DialogHeader>
            <AddNoteForm 
              interventionId={intervention.id} 
              onClose={() => setShowAddDialog(false)} 
            />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm font-medium text-gray-700 hover:text-gray-900 p-0"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Progress Notes ({progressNotes.length})
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 ml-1" />
          ) : (
            <ChevronDown className="h-4 w-4 ml-1" />
          )}
        </Button>

        {isExpanded && (
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Note
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Progress Note</DialogTitle>
              </DialogHeader>
              <AddNoteForm 
                interventionId={intervention.id} 
                onClose={() => setShowAddDialog(false)} 
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isExpanded && (
        <div className="space-y-3">
          {progressNotes.length === 0 ? (
            <p className="text-sm text-gray-500 italic">
              No progress notes yet. Add your first note to track intervention implementation and outcomes.
            </p>
          ) : (
            <div className="space-y-3">
              {progressNotes
                .sort((a, b) => {
                  const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                  const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                  return dateB - dateA;
                })
                .map((note) => (
                  <ProgressNoteItem 
                    key={note.id} 
                    note={note} 
                    interventionId={intervention.id} 
                  />
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}