import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Flag, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle,
  XCircle,
  Calendar,
  Building2,
  Globe,
  Settings
} from "lucide-react";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface FeatureFlag {
  id: string;
  flagName: string;
  isGloballyEnabled: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SchoolFeatureOverride {
  schoolId: string;
  flagName: string;
  isEnabled: boolean;
  enabledBy: string;
  enabledAt: string;
  schoolName?: string;
}

const featureFlagFormSchema = z.object({
  flagName: z.string()
    .min(1, "Flag name is required")
    .max(100, "Flag name too long")
    .regex(/^[a-z0-9_]+$/, "Flag name must be lowercase letters, numbers, and underscores only"),
  description: z.string().optional(),
  isGloballyEnabled: z.boolean().default(false),
});

type FeatureFlagFormData = z.infer<typeof featureFlagFormSchema>;

export default function FeatureFlagManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
  const [deletingFlag, setDeletingFlag] = useState<FeatureFlag | null>(null);
  const [selectedFlag, setSelectedFlag] = useState<string | null>(null);

  // Fetch feature flags
  const { data: flags = [], isLoading: flagsLoading } = useQuery({
    queryKey: ['/api/admin/feature-flags'],
    queryFn: async () => {
      const response = await apiRequest('/api/admin/feature-flags');
      return (response.flags || []) as FeatureFlag[];
    },
  });

  // Fetch school overrides for selected flag
  const { data: overrides = [], isLoading: overridesLoading } = useQuery({
    queryKey: ['/api/admin/feature-flags', selectedFlag, 'overrides'],
    queryFn: async () => {
      if (!selectedFlag) return [];
      const response = await apiRequest(`/api/admin/feature-flags/${selectedFlag}/overrides`);
      return response.overrides as SchoolFeatureOverride[];
    },
    enabled: !!selectedFlag,
  });

  const form = useForm<FeatureFlagFormData>({
    resolver: zodResolver(featureFlagFormSchema),
    defaultValues: {
      flagName: "",
      description: "",
      isGloballyEnabled: false,
    },
  });

  // Create feature flag mutation
  const createMutation = useMutation({
    mutationFn: async (data: FeatureFlagFormData) => {
      return await apiRequest('/api/admin/feature-flags', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/feature-flags'] });
      setShowAddDialog(false);
      form.reset();
      toast({
        title: "Feature Flag Created",
        description: "The feature flag has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create feature flag",
        variant: "destructive",
      });
    },
  });

  // Update feature flag mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FeatureFlagFormData> }) => {
      return await apiRequest(`/api/admin/feature-flags/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/feature-flags'] });
      setEditingFlag(null);
      form.reset();
      toast({
        title: "Feature Flag Updated",
        description: "The feature flag has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update feature flag",
        variant: "destructive",
      });
    },
  });

  // Delete feature flag mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/admin/feature-flags/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/feature-flags'] });
      setDeletingFlag(null);
      toast({
        title: "Feature Flag Deleted",
        description: "The feature flag has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete feature flag",
        variant: "destructive",
      });
    },
  });

  // Toggle global status mutation
  const toggleGlobalMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      return await apiRequest(`/api/admin/feature-flags/${id}/toggle`, {
        method: 'POST',
        body: JSON.stringify({ enabled }),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/feature-flags'] });
      toast({
        title: "Feature Flag Updated",
        description: "Global status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update feature flag",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: FeatureFlagFormData) => {
    if (editingFlag) {
      updateMutation.mutate({ id: editingFlag.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (flag: FeatureFlag) => {
    setEditingFlag(flag);
    form.reset({
      flagName: flag.flagName,
      description: flag.description || "",
      isGloballyEnabled: flag.isGloballyEnabled,
    });
    setShowAddDialog(true);
  };

  const handleDelete = (flag: FeatureFlag) => {
    setDeletingFlag(flag);
  };

  const confirmDelete = () => {
    if (deletingFlag) {
      deleteMutation.mutate(deletingFlag.id);
    }
  };

  const handleToggleGlobal = (flag: FeatureFlag) => {
    toggleGlobalMutation.mutate({
      id: flag.id,
      enabled: !flag.isGloballyEnabled,
    });
  };

  if (flagsLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="feature-flag-management">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Flag className="h-5 w-5 text-blue-600" />
            <span>Feature Flag Management</span>
          </CardTitle>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingFlag ? "Edit Feature Flag" : "Add New Feature Flag"}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="flagName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Flag Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., school_admin_portal"
                            {...field}
                            disabled={!!editingFlag}
                            data-testid="input-flag-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe what this feature flag controls..."
                            {...field}
                            data-testid="input-flag-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isGloballyEnabled"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <FormLabel>Globally Enabled</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-globally-enabled"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                      data-testid="button-save-feature-flag"
                    >
                      {createMutation.isPending || updateMutation.isPending
                        ? "Saving..."
                        : editingFlag
                        ? "Update"
                        : "Create"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Mobile view */}
          <div className="block lg:hidden space-y-4">
            {!Array.isArray(flags) || flags.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No feature flags created yet. Add your first feature flag to get started.
              </div>
            ) : (
              flags.map((flag) => (
                <Card key={flag.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Flag className="h-4 w-4 text-gray-400" />
                        <code className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {flag.flagName}
                        </code>
                      </div>
                      <Badge
                        variant={flag.isGloballyEnabled ? "default" : "secondary"}
                        className={flag.isGloballyEnabled ? "bg-green-100 text-green-800" : ""}
                      >
                        {flag.isGloballyEnabled ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {flag.isGloballyEnabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">
                        {flag.description || "No description"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(flag.createdAt), "MMM dd, yyyy")}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleGlobal(flag)}
                        disabled={toggleGlobalMutation.isPending}
                        data-testid={`button-toggle-${flag.flagName}`}
                        className="p-2"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => 
                          setSelectedFlag(selectedFlag === flag.flagName ? null : flag.flagName)
                        }
                        data-testid={`button-view-overrides-${flag.flagName}`}
                        className="flex-1"
                      >
                        <Building2 className="h-3 w-3 mr-1" />
                        Overrides
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(flag)}
                        data-testid={`button-edit-${flag.flagName}`}
                        className="px-3"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(flag)}
                        data-testid={`button-delete-${flag.flagName}`}
                        className="px-3"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Desktop table view */}
          <div className="hidden lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Flag Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Global Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!Array.isArray(flags) || flags.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                      No feature flags created yet. Add your first feature flag to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  flags.map((flag) => (
                    <TableRow key={flag.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Flag className="h-4 w-4 text-gray-400" />
                          <code className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                            {flag.flagName}
                          </code>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {flag.description || "No description"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={flag.isGloballyEnabled ? "default" : "secondary"}
                            className={flag.isGloballyEnabled ? "bg-green-100 text-green-800" : ""}
                          >
                            {flag.isGloballyEnabled ? (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            ) : (
                              <XCircle className="h-3 w-3 mr-1" />
                            )}
                            {flag.isGloballyEnabled ? "Enabled" : "Disabled"}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleGlobal(flag)}
                            disabled={toggleGlobalMutation.isPending}
                            data-testid={`button-toggle-${flag.flagName}`}
                          >
                            <Settings className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(flag.createdAt), "MMM dd, yyyy")}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => 
                              setSelectedFlag(selectedFlag === flag.flagName ? null : flag.flagName)
                            }
                            data-testid={`button-view-overrides-${flag.flagName}`}
                          >
                            <Building2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(flag)}
                            data-testid={`button-edit-${flag.flagName}`}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(flag)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            data-testid={`button-delete-${flag.flagName}`}
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

          {/* School Overrides Section */}
          {selectedFlag && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-blue-800">
                  <Building2 className="h-5 w-5" />
                  <span>School Overrides for: {selectedFlag}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {overridesLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : overrides.length === 0 ? (
                  <p className="text-blue-700 text-center py-4">
                    No school-specific overrides configured for this feature flag.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {overrides.map((override) => (
                      <div
                        key={`${override.schoolId}-${override.flagName}`}
                        className="flex items-center justify-between p-3 bg-white rounded-lg border"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {override.schoolName || override.schoolId}
                          </p>
                          <p className="text-sm text-gray-600">
                            Enabled: {format(new Date(override.enabledAt), "MMM dd, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                        <Badge
                          variant={override.isEnabled ? "default" : "secondary"}
                          className={override.isEnabled ? "bg-green-100 text-green-800" : ""}
                        >
                          {override.isEnabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingFlag} onOpenChange={() => setDeletingFlag(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Feature Flag</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the feature flag "{deletingFlag?.flagName}"? 
              This action cannot be undone and will also remove all school-specific overrides.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete-feature-flag"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}