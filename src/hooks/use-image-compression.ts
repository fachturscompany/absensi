'use client';

import { useState, useCallback, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import {
  CompressionOptions,
  CompressionResult,
  UploadProgress,
  COMPRESSION_PRESETS,
  SUPPORTED_IMAGE_FORMATS,
  MAX_FILE_SIZE,
  formatFileSize,
  calculateCompressionRatio,
  CompressionPreset
} from '../types/image-compression';

import { logger } from '@/lib/logger';
export interface UseImageCompressionOptions {
  preset?: string;
  customOptions?: CompressionOptions;
  onProgress?: (progress: number) => void;
  onError?: (error: Error) => void;
  onSuccess?: (result: CompressionResult) => void;
}

export interface UseImageCompressionReturn {
  compressImage: (file: File) => Promise<CompressionResult | null>;
  compressMultiple: (files: File[]) => Promise<(CompressionResult | null)[]>;
  isCompressing: boolean;
  progress: UploadProgress;
  error: string | null;
  abortCompression: () => void;
  validateFile: (file: File) => { isValid: boolean; error?: string };
  getSupportedFormats: () => string[];
  getPresetInfo: (presetName: string) => CompressionPreset | null;
}

export function useImageCompression({
  preset = 'standard',
  customOptions,
  onProgress,
  onError,
  onSuccess
}: UseImageCompressionOptions = {}): UseImageCompressionReturn {
  const [isCompressing, setIsCompressing] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({
    loaded: 0,
    total: 0,
    percentage: 0,
    status: 'idle'
  });
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const updateProgress = useCallback((loaded: number, total: number, status: UploadProgress['status']) => {
    const percentage = total > 0 ? Math.round((loaded / total) * 100) : 0;
    const newProgress = { loaded, total, percentage, status };
    setProgress(newProgress);
    onProgress?.(percentage);
  }, [onProgress]);

  const validateFile = useCallback((file: File): { isValid: boolean; error?: string } => {
    // Check file type
    if (!SUPPORTED_IMAGE_FORMATS.includes(file.type)) {
      return {
        isValid: false,
        error: `Unsupported file format. Supported formats: ${SUPPORTED_IMAGE_FORMATS.join(', ')}`
      };
    }

    // Check file size
    const maxSize = MAX_FILE_SIZE.highQuality; // Use the highest limit for initial validation
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `File size too large. Maximum size: ${formatFileSize(maxSize)}`
      };
    }

    // Check if file is actually an image by checking the file extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!allowedExtensions.includes(fileExtension)) {
      return {
        isValid: false,
        error: `Invalid file extension. Allowed extensions: ${allowedExtensions.join(', ')}`
      };
    }

    return { isValid: true };
  }, []);

  const compressImage = useCallback(async (file: File): Promise<CompressionResult | null> => {
    try {
      setError(null);
      setIsCompressing(true);
      updateProgress(0, 100, 'compressing');

      // Debug: Log original file details
      logger.debug('🔍 Original file details:', {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified
      });

      // Validate file
      const validation = validateFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Get compression options
      const compressionPreset = COMPRESSION_PRESETS[preset];
      const options: CompressionOptions = {
        ...compressionPreset?.client,
        ...customOptions,
        onProgress: (progress: number) => {
          updateProgress(progress, 100, 'compressing');
        },
        useWebWorker: true
      };

      // Create abort controller
      abortControllerRef.current = new AbortController();
      if (abortControllerRef.current) {
        options.signal = abortControllerRef.current.signal;
      }

      const originalSize = file.size;
      
      // Perform compression
      const compressedFile = await imageCompression(file, options);
      const compressedSize = compressedFile.size;
      const compressionRatio = calculateCompressionRatio(originalSize, compressedSize);

      // Debug: Log compressed file details
      logger.debug('🔍 Compressed file details:', {
        name: compressedFile.name,
        type: compressedFile.type,
        size: compressedFile.size,
        lastModified: compressedFile.lastModified
      });

      // Generate data URL for preview
      const dataUrl = await imageCompression.getDataUrlFromFile(compressedFile);

      const result: CompressionResult = {
        originalSize,
        compressedSize,
        compressionRatio,
        file: compressedFile,
        dataUrl
      };

      updateProgress(100, 100, 'completed');
      onSuccess?.(result);
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Compression failed');
      
      // Don't treat abort as an error
      if (error.name === 'AbortError' || error.message.includes('abort')) {
        updateProgress(0, 100, 'idle');
        return null;
      }

      setError(error.message);
      updateProgress(0, 100, 'error');
      onError?.(error);
      
      return null;
    } finally {
      setIsCompressing(false);
      abortControllerRef.current = null;
    }
  }, [preset, customOptions, onProgress, onError, onSuccess, updateProgress, validateFile]);

  const compressMultiple = useCallback(async (files: File[]): Promise<(CompressionResult | null)[]> => {
    const results: (CompressionResult | null)[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      updateProgress(i, files.length, 'compressing');
      if (!file) {
        results.push(null);
        continue;
      }
      
      try {
        const result = await compressImage(file);
        results.push(result);
      } catch (error) {
        logger.error(`Failed to compress file ${file.name}:`, error);
        results.push(null);
      }
    }
    
    updateProgress(files.length, files.length, 'completed');
    return results;
  }, [compressImage, updateProgress]);

  const abortCompression = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort(new Error('Compression cancelled by user'));
    }
  }, []);

  const getSupportedFormats = useCallback((): string[] => {
    return [...SUPPORTED_IMAGE_FORMATS];
  }, []);

  const getPresetInfo = useCallback((presetName: string): CompressionPreset | null => {
    return COMPRESSION_PRESETS[presetName] || null;
  }, []);

  return {
    compressImage,
    compressMultiple,
    isCompressing,
    progress,
    error,
    abortCompression,
    validateFile,
    getSupportedFormats,
    getPresetInfo
  };
}

// Helper hook for quick image compression with default settings
export function useQuickImageCompression() {
  return useImageCompression({ preset: 'standard' });
}

// Helper hook for avatar compression
export function useAvatarCompression() {
  return useImageCompression({ preset: 'avatar' });
}

// Helper hook for thumbnail compression
export function useThumbnailCompression() {
  return useImageCompression({ preset: 'thumbnail' });
}