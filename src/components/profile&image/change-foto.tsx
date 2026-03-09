"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Archive as Compress, Upload } from "lucide-react"
import { toast } from "sonner"
import { deleteLogo, uploadLogo, updateOrganization } from "@/action/organization"
import { useImageCompression } from "@/hooks/use-image-compression"
import { formatFileSize } from "@/types/image-compression"

interface ProfilePhotoDialogProps {
    organizationId?: string
    currentLogo?: string | null
    onChange?: (newLogo: string | null) => void
    useCompression?: boolean
}

export default function ProfilePhotoDialog({ 
    organizationId, 
    currentLogo, 
    onChange,
    useCompression = true 
}: ProfilePhotoDialogProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [compressionStats, setCompressionStats] = useState<{
        originalSize: number
        compressedSize: number
        compressionRatio: number
    } | null>(null)

    const {
        compressImage,
        isCompressing,
        progress,
        error: compressionError
    } = useImageCompression({
        preset: 'standard', // Use standard preset for logos
        onSuccess: (result) => {
            setSelectedFile(result.file)
            setPreviewUrl(result.dataUrl || '')
            setCompressionStats({
                originalSize: result.originalSize,
                compressedSize: result.compressedSize,
                compressionRatio: result.compressionRatio
            })
        },
        onError: (error) => {
            toast.error(error.message)
        }
    })

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file')
            return
        }

        // Validate file size (max 10MB for initial upload)
        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size must be less than 10MB')
            return
        }

        if (useCompression) {
            // Use compression
            await compressImage(file)
        } else {
            // Use original file without compression
            setSelectedFile(file)
            setCompressionStats(null)
            
            // Create preview URL
            const reader = new FileReader()
            reader.onload = (e) => {
                setPreviewUrl(e.target?.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSave = async () => {
        if (!organizationId) return
        setLoading(true)
        try {
            let newLogo = currentLogo

            if (selectedFile) {
                // Upload logo baru
                const uploaded = await uploadLogo(selectedFile)
                if (uploaded) {
                    // Hapus logo lama
                    if (currentLogo) await deleteLogo(currentLogo)
                    newLogo = uploaded
                }
            }

            // Update di DB
            await updateOrganization(organizationId, { logo_url: newLogo })
            onChange?.(newLogo ?? null)
            toast.success("Logo updated!")
            
            // Reset state
            setSelectedFile(null)
            setPreviewUrl(null)
            setCompressionStats(null)
        } catch (err) {
            toast.error("Failed to update logo")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!organizationId || !currentLogo) return
        setLoading(true)
        try {
            await deleteLogo(currentLogo)
            await updateOrganization(organizationId, { logo_url: null })
            setSelectedFile(null)
            setPreviewUrl(null)
            setCompressionStats(null)
            onChange?.(null)
            toast.success("Logo deleted!")
        } catch {
            toast.error("Failed to delete logo")
        } finally {
            setLoading(false)
        }
    }

    const displayUrl = previewUrl || (selectedFile && URL.createObjectURL(selectedFile)) || currentLogo

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" disabled={loading || isCompressing}>
                    {isCompressing ? 'Processing...' : 'Change Logo'}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md w-full bg-white p-6 rounded-lg shadow-lg z-50">
                <DialogTitle>Logo</DialogTitle>
                <DialogDescription>
                    Update your logo below. {useCompression ? 'Images will be automatically optimized.' : ''}
                </DialogDescription>

                <div className="flex flex-col items-center gap-4 mt-4">
                    {/* Logo Preview */}
                    {displayUrl && (
                        <div className="space-y-2">
                            <img
                                src={displayUrl}
                                alt="Logo Preview"
                                className="max-w-full max-h-48 object-contain border rounded-md"
                            />
                            {compressionStats && compressionStats.compressionRatio > 0 && (
                                <div className="flex justify-center">
                                    <Badge variant="secondary" className="text-xs">
                                        <Compress className="h-3 w-3 mr-1" />
                                        {compressionStats.compressionRatio}% saved
                                    </Badge>
                                </div>
                            )}
                        </div>
                    )}

                    {/* File Info */}
                    {selectedFile && (
                        <div className="text-sm text-muted-foreground text-center space-y-1">
                            <p className="font-medium">{selectedFile.name}</p>
                            <div className="flex items-center justify-center gap-2">
                                <span>{formatFileSize(selectedFile.size)}</span>
                            </div>
                            {compressionStats && (
                                <p className="text-xs">
                                    Original: {formatFileSize(compressionStats.originalSize)} → 
                                    Compressed: {formatFileSize(compressionStats.compressedSize)}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Compression Progress */}
                    {isCompressing && (
                        <div className="w-full space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Optimizing...</span>
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
                    <div className="w-full">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                            id="logo-upload"
                            disabled={loading || isCompressing}
                        />
                        <label htmlFor="logo-upload">
                            <Button 
                                variant="outline" 
                                className="w-full cursor-pointer"
                                type="button"
                                asChild
                                disabled={loading || isCompressing}
                            >
                                <div className="flex items-center gap-2">
                                    <Upload className="h-4 w-4" />
                                    {isCompressing ? 'Processing...' : 'Choose Image'}
                                </div>
                            </Button>
                        </label>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2 w-full">
                        {(currentLogo || selectedFile) && (
                            <Button 
                                variant="destructive" 
                                onClick={handleDelete} 
                                disabled={loading || isCompressing}
                            >
                                Delete
                            </Button>
                        )}
                        <Button 
                            onClick={handleSave} 
                            disabled={loading || isCompressing || !selectedFile}
                        >
                            {loading ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
