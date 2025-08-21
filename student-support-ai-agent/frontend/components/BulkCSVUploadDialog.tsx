import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Loader2, Upload, Download, AlertTriangle, CheckCircle, FileText, X, Users } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';
import type { BulkCSVUploadResult } from '~backend/admin/bulk-csv-upload';

interface BulkCSVUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkCSVUploadDialog({ isOpen, onClose, onSuccess }: BulkCSVUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<BulkCSVUploadResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a CSV file.",
        variant: "destructive"
      });
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File Too Large",
        description: "Please select a CSV file smaller than 5MB.",
        variant: "destructive"
      });
      return;
    }

    setFile(selectedFile);
    setUploadResult(null);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please select a CSV file to upload.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      // Read file as base64
      const fileContent = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove the data URL prefix to get just the base64 content
          const base64Content = result.split(',')[1];
          resolve(base64Content);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await backend.admin.bulkCSVUpload({
        csvData: fileContent,
        filename: file.name
      });

      setUploadResult(response);
      
      if (response.success) {
        toast({
          title: "Upload Successful",
          description: response.summary
        });
        onSuccess();
      } else {
        toast({
          title: "Upload Completed with Errors",
          description: response.summary,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error uploading CSV:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to upload CSV file.";
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvTemplate = `name,email,password,school name,school district,primary grade,primary subject,teacher type,subscription end date,support requests limit
John Smith,john.smith@school.edu,password123,Lincoln Elementary,Springfield District,3rd,Mathematics,classroom,2025-12-31,20
Jane Doe,jane.doe@school.edu,password456,Lincoln Elementary,Springfield District,4th,English,classroom,2025-12-31,25
Mike Johnson,mike.johnson@school.edu,password789,Lincoln Elementary,Springfield District,K-5,Art,specialist,2025-12-31,15`;

    const blob = new Blob([csvTemplate], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'teacher-import-template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Template Downloaded",
      description: "CSV template has been downloaded to your computer."
    });
  };

  const handleClose = () => {
    setFile(null);
    setUploadResult(null);
    setDragOver(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const removeFile = () => {
    setFile(null);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-600" />
            Bulk Upload Teachers
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file to add multiple teachers at once. Download the template to see the required format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Download */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-blue-900 mb-1">CSV Template</h4>
                <p className="text-sm text-blue-700">Download the template to see the required format and example data.</p>
              </div>
              <Button
                onClick={handleDownloadTemplate}
                variant="outline"
                size="sm"
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>
          </div>

          {/* File Upload Area */}
          <div className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragOver
                  ? 'border-blue-500 bg-blue-50'
                  : file
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {file ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center">
                    <FileText className="h-12 w-12 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium text-green-800">{file.name}</p>
                    <p className="text-sm text-green-600">
                      {(file.size / 1024).toFixed(1)} KB • Ready to upload
                    </p>
                  </div>
                  <Button
                    onClick={removeFile}
                    variant="outline"
                    size="sm"
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove File
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-center">
                    <Upload className="h-12 w-12 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      Drop your CSV file here
                    </p>
                    <p className="text-sm text-gray-500">
                      or click to browse files
                    </p>
                  </div>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Processing CSV file...</span>
              </div>
              <Progress value={undefined} className="h-2" />
            </div>
          )}

          {/* Upload Results */}
          {uploadResult && (
            <div className="space-y-4">
              <Alert className={`border-2 rounded-xl ${uploadResult.success ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
                {uploadResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                )}
                <AlertDescription className={uploadResult.success ? 'text-green-800' : 'text-amber-800'}>
                  <strong>Upload Results:</strong>
                  <br />
                  {uploadResult.summary}
                </AlertDescription>
              </Alert>

              {/* Success Summary */}
              {uploadResult.successfulImports > 0 && (
                <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-800">Successfully Imported</span>
                  </div>
                  <p className="text-sm text-green-700">
                    {uploadResult.successfulImports} teacher{uploadResult.successfulImports === 1 ? '' : 's'} added to the system
                  </p>
                </div>
              )}

              {/* Errors */}
              {uploadResult.errors.length > 0 && (
                <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="font-medium text-red-800">Errors ({uploadResult.errors.length})</span>
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-2">
                    {uploadResult.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-700 bg-red-100 p-2 rounded">
                        <strong>Row {error.row}:</strong> {error.error}
                        {error.email && <span className="block text-xs">Email: {error.email}</span>}
                        {error.name && <span className="block text-xs">Name: {error.name}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Duplicate Emails */}
              {uploadResult.duplicateEmails.length > 0 && (
                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium text-yellow-800">Duplicate Emails</span>
                  </div>
                  <p className="text-sm text-yellow-700 mb-2">
                    These emails already exist in the system:
                  </p>
                  <div className="text-xs text-yellow-600 space-y-1">
                    {uploadResult.duplicateEmails.map((email, index) => (
                      <div key={index} className="font-mono">{email}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CSV Format Information */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">CSV Format Requirements</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• <strong>Required columns:</strong> name, email</li>
              <li>• <strong>Optional columns:</strong> password, school name, school district, primary grade, primary subject, teacher type, subscription end date, support requests limit</li>
              <li>• If password is not provided, a random password will be generated</li>
              <li>• Subscription end date format: YYYY-MM-DD (defaults to 1 year from now)</li>
              <li>• Support requests limit: number between 1-100 (defaults to 20)</li>
              <li>• Teacher type: classroom, specialist, or support (defaults to classroom)</li>
              <li>• Maximum file size: 5MB</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          {uploadResult ? (
            <Button onClick={handleClose} className="w-full rounded-xl">
              Close
            </Button>
          ) : (
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isUploading}
                className="flex-1 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload CSV
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
