"use client";

import React from "react";
import { Camera, Upload, X, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/profile&image/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useImageCompression } from "@/hooks/use-image-compression";
import { formatFileSize } from "@/types/image-compression";

interface PhotoUploadDialogProps {
  currentPhotoUrl?: string;
  userInitials: string;
  onUpload: (file: File) => Promise<void>;
  loading?: boolean;
  useCompression?: boolean;
}

export function PhotoUploadDialog({
  currentPhotoUrl,
  userInitials,
  onUpload,
  loading = false,
  useCompression = true,
}: PhotoUploadDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [compressionStats, setCompressionStats] = React.useState<{
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
  } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const {
    compressImage,
    isCompressing,
    progress,
    error: compressionError
  } = useImageCompression({
    preset: "avatar",
    onSuccess: (result) => {
      setSelectedFile(result.file);
      setPreviewUrl(result.dataUrl || '');
      setCompressionStats({
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        compressionRatio: result.compressionRatio
      });
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 10MB for initial upload)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    if (useCompression) {
      // Use compression
      await compressImage(file);
    } else {
      // Use original file without compression
      setSelectedFile(file);
      setCompressionStats(null);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      await onUpload(selectedFile);
      setOpen(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setCompressionStats(null);
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setCompressionStats(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="secondary"
          className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
          disabled={loading || isCompressing}
        >
          <Camera className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Profile Photo</DialogTitle>
          <DialogDescription>
            Choose a new profile photo. {useCompression ? 'Images will be automatically compressed and optimized.' : 'The image should be less than 2MB.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current/Preview Photo */}
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarImage
                src={previewUrl || currentPhotoUrl || ""}
                alt="Profile preview"
              />
              <AvatarFallback className="text-lg">
                {userInitials}
              </AvatarFallback>
            </Avatar>

            {selectedFile && (
              <div className="text-sm text-muted-foreground text-center space-y-2">
                <p className="font-medium">{selectedFile.name}</p>
                <div className="flex items-center justify-center gap-2">
                  <span>{formatFileSize(selectedFile.size)}</span>
                  {compressionStats && compressionStats.compressionRatio > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      <Archive className="h-3 w-3 mr-1" />
                      {compressionStats.compressionRatio}% saved
                    </Badge>
                  )}
                </div>
                {compressionStats && (
                  <p className="text-xs">
                    Original: {formatFileSize(compressionStats.originalSize)} → Compressed: {formatFileSize(compressionStats.compressedSize)}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Compression Progress */}
          {isCompressing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Compressing...</span>
                <span className="text-xs text-muted-foreground">{progress.percentage}%</span>
              </div>
              <Progress value={progress.percentage} className="h-2" />
            </div>
          )}

          {/* Error Display */}
          {compressionError && (
            <div className="text-sm text-red-500 text-center">
              {compressionError}
            </div>
          )}

          {/* File Input */}
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="photo-upload"
              disabled={loading || isCompressing}
            />
            <label htmlFor="photo-upload">
              <Button
                variant="outline"
                className="w-full cursor-pointer"
                type="button"
                asChild
                disabled={loading || isCompressing}
              >
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  {isCompressing ? 'Compressing...' : 'Choose Image'}
                </div>
              </Button>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {selectedFile && (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1"
                  disabled={loading || isCompressing}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  className="flex-1"
                  disabled={loading || isCompressing}
                >
                  {loading ? "Uploading..." : isCompressing ? "Compressing..." : "Upload"}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}