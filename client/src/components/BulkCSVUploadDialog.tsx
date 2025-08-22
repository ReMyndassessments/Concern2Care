import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface BulkCSVUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface UploadResult {
  success: boolean;
  totalRows: number;
  successfulImports: number;
  errors: Array<{
    row: number;
    email?: string;
    name?: string;
    error: string;
  }>;
  duplicateEmails: string[];
  summary: string;
}

export function BulkCSVUploadDialog({ open, onOpenChange, onSuccess }: BulkCSVUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const resetDialog = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setUploading(false);
    setDragOver(false);
  };

  const handleFileSelect = (file: File) => {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a CSV file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File Too Large",
        description: "File size must be less than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setUploadResult(null);
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      // Convert file to base64
      const fileContent = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(selectedFile);
      });

      // Convert to base64 for API
      const base64Content = btoa(fileContent);

      const result = await apiRequest('/api/admin/teachers/bulk-csv-upload', {
        method: 'POST',
        body: JSON.stringify({
          csvData: base64Content,
          filename: selectedFile.name,
        }),
      });

      setUploadResult(result);

      if (result.success) {
        toast({
          title: "Upload Successful",
          description: result.summary,
        });
        if (onSuccess) onSuccess();
      } else {
        toast({
          title: "Upload Completed with Errors",
          description: result.summary,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "An error occurred while uploading the file.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadSampleCSV = () => {
    const sampleData = [
      ['Name', 'Email', 'School Name', 'Support Requests Limit', 'Password'],
      ['John Doe', 'john.doe@school.edu', 'Sample Elementary', '25', 'temp123'],
      ['Jane Smith', 'jane.smith@school.edu', 'Sample Middle School', '30', 'temp456'],
      ['Bob Johnson', 'bob.johnson@school.edu', 'Sample High School', '20', 'temp789'],
    ];

    const csvContent = sampleData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'teacher_import_sample.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    resetDialog();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl" data-testid="csv-upload-dialog">
        <DialogHeader>
          <DialogTitle>Bulk Import Teachers from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to import multiple teachers at once. Required columns: Name, Email.
          </DialogDescription>
        </DialogHeader>

        {!uploadResult ? (
          <div className="space-y-6">
            {/* Sample CSV Download */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Need a sample CSV?</h4>
                    <p className="text-sm text-gray-600">Download a sample CSV file with the correct format.</p>
                  </div>
                  <Button variant="outline" onClick={downloadSampleCSV} data-testid="button-download-sample">
                    <Download className="mr-2 h-4 w-4" />
                    Sample CSV
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* File Upload Area */}
            <div>
              <Label>CSV File</Label>
              <div
                className={`mt-2 border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                data-testid="file-drop-zone"
              >
                {selectedFile ? (
                  <div className="space-y-2">
                    <FileText className="mx-auto h-8 w-8 text-green-600" />
                    <div className="text-sm font-medium">{selectedFile.name}</div>
                    <div className="text-xs text-gray-500">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                      data-testid="button-remove-file"
                    >
                      Remove file
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="mx-auto h-8 w-8 text-gray-400" />
                    <div className="text-sm">
                      <span className="font-medium">Click to upload</span> or drag and drop
                    </div>
                    <div className="text-xs text-gray-500">CSV files only, max 5MB</div>
                  </div>
                )}
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileInputChange}
                className="hidden"
                data-testid="file-input"
              />
              
              {!selectedFile && (
                <Button
                  variant="outline"
                  className="mt-2 w-full"
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="button-browse-files"
                >
                  Browse Files
                </Button>
              )}
            </div>

            {/* CSV Format Info */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Required columns:</strong> Name, Email
                <br />
                <strong>Optional columns:</strong> School Name, Support Requests Limit, Password
                <br />
                If Password is not provided, a random password will be generated.
              </AlertDescription>
            </Alert>

            {/* Upload Progress */}
            {uploading && (
              <div className="space-y-2" data-testid="upload-progress">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading and processing...</span>
                </div>
                <Progress className="w-full" />
              </div>
            )}
          </div>
        ) : (
          /* Upload Results */
          <div className="space-y-4" data-testid="upload-results">
            <div className="flex items-center gap-3">
              {uploadResult.success ? (
                <CheckCircle className="h-8 w-8 text-green-600" />
              ) : (
                <XCircle className="h-8 w-8 text-red-600" />
              )}
              <div>
                <h3 className="font-medium">
                  {uploadResult.success ? 'Import Completed Successfully' : 'Import Completed with Issues'}
                </h3>
                <p className="text-sm text-gray-600">{uploadResult.summary}</p>
              </div>
            </div>

            {/* Results Summary */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{uploadResult.totalRows}</div>
                  <div className="text-sm text-gray-600">Total Rows</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{uploadResult.successfulImports}</div>
                  <div className="text-sm text-gray-600">Successful</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{uploadResult.errors.length}</div>
                  <div className="text-sm text-gray-600">Errors</div>
                </CardContent>
              </Card>
            </div>

            {/* Duplicate Emails */}
            {uploadResult.duplicateEmails.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Duplicate emails found:</strong>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {uploadResult.duplicateEmails.map((email, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {email}
                      </Badge>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Error Details */}
            {uploadResult.errors.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Error Details:</h4>
                <div className="max-h-40 overflow-y-auto space-y-2" data-testid="error-list">
                  {uploadResult.errors.map((error, index) => (
                    <div key={index} className="text-sm p-2 bg-red-50 border border-red-200 rounded">
                      <div className="font-medium">Row {error.row}: {error.name || 'Unknown'} ({error.email || 'No email'})</div>
                      <div className="text-red-600">{error.error}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose} data-testid="button-close">
            {uploadResult ? 'Close' : 'Cancel'}
          </Button>
          {!uploadResult && (
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              data-testid="button-upload"
            >
              {uploading ? 'Uploading...' : 'Upload CSV'}
            </Button>
          )}
          {uploadResult && !uploadResult.success && (
            <Button
              onClick={() => {
                setUploadResult(null);
                setSelectedFile(null);
              }}
              data-testid="button-try-again"
            >
              Try Again
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}