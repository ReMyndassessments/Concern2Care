import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Database, Plus, Trash2, AlertTriangle, CheckCircle, Users, FileText } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';
import backend from '~backend/client';
import type { CreateDemoDataRequest, CreateDemoDataResponse, ClearDemoDataResponse } from '~backend/admin/demo-data';

export function AdminDemoData() {
  const [creating, setCreating] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [formData, setFormData] = useState<CreateDemoDataRequest>({
    teacherCount: 10,
    supportRequestCount: 25,
    schoolName: 'Demo Elementary School',
    schoolDistrict: 'Demo School District'
  });
  const [lastResult, setLastResult] = useState<CreateDemoDataResponse | ClearDemoDataResponse | null>(null);
  const { toast } = useToast();

  const handleCreateDemoData = async () => {
    if (formData.teacherCount < 1 || formData.teacherCount > 50) {
      toast({
        title: "Invalid Input",
        description: "Teacher count must be between 1 and 50.",
        variant: "destructive"
      });
      return;
    }

    if (formData.supportRequestCount < 1 || formData.supportRequestCount > 100) {
      toast({
        title: "Invalid Input",
        description: "Support request count must be between 1 and 100.",
        variant: "destructive"
      });
      return;
    }

    setCreating(true);
    try {
      const response = await backend.admin.createDemoData(formData);
      setLastResult(response);
      toast({
        title: "Demo Data Created",
        description: response.message
      });
    } catch (error) {
      console.error('Error creating demo data:', error);
      toast({
        title: "Error",
        description: "Failed to create demo data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const handleClearDemoData = async () => {
    setClearing(true);
    try {
      const response = await backend.admin.clearDemoData();
      setLastResult(response);
      toast({
        title: "Demo Data Cleared",
        description: response.message
      });
    } catch (error) {
      console.error('Error clearing demo data:', error);
      toast({
        title: "Error",
        description: "Failed to clear demo data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Demo Data Management</h1>
            <p className="text-gray-600">Create or clear demo data for testing and demonstrations</p>
          </div>
          <Link to="/admin">
            <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl">
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Warning Alert */}
        <Alert className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Important:</strong> Demo data operations affect the entire system. Use with caution in production environments.
            Demo data is identified by email addresses ending in ".demo" and support requests created by the admin account.
          </AlertDescription>
        </Alert>

        {/* Last Operation Result */}
        {lastResult && (
          <Alert className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Last Operation:</strong> {lastResult.message}
              {'teachersCreated' in lastResult && (
                <div className="mt-2 text-sm">
                  <div>Teachers created: {lastResult.teachersCreated}</div>
                  <div>Support requests created: {lastResult.supportRequestsCreated}</div>
                </div>
              )}
              {'teachersDeleted' in lastResult && (
                <div className="mt-2 text-sm">
                  <div>Teachers deleted: {lastResult.teachersDeleted}</div>
                  <div>Support requests deleted: {lastResult.supportRequestsDeleted}</div>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Create Demo Data */}
        <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white rounded-t-3xl">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                <Plus className="h-6 w-6" />
              </div>
              Create Demo Data
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="teacherCount" className="text-sm font-medium text-gray-700">
                  Number of Teachers (1-50)
                </Label>
                <Input
                  id="teacherCount"
                  type="number"
                  min="1"
                  max="50"
                  value={formData.teacherCount}
                  onChange={(e) => setFormData(prev => ({ ...prev, teacherCount: parseInt(e.target.value) || 1 }))}
                  className="border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-emerald-500"
                />
                <p className="text-xs text-gray-500">Demo teachers will be created with realistic names and assignments</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supportRequestCount" className="text-sm font-medium text-gray-700">
                  Number of Support Requests (1-100)
                </Label>
                <Input
                  id="supportRequestCount"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.supportRequestCount}
                  onChange={(e) => setFormData(prev => ({ ...prev, supportRequestCount: parseInt(e.target.value) || 1 }))}
                  className="border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-emerald-500"
                />
                <p className="text-xs text-gray-500">Support requests will be distributed among the demo teachers</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="schoolName" className="text-sm font-medium text-gray-700">
                  School Name
                </Label>
                <Input
                  id="schoolName"
                  value={formData.schoolName}
                  onChange={(e) => setFormData(prev => ({ ...prev, schoolName: e.target.value }))}
                  className="border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-emerald-500"
                />
                <p className="text-xs text-gray-500">Name for the demo school</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="schoolDistrict" className="text-sm font-medium text-gray-700">
                  School District
                </Label>
                <Input
                  id="schoolDistrict"
                  value={formData.schoolDistrict}
                  onChange={(e) => setFormData(prev => ({ ...prev, schoolDistrict: e.target.value }))}
                  className="border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-emerald-500"
                />
                <p className="text-xs text-gray-500">Name for the demo school district</p>
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                onClick={handleCreateDemoData}
                disabled={creating}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-xl rounded-2xl py-4 px-8 text-lg font-semibold transition-all duration-200 transform hover:scale-105"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Creating Demo Data...
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5 mr-2" />
                    Create Demo Data
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Clear Demo Data */}
        <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 text-white rounded-t-3xl">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                <Trash2 className="h-6 w-6" />
              </div>
              Clear Demo Data
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-r from-red-100 to-pink-100 rounded-3xl flex items-center justify-center mx-auto">
                <Database className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Remove All Demo Data</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  This will permanently delete all demo teachers (emails ending in .demo) and support requests created by the admin account.
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <Alert className="border-red-200 bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 text-sm">
                <strong>Warning:</strong> This operation will permanently delete all demo data. Make sure you want to proceed before clicking the button below.
              </AlertDescription>
            </Alert>

            <div className="flex justify-center">
              <Button
                onClick={handleClearDemoData}
                disabled={clearing}
                variant="destructive"
                className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-xl rounded-2xl py-4 px-8 text-lg font-semibold transition-all duration-200 transform hover:scale-105"
              >
                {clearing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Clearing Demo Data...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-5 w-5 mr-2" />
                    Clear All Demo Data
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Demo Data Info */}
        <Card className="border-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded-t-3xl">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                <Database className="h-6 w-6" />
              </div>
              Demo Data Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-blue-500" />
                  <h4 className="font-medium text-gray-900">Demo Teachers</h4>
                </div>
                <ul className="space-y-2 text-sm text-gray-600 ml-8">
                  <li>• Realistic teacher names and assignments</li>
                  <li>• Various grade levels and subjects</li>
                  <li>• Active subscriptions for 1 year</li>
                  <li>• Email addresses ending in .demo</li>
                </ul>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-green-500" />
                  <h4 className="font-medium text-gray-900">Demo Support Requests</h4>
                </div>
                <ul className="space-y-2 text-sm text-gray-600 ml-8">
                  <li>• Realistic student scenarios</li>
                  <li>• Various concern types and severity levels</li>
                  <li>• Distributed across demo teachers</li>
                  <li>• Created over the past 30 days</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
