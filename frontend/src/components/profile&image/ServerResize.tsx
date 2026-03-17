"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Image as ImageIcon } from "lucide-react";

interface ServerResizeProps {
    compressedFile: File | null;
    originalSize: number | null;
    onresized: (file: File) => void;
}

export default function ServerResize({ compressedFile, originalSize, onresized }: ServerResizeProps) {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<File | null>(null);

    const handleResize = async () => {
        if (!compressedFile) return;

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("file", compressedFile);

            const response = await fetch("/api/comprees-image/server-resize", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Network response was not ok");
            }

            const data = await response.json();

            // Reconstruct File object from URL to match state/prop types in reference
            const fileResponse = await fetch(data.thumbnailUrl);
            const blob = await fileResponse.blob();
            const resizedFile = new File([blob], "thumbnail.webp", { type: "image/webp" });

            setResult(resizedFile);
            onresized(resizedFile);
        } catch (error) {
            console.error("Error during server resize:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatBytes = (bytes: number) => {
        return (bytes / 1024).toFixed(2) + " KB";
    };

    return (
        <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Server-Side Processing (Sharp)
                </h3>
                <Button
                    size="sm"
                    onClick={handleResize}
                    disabled={!compressedFile || loading}
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Generate Thumbnail (300x300)
                </Button>
            </div>

            {compressedFile && (
                <div className="text-xs text-muted-foreground space-y-1">
                    <p>File ready: {compressedFile.name}</p>
                    <p>Compressed size: {formatBytes(compressedFile.size)}</p>
                    {originalSize && <p>Original size: {formatBytes(originalSize)}</p>}
                </div>
            )}

            {result && (
                <div className="mt-4 p-3 border rounded bg-background">
                    <p className="text-xs font-medium mb-2 text-primary">Thumbnail Result (Precise 300x300):</p>
                    <div className="flex items-start gap-4">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary shadow-sm">
                            <img
                                src={URL.createObjectURL(result)}
                                alt="Thumbnail"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="text-xs space-y-1 py-1">
                            <p className="font-semibold text-slate-700">Information:</p>
                            <p>Name: {result.name}</p>
                            <p>Size: {formatBytes(result.size)}</p>
                            <p>Type: {result.type}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
