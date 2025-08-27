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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Key, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Activity,
  AlertCircle,
  CheckCircle,
  Calendar
} from "lucide-react";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface ApiKey {
  id: string;
  name: string;
  provider: string;
  isActive: boolean;
  description: string | null;
  usageCount: number;
  maxUsage: number;
  lastUsedAt: string | null;
  createdAt: string;
  createdByUser: string | null;
  maskedKey: string;
  usagePercentage: number;
}

const apiKeyFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  apiKey: z.string().min(1, "API key is required"),
  provider: z.string().default("deepseek"),
  description: z.string().optional(),
  maxUsage: z.number().min(1).max(100000).default(10000),
  isActive: z.boolean().default(true),
});

type ApiKeyFormData = z.infer<typeof apiKeyFormSchema>;

export default function ApiKeyManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingKey, setEditingKey] = useState<ApiKey | null>(null);
  const [deletingKey, setDeletingKey] = useState<ApiKey | null>(null);
  const [showApiKey, setShowApiKey] = useState<{[key: string]: boolean}>({});

  const form = useForm<ApiKeyFormData>({
    resolver: zodResolver(apiKeyFormSchema),
    defaultValues: {
      name: "",
      apiKey: "",
      provider: "deepseek",
      description: "",
      maxUsage: 10000,
      isActive: true,
    },
  });

  // Fetch API keys
  const { data: apiKeysData, isLoading } = useQuery({
    queryKey: ['/api/admin/api-keys'],
  });

  const apiKeys: ApiKey[] = (apiKeysData as any)?.apiKeys || [];

  // Create API key mutation
  const createMutation = useMutation({
    mutationFn: async (data: ApiKeyFormData) => {
      return apiRequest('/api/admin/api-keys', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/api-keys'] });
      setShowAddDialog(false);
      form.reset();
      toast({
        title: "Success",
        description: "API key created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create API key",
        variant: "destructive",
      });
    },
  });

  // Update API key mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ApiKeyFormData> }) => {
      return apiRequest(`/api/admin/api-keys/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/api-keys'] });
      setEditingKey(null);
      form.reset();
      toast({
        title: "Success",
        description: "API key updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update API key",
        variant: "destructive",
      });
    },
  });

  // Delete API key mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/admin/api-keys/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/api-keys'] });
      setDeletingKey(null);
      toast({
        title: "Success",
        description: "API key deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete API key",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (data: ApiKeyFormData) => {
    if (editingKey) {
      updateMutation.mutate({ id: editingKey.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (apiKey: ApiKey) => {
    setEditingKey(apiKey);
    form.reset({
      name: apiKey.name,
      apiKey: "", // Don't populate the actual key for security
      provider: apiKey.provider,
      description: apiKey.description || "",
      maxUsage: apiKey.maxUsage,
      isActive: apiKey.isActive,
    });
  };

  const handleDelete = (apiKey: ApiKey) => {
    setDeletingKey(apiKey);
  };

  const confirmDelete = () => {
    if (deletingKey) {
      deleteMutation.mutate(deletingKey.id);
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    setShowApiKey(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const getStatusBadge = (apiKey: ApiKey) => {
    if (!apiKey.isActive) {
      return <Badge variant="secondary" data-testid={`status-inactive-${apiKey.id}`}>Inactive</Badge>;
    }
    if (apiKey.usagePercentage >= 90) {
      return <Badge variant="destructive" data-testid={`status-high-usage-${apiKey.id}`}>High Usage</Badge>;
    }
    return <Badge variant="default" data-testid={`status-active-${apiKey.id}`}>Active</Badge>;
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Keys Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Loading API keys...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            <span className="text-lg md:text-xl">API Keys Management</span>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-api-key" className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add API Key
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md mx-4 sm:mx-0">
              <DialogHeader>
                <DialogTitle>Add New API Key</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="My DeepSeek Key" {...field} data-testid="input-api-key-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="provider"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Provider</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-api-provider">
                              <SelectValue placeholder="Select provider" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="deepseek">DeepSeek</SelectItem>
                            <SelectItem value="openai">OpenAI</SelectItem>
                            <SelectItem value="anthropic">Anthropic</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="apiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API Key</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="sk-..." 
                            {...field}
                            data-testid="input-api-key-value"
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
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Description of this API key..."
                            {...field}
                            data-testid="input-api-key-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxUsage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Usage Limit</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="10000"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            data-testid="input-api-key-usage-limit"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <FormLabel>Active</FormLabel>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-api-key-active"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createMutation.isPending}
                      data-testid="button-save-api-key"
                    >
                      {createMutation.isPending ? "Creating..." : "Create Key"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {apiKeys.length === 0 ? (
          <div className="text-center py-8">
            <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No API Keys Found</h3>
            <p className="text-muted-foreground mb-4">
              You haven't created any API keys yet. Click "Add API Key" to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Mobile Card View */}
            <div className="block md:hidden space-y-4">
              {apiKeys.map((apiKey) => (
                <Card key={apiKey.id} data-testid={`card-api-key-${apiKey.id}`} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium" data-testid={`text-name-${apiKey.id}`}>{apiKey.name}</h3>
                        <Badge variant="secondary" className="text-xs mt-1" data-testid={`text-provider-${apiKey.id}`}>
                          {apiKey.provider}
                        </Badge>
                      </div>
                      {getStatusBadge(apiKey)}
                    </div>
                    
                    {apiKey.description && (
                      <p className="text-sm text-muted-foreground">{apiKey.description}</p>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getUsageColor(apiKey.usagePercentage)}`}
                          style={{ width: `${Math.min(apiKey.usagePercentage, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs" data-testid={`text-usage-${apiKey.id}`}>
                        {apiKey.usageCount}/{apiKey.maxUsage}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span data-testid={`text-last-used-${apiKey.id}`}>
                        Last used: {apiKey.lastUsedAt ? format(new Date(apiKey.lastUsedAt), 'MMM d') : 'Never'}
                      </span>
                      <span data-testid={`text-created-${apiKey.id}`}>
                        Created: {format(new Date(apiKey.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(apiKey)}
                        data-testid={`button-edit-${apiKey.id}`}
                        className="text-xs"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(apiKey)}
                        className="text-red-600 hover:text-red-800 text-xs"
                        data-testid={`button-delete-${apiKey.id}`}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Desktop Table View */}
            <Table className="hidden md:table">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs lg:text-sm">Name</TableHead>
                  <TableHead className="text-xs lg:text-sm">Provider</TableHead>
                  <TableHead className="text-xs lg:text-sm">Status</TableHead>
                  <TableHead className="text-xs lg:text-sm">Usage</TableHead>
                  <TableHead className="text-xs lg:text-sm">API Key</TableHead>
                  <TableHead className="text-xs lg:text-sm">Last Used</TableHead>
                  <TableHead className="text-xs lg:text-sm">Created</TableHead>
                  <TableHead className="text-right text-xs lg:text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((apiKey) => (
                  <TableRow key={apiKey.id} data-testid={`row-api-key-${apiKey.id}`}>
                    <TableCell className="font-medium text-xs lg:text-sm" data-testid={`text-name-${apiKey.id}`}>
                      {apiKey.name}
                      {apiKey.description && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {apiKey.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs" data-testid={`text-provider-${apiKey.id}`}>
                        {apiKey.provider}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(apiKey)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[100px]">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getUsageColor(apiKey.usagePercentage)}`}
                            style={{ width: `${Math.min(apiKey.usagePercentage, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs whitespace-nowrap" data-testid={`text-usage-${apiKey.id}`}>
                          {apiKey.usageCount}/{apiKey.maxUsage}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <code className="text-xs bg-muted px-2 py-1 rounded max-w-[120px] truncate">
                          {apiKey.maskedKey}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleKeyVisibility(apiKey.id)}
                          data-testid={`button-toggle-key-${apiKey.id}`}
                          className="p-1"
                        >
                          {showApiKey[apiKey.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell data-testid={`text-last-used-${apiKey.id}`}>
                      {apiKey.lastUsedAt ? (
                        <div className="flex items-center gap-1 text-xs">
                          <Activity className="h-3 w-3" />
                          {format(new Date(apiKey.lastUsedAt), 'MMM d')}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">Never</span>
                      )}
                    </TableCell>
                    <TableCell data-testid={`text-created-${apiKey.id}`}>
                      <div className="flex items-center gap-1 text-xs">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(apiKey.createdAt), 'MMM d')}
                      </div>
                      {apiKey.createdByUser && (
                        <div className="text-xs text-muted-foreground">
                          by {apiKey.createdByUser}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(apiKey)}
                          data-testid={`button-edit-${apiKey.id}`}
                          className="p-2"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(apiKey)}
                          className="text-red-600 hover:text-red-800 p-2"
                          data-testid={`button-delete-${apiKey.id}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={editingKey !== null} onOpenChange={() => setEditingKey(null)}>
        <DialogContent className="max-w-md mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle>Edit API Key</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-api-key-name" />
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
                      <Textarea {...field} data-testid="input-edit-api-key-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxUsage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Usage Limit</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        data-testid="input-edit-api-key-usage-limit"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <FormLabel>Active</FormLabel>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-edit-api-key-active"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingKey(null)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending}
                  data-testid="button-update-api-key"
                >
                  {updateMutation.isPending ? "Updating..." : "Update Key"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deletingKey !== null} onOpenChange={() => setDeletingKey(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the API key "{deletingKey?.name}"? 
              This action cannot be undone and will permanently remove the key.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete-api-key"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}