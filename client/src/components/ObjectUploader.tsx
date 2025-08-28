import { useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ObjectUploaderProps {
  maxFileSize?: number;
  acceptedFileTypes?: string[];
  onFileUploaded?: (fileUrl: string, fileName: string) => void;
  buttonClassName?: string;
  children?: ReactNode;
  currentFile?: string;
  onFileRemoved?: () => void;
  disabled?: boolean;
}

/**
 * A simple file upload component for uploading documents to object storage.
 * 
 * Features:
 * - File selection and validation
 * - Upload progress indication
 * - File preview/display
 * - Remove uploaded file option
 */
export function ObjectUploader({
  maxFileSize = 10485760, // 10MB default
  acceptedFileTypes = ['.pdf', '.doc', '.docx', '.txt'],
  onFileUploaded,
  onFileRemoved,
  buttonClassName,
  children,
  currentFile,
  disabled = false,
}: ObjectUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  // Generate unique ID for this uploader instance to avoid conflicts
  const uploaderId = useState(() => `uploader-${Math.random().toString(36).substr(2, 9)}`)[0];

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxFileSize) {
      toast({
        title: "File too large",
        description: `Please select a file smaller than ${Math.round(maxFileSize / 1024 / 1024)}MB`,
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedFileTypes.includes(fileExtension)) {
      toast({
        title: "Invalid file type",
        description: `Please select a file with one of these extensions: ${acceptedFileTypes.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);

      // Get upload URL from backend
      const uploadResponse = await apiRequest("POST", "/api/objects/upload");
      const uploadUrl = uploadResponse.uploadURL;

      // Upload file directly to object storage
      // Don't set Content-Type header - let the browser set it automatically
      // This avoids CORS issues with signed URLs
      const uploadFileResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
      });

      if (!uploadFileResponse.ok) {
        throw new Error('Upload failed');
      }

      // Extract the object path from the upload URL
      const fileUrl = uploadUrl.split('?')[0]; // Remove query parameters
      
      toast({
        title: "File uploaded successfully",
        description: `${file.name} has been uploaded`,
      });

      onFileUploaded?.(fileUrl, file.name);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset the input
      event.target.value = '';
    }
  };

  const handleRemoveFile = () => {
    onFileRemoved?.();
    toast({
      title: "File removed",
      description: "The uploaded file has been removed",
    });
  };

  if (currentFile) {
    return (
      <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-md">
        <FileText className="h-4 w-4 text-green-600" />
        <span className="text-sm text-green-700 flex-1">File uploaded</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleRemoveFile}
          disabled={disabled}
          className="h-6 w-6 p-0 text-green-600 hover:text-green-800"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div>
      <input
        type="file"
        id={uploaderId}
        className="hidden"
        accept={acceptedFileTypes.join(',')}
        onChange={handleFileSelect}
        disabled={uploading || disabled}
      />
      <label htmlFor={uploaderId}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={buttonClassName}
          disabled={uploading || disabled}
          asChild
        >
          <span className="cursor-pointer">
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                {children || "Upload File"}
              </>
            )}
          </span>
        </Button>
      </label>
    </div>
  );
}