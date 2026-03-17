// Image compression configuration and types

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  initialQuality?: number;
  alwaysKeepResolution?: boolean;
  useWebWorker?: boolean;
  preserveExif?: boolean;
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
}

export interface ServerCompressionOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  withoutEnlargement?: boolean;
}

export interface CompressionPreset {
  name: string;
  description: string;
  client: CompressionOptions;
  server: ServerCompressionOptions;
}

export interface CompressionResult {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  file: File;
  dataUrl?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  status: 'idle' | 'compressing' | 'uploading' | 'completed' | 'error';
}

// Predefined compression presets
export const COMPRESSION_PRESETS: Record<string, CompressionPreset> = {
  avatar: {
    name: 'Avatar',
    description: 'Small circular profile pictures',
    client: {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 400,
      initialQuality: 0.8,
      useWebWorker: true,
      preserveExif: false
    },
    server: {
      width: 400,
      height: 400,
      quality: 85,
      format: 'webp',
      fit: 'cover',
      withoutEnlargement: true
    }
  },
  thumbnail: {
    name: 'Thumbnail',
    description: 'Small preview images',
    client: {
      maxSizeMB: 0.3,
      maxWidthOrHeight: 300,
      initialQuality: 0.7,
      useWebWorker: true,
      preserveExif: false
    },
    server: {
      width: 300,
      height: 300,
      quality: 75,
      format: 'webp',
      fit: 'cover',
      withoutEnlargement: true
    }
  },
  standard: {
    name: 'Standard',
    description: 'Regular images for general use',
    client: {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      initialQuality: 0.85,
      useWebWorker: true,
      preserveExif: true
    },
    server: {
      width: 1920,
      height: 1080,
      quality: 85,
      format: 'webp',
      fit: 'inside',
      withoutEnlargement: true
    }
  },
  highQuality: {
    name: 'High Quality',
    description: 'High quality images with minimal compression',
    client: {
      maxSizeMB: 2,
      maxWidthOrHeight: 2560,
      initialQuality: 0.95,
      useWebWorker: true,
      preserveExif: true
    },
    server: {
      width: 2560,
      height: 1440,
      quality: 95,
      format: 'webp',
      fit: 'inside',
      withoutEnlargement: true
    }
  },
  document: {
    name: 'Document',
    description: 'Text documents and screenshots',
    client: {
      maxSizeMB: 1.5,
      maxWidthOrHeight: 1920,
      initialQuality: 0.9,
      useWebWorker: true,
      preserveExif: false
    },
    server: {
      width: 1920,
      height: 1080,
      quality: 90,
      format: 'png',
      fit: 'inside',
      withoutEnlargement: true
    }
  }
};

// Helper function to get file size in human readable format
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper function to calculate compression ratio
export const calculateCompressionRatio = (originalSize: number, compressedSize: number): number => {
  return Math.round(((originalSize - compressedSize) / originalSize) * 100);
};

// Supported image formats
export const SUPPORTED_IMAGE_FORMATS = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/bmp',
  'image/gif'
];

// Maximum file size limits (in bytes)
export const MAX_FILE_SIZE = {
  avatar: 5 * 1024 * 1024, // 5MB
  standard: 5 * 1024 * 1024, // 5MB
  document: 5 * 1024 * 1024, // 5MB
  highQuality: 5 * 1024 * 1024 // 5MB
};
