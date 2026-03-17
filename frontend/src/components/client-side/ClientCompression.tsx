"use client"

import { useState, ChangeEvent } from "react";
import imageCompression from "browser-image-compression";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload } from "lucide-react";

interface ClientCompressionProps {
    onCompressed?: (file: File, originalSize: number) => void;
}

export default function ClientCompression({ onCompressed }: ClientCompressionProps) {
    const [originalFile, setOriginalFile] = useState<File | null>(null);
    const [compressedFile, setCompressedFile] = useState<File | null>(null);
    const [originalPreview, setOriginalPreview] = useState<string>("");
    const [compressedPreview, setCompressedPreview] = useState<string>("");
    const [compressing, setCompressing] = useState(false);

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setOriginalFile(file);
        setOriginalPreview(URL.createObjectURL(file));
        setCompressedFile(null);
        setCompressedPreview("");

        // Compression options
        const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 800,
            useWebWorker: true,
            fileType: 'image/webp' as string,
        };

        try {
            setCompressing(true);
            const compressed = await imageCompression(file, options);

            setCompressedFile(compressed);
            setCompressedPreview(URL.createObjectURL(compressed));

            if (onCompressed) {
                onCompressed(compressed, file.size);
            }
        } catch (error) {
            console.error("Compression error:", error);
        } finally {
            setCompressing(false);
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Client-Side Image Compression</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg border-muted-foreground/25">
                    <Upload className="w-10 h-10 mb-4 text-muted-foreground" />
                    <Input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="max-w-xs cursor-pointer"
                    />
                    <p className="mt-2 text-sm text-muted-foreground">
                        Pilih gambar untuk dikompresi di browser
                    </p>
                </div>

                {compressing && (
                    <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-6 h-6 animate-spin mr-2" />
                        <span>Mengompresi gambar...</span>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {originalPreview && (
                        <div className="space-y-2">
                            <p className="font-semibold text-sm">Original: {formatSize(originalFile?.size || 0)}</p>
                            <div className="aspect-square relative overflow-hidden rounded-md border">
                                <img src={originalPreview} alt="Original" className="object-cover w-full h-full" />
                            </div>
                        </div>
                    )}

                    {compressedPreview && (
                        <div className="space-y-2">
                            <p className="font-semibold text-sm text-green-600">
                                Compressed: {formatSize(compressedFile?.size || 0)}
                                ({originalFile && compressedFile ? Math.round((1 - compressedFile.size / originalFile.size) * 100) : 0}% hemat)
                            </p>
                            <div className="aspect-square relative overflow-hidden rounded-md border border-green-200">
                                <img src={compressedPreview} alt="Compressed" className="object-cover w-full h-full" />
                            </div>
                            <Button asChild className="w-full" variant="outline">
                                <a href={compressedPreview} download={`compressed_${originalFile?.name || 'image.webp'}`}>
                                    Download WebP
                                </a>
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
