import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Mail, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Send, 
  Settings, 
  Trash2,
  AlertTriangle,
  Building2,
  Users,
  Plus
} from "lucide-react";

interface SchoolEmailConfig {
  id: string;
  schoolId: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  fromAddress?: string;
  fromName?: string;
  isActive: boolean;
  configuredBy: string;
  lastTestedAt?: string;
  testStatus?: 'success' | 'failed' | 'pending';
  createdAt: string;
  updatedAt: string;
}

interface School {
  id: string;
  name: string;
  district?: string;
  contactEmail?: string;
}

// Component for auto-creating schools from teacher data
function AutoCreateSchools({ onSchoolsCreated }: { onSchoolsCreated: () => void }) {
  const { toast } = useToast();
  
  const autoCreateMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/admin/schools/auto-create", {
        method: "POST"
      });
    },
    onSuccess: (result: any) => {
      toast({
        title: "Schools Created",
        description: `Created ${result.created} schools from teacher data.`,
      });
      onSchoolsCreated();
    },
    onError: (error: any) => {
      toast({
        title: "Auto-Creation Failed",
        description: error.message || "Failed to auto-create schools",
        variant: "destructive",
      });
    },
  });

  return (
    <Button
      onClick={() => autoCreateMutation.mutate()}
      disabled={autoCreateMutation.isPending}
      size="sm"
      className="w-full"
      data-testid="button-auto-create-schools"
    >
      <Plus className="w-4 h-4 mr-2" />
      {autoCreateMutation.isPending ? "Creating Schools..." : "Create Schools from Teacher Data"}
    </Button>
  );
}

interface SchoolEmailSettingsProps {
  selectedSchoolId?: string;
}

