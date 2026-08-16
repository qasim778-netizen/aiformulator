import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SimpleImageUploaderProps {
  value?: string;
  onChange: (imageUrl: string) => void;
  onRemove: () => void;
  maxFileSize?: number;
  className?: string;
  isUploading?: boolean;
}

export function SimpleImageUploader({
  value,
  onChange,
  onRemove,
  maxFileSize = 5 * 1024 * 1024, // 5MB default
  className,
  isUploading = false
}: SimpleImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = async (file: File) => {
    if (file.size > maxFileSize) {
      alert(`File size must be less than ${Math.round(maxFileSize / 1024 / 1024)}MB`);
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "categories");
      const response = await fetch('/api/uploads/local', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to get upload URL');
      }
      
      const { objectPath } = await response.json();
      onChange(objectPath);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image. Please try again.');
    }
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input value so same file can be selected again
    event.target.value = '';
  };

  return (
    <div className={`space-y-4 ${className || ''}`}>
      {value ? (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              Image selected
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="h-6 w-6 p-0"
              disabled={isUploading}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          {(value.startsWith('/uploads/') || value.startsWith('/objects/') || value.startsWith('http')) && (
            <img
              src={value}
              alt="Category preview"
              className="h-16 w-16 object-cover rounded-lg border"
            />
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
            id="image-upload"
            disabled={isUploading}
          />
          <label htmlFor="image-upload">
            <Button
              type="button"
              variant="outline"
              className="w-full cursor-pointer"
              asChild
              disabled={isUploading}
            >
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                <span>{isUploading ? 'Uploading...' : 'Upload Category Image'}</span>
              </div>
            </Button>
          </label>
          <div className="text-xs text-muted-foreground">
            Upload an image for this category. Recommended size: 400x300px or larger. Max size: {Math.round(maxFileSize / 1024 / 1024)}MB.
          </div>
        </div>
      )}
    </div>
  );
}