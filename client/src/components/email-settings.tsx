import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";
import { 
  Mail, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Send, 
  Settings, 
  Trash2,
  AlertTriangle,
  Info
} from "lucide-react";

interface UserEmailConfig {
  id: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  fromAddress?: string;
  fromName?: string;
  isActive: boolean;
  lastTestedAt?: string;
  testStatus?: 'success' | 'failed' | 'pending';
  createdAt: string;
  updatedAt: string;
}

interface EmailStatus {
  hasPersonalConfig: boolean;
  hasSchoolConfig: boolean;
  activeConfig: 'user' | 'school' | 'none';
  status: 'active' | 'limited';
}

export default function EmailSettings() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  
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

  // Get email status
  const { data: emailStatus } = useQuery<EmailStatus>({
    queryKey: ["/api/email/status"]
  });

  // Get current user email config
  const { data: userConfig, isLoading } = useQuery<UserEmailConfig | null>({
    queryKey: ["/api/email/user-config"]
  });

  // Update form when config loads
  useEffect(() => {
    if (userConfig) {
      setFormData({
        smtpHost: userConfig.smtpHost,
        smtpPort: userConfig.smtpPort,
        smtpSecure: userConfig.smtpSecure,
        smtpUser: userConfig.smtpUser,
        smtpPassword: "", // Don't populate password for security
        fromAddress: userConfig.fromAddress || "",
        fromName: userConfig.fromName || "",
        isActive: userConfig.isActive
      });
    }
  }, [userConfig]);

  // Save email configuration
  const saveConfigMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/email/user-config", data);
    },
    onSuccess: () => {
      toast({
        title: t('emailSettings.configSaved', 'Email Configuration Saved'),
        description: t('emailSettings.configSavedDesc', 'Your personal email settings have been updated successfully.'),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/email/user-config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/email/status"] });
      setShowForm(false);
    },
    onError: (error: any) => {
      toast({
        title: t('emailSettings.saveFailed', 'Save Failed'),
        description: error.message || t('emailSettings.saveFailedDesc', 'Failed to save email configuration'),
        variant: "destructive",
      });
    },
  });

  // Test email configuration
  const testConfigMutation = useMutation({
    mutationFn: async (email: string) => {
      return await apiRequest("POST", "/api/email/user-config/test", { testEmail: email });
    },
    onSuccess: (result: any) => {
      toast({
        title: result.success ? t('emailSettings.testSent', 'Test Email Sent') : t('emailSettings.testFailed', 'Test Failed'),
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/email/user-config"] });
      setTestEmail("");
    },
    onError: (error: any) => {
      toast({
        title: t('emailSettings.testFailed', 'Test Failed'),
        description: error.message || t('emailSettings.testFailedDesc', 'Failed to test email configuration'),
        variant: "destructive",
      });
    },
  });

  // Delete email configuration
  const deleteConfigMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", "/api/email/user-config");
    },
    onSuccess: () => {
      toast({
        title: t('emailSettings.configDeleted', 'Configuration Deleted'),
        description: t('emailSettings.configDeletedDesc', 'Your personal email configuration has been removed.'),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/email/user-config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/email/status"] });
      setShowForm(false);
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
    },
    onError: (error: any) => {
      toast({
        title: t('emailSettings.deleteFailed', 'Delete Failed'),
        description: error.message || t('emailSettings.deleteFailedDesc', 'Failed to delete email configuration'),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.smtpHost || !formData.smtpUser || !formData.smtpPassword) {
      toast({
        title: t('emailSettings.missingInfo', 'Missing Information'),
        description: t('emailSettings.missingInfoDesc', 'Please fill in all required fields.'),
        variant: "destructive",
      });
      return;
    }
    saveConfigMutation.mutate(formData);
  };

  const handleTest = () => {
    if (!testEmail) {
      toast({
        title: t('emailSettings.testEmailRequired', 'Test Email Required'),
        description: t('emailSettings.testEmailRequiredDesc', 'Please enter an email address to send the test to.'),
        variant: "destructive",
      });
      return;
    }
    testConfigMutation.mutate(testEmail);
  };

  const getStatusBadge = () => {
    if (!emailStatus) return null;

    if (emailStatus.status === 'active') {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          {t('emailSettings.statusActive', 'Active')}
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          <AlertTriangle className="w-3 h-3 mr-1" />
          {t('emailSettings.statusLimited', 'Limited')}
        </Badge>
      );
    }
  };

  const getActiveConfigDescription = () => {
    if (!emailStatus) return "";

    if (emailStatus.activeConfig === 'user') {
      return t('emailSettings.usingPersonalConfig', 'Using your personal email configuration');
    } else if (emailStatus.activeConfig === 'school') {
      return t('emailSettings.usingSchoolConfig', "Using your school's email configuration");
    } else {
      return t('emailSettings.noConfigAvailable', 'No email configuration available');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <Mail className="w-5 h-5 animate-pulse" />
            <span>{t('emailSettings.loading', 'Loading email settings...')}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Mail className="w-5 h-5" />
          <span>{t('emailSettings.title', 'Email Configuration')}</span>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status */}
        <div className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>{t('emailSettings.currentStatus', 'Current Status')}:</strong> {getActiveConfigDescription()}
              {emailStatus?.activeConfig === 'school' && (
                <span className="block mt-1 text-sm text-gray-600">
                  {t('emailSettings.personalOverrideNote', "You can set up personal email settings to override your school's configuration.")}
                </span>
              )}
            </AlertDescription>
          </Alert>

          {emailStatus && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <span className="font-medium">{t('emailSettings.personalConfig', 'Personal Config')}:</span>
                {emailStatus.hasPersonalConfig ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {t('emailSettings.statusConfigured', 'Configured')}
                  </Badge>
                ) : (
                  <Badge variant="secondary">{t('emailSettings.statusNotSet', 'Not Set')}</Badge>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">{t('emailSettings.schoolConfig', 'School Config')}:</span>
                {emailStatus.hasSchoolConfig ? (
                  <Badge variant="default" className="bg-blue-100 text-blue-800">
                    <Shield className="w-3 h-3 mr-1" />
                    {t('emailSettings.statusAvailable', 'Available')}
                  </Badge>
                ) : (
                  <Badge variant="secondary">{t('emailSettings.statusNotAvailable', 'Not Available')}</Badge>
                )}
              </div>
            </div>
          )}
        </div>

        <hr className="my-4" />

        {/* Personal Configuration Section */}
        {userConfig && !showForm ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">{t('emailSettings.personalEmailSettings', 'Your Personal Email Settings')}</h3>
              <div className="space-x-2">
                <Button variant="outline" onClick={() => setShowForm(true)} data-testid="button-edit-email">
                  <Settings className="w-4 h-4 mr-2" />
                  {t('emailSettings.edit', 'Edit')}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => deleteConfigMutation.mutate()}
                  disabled={deleteConfigMutation.isPending}
                  data-testid="button-delete-email"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('emailSettings.delete', 'Delete')}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-lg">
              <div>
                <span className="font-medium">{t('emailSettings.summary.smtpServer', 'SMTP Server')}:</span>
                <p>{userConfig.smtpHost}:{userConfig.smtpPort}</p>
              </div>
              <div>
                <span className="font-medium">{t('emailSettings.summary.username', 'Username')}:</span>
                <p>{userConfig.smtpUser}</p>
              </div>
              <div>
                <span className="font-medium">{t('emailSettings.summary.fromAddress', 'From Address')}:</span>
                <p>{userConfig.fromAddress || userConfig.smtpUser}</p>
              </div>
              <div>
                <span className="font-medium">{t('emailSettings.summary.status', 'Status')}:</span>
                <div className="flex items-center space-x-2">
                  {userConfig.isActive ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">{t('emailSettings.configStatusActive', 'Active')}</Badge>
                  ) : (
                    <Badge variant="secondary">{t('emailSettings.configStatusInactive', 'Inactive')}</Badge>
                  )}
                  {userConfig.testStatus === 'success' && (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                  {userConfig.testStatus === 'failed' && (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                </div>
              </div>
            </div>

            {/* Test Email Section */}
            <div className="space-y-2">
              <Label htmlFor="test-email">{t('emailSettings.testSectionLabel', 'Test Email Configuration')}</Label>
              <div className="flex space-x-2">
                <Input
                  id="test-email"
                  type="email"
                  placeholder={t('emailSettings.testPlaceholder', 'Enter email to test')}
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  data-testid="input-test-email"
                />
                <Button 
                  onClick={handleTest}
                  disabled={testConfigMutation.isPending || !testEmail}
                  data-testid="button-test-email"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {testConfigMutation.isPending ? t('emailSettings.sending', 'Sending...') : t('emailSettings.test', 'Test')}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {!userConfig && (
              <div className="text-center py-8">
                <Mail className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('emailSettings.noPersonalConfigTitle', 'No Personal Email Configuration')}</h3>
                <p className="text-gray-600 mb-4">
                  {t('emailSettings.noPersonalConfigDesc', 'Set up your personal email settings to send reports and notifications.')}
                </p>
                <Button onClick={() => setShowForm(true)} data-testid="button-setup-email">
                  <Settings className="w-4 h-4 mr-2" />
                  {t('emailSettings.setupPersonalEmail', 'Setup Personal Email')}
                </Button>
              </div>
            )}

            {/* Email Configuration Form */}
            {showForm && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">
                    {userConfig ? t('emailSettings.editTitle', 'Edit') : t('emailSettings.setupTitle', 'Setup')} {t('emailSettings.personalEmailSettingsForm', 'Personal Email Settings')}
                  </h3>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowForm(false)}
                    data-testid="button-cancel-email"
                  >
                    {t('emailSettings.cancel', 'Cancel')}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtp-host">{t('emailSettings.smtpHostLabel', 'SMTP Server Hostname *')}</Label>
                    <Input
                      id="smtp-host"
                      value={formData.smtpHost}
                      onChange={(e) => setFormData({...formData, smtpHost: e.target.value})}
                      placeholder={t('emailSettings.smtpHostPlaceholder', 'smtp.gmail.com')}
                      required
                      data-testid="input-smtp-host"
                    />
                    <p className="text-xs text-gray-600">
                      {t('emailSettings.smtpHostHelp', 'Server hostname (e.g., smtp.gmail.com), not your email address')}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-port">{t('emailSettings.portLabel', 'Port *')}</Label>
                    <Input
                      id="smtp-port"
                      type="number"
                      value={formData.smtpPort}
                      onChange={(e) => setFormData({...formData, smtpPort: parseInt(e.target.value)})}
                      placeholder="587"
                      required
                      data-testid="input-smtp-port"
                    />
                    <p className="text-xs text-gray-600">
                      {t('emailSettings.portHelp', '587 (TLS) or 465 (SSL)')}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      id="smtp-secure"
                      type="checkbox"
                      checked={formData.smtpSecure}
                      onChange={(e) => setFormData({...formData, smtpSecure: e.target.checked})}
                      data-testid="switch-smtp-secure"
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="smtp-secure">{t('emailSettings.secureLabel', 'Use SSL (port 465)')}</Label>
                  </div>
                  <p className="text-xs text-gray-600">
                    {t('emailSettings.secureHelp', 'Check this if using port 465, leave unchecked for port 587 (TLS)')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtp-user">{t('emailSettings.usernameLabel', 'Username/Email *')}</Label>
                  <Input
                    id="smtp-user"
                    type="email"
                    value={formData.smtpUser}
                    onChange={(e) => setFormData({...formData, smtpUser: e.target.value})}
                    placeholder={t('emailSettings.usernamePlaceholder', 'your-email@example.com')}
                    required
                    data-testid="input-smtp-user"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtp-password">{t('emailSettings.passwordLabel', 'Password *')}</Label>
                  <Input
                    id="smtp-password"
                    type="password"
                    value={formData.smtpPassword}
                    onChange={(e) => setFormData({...formData, smtpPassword: e.target.value})}
                    placeholder="App password or email password"
                    required
                    data-testid="input-smtp-password"
                  />
                  <p className="text-xs text-gray-600">
                    {t('emailSettings.passwordHelp', 'For Gmail, use an App Password instead of your regular password.')}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="from-address">{t('emailSettings.fromAddressLabel', 'From Address (Optional)')}</Label>
                    <Input
                      id="from-address"
                      type="email"
                      value={formData.fromAddress}
                      onChange={(e) => setFormData({...formData, fromAddress: e.target.value})}
                      placeholder={t('emailSettings.fromAddressPlaceholder', 'Leave empty to use username')}
                      data-testid="input-from-address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="from-name">{t('emailSettings.fromNameLabel', 'From Name (Optional)')}</Label>
                    <Input
                      id="from-name"
                      value={formData.fromName}
                      onChange={(e) => setFormData({...formData, fromName: e.target.value})}
                      placeholder="Concern2Care"
                      data-testid="input-from-name"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    id="is-active"
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    data-testid="switch-is-active"
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="is-active">{t('emailSettings.enableConfigLabel', 'Enable this email configuration')}</Label>
                </div>

                <Button 
                  type="submit" 
                  disabled={saveConfigMutation.isPending}
                  className="w-full"
                  data-testid="button-save-email"
                >
                  {saveConfigMutation.isPending ? t('emailSettings.saving', 'Saving...') : t('emailSettings.saveConfigButton', 'Save Email Configuration')}
                </Button>
              </form>
            )}
          </div>
        )}

        {/* Quick Setup Templates */}
        {showForm && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Quick Setup</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-blue-800">Gmail:</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setFormData({
                    ...formData,
                    smtpHost: "smtp.gmail.com",
                    smtpPort: 587,
                    smtpSecure: false
                  })}
                  data-testid="button-gmail-template"
                >
                  Use Gmail Settings
                </Button>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-800">Outlook:</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setFormData({
                    ...formData,
                    smtpHost: "smtp.office365.com",
                    smtpPort: 587,
                    smtpSecure: false
                  })}
                  data-testid="button-outlook-template"
                >
                  Use Outlook Settings
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}