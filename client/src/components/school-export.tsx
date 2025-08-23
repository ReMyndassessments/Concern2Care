import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  School, 
  Download, 
  FileText, 
  Building2,
  Users,
  AlertCircle,
  Search,
  Filter,
  Grid3X3,
  List,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  ArrowUpDown,
  Calendar,
  Activity
} from "lucide-react";

interface SchoolExportInfo {
  name: string;
  teacherCount?: number;
  concernCount?: number;
  lastActivity?: string;
  state?: string;
  district?: string;
}

type ViewMode = 'grid' | 'table';
type SortField = 'name' | 'teacherCount' | 'concernCount' | 'lastActivity';
type SortDirection = 'asc' | 'desc';

export default function SchoolExport() {
  const { toast } = useToast();
  const [schools, setSchools] = useState<SchoolExportInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState<string | null>(null);
  
  // Search and filtering state
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedSchools, setSelectedSchools] = useState<Set<string>>(new Set());
  const [bulkExporting, setBulkExporting] = useState(false);
  
  // Filters
  const [minTeachers, setMinTeachers] = useState<string>("");
  const [maxTeachers, setMaxTeachers] = useState<string>("");
  const [activityFilter, setActivityFilter] = useState<string>("all"); // all, active, inactive
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    try {
      setLoading(true);
      const response = await apiRequest("/api/admin/export/schools");
      const schoolNames = response.schools || [];
      
      // Convert school names to school objects with mock data for demonstration
      setSchools(schoolNames.map((name: string, index: number) => ({ 
        name, 
        teacherCount: Math.floor(Math.random() * 50) + 5, // Random 5-55 teachers
        concernCount: Math.floor(Math.random() * 200) + 10, // Random concerns
        lastActivity: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Random last 30 days
        state: index % 2 === 0 ? 'CA' : 'NY', // Sample states
        district: index % 2 === 0 ? 'San Diego Unified' : 'New York City DOE' // Sample districts
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

  // Filtered and sorted schools
  const filteredAndSortedSchools = useMemo(() => {
    let filtered = schools.filter(school => {
      // Search filter
      if (searchQuery && !school.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Teacher count filters
      if (minTeachers && school.teacherCount && school.teacherCount < parseInt(minTeachers)) {
        return false;
      }
      if (maxTeachers && school.teacherCount && school.teacherCount > parseInt(maxTeachers)) {
        return false;
      }
      
      // Activity filter
      if (activityFilter !== "all" && school.lastActivity) {
        const daysSinceActivity = Math.floor((Date.now() - new Date(school.lastActivity).getTime()) / (1000 * 60 * 60 * 24));
        if (activityFilter === "active" && daysSinceActivity > 7) return false;
        if (activityFilter === "inactive" && daysSinceActivity <= 7) return false;
      }
      
      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortField) {
        case 'teacherCount':
          aVal = a.teacherCount || 0;
          bVal = b.teacherCount || 0;
          break;
        case 'concernCount':
          aVal = a.concernCount || 0;
          bVal = b.concernCount || 0;
          break;
        case 'lastActivity':
          aVal = a.lastActivity ? new Date(a.lastActivity).getTime() : 0;
          bVal = b.lastActivity ? new Date(b.lastActivity).getTime() : 0;
          break;
        default:
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [schools, searchQuery, minTeachers, maxTeachers, activityFilter, sortField, sortDirection]);

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSchools(new Set(filteredAndSortedSchools.map(s => s.name)));
    } else {
      setSelectedSchools(new Set());
    }
  };

  const handleSelectSchool = (schoolName: string, checked: boolean) => {
    const newSelected = new Set(selectedSchools);
    if (checked) {
      newSelected.add(schoolName);
    } else {
      newSelected.delete(schoolName);
    }
    setSelectedSchools(newSelected);
  };

  // Bulk export handler
  const handleBulkExport = async (format: 'csv' | 'json' = 'csv') => {
    if (selectedSchools.size === 0) {
      toast({
        title: "No schools selected",
        description: "Please select at least one school to export",
        variant: "destructive"
      });
      return;
    }

    setBulkExporting(true);
    try {
      const schoolNames = Array.from(selectedSchools);
      
      for (const schoolName of schoolNames) {
        await handleExportSchool(schoolName, format, false); // false = don't show individual toasts
      }
      
      toast({
        title: "Bulk export completed",
        description: `Successfully exported data for ${schoolNames.length} schools`,
      });
      
      setSelectedSchools(new Set()); // Clear selections
    } catch (error) {
      toast({
        title: "Bulk export failed",
        description: "Some exports may have failed. Please check individual schools.",
        variant: "destructive"
      });
    } finally {
      setBulkExporting(false);
    }
  };

  const handleExportSchool = async (schoolName: string, format: 'csv' | 'json' = 'csv', showToast: boolean = true) => {
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
      
      if (showToast) {
        toast({
          title: "Success",
          description: `School data exported successfully for ${schoolName}`
        });
      }
    } catch (error: any) {
      console.error('School export error:', error);
      if (showToast) {
        toast({
          title: "Error",
          description: error.message || "Failed to export school data",
          variant: "destructive"
        });
      }
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
            <Badge variant="secondary" className="ml-auto">
              {filteredAndSortedSchools.length} of {schools.length} schools
            </Badge>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Export all teacher data and concerns by school. Use search and filters to manage large school lists efficiently.
          </p>
        </CardHeader>
      </Card>

      {/* Search and Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Search and View Toggle */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search schools by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-schools"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  data-testid="button-toggle-filters"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {showFilters ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
                </Button>
                
                <div className="flex rounded-md border">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-r-none"
                    data-testid="button-view-grid"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                    className="rounded-l-none"
                    data-testid="button-view-table"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="text-sm font-medium mb-2 block">Teacher Count Range</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Min"
                      value={minTeachers}
                      onChange={(e) => setMinTeachers(e.target.value)}
                      type="number"
                      className="text-sm"
                      data-testid="input-min-teachers"
                    />
                    <Input
                      placeholder="Max"
                      value={maxTeachers}
                      onChange={(e) => setMaxTeachers(e.target.value)}
                      type="number"
                      className="text-sm"
                      data-testid="input-max-teachers"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Activity Level</label>
                  <Select value={activityFilter} onValueChange={setActivityFilter}>
                    <SelectTrigger data-testid="select-activity-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Schools</SelectItem>
                      <SelectItem value="active">Active (last 7 days)</SelectItem>
                      <SelectItem value="inactive">Inactive (7+ days)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Sort By</label>
                  <div className="flex gap-2">
                    <Select value={sortField} onValueChange={(value: SortField) => setSortField(value)}>
                      <SelectTrigger data-testid="select-sort-field">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">School Name</SelectItem>
                        <SelectItem value="teacherCount">Teacher Count</SelectItem>
                        <SelectItem value="concernCount">Concern Count</SelectItem>
                        <SelectItem value="lastActivity">Last Activity</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                      data-testid="button-sort-direction"
                    >
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Bulk Actions */}
            {selectedSchools.size > 0 && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium text-blue-800">
                  {selectedSchools.size} school{selectedSchools.size > 1 ? 's' : ''} selected
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkExport('csv')}
                    disabled={bulkExporting}
                    data-testid="button-bulk-export-csv"
                  >
                    {bulkExporting ? (
                      <>
                        <div className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full mr-2" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Export All CSV
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkExport('json')}
                    disabled={bulkExporting}
                    data-testid="button-bulk-export-json"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Export All JSON
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedSchools(new Set())}
                    data-testid="button-clear-selection"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          School exports include all teacher data, student concerns, AI-generated interventions, and progress notes. 
          Please ensure you have proper authorization to export this data and handle it according to FERPA guidelines.
        </AlertDescription>
      </Alert>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Select All Checkbox */}
          {filteredAndSortedSchools.length > 0 && (
            <div className="col-span-full mb-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedSchools.size === filteredAndSortedSchools.length && filteredAndSortedSchools.length > 0}
                  onCheckedChange={handleSelectAll}
                  data-testid="checkbox-select-all"
                />
                <span className="text-sm text-gray-600">
                  Select all ({filteredAndSortedSchools.length} schools)
                </span>
              </div>
            </div>
          )}
          
          {filteredAndSortedSchools.map((school) => (
            <Card key={school.name} className="relative">
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* School Header with Checkbox */}
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      checked={selectedSchools.has(school.name)}
                      onCheckedChange={(checked) => handleSelectSchool(school.name, checked as boolean)}
                      className="mt-1"
                      data-testid={`checkbox-school-${school.name.replace(/\s+/g, '-')}`}
                    />
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm md:text-base line-clamp-2" title={school.name}>
                        {school.name}
                      </h3>
                      
                      <div className="space-y-1 mt-2">
                        <div className="flex items-center space-x-1">
                          <Building2 className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">{school.state || 'N/A'}</span>
                        </div>
                        
                        {school.teacherCount !== undefined && (
                          <div className="flex items-center space-x-1">
                            <Users className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {school.teacherCount} teachers
                            </span>
                          </div>
                        )}
                        
                        {school.concernCount !== undefined && (
                          <div className="flex items-center space-x-1">
                            <FileText className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {school.concernCount} concerns
                            </span>
                          </div>
                        )}
                        
                        {school.lastActivity && (
                          <div className="flex items-center space-x-1">
                            <Activity className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              Last active: {new Date(school.lastActivity).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
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
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="hover:bg-gray-50">
                    <th className="text-left p-4">
                      <Checkbox
                        checked={selectedSchools.size === filteredAndSortedSchools.length && filteredAndSortedSchools.length > 0}
                        onCheckedChange={handleSelectAll}
                        data-testid="checkbox-select-all-table"
                      />
                    </th>
                    <th className="text-left p-4 font-medium">School Name</th>
                    <th className="text-left p-4 font-medium">Teachers</th>
                    <th className="text-left p-4 font-medium">Concerns</th>
                    <th className="text-left p-4 font-medium">Last Activity</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedSchools.map((school) => (
                    <tr key={school.name} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <Checkbox
                          checked={selectedSchools.has(school.name)}
                          onCheckedChange={(checked) => handleSelectSchool(school.name, checked as boolean)}
                          data-testid={`checkbox-school-table-${school.name.replace(/\s+/g, '-')}`}
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium">{school.name}</div>
                            <div className="text-xs text-gray-500">{school.state || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="secondary">
                          {school.teacherCount || 0}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">
                          {school.concernCount || 0}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-gray-600">
                          {school.lastActivity ? new Date(school.lastActivity).toLocaleDateString() : 'No activity'}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExportSchool(school.name, 'csv')}
                            disabled={exportLoading === school.name}
                            data-testid={`button-export-table-csv-${school.name.replace(/\s+/g, '-')}`}
                          >
                            {exportLoading === school.name ? (
                              <div className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full" />
                            ) : (
                              <Download className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExportSchool(school.name, 'json')}
                            disabled={exportLoading === school.name}
                            data-testid={`button-export-table-json-${school.name.replace(/\s+/g, '-')}`}
                          >
                            <FileText className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredAndSortedSchools.length === 0 && (
                <div className="text-center py-12">
                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No schools found</h3>
                  <p className="text-gray-500 text-sm">
                    Try adjusting your search or filter criteria.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}