export default function SchoolEmailSettings({ selectedSchoolId }: SchoolEmailSettingsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [currentSchoolId, setCurrentSchoolId] = useState(selectedSchoolId || "");
  
  const [formData, setFormData] = useState({
    smtpHost: "",
    smtpPort: 587,
    smtpSecure: false,
    smtpUser: "",
    smtpPassword: "",
    fromAddress: "",
    fromName: "",
    isActive: true
  });

  // Get all schools for admin
  const { data: schools } = useQuery<School[]>({
    queryKey: ["/api/admin/schools"]
  });

  // Get school email config for selected school
  const { data: schoolConfig, isLoading } = useQuery<SchoolEmailConfig | null>({
    queryKey: [`/api/admin/school/${currentSchoolId}/email-config`],
    enabled: !!currentSchoolId
  });

  // Update form when config loads
  useEffect(() => {
    if (schoolConfig) {
      setFormData({
        smtpHost: schoolConfig.smtpHost,
        smtpPort: schoolConfig.smtpPort,
        smtpSecure: schoolConfig.smtpSecure,
        smtpUser: schoolConfig.smtpUser,
        smtpPassword: "", // Don't populate password for security
        fromAddress: schoolConfig.fromAddress || "",
        fromName: schoolConfig.fromName || "",
        isActive: schoolConfig.isActive
      });
    } else {
      // Reset form for new school
      setFormData({
        smtpHost: "",
        smtpPort: 587,
        smtpSecure: false,
        smtpUser: "",
        smtpPassword: "",
        fromAddress: "",
        fromName: "",
        isActive: true
      });
    }
  }, [schoolConfig, currentSchoolId]);

  // Save school email configuration
  const saveConfigMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest(`/api/admin/school/${currentSchoolId}/email-config`, "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "School Email Configuration Saved",
        description: "The school's email settings have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/school/${currentSchoolId}/email-config`] });
      setShowForm(false);
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save school email configuration",
        variant: "destructive",
      });
    },
  });

  // Test school email configuration
  const testConfigMutation = useMutation({
    mutationFn: async (email: string) => {
      return await apiRequest(`/api/admin/school/${currentSchoolId}/email-config/test`, "POST", { testEmail: email });
    },
    onSuccess: (result: any) => {
      toast({
        title: result.success ? "Test Email Sent" : "Test Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/school/${currentSchoolId}/email-config`] });
      setTestEmail("");
    },
    onError: (error: any) => {
      toast({
        title: "Test Failed",
        description: error.message || "Failed to test school email configuration",
        variant: "destructive",
      });
    },
  });

  // Delete school email configuration
  const deleteConfigMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/admin/school/${currentSchoolId}/email-config`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "Configuration Deleted",
        description: "The school's email configuration has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/school/${currentSchoolId}/email-config`] });
      setShowForm(false);
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete school email configuration",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSchoolId) {
      toast({
        title: "School Required",
        description: "Please select a school first.",
        variant: "destructive",
      });
      return;
    }
    if (!formData.smtpHost || !formData.smtpUser || !formData.smtpPassword) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    saveConfigMutation.mutate(formData);
  };

  const handleTest = () => {
    if (!testEmail) {
      toast({
        title: "Test Email Required",
        description: "Please enter an email address to send the test to.",
        variant: "destructive",
      });
      return;
    }
    testConfigMutation.mutate(testEmail);
  };

  const selectedSchool = schools?.find(s => s.id === currentSchoolId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Building2 className="w-5 h-5" />
          <span>School Email Configuration</span>
          <Badge variant="outline">Admin Only</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* School Selection */}
        <div className="space-y-2">
          <Label htmlFor="school-select">Select School</Label>
          <Select value={currentSchoolId} onValueChange={setCurrentSchoolId}>
            <SelectTrigger data-testid="select-school">
              <SelectValue placeholder="Choose a school to configure" />
            </SelectTrigger>
            <SelectContent>
              {schools?.map((school) => (
                <SelectItem key={school.id} value={school.id} data-testid={`select-school-${school.id}`}>
                  {school.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!currentSchoolId && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please select a school to configure its email settings. School email configurations provide default email settings for all teachers in that school.
              <div className="mt-3">
                <AutoCreateSchools onSchoolsCreated={() => {
                  queryClient.invalidateQueries({ queryKey: ["/api/admin/schools"] });
                }} />
              </div>
            </AlertDescription>
          </Alert>
        )}

        {currentSchoolId && selectedSchool && (
          <>
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>School-wide Configuration for {selectedSchool.name}</strong><br />
                This email configuration will be used by all teachers in this school who haven't set up personal email settings.
              </AlertDescription>
            </Alert>

            {isLoading ? (
              <div className="flex items-center space-x-2">
                <Mail className="w-5 h-5 animate-pulse" />
                <span>Loading school email settings...</span>
              </div>
            ) : schoolConfig && !showForm ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Current School Email Settings</h3>
                  <div className="space-x-2">
                    <Button variant="outline" onClick={() => setShowForm(true)} data-testid="button-edit-school-email">
                      <Settings className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => deleteConfigMutation.mutate()}
                      disabled={deleteConfigMutation.isPending}
                      data-testid="button-delete-school-email"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-lg">
                  <div>
                    <span className="font-medium">SMTP Server:</span>
                    <p>{schoolConfig.smtpHost}:{schoolConfig.smtpPort}</p>
                  </div>
                  <div>
                    <span className="font-medium">Username:</span>
                    <p>{schoolConfig.smtpUser}</p>
                  </div>
                  <div>
                    <span className="font-medium">From Address:</span>
                    <p>{schoolConfig.fromAddress || schoolConfig.smtpUser}</p>
                  </div>
                  <div>
                    <span className="font-medium">From Name:</span>
                    <p>{schoolConfig.fromName || 'Concern2Care'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <div className="flex items-center space-x-2">
                      {schoolConfig.isActive ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                      {schoolConfig.testStatus === 'success' && (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                      {schoolConfig.testStatus === 'failed' && (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Last Updated:</span>
                    <p>{new Date(schoolConfig.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Test Email Section */}
                <div className="space-y-2">
                  <Label htmlFor="test-email">Test School Email Configuration</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="test-email"
                      type="email"
                      placeholder="Enter email to test"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      data-testid="input-test-school-email"
                    />
                    <Button 
                      onClick={handleTest}
                      disabled={testConfigMutation.isPending || !testEmail}
                      data-testid="button-test-school-email"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {testConfigMutation.isPending ? "Sending..." : "Test"}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {!schoolConfig && (
                  <div className="text-center py-8">
                    <Mail className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No School Email Configuration</h3>
                    <p className="text-gray-600 mb-4">
                      Set up email settings for {selectedSchool.name} to provide default email functionality for all teachers.
                    </p>
                    <Button onClick={() => setShowForm(true)} data-testid="button-setup-school-email">
                      <Settings className="w-4 h-4 mr-2" />
                      Setup School Email
                    </Button>
                  </div>
                )}

                {/* School Email Configuration Form */}
                {showForm && (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">
                        {schoolConfig ? "Edit" : "Setup"} Email Settings for {selectedSchool.name}
                      </h3>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowForm(false)}
                        data-testid="button-cancel-school-email"
                      >
                        Cancel
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="smtp-host">SMTP Server *</Label>
                        <Input
                          id="smtp-host"
                          value={formData.smtpHost}
                          onChange={(e) => setFormData({...formData, smtpHost: e.target.value})}
                          placeholder="smtp.schooldomain.edu"
                          required
                          data-testid="input-school-smtp-host"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtp-port">Port *</Label>
                        <Input
                          id="smtp-port"
                          type="number"
                          value={formData.smtpPort}
                          onChange={(e) => setFormData({...formData, smtpPort: parseInt(e.target.value)})}
                          placeholder="587"
                          required
                          data-testid="input-school-smtp-port"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        id="smtp-secure"
                        type="checkbox"
                        checked={formData.smtpSecure}
                        onChange={(e) => setFormData({...formData, smtpSecure: e.target.checked})}
                        data-testid="switch-school-smtp-secure"
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="smtp-secure">Use SSL (port 465)</Label>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="smtp-user">Username/Email *</Label>
                      <Input
                        id="smtp-user"
                        type="email"
                        value={formData.smtpUser}
                        onChange={(e) => setFormData({...formData, smtpUser: e.target.value})}
                        placeholder="noreply@schooldomain.edu"
                        required
                        data-testid="input-school-smtp-user"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="smtp-password">Password *</Label>
                      <Input
                        id="smtp-password"
                        type="password"
                        value={formData.smtpPassword}
                        onChange={(e) => setFormData({...formData, smtpPassword: e.target.value})}
                        placeholder="Email account password"
                        required
                        data-testid="input-school-smtp-password"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="from-address">From Address (Optional)</Label>
                        <Input
                          id="from-address"
                          type="email"
                          value={formData.fromAddress}
                          onChange={(e) => setFormData({...formData, fromAddress: e.target.value})}
                          placeholder="concern2care@schooldomain.edu"
                          data-testid="input-school-from-address"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="from-name">From Name (Optional)</Label>
                        <Input
                          id="from-name"
                          value={formData.fromName}
                          onChange={(e) => setFormData({...formData, fromName: e.target.value})}
                          placeholder={selectedSchool.name}
                          data-testid="input-school-from-name"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        id="is-active"
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                        data-testid="switch-school-is-active"
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="is-active">Enable this email configuration for the school</Label>
                    </div>

                    <Alert>
                      <Users className="h-4 w-4" />
                      <AlertDescription>
                        This configuration will be used by all teachers in {selectedSchool.name} who haven't set up their own personal email settings.
                      </AlertDescription>
                    </Alert>

                    <Button 
                      type="submit" 
                      disabled={saveConfigMutation.isPending}
                      className="w-full"
                      data-testid="button-save-school-email"
                    >
                      {saveConfigMutation.isPending ? "Saving..." : "Save School Email Configuration"}
                    </Button>
                  </form>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}