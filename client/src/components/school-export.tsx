import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  School, 
  Download, 
  FileText, 
  Building2,
  Users,
  AlertCircle
} from "lucide-react";

interface SchoolExportInfo {
  name: string;
  teacherCount?: number;
}

export default function SchoolExport() {
  const { toast } = useToast();
  const [schools, setSchools] = useState<SchoolExportInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState<string | null>(null);

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    try {
      setLoading(true);
      const response = await apiRequest("/api/admin/export/schools");
      const schoolNames = response.schools || [];
      
      // Convert school names to school objects
      setSchools(schoolNames.map((name: string) => ({ 
        name, 
        teacherCount: undefined // We could enhance this later with teacher counts
      })));
    } catch (error: any) {
      console.error("Error loading schools:", error);
      toast({
        title: "Error",
        description: "Failed to load schools for export",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportSchool = async (schoolName: string, format: 'csv' | 'json' = 'csv') => {
    try {
      setExportLoading(schoolName);
      
      const encodedSchoolName = encodeURIComponent(schoolName);
      const response = await fetch(`/api/admin/export/school/${encodedSchoolName}?format=${format}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Export failed');
      }

      const blob = await response.blob();
      const schoolFileName = schoolName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
      const filename = `school_export_${schoolFileName}_${new Date().toISOString().split('T')[0]}.${format}`;
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: `School data exported successfully for ${schoolName}`
      });
    } catch (error: any) {
      console.error('School export error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to export school data",
        variant: "destructive"
      });
    } finally {
      setExportLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  if (schools.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Schools Found</h3>
            <p className="text-gray-500 text-sm">
              No schools with active teachers found for export.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <School className="h-5 w-5" />
            <span>School Data Export</span>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Export all teacher data and concerns by school. Each export includes all teachers, their concerns, interventions, and progress notes.
          </p>
        </CardHeader>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          School exports include all teacher data, student concerns, AI-generated interventions, and progress notes. 
          Please ensure you have proper authorization to export this data and handle it according to FERPA guidelines.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {schools.map((school) => (
          <Card key={school.name} className="relative">
            <CardContent className="p-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-sm md:text-base line-clamp-2" title={school.name}>
                    {school.name}
                  </h3>
                  <div className="flex items-center space-x-1 mt-1">
                    <Building2 className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-500">School</span>
                  </div>
                  {school.teacherCount !== undefined && (
                    <div className="flex items-center space-x-1 mt-1">
                      <Users className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {school.teacherCount} teachers
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportSchool(school.name, 'csv')}
                    disabled={exportLoading === school.name}
                    className="w-full text-xs"
                    data-testid={`button-export-school-csv-${school.name.replace(/\s+/g, '-')}`}
                  >
                    {exportLoading === school.name ? (
                      <>
                        <div className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full mr-2" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="h-3 w-3 mr-2" />
                        Export CSV
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportSchool(school.name, 'json')}
                    disabled={exportLoading === school.name}
                    className="w-full text-xs"
                    data-testid={`button-export-school-json-${school.name.replace(/\s+/g, '-')}`}
                  >
                    {exportLoading === school.name ? (
                      <>
                        <div className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full mr-2" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <FileText className="h-3 w-3 mr-2" />
                        Export JSON
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}