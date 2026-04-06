"use client";

import React from "react";
import NextLink from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/profile&image/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";




import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import imageCompression from "browser-image-compression";
import {
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Settings,
  User,
  Activity,
  Users,
  Archive,
  Folder,
} from "lucide-react";
import {
  uploadProfilePhotoBase64,
} from "@/action/account";
import { IUser, IOrganization_member } from "@/interface";
import { useAuthStore } from "@/store/user-store";
import { useProfileRefresh, useProfilePhotoUrl } from "@/hooks/use-profile";
import { safeAvatarSrc, getUserInitials } from "@/lib/avatar-utils";
import { accountLogger } from '@/lib/logger';
import { ImageCropperDialog } from "@/components/profile&image/image-cropper-dialog";

interface UserProfile extends Partial<IUser> {
  email?: string;
}

interface AccountData {
  user: UserProfile;
  organizationMember: IOrganization_member | null;
}

interface AccountFormProps {
  initialData: AccountData;
}

// Schema for profile form
const profileFormSchema = z.object({
  employee_code: z.string().optional(),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().optional(),
  display_name: z.string().optional(),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
  nationality: z.string().optional(),
  national_id: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_relationship: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  emergency_contact_email: z.string().email().optional().or(z.literal("")),
});



type ProfileFormValues = z.infer<typeof profileFormSchema>;


const ACTIVE_PROJECTS = [
  {
    id: 1,
    name: "Attendance System Redesign",
    client: "UBIG Technology",
    progress: 75,
    dueDate: "2024-05-15",
  },
  {
    id: 2,
    name: "Mobile App Development",
    client: "SMKN 8 Malang",
    progress: 40,
    dueDate: "2024-06-20",
  },
  {
    id: 3,
    name: "Payroll Module Integration",
    client: "Indo Jaya Corp",
    progress: 15,
    dueDate: "2024-07-10",
  }
];

const ARCHIVED_PROJECTS = [
  {
    id: 4,
    name: "Company Landing Page",
    client: "Internal Project",
    completedDate: "2023-12-10",
    lifecycle_status: "Completed"
  },
  {
    id: 5,
    name: "HR Management Portal",
    client: "Global Tech",
    completedDate: "2023-11-05",
    lifecycle_status: "Completed"
  }
];

