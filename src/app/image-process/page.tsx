"use client";

import { useState } from "react";
import ClientCompression from "@/components/client-side/ClientCompression";
import ServerResize from "@/components/profile&image/ServerResize";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowDown } from "lucide-react";

export default function ImageProcessPage() {
    const [compressedFile, setCompressedFile] = useState<File | null>(null);
    const [originalSize, setOriginalSize] = useState<number | null>(null);

    const handleCompressed = (file: File, originalSize: number) => {
        setCompressedFile(file);
        setOriginalSize(originalSize);
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8 font-sans">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
                        Image Optimizer Test Lab
                    </h1>
                    <p className="text-slate-500 max-w-2xl mx-auto">
                        Test the full pipeline: Compress images locally in your browser, then generate precise thumbnails on the server using Sharp.
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Step 1: Client Side Compression */}
                    <div className="relative">
                        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-primary rounded-full hidden md:block" />
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">1</span>
                                <h2 className="text-xl font-bold text-slate-800">Client-Side Compression</h2>
                            </div>
                            <ClientCompression onCompressed={handleCompressed} />
                        </div>
                    </div>

                    {/* Connector */}
                    <div className="flex justify-center py-2 text-slate-300">
                        <ArrowDown className="w-8 h-8 animate-bounce" />
                    </div>

                    {/* Step 2: Server Side Processing */}
                    <div className="relative">
                        <div className={`absolute -left-4 top-0 bottom-0 w-1 rounded-full hidden md:block ${compressedFile ? 'bg-primary' : 'bg-slate-200'}`} />
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <span className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${compressedFile ? 'bg-primary text-primary-foreground' : 'bg-slate-200 text-slate-400'}`}>2</span>
                                <h2 className={`text-xl font-bold ${compressedFile ? 'text-slate-800' : 'text-slate-400'}`}>Server-Side Resize (Sharp)</h2>
                            </div>

                            {compressedFile ? (
                                <ServerResize
                                    compressedFile={compressedFile}
                                    originalSize={originalSize}
                                    onresized={(data) => {
                                        console.log("Server side processing complete with file:", data);
                                    }}
                                />
                            ) : (
                                <Card className="border-dashed bg-slate-50/50">
                                    <CardContent className="h-48 flex items-center justify-center text-slate-400 text-center px-12">
                                        <p>Upload and compress an image in Step 1 to enable server-side processing.</p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>

                <Separator className="my-8" />

                <footer className="text-center text-xs text-slate-400 pb-8">
                    <p>Built with Next.js, Sharp, and Browser Image Compression</p>
                </footer>
            </div>
        </main>
    );
}
