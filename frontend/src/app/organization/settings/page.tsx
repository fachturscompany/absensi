"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { Textarea } from "@/components/ui/textarea";

import { Badge } from "@/components/ui/badge";

import { Separator } from "@/components/ui/separator";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {

  AlertDialog,

  AlertDialogAction,

  AlertDialogCancel,

  AlertDialogContent,

  AlertDialogDescription,

  AlertDialogFooter,

  AlertDialogHeader,

  AlertDialogTitle,

  AlertDialogTrigger,

} from "@/components/ui/alert-dialog";

import { toast } from "sonner";

import {

  Building2,

  Save,

  Eye,

  EyeOff,

  ClipboardCheck,

  Check,

  Upload,

  ChevronsUpDown,
  RefreshCw,

  Loader2,

  Mail,

  Phone,

  Globe,

  Clock,

  Image as ImageIcon,
} from "@/components/icons/lucide-exports";

import { getCurrentUserOrganization, updateOrganization, regenerateInviteCode, deleteOrganization, OrganizationUpdateData } from "@/action/organization-settings";

import { INDUSTRY_OPTIONS, findIndustryValue } from "@/lib/constants/industries";

import { useImageCompression } from "@/hooks/use-image-compression";
import { useOrgStore } from "@/store/org-store";
import { organizationLogger } from '@/lib/logger';

import { cn } from "@/lib/utils";
import type { GeoCountry, GeoCity } from "@/types/geo";


// Helper functions for geo data
const getStateLabelFromGeo = (geoData: GeoCountry | null, value: string | null): string => {
  if (!geoData || !value) return "";
  const state = geoData.states.find((s) => s.value === value);
  return state?.label ?? "";
};

const getCityLabelFromGeo = (geoData: GeoCountry | null, value: string | null): string => {
  if (!geoData || !value) return "";
  for (const state of geoData.states) {
    const city = state.cities.find((c) => c.value === value);
    if (city) return city.label;
  }
  return "";
};

const normalizeStateValue = (geoData: GeoCountry | null, input: string | null): string => {
  if (!geoData || !input) return "";
  const normalized = input.trim().toLowerCase();
  const match = geoData.states.find(
    (s) => s.value.toLowerCase() === normalized || s.label.toLowerCase() === normalized
  );
  return match?.value ?? "";
};

const normalizeCityValue = (geoData: GeoCountry | null, input: string | null, stateValue: string): string => {
  if (!geoData || !input || !stateValue) return "";
  const state = geoData.states.find((s) => s.value === stateValue);
  if (!state) return "";
  const normalized = input.trim().toLowerCase();
  const match = state.cities.find(
    (c) => c.value.toLowerCase() === normalized || c.label.toLowerCase() === normalized
  );
  return match?.value ?? "";
};


interface OrganizationData {

  id: number;

  code: string;

  name: string;

  legal_name: string | null;

  description: string | null;

  address: string | null;

  city: string | null;

  state_province: string | null;

  postal_code: string | null;

  phone: string | null;

  website: string | null;

  email: string | null;

  logo_url: string | null;

  inv_code: string;

  is_active: boolean;

  timezone: string | null;

  currency_code: string | null;

  country_code: string;

  industry: string | null;

  time_format: '12h' | '24h';

  created_at: string;

  updated_at: string;

}