export function AccountForm({ initialData }: AccountFormProps) {
  const [photoUploading, setPhotoUploading] = React.useState(false);
  const [cropDialogOpen, setCropDialogOpen] = React.useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = React.useState<string | null>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { refreshProfile } = useProfileRefresh();
  const setUser = useAuthStore((state) => state.setUser);
  const currentUser = useAuthStore((state) => state.user);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      employee_code: initialData.user.employee_code || "",
      first_name: initialData.user.first_name || "",
      last_name: initialData.user.last_name || "",
      display_name: initialData.user.display_name || "",
      email: initialData.user.email || "",
      phone: initialData.user.phone || "",
      date_of_birth: initialData.user.date_of_birth || "",
      gender: initialData.user.gender || undefined,
      nationality: initialData.user.nationality || "",
      national_id: initialData.user.national_id || "",
      emergency_contact_name: initialData.user.emergency_contact?.name || "",
      emergency_contact_relationship: initialData.user.emergency_contact?.relationship || "",
      emergency_contact_phone: initialData.user.emergency_contact?.phone || "",
      emergency_contact_email: initialData.user.emergency_contact?.email || "",
    },
  });



  const watchedDisplayName = profileForm.watch("display_name")?.trim();

  // Compute display name
  const displayName = React.useMemo(() => {
    const dn = watchedDisplayName && watchedDisplayName !== "" ? watchedDisplayName : currentUser?.display_name ?? initialData.user.display_name;
    if (dn && dn.trim() !== "") return dn;
    const parts = [
      currentUser?.first_name ?? initialData.user.first_name ?? "",
      currentUser?.last_name ?? initialData.user.last_name ?? "",
    ].filter((part) => part && part.trim() !== "");
    if (parts.length > 0) return parts.join(" ");
    return currentUser?.email ?? initialData.user.email ?? "No Name";
  }, [watchedDisplayName, currentUser, initialData.user]);

  // Compute profile completion percentage
  const profileCompletion = React.useMemo(() => {
    const user = initialData.user;
    const fields = [
      user.first_name,
      user.last_name,
      user.email,
      user.phone,
      user.gender,
      user.date_of_birth,
      user.nationality,
      user.national_id,
      user.profile_photo_url,
      user.display_name,
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  }, [initialData.user]);



  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (event.target) event.target.value = '';

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error('Image size must be less than 8MB');
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setSelectedImageSrc(reader.result?.toString() || null);
      setSelectedFile(file);
      setCropDialogOpen(true);
    });
    reader.readAsDataURL(file);
  };

  const onCropComplete = async (croppedBlob: Blob) => {
    if (!selectedFile) return;
    setPhotoUploading(true);

    try {
      // Client-side compression
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 400,
        useWebWorker: true,
        fileType: 'image/webp'
      };

      const imageFile = new File([croppedBlob], selectedFile.name, {
        type: 'image/png',
        lastModified: Date.now(),
      });

      const compressedFile = await imageCompression(imageFile, options);

      const reader = new FileReader();
      reader.readAsDataURL(compressedFile);
      reader.onloadend = async () => {
        const base64 = reader.result?.toString();
        if (!base64) {
          toast.error("Failed to process compressed image");
          setPhotoUploading(false);
          return;
        }

        const base64Data = (base64.includes('base64,') ? base64.split('base64,')[1] : base64) || "";
        const result = await uploadProfilePhotoBase64({
          base64Data,
          fileName: compressedFile.name,
          fileType: compressedFile.type,
          fileSize: compressedFile.size,
        });

        if (result.success) {
          const successMsg = result.oldPhotoDeleted
            ? 'Profile photo updated successfully (old photo removed)'
            : 'Profile photo uploaded successfully';
          toast.success(successMsg);

          if (result.url) {
            const formDisplayName = profileForm.getValues("display_name")?.trim();
            const initialDisplayName = initialData.user.display_name?.trim();

            setUser((prev) => {
              if (!prev) return prev;
              const prevDisplayName = prev.display_name?.trim();
              const preservedDisplayName =
                (formDisplayName && formDisplayName !== "" ? formDisplayName : undefined) ??
                (prevDisplayName && prevDisplayName !== "" ? prevDisplayName : undefined) ??
                (initialDisplayName && initialDisplayName !== "" ? initialDisplayName : undefined) ??
                prev.display_name ?? "";

              return {
                ...prev,
                profile_photo_url: result.url!,
                display_name: preservedDisplayName,
              };
            });

            if (typeof initialData.user.display_name === "string") {
              const trimmed = initialData.user.display_name.trim();
              initialData.user.display_name = trimmed === "" ? null : trimmed;
            }
            initialData.user.profile_photo_url = result.url;
          }

          refreshProfile().catch((error) => {
            accountLogger.error('refreshProfile after upload failed:', error);
          });
        } else {
          toast.error(result.message);
        }
        setPhotoUploading(false);
      };
    } catch (error: unknown) {
      accountLogger.error("Upload error:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to upload photo: ${message}`);
      setPhotoUploading(false);
    }
  };



  const profilePhotoUrl = useProfilePhotoUrl(
    currentUser?.profile_photo_url ?? initialData.user.profile_photo_url ?? undefined,
    currentUser?.id
  );

  const avatarSrc = safeAvatarSrc(profilePhotoUrl ?? undefined) || undefined;

  const userInitials = getUserInitials(
    currentUser?.first_name ?? initialData.user.first_name,
    currentUser?.last_name ?? initialData.user.last_name,
    (watchedDisplayName && watchedDisplayName !== "" ? watchedDisplayName : currentUser?.display_name ?? initialData.user.display_name) ?? undefined,
    currentUser?.email ?? initialData.user.email
  );

  return (
    <div className="w-full">
      <ImageCropperDialog
        open={cropDialogOpen}
        onOpenChange={setCropDialogOpen}
        imageSrc={selectedImageSrc}
        onCropComplete={onCropComplete}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,image/jpg,image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handlePhotoUpload}
        key={Date.now()}
      />

      {/* -- PAGE HEADER -- */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold">Profile Page</h1>
        <Button variant="outline" size="sm" asChild>
          <NextLink href="/account/settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </NextLink>
        </Button>
      </div>

      {/* -- MAIN TABS -- */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6 border-b rounded-none bg-transparent h-auto p-0 gap-0 w-full overflow-x-auto justify-start scrollbar-hide">
          <TabsTrigger
            value="overview"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-2 text-sm font-medium"
          >
            <User className="h-4 w-4 mr-1.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="edit"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-2 text-sm font-medium"
          >
            <Settings className="h-4 w-4 mr-1.5" />
            Project
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-2 text-sm font-medium"
          >
            <Activity className="h-4 w-4 mr-1.5" />
            Activities
          </TabsTrigger>
          <TabsTrigger
            value="members"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-2 text-sm font-medium"
          >
            <Users className="h-4 w-4 mr-1.5" />
            Members
          </TabsTrigger>
        </TabsList>

        {/* --------------------------
            TAB: OVERVIEW
            -------------------------- */}
        <TabsContent value="overview" className="space-y-6">
          {/* Row 1: Profile card + Latest Activity */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* -- Left: Profile Card -- */}
            <Card className="md:col-span-1">
              <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
                {/* Avatar */}
                {/* Avatar */}
                <div
                  className="relative cursor-pointer group"
                  onClick={() => setProfileDialogOpen(true)}
                >
                  <Avatar className="h-24 w-24 ring-2 ring-border">
                    <AvatarImage
                      src={avatarSrc}
                      alt="Profile"
                      className="object-cover"
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                    <AvatarFallback className="text-2xl bg-gradient-to-br from-gray-700 to-gray-900 text-white">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  {photoUploading && (
                    <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                      <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs font-medium">View</span>
                  </div>
                </div>

                {/* Name + Badge */}
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <h2 className="text-lg font-semibold">{displayName}</h2>
                    {initialData.organizationMember?.role?.name && (
                      <Badge variant="secondary" className="text-xs">
                        {initialData.organizationMember.role.name}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {initialData.organizationMember?.positions?.title || "Member"}
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 w-full divide-x divide-border border rounded-lg overflow-hidden">
                  <div className="py-3 text-center">
                    <p className="text-base font-bold">{initialData.organizationMember?.employee_id ? "?" : "�"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Employee</p>
                  </div>
                  <div className="py-3 text-center">
                    <p className="text-base font-bold">
                      {initialData.organizationMember?.departments?.name
                        ? initialData.organizationMember.departments.name.slice(0, 4)
                        : "�"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Dept</p>
                  </div>
                  <div className="py-3 text-center">
                    <p className="text-base font-bold capitalize">
                      {initialData.organizationMember?.employment_status
                        ? initialData.organizationMember.employment_status.slice(0, 3)
                        : "�"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Status</p>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="w-full space-y-2 text-sm pt-2 border-t">
                  {(currentUser?.email || initialData.user.email) && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4 shrink-0" />
                      <span className="truncate">{currentUser?.email ?? initialData.user.email}</span>
                    </div>
                  )}
                  {(currentUser?.phone || initialData.user.phone) && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4 shrink-0" />
                      <span>{currentUser?.phone ?? initialData.user.phone}</span>
                    </div>
                  )}
                  {initialData.organizationMember?.work_location && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span>{initialData.organizationMember.work_location}</span>
                    </div>
                  )}
                  {initialData.organizationMember?.organization?.name && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="h-4 w-4 shrink-0" />
                      <span>{initialData.organizationMember.organization.name}</span>
                    </div>
                  )}
                  {initialData.organizationMember?.positions?.title && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Briefcase className="h-4 w-4 shrink-0" />
                      <span>{initialData.organizationMember.positions.title}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* -- Right: Latest Activity -- */}
            <Card className="md:col-span-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Latest Activity</CardTitle>
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Activity items - placeholder data */}
                {[
                  {
                    icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
                    title: "Attendance Check-in",
                    time: "Today, 08:00 AM",
                    desc: "Successfully checked in at the main office.",
                    badge: "On Time",
                    badgeClass: "bg-slate-100 text-green-700 dark:bg-green-400/20 dark:text-green-300",
                  },
                  {
                    icon: <Clock className="h-5 w-5 text-slate-600" />,
                    title: "Work Hours Logged",
                    time: "Yesterday",
                    desc: "Completed 8 hours of productive work time.",
                    badge: null,
                    badgeClass: "",
                  },
                  {
                    icon: <AlertCircle className="h-5 w-5 text-yellow-500" />,
                    title: "Profile Incomplete",
                    time: "Pending",
                    desc: `Your profile is ${profileCompletion}% complete. Fill in missing details to unlock full features.`,
                    badge: "Action Needed",
                    badgeClass: "bg-yellow-100 text-yellow-700 dark:bg-yellow-400/20 dark:text-yellow-300",
                  },
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-3 pb-4 border-b last:border-b-0 last:pb-0">
                    <div className="shrink-0 mt-0.5">{item.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{item.title}</p>
                        {item.badge && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.badgeClass}`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.time}</p>
                      <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Row 2: Profile Completion + Work Info + Employment */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* -- Employment Details (Personal Info) -- */}
            <Card className="h-full min-h-[375px]">
              <Tabs defaultValue="profile" className="w-full h-full flex flex-col">
                <CardHeader className="px-6 pt-3 pb-2">
                  <TabsList className="w-full justify-start rounded-none bg-transparent p-0 h-auto gap-6">
                    <TabsTrigger
                      value="profile"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pt-0 pb-2 text-sm font-semibold leading-none text-muted-foreground data-[state=active]:text-foreground"
                    >
                      Profile
                    </TabsTrigger>
                    <TabsTrigger
                      value="details"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pt-0 pb-2 text-sm font-semibold leading-none text-muted-foreground data-[state=active]:text-foreground"
                    >
                      Details
                    </TabsTrigger>
                  </TabsList>
                </CardHeader>
                <CardContent className="flex-1 p-4">
                  <TabsContent value="profile" className="mt-0 space-y-4">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Employee Code</p>
                        <p className="text-sm font-medium">{initialData.user.employee_code || "�"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Email Address</p>
                        <p className="text-sm font-medium truncate" title={initialData.user.email || ""}>{initialData.user.email || "�"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">First Name</p>
                        <p className="text-sm font-medium">{initialData.user.first_name || "�"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Last Name</p>
                        <p className="text-sm font-medium">{initialData.user.last_name || "�"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Display Name</p>
                        <p className="text-sm font-medium">{initialData.user.display_name || "�"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Phone Number</p>
                        <p className="text-sm font-medium">{initialData.user.phone || "�"}</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="details" className="mt-0 space-y-4">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Date of Birth</p>
                        <p className="text-sm font-medium">
                          {initialData.user.date_of_birth
                            ? new Date(initialData.user.date_of_birth).toLocaleDateString('id-ID', {
                              year: 'numeric', month: 'long', day: 'numeric',
                            })
                            : "�"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Gender</p>
                        <p className="text-sm font-medium capitalize">
                          {initialData.user.gender?.replace(/_/g, ' ') || "�"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Nationality</p>
                        <p className="text-sm font-medium">{initialData.user.nationality || "�"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">National ID</p>
                        <p className="text-sm font-medium">{initialData.user.national_id || "�"}</p>
                      </div>

                      <div className="col-span-2 pt-2 border-t mt-2">
                        <p className="text-xs font-semibold mb-3">Emergency Contact</p>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Name</p>
                            <p className="text-sm font-medium">{initialData.user.emergency_contact?.name || "�"}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Relationship</p>
                            <p className="text-sm font-medium">{initialData.user.emergency_contact?.relationship || "�"}</p>
                          </div>
                          <div className="space-y-1 col-span-2">
                            <p className="text-xs text-muted-foreground">Phone</p>
                            <p className="text-sm font-medium">{initialData.user.emergency_contact?.phone || "�"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>

            {/* -- Work Information -- */}
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Work Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  {
                    icon: <Building2 className="h-4 w-4 text-muted-foreground" />,
                    label: "Organization",
                    value: initialData.organizationMember?.organization?.name,
                  },
                  {
                    icon: <Briefcase className="h-4 w-4 text-muted-foreground" />,
                    label: "Department",
                    value: initialData.organizationMember?.departments?.name,
                  },
                  {
                    icon: <User className="h-4 w-4 text-muted-foreground" />,
                    label: "Position",
                    value: initialData.organizationMember?.positions?.title,
                  },
                  {
                    icon: <Calendar className="h-4 w-4 text-muted-foreground" />,
                    label: "Hire Date",
                    value: initialData.organizationMember?.hire_date
                      ? new Date(initialData.organizationMember.hire_date).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                      : null,
                  },
                  {
                    icon: <Clock className="h-4 w-4 text-muted-foreground" />,
                    label: "Contract",
                    value: initialData.organizationMember?.contract_type,
                  },
                  {
                    icon: <MapPin className="h-4 w-4 text-muted-foreground" />,
                    label: "Work Location",
                    value: initialData.organizationMember?.work_location,
                  },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-2.5">
                    <div className="mt-0.5 shrink-0">{item.icon}</div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="text-sm font-medium truncate">{item.value || "�"}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* -- Complete Your Profile -- */}
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Complete Your Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Profile completion</span>
                    <span className="font-medium text-foreground">{profileCompletion}%</span>
                  </div>
                  <Progress value={profileCompletion} className="h-2" />
                </div>

                {/* Checklist */}
                <div className="space-y-1.5">
                  {[
                    { label: "Full name", done: !!(initialData.user.first_name) },
                    { label: "Email address", done: !!(initialData.user.email) },
                    { label: "Phone number", done: !!(initialData.user.phone) },
                    { label: "Gender", done: !!(initialData.user.gender) },
                    { label: "Date of birth", done: !!(initialData.user.date_of_birth) },
                    { label: "Profile photo", done: !!(currentUser?.profile_photo_url || initialData.user.profile_photo_url) },
                    { label: "National ID", done: !!(initialData.user.national_id) },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2 text-xs">
                      {item.done
                        ? <CheckCircle2 className="h-3.5 w-3.5 text-black shrink-0" />
                        : <AlertCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      }
                      <span className={item.done ? "text-foreground" : "text-muted-foreground"}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        {/* --------------------------
            TAB: EDIT PROFILE
            -------------------------- */}
        <TabsContent value="edit" className="space-y-6">

          {/* Header Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* -- Left: Profile Card -- */}
            <Card className="md:col-span-1">
              <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
                {/* Avatar */}
                <div
                  className="relative cursor-pointer group"
                  onClick={() => setProfileDialogOpen(true)}
                >
                  <Avatar className="h-24 w-24 ring-2 ring-border">
                    <AvatarImage
                      src={avatarSrc}
                      alt="Profile"
                      className="object-cover"
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                    <AvatarFallback className="text-2xl bg-gradient-to-br from-gray-700 to-gray-900 text-white">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  {photoUploading && (
                    <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                      <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs font-medium">View</span>
                  </div>
                </div>

                {/* Name + Badge */}
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <h2 className="text-lg font-semibold">{displayName}</h2>
                    {initialData.organizationMember?.role?.name && (
                      <Badge variant="secondary" className="text-xs">
                        {initialData.organizationMember.role.name}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {initialData.organizationMember?.positions?.title || "Member"}
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 w-full divide-x divide-border border rounded-lg overflow-hidden">
                  <div className="py-3 text-center">
                    <p className="text-base font-bold">{initialData.organizationMember?.employee_id ? "?" : "�"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Employee</p>
                  </div>
                  <div className="py-3 text-center">
                    <p className="text-base font-bold">
                      {initialData.organizationMember?.departments?.name
                        ? initialData.organizationMember.departments.name.slice(0, 4)
                        : "�"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Dept</p>
                  </div>
                  <div className="py-3 text-center">
                    <p className="text-base font-bold capitalize">
                      {initialData.organizationMember?.employment_status
                        ? initialData.organizationMember.employment_status.slice(0, 3)
                        : "�"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Status</p>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="w-full space-y-2 text-sm pt-2 border-t">
                  {(currentUser?.email || initialData.user.email) && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4 shrink-0" />
                      <span className="truncate">{currentUser?.email ?? initialData.user.email}</span>
                    </div>
                  )}
                  {(currentUser?.phone || initialData.user.phone) && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4 shrink-0" />
                      <span>{currentUser?.phone ?? initialData.user.phone}</span>
                    </div>
                  )}
                  {initialData.organizationMember?.work_location && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span>{initialData.organizationMember.work_location}</span>
                    </div>
                  )}
                  {initialData.organizationMember?.organization?.name && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="h-4 w-4 shrink-0" />
                      <span>{initialData.organizationMember.organization.name}</span>
                    </div>
                  )}
                  {initialData.organizationMember?.positions?.title && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Briefcase className="h-4 w-4 shrink-0" />
                      <span>{initialData.organizationMember.positions.title}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* -- Right: Projects Tabs -- */}
            <Card className="md:col-span-2 h-full">
              <CardHeader className="pb-3">
                <CardTitle>Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="active" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="active">Active Projects</TabsTrigger>
                    <TabsTrigger value="archive">Archived Projects</TabsTrigger>
                  </TabsList>

                  <TabsContent value="active" className="space-y-4">
                    <div className="max-h-[320px] overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-muted-foreground/20">
                      {ACTIVE_PROJECTS.map((project) => (
                        <div key={project.id} className="p-3 border rounded-lg space-y-3 hover:bg-muted/50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex gap-3">
                              <div className="p-2 bg-primary/10 rounded-md">
                                <Folder className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold">{project.name}</p>
                                <p className="text-xs text-muted-foreground">{project.client}</p>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-primary/20 bg-primary/5 text-primary">
                              Active
                            </Badge>
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px]">
                              <span className="text-muted-foreground font-medium">Implementation</span>
                              <span className="font-bold text-primary">{project.progress}%</span>
                            </div>
                            <Progress value={project.progress} className="h-1.5" />
                          </div>
                          <div className="flex items-center justify-between text-[10px] pt-1">
                            <div className="flex items-center gap-1.5 text-muted-foreground px-2 py-0.5 bg-muted rounded-full">
                              <Calendar className="h-3 w-3" />
                              <span>Due {project.dueDate}</span>
                            </div>
                            <div className="flex -space-x-1.5">
                              {[1, 2, 3].map(i => (
                                <div key={i} className="h-6 w-6 rounded-full border-2 border-background bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[8px] font-bold">
                                  {String.fromCharCode(64 + i)}
                                </div>
                              ))}
                              <div className="h-6 w-6 rounded-full border-2 border-background bg-primary/10 flex items-center justify-center text-[8px] font-bold text-primary">
                                +2
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="archive" className="space-y-4">
                    <div className="max-h-[320px] overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-muted-foreground/20">
                      {ARCHIVED_PROJECTS.map((project) => (
                        <div key={project.id} className="p-3 border rounded-lg space-y-3 bg-muted/30 opacity-80 hover:opacity-100 transition-opacity">
                          <div className="flex items-start justify-between">
                            <div className="flex gap-3">
                              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-md">
                                <Archive className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold">{project.name}</p>
                                <p className="text-xs text-muted-foreground">{project.client}</p>
                              </div>
                            </div>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                              {project.lifecycle_status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground pt-1">
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                            <span>Delivered on {project.completedDate}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* --------------------------
            TAB: ACTIVITIES (placeholder)
            -------------------------- */}
        <TabsContent value="activity">
          <Card>
            <CardContent className="py-16 text-center">
              <Activity className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Activity history coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --------------------------
            TAB: MEMBERS (placeholder)
            -------------------------- */}
        <TabsContent value="members">
          <Card>
            <CardContent className="py-16 text-center">
              <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Team members view coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* -- PROFILE PHOTO DIALOG -- */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        {/* Removed max-w constraint to allow larger image */}
        <DialogContent className="bg-transparent border-none shadow-none p-0 flex items-center justify-center max-w-none w-auto">
          <div className="sr-only">
            <DialogTitle>Profile Photo</DialogTitle>
          </div>
          <div className="relative">
            {/* Increased size significantly */}
            <Avatar className="h-[500px] w-[500px] ring-4 ring-white/20 shadow-2xl">
              <AvatarImage
                src={avatarSrc}
                alt="Profile"
                className="object-cover"
              />
              <AvatarFallback className="text-9xl bg-gradient-to-br from-gray-700 to-gray-900 text-white">
                {userInitials}
              </AvatarFallback>
            </Avatar>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
