import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Define upload directory
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        await mkdir(uploadDir, { recursive: true });

        const timestamp = Date.now();
        const originalName = file.name.split('.').slice(0, -1).join('.');
        const filename = `${timestamp}-${originalName}.webp`;
        const filePath = path.join(uploadDir, filename);

        // Convert to WebP using sharp
        await sharp(buffer)
            .webp({ quality: 80, effort: 6 })
            .toFile(filePath);

        // Calculate sizes for response
        const originalSize = buffer.length;
        const compressedSize = (await import('fs/promises')).stat(filePath).then(s => s.size);

        return NextResponse.json({
            success: true,
            message: 'Image converted to WebP successfully',
            url: `/uploads/${filename}`,
            filename: filename,
            originalSize,
            compressedSize: await compressedSize,
            format: 'webp'
        });
    } catch (error) {
        console.error('WebP conversion error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to convert image to WebP'
        }, { status: 500 });
    }
}
