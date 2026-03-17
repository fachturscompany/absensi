import sharp from 'sharp';
import { 
  ServerCompressionOptions, 
  CompressionPreset, 
  COMPRESSION_PRESETS 
} from '../types/image-compression';

import { logger } from '@/lib/logger';
/**
 * Server-side image compression utility using Sharp
 */
export class ImageCompressor {
  private static instance: ImageCompressor;

  private constructor() {}

  public static getInstance(): ImageCompressor {
    if (!ImageCompressor.instance) {
      ImageCompressor.instance = new ImageCompressor();
    }
    return ImageCompressor.instance;
  }

  /**
   * Compress image buffer using specified options
   */
  async compressBuffer(
    buffer: Buffer, 
    options: ServerCompressionOptions
  ): Promise<{
    buffer: Buffer;
    info: sharp.OutputInfo;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
  }> {
    const originalSize = buffer.length;
    
    let pipeline = sharp(buffer);

    // Resize if dimensions are specified
    if (options.width || options.height) {
      pipeline = pipeline.resize({
        width: options.width,
        height: options.height,
        fit: options.fit || 'inside',
        withoutEnlargement: options.withoutEnlargement !== false
      });
    }

    // Apply format and quality
    switch (options.format) {
      case 'jpeg':
        pipeline = pipeline.jpeg({ 
          quality: options.quality || 85,
          progressive: true,
          mozjpeg: true
        });
        break;
      case 'png':
        pipeline = pipeline.png({ 
          quality: options.quality || 85,
          progressive: true,
          compressionLevel: 9
        });
        break;
      case 'webp':
        pipeline = pipeline.webp({ 
          quality: options.quality || 85,
          effort: 6
        });
        break;
      case 'avif':
        pipeline = pipeline.avif({ 
          quality: options.quality || 85,
          effort: 9
        });
        break;
      default:
        // Keep original format but optimize
        const metadata = await sharp(buffer).metadata();
        if (metadata.format === 'jpeg') {
          pipeline = pipeline.jpeg({ 
            quality: options.quality || 85,
            progressive: true,
            mozjpeg: true
          });
        } else if (metadata.format === 'png') {
          pipeline = pipeline.png({ 
            quality: options.quality || 85,
            progressive: true,
            compressionLevel: 9
          });
        }
        break;
    }

    const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
    const compressedSize = data.length;
    const compressionRatio = Math.round(((originalSize - compressedSize) / originalSize) * 100);

    return {
      buffer: data,
      info,
      originalSize,
      compressedSize,
      compressionRatio
    };
  }

  /**
   * Compress image using a predefined preset
   */
  async compressWithPreset(
    buffer: Buffer, 
    presetName: string
  ): Promise<{
    buffer: Buffer;
    info: sharp.OutputInfo;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    preset: CompressionPreset;
  }> {
    const preset = COMPRESSION_PRESETS[presetName];
    if (!preset) {
      throw new Error(`Compression preset '${presetName}' not found`);
    }

    const result = await this.compressBuffer(buffer, preset.server);

    return {
      ...result,
      preset
    };
  }

  /**
   * Create multiple variants of an image (thumbnail, standard, etc.)
   */
  async createVariants(
    buffer: Buffer, 
    variants: string[]
  ): Promise<Record<string, {
    buffer: Buffer;
    info: sharp.OutputInfo;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    preset: CompressionPreset;
  }>> {
    const results: Record<string, {
      buffer: Buffer;
      info: sharp.OutputInfo;
      originalSize: number;
      compressedSize: number;
      compressionRatio: number;
      preset: CompressionPreset;
    }> = {};

    for (const variant of variants) {
      try {
        results[variant] = await this.compressWithPreset(buffer, variant);
      } catch (error) {
        logger.error(`Failed to create variant '${variant}':`, error);
        throw error;
      }
    }

    return results;
  }

  /**
   * Get image metadata
   */
  async getMetadata(buffer: Buffer): Promise<sharp.Metadata> {
    return await sharp(buffer).metadata();
  }

  /**
   * Validate image format
   */
  async validateImage(buffer: Buffer): Promise<{
    isValid: boolean;
    format?: string;
    width?: number;
    height?: number;
    size: number;
    error?: string;
  }> {
    try {
      const metadata = await this.getMetadata(buffer);
      
      const supportedFormats = ['jpeg', 'png', 'webp', 'avif', 'gif', 'bmp', 'tiff'];
      const isValid = supportedFormats.includes(metadata.format || '');

      if (!isValid) {
        return {
          isValid: false,
          size: buffer.length,
          error: `Unsupported image format: ${metadata.format}`
        };
      }

      return {
        isValid: true,
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
        size: buffer.length
      };
    } catch (error) {
      return {
        isValid: false,
        size: buffer.length,
        error: error instanceof Error ? error.message : 'Invalid image file'
      };
    }
  }

  /**
   * Optimize image for web delivery
   */
  async optimizeForWeb(
    buffer: Buffer,
    options: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
      format?: 'auto' | 'jpeg' | 'webp' | 'avif';
    } = {}
  ): Promise<{
    buffer: Buffer;
    info: sharp.OutputInfo;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
  }> {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 85,
      format = 'auto'
    } = options;

    const metadata = await this.getMetadata(buffer);
    let targetFormat: 'jpeg' | 'webp' | 'avif' = 'webp';

    if (format === 'auto') {
      // Choose best format based on original
      if (metadata.format === 'png' && metadata.hasAlpha) {
        targetFormat = 'webp'; // WebP handles transparency better
      } else {
        targetFormat = 'webp'; // Default to WebP for best compression
      }
    } else {
      targetFormat = format;
    }

    return await this.compressBuffer(buffer, {
      width: maxWidth,
      height: maxHeight,
      quality,
      format: targetFormat,
      fit: 'inside',
      withoutEnlargement: true
    });
  }
}

// Export singleton instance
export const imageCompressor = ImageCompressor.getInstance();

// Helper functions for common operations
export async function compressImageBuffer(
  buffer: Buffer,
  preset: string = 'standard'
) {
  return await imageCompressor.compressWithPreset(buffer, preset);
}

export async function createImageVariants(
  buffer: Buffer,
  variants: string[] = ['thumbnail', 'standard']
) {
  return await imageCompressor.createVariants(buffer, variants);
}

export async function validateImageBuffer(buffer: Buffer) {
  return await imageCompressor.validateImage(buffer);
}

export async function optimizeImageForWeb(
  buffer: Buffer,
  options?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'auto' | 'jpeg' | 'webp' | 'avif';
  }
) {
  return await imageCompressor.optimizeForWeb(buffer, options);
}
