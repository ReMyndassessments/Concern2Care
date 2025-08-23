import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Download, UserX, Building, Shield, FileDown } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface DeletionImpact {
  school?: {
    name: string;
    id: string;
  };
  user?: {
    name: string;
    email: string;
    school: string;
  };
  affectedUsers?: number;
  totalConcerns: number;
  totalInterventions: number;
  totalReports: number;
  warnings: string[];
}

export function DeletionSafetyDemo() {
  const { toast } = useToast();
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('demo-school-123');
  const [selectedUserId, setSelectedUserId] = useState<string>('teacher-001');
  const [showSchoolImpact, setShowSchoolImpact] = useState(false);
  const [showUserImpact, setShowUserImpact] = useState(false);

  // Mock data for demonstration
  const mockSchoolImpact: DeletionImpact = {
    school: { name: "Washington High School", id: "demo-school-123" },
    affectedUsers: 5,
    totalConcerns: 28,
    totalInterventions: 45,
    totalReports: 12,
    warnings: [
      "5 teacher accounts will be affected",
      "28 student concerns will be lost",
      "45 AI interventions will be lost", 
      "12 generated reports will be lost",
      "All school email configurations will be removed",
      "All school feature settings will be lost"
    ]
  };

  const mockUserImpact: DeletionImpact = {
    user: { name: "Noel Roberts", email: "noel.roberts@school.edu", school: "Washington High School" },
    totalConcerns: 8,
    totalInterventions: 12,
    totalReports: 3,
    warnings: [
      "8 student concerns will be lost",
      "12 AI interventions will be lost",
      "3 generated reports will be lost",
      "All progress notes created by this teacher will be lost",
      "Personal email configuration will be removed",
      "All activity logs will remain for audit purposes"
    ]
  };

  const handleSchoolExport = () => {
    toast({
      title: "School Data Export",
      description: "Complete school data with all teachers and their work has been exported to JSON format.",
    });
  };

  const handleUserExport = () => {
    toast({
      title: "Teacher Data Export", 
      description: "Complete teacher data including all concerns, interventions, and reports has been exported.",
    });
  };

  const handleSoftDelete = (type: 'school' | 'user') => {
    toast({
      title: `${type === 'school' ? 'School' : 'Teacher'} Marked Inactive`,
      description: `Successfully marked as inactive. Data preserved and can be reactivated if needed.`,
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Shield className="h-6 w-6 text-blue-600" />
          Data Protection System Demo
        </h2>
        <p className="text-muted-foreground mt-2">
          Safe deletion with comprehensive data protection for schools and teachers
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* School Deletion Safety */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              School Cancellation Protection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              When a school cancels their subscription, protect valuable educational data:
            </p>
            
            <div className="space-y-2">
              <Button 
                variant="outline" 
                onClick={() => setShowSchoolImpact(!showSchoolImpact)}
                className="w-full"
                data-testid="button-analyze-school-impact"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Analyze Deletion Impact
              </Button>

              {showSchoolImpact && (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="space-y-3">
                    <div>
                      <strong>Impact for {mockSchoolImpact.school?.name}:</strong>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <Badge variant="secondary">{mockSchoolImpact.affectedUsers} Teachers</Badge>
                      <Badge variant="secondary">{mockSchoolImpact.totalConcerns} Concerns</Badge>
                      <Badge variant="secondary">{mockSchoolImpact.totalInterventions} Interventions</Badge>
                      <Badge variant="secondary">{mockSchoolImpact.totalReports} Reports</Badge>
                    </div>
                    <ul className="text-xs space-y-1">
                      {mockSchoolImpact.warnings.map((warning, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-orange-600 mt-1">•</span>
                          {warning}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Button 
                onClick={handleSchoolExport}
                className="w-full"
                data-testid="button-export-school"
              >
                <Download className="h-4 w-4 mr-2" />
                Export All School Data
              </Button>

              <Button 
                variant="secondary"
                onClick={() => handleSoftDelete('school')}
                className="w-full"
                data-testid="button-mark-school-inactive"
              >
                <UserX className="h-4 w-4 mr-2" />
                Mark School Inactive (Safe)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* User Deletion Safety */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserX className="h-5 w-5" />
              Teacher Departure Protection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              When teachers leave, ensure their valuable work is preserved:
            </p>
            
            <div className="space-y-2">
              <Button 
                variant="outline" 
                onClick={() => setShowUserImpact(!showUserImpact)}
                className="w-full"
                data-testid="button-analyze-user-impact"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Analyze Teacher Impact
              </Button>

              {showUserImpact && (
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertTriangle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="space-y-3">
                    <div>
                      <strong>Impact for {mockUserImpact.user?.name}:</strong>
                      <div className="text-xs text-muted-foreground">{mockUserImpact.user?.email}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <Badge variant="secondary">{mockUserImpact.totalConcerns} Concerns</Badge>
                      <Badge variant="secondary">{mockUserImpact.totalInterventions} Interventions</Badge>
                      <Badge variant="secondary">{mockUserImpact.totalReports} Reports</Badge>
                    </div>
                    <ul className="text-xs space-y-1">
                      {mockUserImpact.warnings.map((warning, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-blue-600 mt-1">•</span>
                          {warning}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Button 
                onClick={handleUserExport}
                className="w-full"
                data-testid="button-export-user"
              >
                <FileDown className="h-4 w-4 mr-2" />
                Export Teacher Data
              </Button>

              <Button 
                variant="secondary"
                onClick={() => handleSoftDelete('user')}
                className="w-full"
                data-testid="button-mark-user-inactive"
              >
                <UserX className="h-4 w-4 mr-2" />
                Mark Teacher Inactive (Safe)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Safety Features Summary */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-800 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Data Protection Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium text-green-800">Impact Analysis</h4>
              <ul className="space-y-1 text-green-700">
                <li>• Pre-deletion data assessment</li>
                <li>• Comprehensive warning system</li>
                <li>• Cascade effect analysis</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-green-800">Data Export</h4>
              <ul className="space-y-1 text-green-700">
                <li>• Complete JSON exports</li>
                <li>• All related records included</li>
                <li>• Structured for restoration</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-green-800">Soft Deletion</h4>
              <ul className="space-y-1 text-green-700">
                <li>• Mark inactive vs delete</li>
                <li>• Preserves all data</li>
                <li>• Reversible operations</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}