import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Settings, Save, AlertTriangle, Shield, Database, Mail, Upload } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';
import backend from '~backend/client';
import type { SystemSettings, UpdateSystemSettingsRequest } from '~backend/admin/system-settings';

export function AdminSystemSettings() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<UpdateSystemSettingsRequest>({});
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await backend.admin.getSystemSettings();
      setSettings(response);
      setFormData({
        defaultSupportRequestLimit: response.defaultSupportRequestLimit,
        defaultSubscriptionDuration: response.defaultSubscriptionDuration,
        aiRecommendationsEnabled: response.aiRecommendationsEnabled,
        emailNotificationsEnabled: response.emailNotificationsEnabled,
        maintenanceMode: response.maintenanceMode,
        maxFileUploadSize: response.maxFileUploadSize
      });
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Error",
        description: "Failed to load system settings.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await backend.admin.updateSystemSettings(formData);
      setSettings(response);
      toast({
        title: "Settings Updated",
        description: "System settings have been saved successfully."
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Error",
        description: "Failed to update system settings.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center animate-pulse mx-auto mb-4">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
          <p className="text-gray-600">Loading system settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
            <p className="text-gray-600">Configure global system parameters and features</p>
          </div>
          <Link to="/admin">
            <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl">
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Maintenance Mode Alert */}
        {formData.maintenanceMode && (
          <Alert className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Maintenance Mode is Active</strong>
              <br />
              The system is currently in maintenance mode. Users may experience limited functionality.
            </AlertDescription>
          </Alert>
        )}

        {/* User Management Settings */}
        <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded-t-3xl">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                <Shield className="h-6 w-6" />
              </div>
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="defaultSupportRequestLimit" className="text-sm font-medium text-gray-700">
                  Default Support Request Limit (per month)
                </Label>
                <Input
                  id="defaultSupportRequestLimit"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.defaultSupportRequestLimit || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, defaultSupportRequestLimit: parseInt(e.target.value) || 20 }))}
                  className="border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500">Number of support requests each teacher can create per month</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultSubscriptionDuration" className="text-sm font-medium text-gray-700">
                  Default Subscription Duration (days)
                </Label>
                <Input
                  id="defaultSubscriptionDuration"
                  type="number"
                  min="30"
                  max="1095"
                  value={formData.defaultSubscriptionDuration || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, defaultSubscriptionDuration: parseInt(e.target.value) || 365 }))}
                  className="border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500">Default subscription length for new teachers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature Settings */}
        <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white rounded-t-3xl">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                <Database className="h-6 w-6" />
              </div>
              Feature Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl">
                <div>
                  <h4 className="font-medium text-gray-900">AI Recommendations</h4>
                  <p className="text-sm text-gray-600">Enable AI-powered intervention recommendations</p>
                </div>
                <Switch
                  checked={formData.aiRecommendationsEnabled || false}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, aiRecommendationsEnabled: checked }))}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl">
                <div>
                  <h4 className="font-medium text-gray-900">Email Notifications</h4>
                  <p className="text-sm text-gray-600">Send email notifications for important events</p>
                </div>
                <Switch
                  checked={formData.emailNotificationsEnabled || false}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, emailNotificationsEnabled: checked }))}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl">
                <div>
                  <h4 className="font-medium text-gray-900">Maintenance Mode</h4>
                  <p className="text-sm text-gray-600">Temporarily disable system for maintenance</p>
                </div>
                <Switch
                  checked={formData.maintenanceMode || false}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, maintenanceMode: checked }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Limits */}
        <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white rounded-t-3xl">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                <Upload className="h-6 w-6" />
              </div>
              System Limits
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="maxFileUploadSize" className="text-sm font-medium text-gray-700">
                Maximum File Upload Size (MB)
              </Label>
              <Input
                id="maxFileUploadSize"
                type="number"
                min="1"
                max="100"
                value={formData.maxFileUploadSize || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, maxFileUploadSize: parseInt(e.target.value) || 10 }))}
                className="border-gray-200 rounded-xl focus:border-orange-500 focus:ring-orange-500"
              />
              <p className="text-xs text-gray-500">Maximum size for file uploads in the system</p>
            </div>
          </CardContent>
        </Card>

        {/* Current Settings Summary */}
        {settings && (
          <Card className="border-0 bg-gradient-to-br from-gray-50 via-slate-50 to-gray-50 shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-600 via-slate-600 to-gray-700 text-white rounded-t-3xl">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Settings className="h-6 w-6" />
                </div>
                Current Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div className="bg-white p-3 rounded-xl border border-gray-200">
                  <span className="font-medium text-gray-700">Support Request Limit:</span>
                  <p className="text-gray-600">{settings.defaultSupportRequestLimit} per month</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-gray-200">
                  <span className="font-medium text-gray-700">Subscription Duration:</span>
                  <p className="text-gray-600">{settings.defaultSubscriptionDuration} days</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-gray-200">
                  <span className="font-medium text-gray-700">AI Recommendations:</span>
                  <p className={`${settings.aiRecommendationsEnabled ? 'text-green-600' : 'text-red-600'}`}>
                    {settings.aiRecommendationsEnabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-gray-200">
                  <span className="font-medium text-gray-700">Email Notifications:</span>
                  <p className={`${settings.emailNotificationsEnabled ? 'text-green-600' : 'text-red-600'}`}>
                    {settings.emailNotificationsEnabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-gray-200">
                  <span className="font-medium text-gray-700">Maintenance Mode:</span>
                  <p className={`${settings.maintenanceMode ? 'text-amber-600' : 'text-green-600'}`}>
                    {settings.maintenanceMode ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-gray-200">
                  <span className="font-medium text-gray-700">Max Upload Size:</span>
                  <p className="text-gray-600">{settings.maxFileUploadSize} MB</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Save Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-xl rounded-2xl py-6 px-8 text-lg font-semibold transition-all duration-200 transform hover:scale-105"
          >
            {saving ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Saving Settings...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
