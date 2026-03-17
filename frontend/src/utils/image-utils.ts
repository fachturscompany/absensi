/**
 * Utility functions for image operations and compression
 */

import { CompressionResult, formatFileSize } from '@/types/image-compression';

import { logger } from '@/lib/logger';
/**
 * Convert a File to base64 string
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Convert base64 string to File
 */
export const base64ToFile = async (
  dataUrl: string, 
  filename: string, 
  mimeType?: string
): Promise<File> => {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], filename, { type: mimeType || blob.type });
};

/**
 * Get image dimensions from File
 */
export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Validate image file
 */
export const validateImageFile = (
  file: File, 
  options: {
    maxSize?: number;
    allowedTypes?: string[];
    maxWidth?: number;
    maxHeight?: number;
  } = {}
): Promise<{ isValid: boolean; error?: string; dimensions?: { width: number; height: number } }> => {
  return new Promise(async (resolve) => {
    const {
      maxSize = 10 * 1024 * 1024, // 10MB default
      allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/bmp', 'image/gif'],
      maxWidth,
      maxHeight
    } = options;

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      resolve({
        isValid: false,
        error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
      });
      return;
    }

    // Check file size
    if (file.size > maxSize) {
      resolve({
        isValid: false,
        error: `File too large. Maximum size: ${formatFileSize(maxSize)}`
      });
      return;
    }

    // Check dimensions if specified
    if (maxWidth || maxHeight) {
      try {
        const dimensions = await getImageDimensions(file);
        
        if (maxWidth && dimensions.width > maxWidth) {
          resolve({
            isValid: false,
            error: `Image width too large. Maximum width: ${maxWidth}px`,
            dimensions
          });
          return;
        }
        
        if (maxHeight && dimensions.height > maxHeight) {
          resolve({
            isValid: false,
            error: `Image height too large. Maximum height: ${maxHeight}px`,
            dimensions
          });
          return;
        }
        
        resolve({ isValid: true, dimensions });
      } catch (error) {
        resolve({
          isValid: false,
          error: 'Failed to read image dimensions'
        });
      }
    } else {
      resolve({ isValid: true });
    }
  });
};

/**
 * Create thumbnail from image file
 */
export const createThumbnail = (
  file: File, 
  size: number = 150
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      // Calculate dimensions to maintain aspect ratio
      const { width, height } = img;
      let newWidth, newHeight;
      
      if (width > height) {
        newWidth = size;
        newHeight = (height * size) / width;
      } else {
        newHeight = size;
        newWidth = (width * size) / height;
      }
      
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      
      resolve(canvas.toDataURL('image/jpeg', 0.8));
      URL.revokeObjectURL(img.src);
    };
    
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Download compressed image
 */
export const downloadCompressedImage = (result: CompressionResult, filename?: string) => {
  const link = document.createElement('a');
  const downloadFilename = filename || `compressed_${result.file.name}`;
  
  if (result.dataUrl) {
    link.href = result.dataUrl;
  } else {
    link.href = URL.createObjectURL(result.file);
  }
  
  link.download = downloadFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up if we created an object URL
  if (!result.dataUrl) {
    URL.revokeObjectURL(link.href);
  }
};

/**
 * Get compression stats summary
 */
export const getCompressionStats = (results: CompressionResult[]) => {
  if (results.length === 0) {
    return {
      totalFiles: 0,
      totalOriginalSize: 0,
      totalCompressedSize: 0,
      totalSavedSize: 0,
      averageCompressionRatio: 0
    };
  }

  const totalOriginalSize = results.reduce((sum, result) => sum + result.originalSize, 0);
  const totalCompressedSize = results.reduce((sum, result) => sum + result.compressedSize, 0);
  const totalSavedSize = totalOriginalSize - totalCompressedSize;
  const averageCompressionRatio = results.reduce((sum, result) => sum + result.compressionRatio, 0) / results.length;

  return {
    totalFiles: results.length,
    totalOriginalSize,
    totalCompressedSize,
    totalSavedSize,
    averageCompressionRatio: Math.round(averageCompressionRatio)
  };
};

/**
 * Batch compress multiple files
 */
export const batchCompressImages = async (
  files: File[],
  compressFunction: (file: File) => Promise<CompressionResult | null>,
  onProgress?: (current: number, total: number) => void
): Promise<CompressionResult[]> => {
  const results: CompressionResult[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file) continue;
    
    onProgress?.(i + 1, files.length);
    
    try {
      const result = await compressFunction(file);
      if (result) {
        results.push(result);
      }
    } catch (error) {
      logger.error(`Failed to compress ${file.name}:`, error);
    }
  }
  
  return results;
};

/**
 * Compare two compression results
 */
export const compareCompressionResults = (
  result1: CompressionResult,
  result2: CompressionResult
) => {
  return {
    sizeDifference: result2.compressedSize - result1.compressedSize,
    ratioDifference: result2.compressionRatio - result1.compressionRatio,
    betterCompression: result2.compressionRatio > result1.compressionRatio ? 'result2' : 
                      result1.compressionRatio > result2.compressionRatio ? 'result1' : 'equal'
  };
};

/**
 * Generate a unique filename with timestamp
 */
export const generateUniqueFilename = (originalName: string, prefix: string = 'compressed'): string => {
  const timestamp = new Date().getTime();
  const extension = originalName.substring(originalName.lastIndexOf('.'));
  const baseName = originalName.substring(0, originalName.lastIndexOf('.'));
  
  return `${prefix}_${baseName}_${timestamp}${extension}`;
};

/**
 * Check if browser supports WebP format
 */
export const supportsWebP = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

/**
 * Check if browser supports AVIF format
 */
export const supportsAVIF = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const avif = new Image();
    avif.onload = () => resolve(true);
    avif.onerror = () => resolve(false);
    avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
  });
};
