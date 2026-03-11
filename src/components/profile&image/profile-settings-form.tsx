"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/profile&image/avatar"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { useState, useRef, useMemo } from "react"
import { IUser, IOrganization_member } from "@/interface"
import { useAuthStore } from "@/store/user-store"
import { useProfilePhotoDelete, useProfilePhotoUrl } from "@/hooks/use-profile"
import { getUserInitials, safeAvatarSrc } from "@/lib/avatar-utils"
import { uploadProfilePhotoBase64, updateUserProfile } from "@/action/account"
import { ImageCropperDialog } from "@/components/profile&image/image-cropper-dialog"
import { DatePicker } from "@/components/ui/date-picker"
import { Trash2 } from "lucide-react"
import {
    Select as UISelect,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import imageCompression from "browser-image-compression"


// Schema
const profileFormSchema = z.object({
    display_name: z.string().min(2, {
        message: "Username must be at least 2 characters.",
    }).optional(),
    email: z.string().email({
        message: "Please select a verified email to display.",
    }).optional(),


    // Profile Tab Fields
    employee_code: z.string().optional(), // Read only
    first_name: z.string().min(1, "First name is required"),
    middle_name: z.string().optional(),
    last_name: z.string().optional(),
    phone: z.string().optional(),

    // Details Tab Fields
    gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
    date_of_birth: z.date().optional(), // Transformed to/from string
    nationality: z.string().optional(),
    national_id: z.string().optional(),

    // Emergency Contact
    emergency_contact_name: z.string().optional(),
    emergency_contact_relationship: z.string().optional(),
    emergency_contact_phone: z.string().optional(),
    emergency_contact_email: z.string().email().optional().or(z.literal("")),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

interface ProfileSettingsFormProps {
    initialData: {
        user: Partial<IUser>
        organizationMember: IOrganization_member | null
    }
}

export function ProfileSettingsForm({ initialData }: ProfileSettingsFormProps) {
    const [photoUploading, setPhotoUploading] = useState(false)
    const [cropDialogOpen, setCropDialogOpen] = useState(false)
    const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const { deleteProfilePhoto } = useProfilePhotoDelete()
    const setUser = useAuthStore((state) => state.setUser)
    const currentUser = useAuthStore((state) => state.user)

    // Default values
    const defaultValues: Partial<ProfileFormValues> = {
        display_name: initialData.user.display_name || "",
        email: initialData.user.email || "",


        employee_code: initialData.user.employee_code || "",
        first_name: initialData.user.first_name || "",
        last_name: initialData.user.last_name || "",
        phone: initialData.user.phone || "",

        gender: (initialData.user.gender as any) || undefined,
        date_of_birth: initialData.user.date_of_birth ? new Date(initialData.user.date_of_birth) : undefined,
        nationality: initialData.user.nationality || "",
        national_id: initialData.user.national_id || "",

        emergency_contact_name: initialData.user.emergency_contact?.name || "",
        emergency_contact_relationship: initialData.user.emergency_contact?.relationship || "",
        emergency_contact_phone: initialData.user.emergency_contact?.phone || "",
        emergency_contact_email: initialData.user.emergency_contact?.email || "",
    }

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues,
        mode: "onChange",
    })

    const profilePhotoUrl = useProfilePhotoUrl(currentUser?.profile_photo_url || undefined, currentUser?.id)

    // Avatar Logic
    const avatarSrc = useMemo(() => {
        const url = profilePhotoUrl ?? safeAvatarSrc(initialData.user.profile_photo_url);
        return url;
    }, [profilePhotoUrl, initialData.user.profile_photo_url]);

    const userInitials = useMemo(() => {
        return getUserInitials(
            currentUser?.first_name || initialData.user.first_name,
            currentUser?.email || initialData.user.email
        );
    }, [currentUser, initialData.user]);

    // Handle Photo Upload
    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            if (file) {
                setSelectedFile(file);
                const reader = new FileReader();
                reader.onload = () => {
                    setSelectedImageSrc(reader.result as string);
                    setCropDialogOpen(true);
                };
                reader.readAsDataURL(file);
            }
        }
    };

    const onCropComplete = async (croppedBlob: Blob) => {
        setPhotoUploading(true);
        const toastId = toast.loading("Uploading profile photo...");
        try {
            // Compress the CROPPED image (will become the thumbnail)
            const imageFile = new File([croppedBlob], selectedFile?.name || 'profile.png', {
                type: 'image/png',
                lastModified: Date.now(),
            });

            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 400,
                useWebWorker: true,
                fileType: 'image/webp'
            };

            const compressedFile = await imageCompression(imageFile, options);

            // Read the ORIGINAL file (pre-crop) as base64 too
            const readOriginalAsBase64 = (): Promise<{ base64: string; fileType: string } | null> => {
                if (!selectedFile) return Promise.resolve(null);
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const result = reader.result?.toString();
                        if (!result) { resolve(null); return; }
                        const base64 = (result.includes('base64,') ? result.split('base64,')[1] : result) || "";
                        resolve({ base64, fileType: selectedFile.type });
                    };
                    reader.readAsDataURL(selectedFile);
                });
            };

            const [originalData] = await Promise.all([readOriginalAsBase64()]);

            const reader = new FileReader();
            reader.readAsDataURL(compressedFile);
            reader.onloadend = async () => {
                const base64 = reader.result?.toString();
                if (!base64) {
                    toast.error("Failed to process compressed image", { id: toastId });
                    setPhotoUploading(false);
                    return;
                }

                const base64Data = (base64.includes('base64,') ? base64.split('base64,')[1] : base64) || "";
                const result = await uploadProfilePhotoBase64({
                    base64Data,                            // cropped+compressed ? thumb
                    fileName: compressedFile.name,
                    fileType: compressedFile.type,
                    fileSize: compressedFile.size,
                    originalBase64Data: originalData?.base64,      // full original ? original/
                    originalFileType: originalData?.fileType,
                });

                if (result.success && result.url) {
                    toast.success("Profile photo updated successfully", { id: toastId });

                    setUser((prev) => {
                        if (!prev) return prev;
                        return { ...prev, profile_photo_url: result.url! };
                    });
                } else {
                    toast.error(result.message || "Failed to upload photo", { id: toastId });
                }
                setPhotoUploading(false);
                setCropDialogOpen(false);
            };
        } catch (error) {
            toast.error("An error occurred during upload", { id: toastId });
            setPhotoUploading(false);
        }
    };

    const handleDeletePhoto = async () => {
        if (confirm("Are you sure you want to delete your profile photo?")) {
            setPhotoUploading(true);
            const toastId = toast.loading("Deleting profile photo...");
            const result = await deleteProfilePhoto();
            if (result.success) {
                toast.success("Profile photo deleted", { id: toastId });
                setUser((prev) => {
                    if (!prev) return prev;
                    return { ...prev, profile_photo_url: null };
                });
            } else {
                toast.error(result.message || "Failed to delete photo", { id: toastId });
            }
            setPhotoUploading(false);
        }
    }

    // Handle Form Submit
    async function onSubmit(data: ProfileFormValues) {
        try {
            const formData = new FormData();

            // Append all fields
            if (data.display_name) formData.append("display_name", data.display_name);
            if (data.email) formData.append("email", data.email);
            if (data.first_name) formData.append("first_name", data.first_name);
            if (data.last_name) formData.append("last_name", data.last_name);
            if (data.phone) formData.append("phone", data.phone);

            if (data.gender) formData.append("gender", data.gender);
            if (data.date_of_birth) formData.append("date_of_birth", data.date_of_birth.toISOString());
            if (data.nationality) formData.append("nationality", data.nationality);
            if (data.national_id) formData.append("national_id", data.national_id);

            // Emergency Contact (needs specific handling in updateUserProfile? or JSON?)
            // Based on account-form.tsx, it constructs an object:


            const emergencyContact = {
                name: data.emergency_contact_name,
                relationship: data.emergency_contact_relationship,
                phone: data.emergency_contact_phone,
                email: data.emergency_contact_email,
            };

            const payload: any = {
                display_name: data.display_name,
                email: data.email,
                first_name: data.first_name,
                last_name: data.last_name,
                phone: data.phone,
                gender: data.gender,
                date_of_birth: data.date_of_birth ? data.date_of_birth.toISOString() : undefined,
                nationality: data.nationality,
                national_id: data.national_id,
                emergency_contact: emergencyContact,
            };

            const result = await updateUserProfile(payload);

            if (result.success) {
                toast.success("Profile updated successfully");
                setUser((prev) => {
                    if (!prev) return prev;
                    return { ...prev, ...payload };
                });
            } else {
                toast.error(result.message || "Failed to update profile");
            }
        } catch (error) {
            toast.error("Something went wrong.");
        }
    }

    return (
        <div className="space-y-6">
            <ImageCropperDialog
                open={cropDialogOpen}
                onOpenChange={setCropDialogOpen}
                imageSrc={selectedImageSrc}
                onCropComplete={onCropComplete}
            />
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoSelect}
            />

            <div className="flex items-center gap-3">
                <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarSrc || undefined} className="object-cover" />
                    <AvatarFallback className="text-2xl bg-gradient-to-br from-gray-700 to-gray-900 text-white">
                        {userInitials}
                    </AvatarFallback>
                </Avatar>
                <div className="flex gap-3 items-center">
                    <Button
                        type="button"
                        variant="secondary"
                        className="bg-black text-white hover:bg-black/90"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={photoUploading}
                    >
                        {photoUploading ? "Uploading..." : "Change image"}
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={handleDeletePhoto}
                        disabled={photoUploading}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Form Section */}
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <Tabs defaultValue="profile" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="profile">Profile</TabsTrigger>
                            <TabsTrigger value="details">Details</TabsTrigger>
                        </TabsList>

                        {/* PROFILE TAB */}
                        <TabsContent value="profile" className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <FormField
                                        control={form.control}
                                        name="employee_code"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Employee Code</FormLabel>
                                                <FormControl>
                                                    <Input {...field} disabled className="bg-muted" />
                                                </FormControl>
                                                <FormDescription>Cannot be changed</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="first_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>First Name *</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="e.g. John" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="last_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Last Name</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="e.g. Doe" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="display_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Display Name</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="e.g. John Doe" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Phone Number *</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="e.g. +62 812 3456 7890" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>



                        </TabsContent>

                        {/* DETAILS TAB */}
                        <TabsContent value="details" className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="date_of_birth"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Date of Birth</FormLabel>
                                            <FormControl>
                                                <DatePicker
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    fromYear={1900}
                                                    toYear={new Date().getFullYear()}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="gender"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Gender</FormLabel>
                                            <UISelect onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select gender" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="male">Male</SelectItem>
                                                    <SelectItem value="female">Female</SelectItem>
                                                    <SelectItem value="other">Other</SelectItem>
                                                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                                                </SelectContent>
                                            </UISelect>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="nationality"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nationality</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="e.g. Indonesian" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="national_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>National ID</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="e.g. 1234567890" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="pt-4 border-t">
                                <h4 className="text-sm font-medium mb-4">Emergency Contact</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="emergency_contact_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Name</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="e.g. Jane Doe" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="emergency_contact_relationship"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Relationship</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="e.g. Spouse" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="col-span-1">
                                        <FormField
                                            control={form.control}
                                            name="emergency_contact_phone"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Phone</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} placeholder="e.g. +62 812 3456 7890" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <FormField
                                            control={form.control}
                                            name="emergency_contact_email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Email</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} placeholder="e.g. jane@example.com" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

                    <div className="flex justify-end">
                        <Button type="submit">Save</Button>
                    </div>
                </form>
            </Form>
        </div>
    )
}
