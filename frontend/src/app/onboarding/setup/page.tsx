"use client";

import { useEffect, useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useOrgStore } from "@/store/org-store";
import { useUserStore } from "@/store/user-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    AlertCircle,
    CheckCircle2,
    Loader2,
    Building2,
    MapPin,
    ClipboardCheck,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    createOrganization,
    validateOrganizationCode,
    getAvailableTimezones,
    getAvailableRoles,
} from "@/action/create-organization";
import { INDUSTRY_OPTIONS } from "@/lib/constants/industries";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

interface GeoCity {
    value: string;
    label: string;
    postal_codes?: string[];
}

interface GeoState {
    value: string;
    label: string;
    cities: GeoCity[];
}

interface GeoCountry {
    code: string;
    name: string;
    states: GeoState[];
}

// ─── Step Config ─────────────────────────────────────────────────────────────

const STEPS = [
    {
        number: 1,
        title: "Basic Information",
        description: "Required organization details",
        icon: Building2,
    },
    {
        number: 2,
        title: "Address & Location",
        description: "Optional – can be updated later",
        icon: MapPin,
    },
    {
        number: 3,
        title: "Review",
        description: "Confirm and create your organization",
        icon: ClipboardCheck,
    },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function OnboardingSetupPage() {
    const orgStore = useOrgStore();
    const userStore = useUserStore();
    const queryClient = useQueryClient();

    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [globalError, setGlobalError] = useState<string | null>(null);
    const [isHydrated, setIsHydrated] = useState(false);

    // ── Data loading
    const [timezones, setTimezones] = useState<string[]>([]);
    const [locationData, setLocationData] = useState<GeoCountry | null>(null);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [defaultRoleCode, setDefaultRoleCode] = useState("A001");

    // ── Form data
    const [formData, setFormData] = useState({
        orgName: "",
        orgCode: "",
        timezone: "Asia/Jakarta",
        industry: "",
        phone: "",
        email: "",
        // Address
        address: "",
        stateProvince: "",
        city: "",
        postalCode: "",
    });

    // ── Derived location state
    const [availableCities, setAvailableCities] = useState<GeoCity[]>([]);
    const [availablePostalCodes, setAvailablePostalCodes] = useState<string[]>([]);

    // ── Code validation
    const [codeValidating, setCodeValidating] = useState(false);
    const [codeValid, setCodeValid] = useState(true);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const codeValidationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // ── Hydration + data load ─────────────────────────────────────────────────

    useEffect(() => {
        setIsHydrated(true);
        loadInitialData();
        return () => {
            if (codeValidationTimeoutRef.current) {
                clearTimeout(codeValidationTimeoutRef.current);
            }
        };
         
    }, []);

    const loadInitialData = async () => {
        try {
            setIsLoadingData(true);
            const [timezonesList, rolesList, geoResult] = await Promise.all([
                getAvailableTimezones(),
                getAvailableRoles(),
                fetch("/api/geo/ID")
                    .then((r) => r.json())
                    .catch(() => null),
            ]);

            setTimezones(timezonesList);

            if (geoResult?.code === "ID" && geoResult?.states) {
                setLocationData(geoResult);
            }

            if (rolesList?.length > 0) {
                setDefaultRoleCode(rolesList[0]?.code ?? "A001");
            }
        } catch (err) {
            console.error("[ONBOARDING] Failed to load initial data:", err);
        } finally {
            setIsLoadingData(false);
        }
    };

    // ── Field helpers ─────────────────────────────────────────────────────────

    const setField = (key: string, value: string) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
    };

    const validateField = (name: string, value: string): string => {
        switch (name) {
            case "orgName":
                if (!value.trim()) return "Organization name is required";
                if (value.length < 2) return "Minimum 2 characters";
                if (value.length > 100) return "Maximum 100 characters";
                return "";
            case "orgCode":
                if (!value.trim()) return "Organization code is required";
                if (value.length > 20) return "Maximum 20 characters";
                return "";
            case "phone":
                if (value && value.length > 20) return "Maximum 20 characters";
                return "";
            case "email":
                if (value && !value.includes("@")) return "Invalid email format";
                return "";
            default:
                return "";
        }
    };

    const updateField = (name: string, value: string) => {
        setField(name, value);
        const err = validateField(name, value);
        setFieldErrors((prev) => ({ ...prev, [name]: err }));
    };

    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toUpperCase().slice(0, 20);
        setFormData((prev) => ({ ...prev, orgCode: value }));
        setFieldErrors((prev) => ({ ...prev, orgCode: "" }));

        if (codeValidationTimeoutRef.current) {
            clearTimeout(codeValidationTimeoutRef.current);
        }

        if (value.length > 0) {
            setCodeValidating(true);
            codeValidationTimeoutRef.current = setTimeout(async () => {
                try {
                    const result = await validateOrganizationCode(value);
                    setCodeValid(result.isValid);
                    if (!result.isValid) {
                        setFieldErrors((prev) => ({
                            ...prev,
                            orgCode: result.message || "Code already taken",
                        }));
                    }
                } catch {
                    setCodeValid(false);
                    setFieldErrors((prev) => ({ ...prev, orgCode: "Error validating code" }));
                } finally {
                    setCodeValidating(false);
                }
            }, 500);
        } else {
            setCodeValid(true);
        }
    };

    const handleStateChange = (stateValue: string) => {
        const selectedState = locationData?.states.find((s) => s.value === stateValue);
        setAvailableCities(selectedState?.cities ?? []);
        setAvailablePostalCodes([]);
        setFormData((prev) => ({ ...prev, stateProvince: stateValue, city: "", postalCode: "" }));
    };

    const handleCityChange = (cityValue: string) => {
        const selectedCity = availableCities.find((c) => c.value === cityValue);
        setFormData((prev) => ({ ...prev, city: cityValue, postalCode: "" }));
        setAvailablePostalCodes(selectedCity?.postal_codes ?? []);
    };

    // ── Navigation ────────────────────────────────────────────────────────────

    const canProceedStep1 = (): boolean => {
        if (!formData.orgName.trim() || formData.orgName.length < 2) return false;
        if (!formData.orgCode.trim()) return false;
        if (!codeValid || codeValidating) return false;
        if (fieldErrors.orgName || fieldErrors.orgCode || fieldErrors.email || fieldErrors.phone)
            return false;
        return true;
    };

    const goNext = () => {
        if (currentStep === 1) {
            // Re-validate required fields before advancing
            const nameErr = validateField("orgName", formData.orgName);
            const codeErr = validateField("orgCode", formData.orgCode);
            if (nameErr || codeErr) {
                setFieldErrors((prev) => ({ ...prev, orgName: nameErr, orgCode: codeErr }));
                return;
            }
        }
        setCurrentStep((s) => Math.min(s + 1, STEPS.length));
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const goPrev = () => {
        setCurrentStep((s) => Math.max(s - 1, 1));
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // ── Submit ────────────────────────────────────────────────────────────────

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            setGlobalError(null);

            const toastId = toast.loading("Creating your organization...");

            const result = await createOrganization({
                orgName: formData.orgName,
                orgCode: formData.orgCode,
                timezone: formData.timezone,
                industry: formData.industry,
                phone: formData.phone,
                email: formData.email,
                website: "",
                address: formData.address,
                city: formData.city,
                stateProvince: formData.stateProvince,
                postalCode: formData.postalCode,
                defaultRoleId: defaultRoleCode,
            });

            if (!result.success) {
                const msg = result.message || "Failed to create organization";
                const detail = result.error ? ` (${result.error})` : "";
                toast.dismiss(toastId);
                toast.error(msg + detail);
                setGlobalError(msg + detail);
                return;
            }

            if (result.data) {
                // Invalidate caches
                queryClient.invalidateQueries({ queryKey: ["dashboard"] });
                queryClient.invalidateQueries({ queryKey: ["members"] });
                queryClient.invalidateQueries({ queryKey: ["organization"] });

                orgStore.setOrganizationId(result.data.organizationId, result.data.organizationName);
                orgStore.setTimezone(formData.timezone);
                userStore.setRole(defaultRoleCode, result.data.organizationId);

                toast.dismiss(toastId);
                toast.success(`Organization "${result.data.organizationName}" created! Welcome aboard 🎉`);

                // Set org_id cookie via API so middleware knows we're good
                await fetch("/api/organization/select", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ organizationId: result.data.organizationId }),
                });

                await new Promise((r) => setTimeout(r, 1000));
                window.location.href = "/";
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : "An unexpected error occurred";
            setGlobalError(msg);
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Loading state ─────────────────────────────────────────────────────────

    if (!isHydrated) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // ── Rendered steps ────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                {/* ── Header ── */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground mb-4 shadow-lg">
                        <Building2 className="w-7 h-7" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        Set Up Your Organization
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm">
                        Let&apos;s get started — this takes less than 2 minutes.
                    </p>
                </div>

                {/* ── Step Indicator ── */}
                <div className="flex items-center justify-center gap-0 mb-8">
                    {STEPS.map((step, idx) => {
                        const isCompleted = currentStep > step.number;
                        const isActive = currentStep === step.number;
                        const StepIcon = step.icon;
                        return (
                            <div key={step.number} className="flex items-center">
                                {/* Circle */}
                                <div className="flex flex-col items-center">
                                    <div
                                        className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${isCompleted
                                            ? "bg-green-500 border-green-500 text-white"
                                            : isActive
                                                ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/30"
                                                : "bg-white border-slate-200 text-slate-400"
                                            }`}
                                    >
                                        {isCompleted ? (
                                            <CheckCircle2 className="w-5 h-5" />
                                        ) : (
                                            <StepIcon className="w-4 h-4" />
                                        )}
                                    </div>
                                    <div className="mt-1.5 text-center w-24">
                                        <p
                                            className={`text-xs font-semibold leading-tight ${isActive ? "text-primary" : isCompleted ? "text-green-600" : "text-slate-400"
                                                }`}
                                        >
                                            {step.title}
                                        </p>
                                        <p className="text-[10px] text-slate-400 leading-tight hidden sm:block">
                                            {step.description}
                                        </p>
                                    </div>
                                </div>
                                {/* Connector */}
                                {idx < STEPS.length - 1 && (
                                    <div
                                        className={`h-0.5 w-16 mb-6 transition-all duration-300 ${currentStep > step.number ? "bg-green-400" : "bg-slate-200"
                                            }`}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* ── Card ── */}
                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                    {/* Card header */}
                    <div className="px-6 pt-6 pb-4 border-b border-slate-100 text-center">
                        <h2 className="text-lg font-semibold text-slate-900">
                            Step {currentStep}: {STEPS[currentStep - 1]?.title}
                        </h2>
                        <p className="text-sm text-slate-500 mt-0.5">
                            {STEPS[currentStep - 1]?.description}
                        </p>
                    </div>

                    {/* Global error */}
                    {globalError && (
                        <div className="px-6 pt-4">
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{globalError}</AlertDescription>
                            </Alert>
                        </div>
                    )}

                    {/* ── Step 1: Basic Information ── */}
                    {currentStep === 1 && (
                        <div className="px-6 py-6 space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                {/* Org Name */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="orgName" className={fieldErrors.orgName ? "text-red-500" : ""}>
                                        Organization Name <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="orgName"
                                        placeholder="e.g., PT Maju Jaya"
                                        value={formData.orgName}
                                        onChange={(e) => updateField("orgName", e.target.value.slice(0, 100))}
                                        className={fieldErrors.orgName ? "border-red-500" : ""}
                                        disabled={isSubmitting}
                                    />
                                    {fieldErrors.orgName ? (
                                        <p className="text-xs text-red-500">{fieldErrors.orgName}</p>
                                    ) : (
                                        <p className="text-xs text-muted-foreground">{formData.orgName.length}/100</p>
                                    )}
                                </div>

                                {/* Org Code */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="orgCode" className={fieldErrors.orgCode ? "text-red-500" : ""}>
                                        Organization Code <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="orgCode"
                                            placeholder="e.g., PTMJ"
                                            value={formData.orgCode}
                                            onChange={handleCodeChange}
                                            className={`pr-9 ${fieldErrors.orgCode ? "border-red-500" : ""}`}
                                            disabled={isSubmitting}
                                        />
                                        {codeValidating && (
                                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                                        )}
                                        {!codeValidating && codeValid && formData.orgCode && !fieldErrors.orgCode && (
                                            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                                        )}
                                    </div>
                                    {fieldErrors.orgCode ? (
                                        <p className="text-xs text-red-500">{fieldErrors.orgCode}</p>
                                    ) : (
                                        <p className="text-xs text-muted-foreground">
                                            Max 20 characters · auto-uppercase
                                        </p>
                                    )}
                                </div>

                                {/* Timezone */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="timezone">
                                        Timezone <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        value={formData.timezone}
                                        onValueChange={(v) => setField("timezone", v)}
                                        disabled={isLoadingData || isSubmitting}
                                    >
                                        <SelectTrigger id="timezone">
                                            <SelectValue placeholder="Select timezone" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {timezones.map((tz) => (
                                                <SelectItem key={tz} value={tz}>
                                                    {tz}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Industry */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="industry">Industry</Label>
                                    <Select
                                        value={formData.industry}
                                        onValueChange={(v) => setField("industry", v)}
                                        disabled={isSubmitting}
                                    >
                                        <SelectTrigger id="industry">
                                            <SelectValue placeholder="Select industry type" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-64">
                                            {INDUSTRY_OPTIONS.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Phone */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="phone" className={fieldErrors.phone ? "text-red-500" : ""}>
                                        Phone Number
                                    </Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="e.g., +62-821-1234-5678"
                                        value={formData.phone}
                                        onChange={(e) => updateField("phone", e.target.value.slice(0, 20))}
                                        className={fieldErrors.phone ? "border-red-500" : ""}
                                        disabled={isSubmitting}
                                    />
                                    {fieldErrors.phone ? (
                                        <p className="text-xs text-red-500">{fieldErrors.phone}</p>
                                    ) : (
                                        <p className="text-xs text-muted-foreground">{formData.phone.length}/20</p>
                                    )}
                                </div>

                                {/* Email */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="email" className={fieldErrors.email ? "text-red-500" : ""}>
                                        Email Address
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="e.g., info@company.com"
                                        value={formData.email}
                                        onChange={(e) => updateField("email", e.target.value.slice(0, 100))}
                                        className={fieldErrors.email ? "border-red-500" : ""}
                                        disabled={isSubmitting}
                                    />
                                    {fieldErrors.email ? (
                                        <p className="text-xs text-red-500">{fieldErrors.email}</p>
                                    ) : (
                                        <p className="text-xs text-muted-foreground">{formData.email.length}/100</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Step 2: Address & Location ── */}
                    {currentStep === 2 && (
                        <div className="px-6 py-6 space-y-5">
                            <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-600">
                                All fields below are <strong>optional</strong> and can be updated anytime in
                                settings.
                            </div>

                            {/* Street Address */}
                            <div className="space-y-1.5">
                                <Label htmlFor="address">Street Address</Label>
                                <Input
                                    id="address"
                                    placeholder="e.g., Jl. Merdeka No. 123"
                                    value={formData.address}
                                    onChange={(e) => setField("address", e.target.value)}
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {/* State/Province */}
                                <div className="space-y-1.5">
                                    <Label>State / Province</Label>
                                    <Select
                                        value={formData.stateProvince}
                                        onValueChange={handleStateChange}
                                        disabled={isSubmitting || !locationData || isLoadingData}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={isLoadingData ? "Loading…" : "Select state"} />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-60">
                                            {locationData?.states.map((s) => (
                                                <SelectItem key={s.value} value={s.value}>
                                                    {s.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* City */}
                                <div className="space-y-1.5">
                                    <Label>City</Label>
                                    <Select
                                        value={formData.city}
                                        onValueChange={handleCityChange}
                                        disabled={isSubmitting || availableCities.length === 0}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select city" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-60">
                                            {availableCities.map((c) => (
                                                <SelectItem key={c.value} value={c.value}>
                                                    {c.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Postal Code */}
                                <div className="space-y-1.5">
                                    <Label>Postal Code</Label>
                                    <Select
                                        value={formData.postalCode}
                                        onValueChange={(v) => setField("postalCode", v)}
                                        disabled={isSubmitting || availablePostalCodes.length === 0}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select postal code" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availablePostalCodes.map((code) => (
                                                <SelectItem key={code} value={code}>
                                                    {code}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Step 3: Review ── */}
                    {currentStep === 3 && (
                        <div className="px-6 py-6 space-y-5">
                            <p className="text-sm text-slate-500">
                                Please review the information below before creating your organization.
                            </p>

                            {/* Basic Info Summary */}
                            <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                                <div className="px-4 py-3 bg-slate-50">
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                        Basic Information
                                    </p>
                                </div>
                                <ReviewRow label="Organization Name" value={formData.orgName} />
                                <ReviewRow label="Organization Code" value={formData.orgCode} />
                                <ReviewRow label="Timezone" value={formData.timezone} />
                                {formData.industry && (
                                    <ReviewRow
                                        label="Industry"
                                        value={
                                            INDUSTRY_OPTIONS.find((o) => o.value === formData.industry)?.label ??
                                            formData.industry
                                        }
                                    />
                                )}
                                {formData.phone && <ReviewRow label="Phone Number" value={formData.phone} />}
                                {formData.email && <ReviewRow label="Email Address" value={formData.email} />}
                            </div>

                            {/* Address Summary (only if any filled) */}
                            {(formData.address || formData.stateProvince || formData.city || formData.postalCode) && (
                                <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                                    <div className="px-4 py-3 bg-slate-50">
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                            Address & Location
                                        </p>
                                    </div>
                                    {formData.address && <ReviewRow label="Street Address" value={formData.address} />}
                                    {formData.stateProvince && (
                                        <ReviewRow
                                            label="State/Province"
                                            value={
                                                locationData?.states.find(s => s.value === formData.stateProvince)?.label
                                                ?? formData.stateProvince
                                            }
                                        />
                                    )}
                                    {formData.city && (
                                        <ReviewRow
                                            label="City"
                                            value={
                                                availableCities.find(c => c.value === formData.city)?.label
                                                ?? locationData?.states
                                                    .flatMap(s => s.cities)
                                                    .find(c => c.value === formData.city)?.label
                                                ?? formData.city
                                            }
                                        />
                                    )}
                                    {formData.postalCode && (
                                        <ReviewRow label="Postal Code" value={formData.postalCode} />
                                    )}
                                </div>
                            )}

                            {(!formData.address && !formData.stateProvince && !formData.city && !formData.postalCode) && (
                                <p className="text-xs text-slate-400 italic">
                                    No address details provided — you can add these later in settings.
                                </p>
                            )}
                        </div>
                    )}

                    {/* ── Footer / Actions ── */}
                    <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
                        <div>
                            {currentStep > 1 && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={goPrev}
                                    disabled={isSubmitting}
                                    className="gap-2"
                                >
                                    Back
                                </Button>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Step 2 can be skipped */}
                            {currentStep === 2 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={goNext}
                                    disabled={isSubmitting}
                                >
                                    Skip this step
                                </Button>
                            )}

                            {currentStep < STEPS.length && (
                                <Button
                                    type="button"
                                    onClick={goNext}
                                    disabled={currentStep === 1 && !canProceedStep1()}
                                    className="gap-2 min-w-[100px]"
                                >
                                    Next
                                </Button>
                            )}

                            {currentStep === STEPS.length && (
                                <Button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || isLoadingData}
                                    className="gap-2 min-w-[160px]"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Creating…
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="h-4 w-4" />
                                            Create Organization
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Submitting overlay */}
                {isSubmitting && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 max-w-xs w-full">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="font-semibold text-slate-800 text-center">
                                Setting up your organization…
                            </p>
                            <p className="text-sm text-slate-500 text-center">
                                Please don&apos;t close this window.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Helper Component ─────────────────────────────────────────────────────────

function ReviewRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between items-start px-4 py-3">
            <span className="text-sm text-slate-500 shrink-0 mr-4">{label}</span>
            <span className="text-sm font-medium text-slate-900 text-right break-all">{value}</span>
        </div>
    );
}