export default function SettingsPage() {
  const queryClient = useQueryClient();

  const orgStore = useOrgStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [regenerating, setRegenerating] = useState(false);

  const [showInviteCode, setShowInviteCode] = useState(false);

  const [inviteCodeCopied, setInviteCodeCopied] = useState(false);

  const [orgData, setOrgData] = useState<OrganizationData | null>(null);

  // State for delete confirmation
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState<{

    name: string;

    description: string;

    address: string;

    city: string;

    state_province: string;

    postal_code: string;

    phone: string;

    website: string;

    email: string;

    timezone: string;

    currency_code: string;

    country_code: string;

    industry: string;

    time_format: '12h' | '24h';

  }>({

    name: "",

    description: "",

    address: "",

    city: "",

    state_province: "",

    postal_code: "",

    phone: "",

    website: "",

    email: "",

    timezone: "UTC",

    currency_code: "USD",

    country_code: "ID",

    industry: "",

    time_format: "24h"

  });

  const [logoFile, setLogoFile] = useState<File | null>(null);

  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [geoData, setGeoData] = useState<GeoCountry | null>(null);
  const [statePopoverOpen, setStatePopoverOpen] = useState(false);
  const [cityPopoverOpen, setCityPopoverOpen] = useState(false);
  const geoCacheRef = useRef<Record<string, GeoCountry>>({});
  const selectedCountry = (formData.country_code || "ID").toUpperCase();
  const stateOptions = geoData?.states ?? [];
  const cityOptions = useMemo<GeoCity[]>(() => {
    if (!geoData) return [];
    if (!formData.state_province) return [];
    const state = geoData.states.find((s) => s.value === formData.state_province);
    return state ? state.cities : [];
  }, [geoData, formData.state_province]);
  const stateLabel = useMemo(
    () => getStateLabelFromGeo(geoData, formData.state_province),
    [geoData, formData.state_province],
  );
  const cityLabel = useMemo(
    () => getCityLabelFromGeo(geoData, formData.city),
    [geoData, formData.city],
  );
  const fetchGeoData = useCallback(
    async (countryCode: string) => {
      const key = (countryCode || "ID").toUpperCase();
      if (geoCacheRef.current[key]) {
        setGeoData(geoCacheRef.current[key]);
        return geoCacheRef.current[key];
      }

      try {
        const response = await fetch(`/api/geo/${key}`);
        if (!response.ok) {
          throw new Error("Failed to fetch geo data");
        }
        const data: GeoCountry = await response.json();
        geoCacheRef.current[key] = data;
        setGeoData(data);
        return data;
      } catch (error) {
        organizationLogger.error("Geo data error:", error);
        toast.error("Failed to load geographic data");
        return null;
      }
    },
    [],
  );

  useEffect(() => {
    fetchGeoData(selectedCountry);
  }, [selectedCountry, fetchGeoData]);


  // Image compression hook

  const {

    compressImage,

    isCompressing,

    error: compressionError,

    validateFile

  } = useImageCompression({ preset: 'standard' });



  // Fetch real organization data

  useEffect(() => {

    const fetchOrganizationData = async () => {

      setLoading(true);

      try {

        const result = await getCurrentUserOrganization();



        if (result.success && result.data) {

          const data = result.data;

          setOrgData(data as any as OrganizationData);

          const countryCode = (data.country_code || "ID").toUpperCase();
          const geo = await fetchGeoData(countryCode);
          const normalizedState = normalizeStateValue(geo, data.state_province ?? null);
          const normalizedCity = normalizeCityValue(geo, data.city ?? null, normalizedState);

          setFormData({

            name: data.name || "",

            description: (data as any).description || "",

            address: data.address || "",

            city: normalizedCity,
            state_province: normalizedState,
            postal_code: data.postal_code || "",

            phone: data.phone || "",

            website: data.website || "",

            email: data.email || "",

            timezone: data.timezone || "UTC",

            currency_code: data.currency_code || "USD",

            country_code: countryCode,
            industry: findIndustryValue((data as any).industry),

            time_format: data.time_format || '24h'

          });

          setLogoPreview(data.logo_url ?? null);

        } else {

          toast.error(result.message || "Failed to load organization data");

        }

      } catch {

        toast.error("An error occurred while loading organization data");

      } finally {

        setLoading(false);

      }

    };



    if (orgStore.organizationId) {
      fetchOrganizationData();
    }

  }, [orgStore.organizationId]);

  // Handle logo file selection with compression

  const handleLogoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {

    const file = event.target.files?.[0];

    if (!file) return;



    try {

      // Validate file first

      const validation = validateFile(file);

      if (!validation.isValid) {

        toast.error(validation.error || 'Invalid file');

        return;

      }



      // Show upload progress

      toast.info('Upload logo...');



      // Compress the image

      const compressionResult = await compressImage(file);

      if (!compressionResult) {

        toast.error('Failed to process image');

        return;

      }



      // Preserve original filename in compressed file

      const compressedFile = new File([compressionResult.file], file.name, {

        type: compressionResult.file.type,

        lastModified: Date.now(),

      });



      // Update state with compressed file (with preserved filename)

      setLogoFile(compressedFile);

      setLogoPreview(compressionResult.dataUrl || '');



      // Show success without compression details

      toast.success('Logo ready to upload');



      // Optional: Log compression info to console for debugging

      const originalSizeMB = (file.size / (1024 * 1024)).toFixed(2);

      const compressedSizeMB = (compressionResult.compressedSize / (1024 * 1024)).toFixed(2);

      organizationLogger.debug(`Image compressed: ${originalSizeMB}MB → ${compressedSizeMB}MB (${compressionResult.compressionRatio}% reduction)`);

      organizationLogger.debug('Original filename preserved:', compressedFile.name);

    } catch (error) {

      organizationLogger.error('Compression error:', error);

      toast.error('Failed to process image. Please try again.');

    }

  };



  // Upload logo to storage with correct bucket structure

  const uploadLogo = async (file: File): Promise<string | null> => {

    try {

      const { createClient } = await import('@/utils/supabase/client');

      // Helper function to delete old logo

      const deleteOldLogo = async (logoUrl: string) => {

        if (!logoUrl) return { success: false, message: 'No logo URL provided' }



        try {

          const filePath = logoUrl.split('/').pop()

          if (!filePath) return { success: false, message: 'Invalid logo URL' }



          const { createClient } = await import('@/utils/supabase/client')

          const supabase = createClient()



          const { error } = await supabase.storage

            .from('logo')

            .remove([`organization/${filePath}`])



          if (error) {

            return { success: false, message: error.message }

          }



          return { success: true, message: 'Logo deleted' }

        } catch (error) {

          return { success: false, message: String(error) }

        }

      }

      const supabase = createClient();



      // Debug: Log file details

      organizationLogger.debug('Uploading file:', {

        name: file.name,

        type: file.type,

        size: file.size,

        lastModified: file.lastModified

      });



      // Create file name with safeguards and fallback

      let fileName;

      let fileNameToUse = file.name;



      // Fallback if filename is missing or invalid

      if (!fileNameToUse || typeof fileNameToUse !== 'string' || fileNameToUse.trim() === '') {

        organizationLogger.warn('Invalid or missing filename, creating random fallback');

        const extension = file.type.split('/')[1] || 'jpg';

        const timestamp = Date.now();

        const randomId = Math.random().toString(36).substring(2, 15);

        fileNameToUse = `logo-${timestamp}-${randomId}.${extension}`;

        organizationLogger.debug('Generated fallback filename:', fileNameToUse);

      }



      try {

        // Generate logo path: organization/org_{id}_{filename}

        const orgId = orgData?.id || 0

        fileName = `organization/org_${orgId}_${fileNameToUse}`;

      } catch (error) {

        organizationLogger.error('Error generating file path:', error);

        toast.error('Invalid file name. Please choose another file.');

        return null;

      }



      // Delete old logo first if it exists

      if (orgData?.logo_url) {

        organizationLogger.debug('Deleting old logo before uploading new one...');

        const deleteResult = await deleteOldLogo(orgData.logo_url);

        if (deleteResult) {

          organizationLogger.debug('Old logo deleted successfully');

        }

        // Continue with upload even if deletion fails

      }



      // Upload new logo

      const { error } = await supabase.storage

        .from('logo')

        .upload(fileName, file, { upsert: true });



      if (error) {

        organizationLogger.error('Upload error:', error);

        toast.error(`Upload failed: ${error.message}`);

        return null;

      }



      // Get public URL

      const { data: publicUrlData } = supabase.storage

        .from('logo')

        .getPublicUrl(fileName);



      return publicUrlData.publicUrl;

    } catch (error) {

      organizationLogger.error('Upload logo error:', error);

      toast.error('Failed to upload logo. Please try again.');

      return null;

    }

  };



  const handleSave = async () => {

    if (!orgData) {

      toast.error("No organization data available");

      return;

    }



    setSaving(true);

    try {

      let logoUrl = orgData?.logo_url;



      // Upload logo if new file is selected

      if (logoFile) {

        const uploadedUrl = await uploadLogo(logoFile);

        if (uploadedUrl) {

          logoUrl = uploadedUrl;

        } else {

          toast.error("Failed to upload logo");

          setSaving(false);

          return;

        }

      }


      // Convert geo values to labels before saving to database
      // Only use label, never send raw value (e.g., "id-ji-malang")
      let cityLabel = getCityLabelFromGeo(geoData, formData.city);
      let stateLabel = getStateLabelFromGeo(geoData, formData.state_province);

      // If conversion failed, check if formData already contains a label (not a value)
      // Values typically contain hyphens and country codes (e.g., "id-ji-malang")
      // Labels are plain text (e.g., "Malang")
      if (!cityLabel && formData.city) {
        // If it doesn't look like a value (no pattern like "id-xx-xxx"), assume it's already a label
        const looksLikeValue = /^[a-z]{2}-[a-z]{2}(-[a-z0-9-]+)?$/i.test(formData.city);
        if (!looksLikeValue) {
          cityLabel = formData.city; // Already a label
        }
      }

      if (!stateLabel && formData.state_province) {
        const looksLikeValue = /^[a-z]{2}-[a-z]{2}$/i.test(formData.state_province);
        if (!looksLikeValue) {
          stateLabel = formData.state_province; // Already a label
        }
      }

      const updateData: OrganizationUpdateData = {

        name: formData.name,

        legal_name: formData.name,

        description: formData.description,

        address: formData.address,

        city: cityLabel,

        state_province: stateLabel,

        postal_code: formData.postal_code,

        phone: formData.phone,

        website: formData.website,

        email: formData.email,

        timezone: formData.timezone,

        currency_code: formData.currency_code,

        country_code: formData.country_code,

        industry: formData.industry,

        logo_url: logoUrl,

        time_format: formData.time_format

      };



      const result = await updateOrganization(String(orgStore.organizationId), updateData as any);



      if (result.success) {

        toast.success("Organization settings updated successfully!");

        // Invalidate organization query cache for immediate update across all components
        queryClient.invalidateQueries({ queryKey: ['organization', 'full-data'] });

        // Reset logo file after successful upload

        setLogoFile(null);

        // Refresh organization data

        const refreshResult = await getCurrentUserOrganization();

        if (refreshResult.success && refreshResult.data) {

          setOrgData(refreshResult.data as any as OrganizationData);

        }

      } else {

        toast.error(result.message || "Failed to update organization settings");

      }

    } catch {

      toast.error("An error occurred while updating organization settings");

    } finally {

      setSaving(false);

    }

  };



  const copyInviteCode = async () => {

    if (orgData?.inv_code) {

      await navigator.clipboard.writeText(orgData.inv_code);

      setInviteCodeCopied(true);

      toast.success("Invite code copied to clipboard!");

      setTimeout(() => setInviteCodeCopied(false), 2000);

    }

  };



  const handleDeleteOrganization = async () => {
    if (!orgData || deleteConfirmation !== orgData.name) {
      toast.error("Confirmation text does not match the organization name.");
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteOrganization(String(orgData.id));
      if (result.success) {
        toast.success("Organization deleted successfully. Redirecting...");

        // Clear the organization cookie before redirecting
        await fetch('/api/organization/clear', { method: 'POST' });

        // Hard redirect to organization selection page after deletion
        setTimeout(() => {
          window.location.href = "/organization";
        }, 1500); // Slightly shorter timeout as cookie clearing is fast
      } else {
        toast.error(result.message || "Failed to delete organization.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRegenerateInviteCode = async () => {

    setRegenerating(true);

    try {

      const result = await regenerateInviteCode(String(orgStore.organizationId));



      if (result.success) {

        toast.success(result.message);

        // Refresh organization data to get the new invite code

        const refreshResult = await getCurrentUserOrganization();

        if (refreshResult.success && refreshResult.data) {

          const refreshed = refreshResult.data as any as Partial<OrganizationData>;

          setOrgData({

            ...(refreshResult.data as any as OrganizationData),

            time_format: refreshed.time_format || '24h'

          });

        }

      } else {

        toast.error(result.message || "Failed to regenerate invitation code");

      }

    } catch {

      toast.error("An error occurred while regenerating invitation code");

    } finally {

      setRegenerating(false);

    }

  };



  if (loading) {

    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }



  return (
    <div className="flex flex-1 flex-col w-full">
      <div className="p-6 w-full overflow-x-auto">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start">
            {/* Logo */}
            <div className="shrink-0">
              {logoPreview || orgData?.logo_url ? (
                <div className="w-20 h-20 rounded-lg border border-border bg-muted overflow-hidden flex items-center justify-center">
                  <img
                    src={logoPreview || orgData?.logo_url || ''}
                    alt={`${orgData?.name || 'Organization'} logo`}
                    className="block w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-lg border border-border bg-muted overflow-hidden flex items-center justify-center">
                  <Building2 className="h-10 w-10 text-muted-foreground/50" />
                </div>
              )}
            </div>

            {/* Organization Info */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-bold">{orgData?.name || 'Organization Settings'}</h1>
                <Badge
                  variant="secondary"
                  className={
                    orgData?.is_active
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-400/30"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-400/20 dark:text-amber-200 border border-amber-200 dark:border-amber-400/30"
                  }
                >
                  {orgData?.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>

              <p className="text-muted-foreground">
                Manage your organization information, settings, and preferences
              </p>

              {/* Invitation Code - Compact */}
              <div className="flex items-center gap-4 mt-4">
                <Label className="text-sm font-medium text-muted-foreground">
                  Invitation Code:
                </Label>
                <div className="flex items-center gap-2">
                  <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                    {showInviteCode ? orgData?.inv_code : "••••••••"}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowInviteCode(!showInviteCode)}
                    className="h-8 w-8 p-0"
                  >
                    {showInviteCode ? (
                      <EyeOff className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={copyInviteCode}
                    disabled={!showInviteCode}
                    className="h-8 w-8 p-0"
                  >
                    {inviteCodeCopied ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <ClipboardCheck className="h-3 w-3" />
                    )}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={regenerating}
                        className="h-8 w-8 p-0"
                      >
                        {regenerating ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Regenerate invite code?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action will deactivate the current invitation code immediately. New members must use the new code.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={regenerating}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRegenerateInviteCode} disabled={regenerating}>
                          {regenerating ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Regenerating...
                            </>
                          ) : (
                            "Yes, regenerate"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Section with 2 Column Layout */}
        <div className="grid gap-6 lg:grid-cols-2">

          {/* Left Column - Basic Information */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5 text-primary" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Organization name, logo, and general details
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Logo Upload Section */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Organization Logo</Label>
                <div className="flex items-center gap-4">
                  {logoPreview ? (
                    <div className="w-16 h-16 rounded-lg border border-border bg-muted overflow-hidden flex items-center justify-center">
                      <img
                        src={logoPreview}
                        alt={`${orgData?.name || 'Organization'} logo preview`}
                        className="block w-full h-full object-cover"
                      />
                    </div>

                  ) : (
                    <div className="w-16 h-16 rounded-lg border border-border bg-muted overflow-hidden flex items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => document.getElementById('logo')?.click()}
                      disabled={isCompressing}
                      className="text-sm"
                    >
                      {isCompressing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          {logoPreview ? 'Change' : 'Upload'}
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG, WEBP (max 5MB)
                    </p>
                    {compressionError && (
                      <p className="text-xs text-destructive">
                        {compressionError}
                      </p>
                    )}
                  </div>
                </div>
              </div>



              <Separator />

              {/* Organization Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Organization Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter organization name"
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground">
                  This will be used as both display name and legal name
                </p>
              </div>



              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of your organization"
                  className="min-h-20 resize-none"
                />
              </div>

              {/* Industry */}
              <div className="space-y-2">
                <Label htmlFor="industry" className="text-sm font-medium">
                  Industry
                </Label>
                <Select value={formData.industry} onValueChange={(value) => setFormData({ ...formData, industry: value })}>
                  <SelectTrigger id="industry" className="h-10">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

            </CardContent>
          </Card>

          {/* Right Column - Contact & Location */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Phone className="h-5 w-5 text-primary" />
                Contact & Location
              </CardTitle>
              <CardDescription>
                Contact details and address information
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="info@example.com"
                  className="h-10"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+62 xxx xxxx xxxx"
                  className="h-10"
                />
              </div>

              {/* Website */}
              <div className="space-y-2">
                <Label htmlFor="website" className="text-sm font-medium flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  Website
                </Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://example.com"
                  className="h-10"
                />
              </div>

              <Separator />

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium">
                  Street Address
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Main Street"
                  className="h-10"
                />
              </div>

              {/* Country and State/Province in Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country" className="text-sm font-medium">
                    Country
                  </Label>
                  <Select value={formData.country_code} onValueChange={(value) => setFormData({ ...formData, country_code: value })}>
                    <SelectTrigger id="country" className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ID">Indonesia</SelectItem>
                      <SelectItem value="MY">Malaysia</SelectItem>
                      <SelectItem value="SG">Singapore</SelectItem>
                      <SelectItem value="TH">Thailand</SelectItem>
                      <SelectItem value="PH">Philippines</SelectItem>
                      <SelectItem value="VN">Vietnam</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state" className="text-sm font-medium">
                    State / Province
                  </Label>
                  <Popover open={statePopoverOpen} onOpenChange={setStatePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={statePopoverOpen}
                        className="w-full justify-between h-10"
                      >
                        {stateLabel || "Select state..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search state..." />
                        <CommandEmpty>No state found.</CommandEmpty>
                        <CommandGroup>
                          <CommandList>
                            {stateOptions.map((state) => (
                              <CommandItem
                                key={state.value}
                                value={state.value}
                                onSelect={(currentValue) => {
                                  setFormData({ ...formData, state_province: currentValue === formData.state_province ? "" : currentValue });
                                  setStatePopoverOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.state_province === state.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {state.label}
                              </CommandItem>
                            ))}
                          </CommandList>
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* City and Postal Code in Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-medium">
                    City
                  </Label>
                  <Popover open={cityPopoverOpen} onOpenChange={setCityPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={cityPopoverOpen}
                        className="w-full justify-between h-10"
                        disabled={!formData.state_province}
                      >
                        {cityLabel || "Select city..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search city..." />
                        <CommandEmpty>No city found.</CommandEmpty>
                        <CommandGroup>
                          <CommandList>
                            {cityOptions.map((city) => (
                              <CommandItem
                                key={city.value}
                                value={city.value}
                                onSelect={(currentValue) => {
                                  setFormData({ ...formData, city: currentValue === formData.city ? "" : currentValue });
                                  setCityPopoverOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.city === city.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {city.label}
                              </CommandItem>
                            ))}
                          </CommandList>
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postal_code" className="text-sm font-medium">
                    Postal Code
                  </Label>
                  <Input
                    id="postal_code"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    placeholder="12345"
                    className="h-10"
                  />
                </div>
              </div>

              <Separator />

              {/* Timezone */}
              <div className="space-y-2">
                <Label htmlFor="timezone" className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  Timezone
                </Label>
                <Select value={formData.timezone} onValueChange={(value) => setFormData({ ...formData, timezone: value })}>
                  <SelectTrigger id="timezone" className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-64 overflow-y-auto">
                    <SelectItem value="Asia/Jakarta">Asia/Jakarta (WIB, UTC+7)</SelectItem>
                    <SelectItem value="Asia/Makassar">Asia/Makassar (WITA, UTC+8)</SelectItem>
                    <SelectItem value="Asia/Jayapura">Asia/Jayapura (WIT, UTC+9)</SelectItem>
                    <SelectItem value="Asia/Singapore">Asia/Singapore (UTC+8)</SelectItem>
                    <SelectItem value="Asia/Kuala_Lumpur">Asia/Kuala_Lumpur (UTC+8)</SelectItem>
                    <SelectItem value="Asia/Bangkok">Asia/Bangkok (UTC+7)</SelectItem>
                    <SelectItem value="America/New_York">America/New_York (UTC-5/-4)</SelectItem>
                    <SelectItem value="Europe/London">Europe/London (UTC+0/+1)</SelectItem>
                    <SelectItem value="UTC">UTC (Coordinated Universal Time)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Currency */}
              <div className="space-y-2">
                <Label htmlFor="currency" className="text-sm font-medium">
                  Currency
                </Label>
                <Select value={formData.currency_code} onValueChange={(value) => setFormData({ ...formData, currency_code: value })}>
                  <SelectTrigger id="currency" className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="IDR">IDR - Indonesian Rupiah</SelectItem>
                    <SelectItem value="MYR">MYR - Malaysian Ringgit</SelectItem>
                    <SelectItem value="SGD">SGD - Singapore Dollar</SelectItem>
                    <SelectItem value="THB">THB - Thai Baht</SelectItem>
                    <SelectItem value="PHP">PHP - Philippine Peso</SelectItem>
                    <SelectItem value="VND">VND - Vietnamese Dong</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Danger Zone */}
        <Card className="border-destructive/50 shadow-sm mt-6">
          <CardHeader>
            <CardTitle className="text-destructive">Delete {orgData?.name}</CardTitle>
            <CardDescription>
              These actions are permanent and cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the
                    <strong className="px-1">{orgData?.name}</strong>
                    organization and all of its associated data, including members, groups, and attendance records.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-2 py-2">
                  <Label htmlFor="org-name-confirmation">Please type <strong className="px-1">{orgData?.name}</strong> to confirm.</Label>
                  <Input
                    id="org-name-confirmation"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    autoComplete="off"
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={deleteConfirmation !== orgData?.name || isDeleting}
                    onClick={handleDeleteOrganization}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {isDeleting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</>
                    ) : (
                      'I understand, delete this organization'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end pt-6">
          <Button
            onClick={handleSave}
            disabled={saving}
            size="lg"
            className="min-w-[160px] gap-2 px-6 py-3 text-base font-semibold bg-black text-white hover:bg-black/90 disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
