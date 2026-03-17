"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useOrgStore } from "@/store/org-store";
import { useUserStore } from "@/store/user-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
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

interface GeoCity {
  value: string;
  label: string;
  postal_codes?: string[];
}

interface GeoState {
  value: string;
  label: string;
  state_code?: string;
  cities: GeoCity[];
}

interface GeoCountry {
  code: string;
  name: string;
  states: GeoState[];
}

export default function NewOrganizationPageFix() {
  const router = useRouter();
  const orgStore = useOrgStore();
  const userStore = useUserStore();
  const queryClient = useQueryClient();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [timezones, setTimezones] = useState<string[]>([]);
  const [_roles, setRoles] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [locationData, setLocationData] = useState<GeoCountry | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [formData, setFormData] = useState({
    orgName: "",
    orgCode: "",
    timezone: "Asia/Jakarta",
    industry: "",
    phone: "",
    email: "",
    website: "",
    address: "",
    city: "",
    stateProvince: "",
    postalCode: "",
    defaultRoleId: "",
  });

  const [codeValidating, setCodeValidating] = useState(false);
  const [codeValid, setCodeValid] = useState(true);
  const [availableCities, setAvailableCities] = useState<GeoCity[]>([]);
  const [availablePostalCodes, setAvailablePostalCodes] = useState<string[]>([]);
  const codeValidationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateField = (fieldName: string, value: string): string => {
    switch (fieldName) {
      case "orgName":
        if (!value || !value.trim()) return "Organization name is required";
        if (value.length < 2) return "Minimum 2 characters required";
        if (value.length > 100) return "Maximum 100 characters allowed";
        return "";
      case "orgCode":
        if (!value || !value.trim()) return "Organization code is required";
        if (value.length > 20) return "Maximum 20 characters allowed";
        return "";
      case "phone":
        if (value && value.length > 20) return "Maximum 20 characters allowed";
        return "";
      case "email":
        if (value && value.length > 100) return "Maximum 100 characters allowed";
        if (value && !value.includes("@")) return "Invalid email format";
        return "";
      case "website":
        if (value && value.length > 255) return "Maximum 255 characters allowed";
        if (value && !value.startsWith("http")) return "Website must start with http:// or https://";
        return "";
      case "address":
        if (value && value.length > 255) return "Maximum 255 characters allowed";
        return "";
      case "city":
        if (value && value.length > 100) return "Maximum 100 characters allowed";
        return "";
      case "stateProvince":
        if (value && value.length > 100) return "Maximum 100 characters allowed";
        return "";
      case "postalCode":
        if (value && value.length > 20) return "Maximum 20 characters allowed";
        return "";
      default:
        return "";
    }
  };

  const updateFieldWithValidation = (fieldName: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
    const errMsg = validateField(fieldName, value);
    setFieldErrors((prev) => ({
      ...prev,
      [fieldName]: errMsg,
    }));
  };

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
        fetch("/api/geo/ID").then((res) => res.json()).catch(() => null),
      ]);

      setTimezones(timezonesList);

      if (geoResult && geoResult.code === "ID" && geoResult.states) {
        setLocationData(geoResult);
      } else {
        setLocationData(null);
      }

      if (rolesList && Array.isArray(rolesList) && rolesList.length > 0) {
        setRoles(rolesList);
        const firstRole = rolesList[0];
        if (firstRole) {
          setFormData((prev) => ({
            ...prev,
            defaultRoleId: firstRole.code,
          }));
        }
      } else {
        const fallbackRoles = [
          { id: "1", code: "A001", name: "Admin" },
          { id: "2", code: "US001", name: "User" },
          { id: "5", code: "SA001", name: "Super Admin" },
          { id: "6", code: "SP001", name: "Support" },
          { id: "7", code: "B001", name: "Billing" },
          { id: "8", code: "P001", name: "Petugas" },
        ];
        setFormData((prev) => ({
          ...prev,
          defaultRoleId: fallbackRoles[0]?.code ?? "",
        }));
      }
    } catch (err) {
      console.error("[LOAD-DATA] Error loading initial data:", err);
      toast.error("Failed to load form data");
      const fallbackRoles = [
        { id: "1", code: "A001", name: "Admin" },
        { id: "2", code: "US001", name: "User" },
        { id: "5", code: "SA001", name: "Super Admin" },
        { id: "6", code: "SP001", name: "Support" },
        { id: "7", code: "B001", name: "Billing" },
        { id: "8", code: "P001", name: "Petugas" },
      ];
      setFormData((prev) => ({
        ...prev,
        defaultRoleId: fallbackRoles[0]?.code ?? "",
      }));
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().slice(0, 20);
    setFormData((prev) => ({ ...prev, orgCode: value }));
    setError(null);
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
            setError(result.message || "Organization code already exists");
            setFieldErrors((prev) => ({
              ...prev,
              orgCode: result.message || "Organization code already exists",
            }));
          }
        } catch (err) {
          console.error("Code validation error:", err);
          setCodeValid(false);
          setError("Error validating code");
          setFieldErrors((prev) => ({
            ...prev,
            orgCode: "Error validating code",
          }));
        } finally {
          setCodeValidating(false);
        }
      }, 500);
    } else {
      setCodeValid(true);
      setError(null);
    }
  };

  const handleStateChange = (stateValue: string) => {
    if (locationData) {
      const selectedState = locationData.states.find((s) => s.value === stateValue);
      if (selectedState) {
        setAvailableCities(selectedState.cities);
        setAvailablePostalCodes([]);
        setFormData((prev) => ({
          ...prev,
          stateProvince: stateValue,
          city: "",
          postalCode: "",
        }));
      } else {
        setAvailableCities([]);
        setAvailablePostalCodes([]);
      }
    }
  };

  const handleCityChange = (cityValue: string) => {
    const selectedCity = availableCities.find((c) => c.value === cityValue);
    setFormData((prev) => ({
      ...prev,
      city: cityValue,
      postalCode: "",
    }));
    setAvailablePostalCodes(selectedCity?.postal_codes || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.orgName || !formData.orgName.trim()) {
      setError("Organization name is required");
      return;
    }

    if (formData.orgName.length < 2) {
      setError("Organization name must be at least 2 characters");
      return;
    }

    if (!formData.orgCode || !formData.orgCode.trim()) {
      setError("Organization code is required");
      return;
    }

    if (!codeValid) {
      setError("Organization code is invalid or already exists");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const toastId = toast.loading("Creating organization...");

      const result = await createOrganization({
        orgName: formData.orgName,
        orgCode: formData.orgCode,
        timezone: formData.timezone,
        industry: formData.industry,
        phone: formData.phone,
        email: formData.email,
        website: formData.website,
        address: formData.address,
        city: formData.city,
        stateProvince: formData.stateProvince,
        postalCode: formData.postalCode,
        defaultRoleId: formData.defaultRoleId || "A001",
      });

      if (!result.success) {
        const errorMsg = result.message || "Failed to create organization";
        const errorDetail = result.error ? ` (${result.error})` : "";
        const fullError = errorMsg + errorDetail;

        toast.dismiss(toastId);
        toast.error(fullError);
        setError(fullError);
        return;
      }

      if (result.data) {
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        queryClient.invalidateQueries({ queryKey: ["stats"] });
        queryClient.invalidateQueries({ queryKey: ["members"] });
        queryClient.invalidateQueries({ queryKey: ["attendance"] });
        queryClient.invalidateQueries({ queryKey: ["leaves"] });
        queryClient.invalidateQueries({ queryKey: ["groups"] });
        queryClient.invalidateQueries({ queryKey: ["organization"] });
        queryClient.invalidateQueries({ queryKey: ["organization", "full-data"] });

        orgStore.setOrganizationId(result.data.organizationId, result.data.organizationName);
        orgStore.setTimezone(formData.timezone);
        userStore.setRole(formData.defaultRoleId || "A001", result.data.organizationId);

        toast.dismiss(toastId);
        toast.success(`Organization "${result.data.organizationName}" created successfully!`);

        setTimeout(() => {
          router.push("/");
        }, 1500);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isHydrated || isLoadingData) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-4xl mx-auto w-full">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="w-full">
        <div className="w-full bg-white rounded-lg shadow-sm border border-gray-300">
          <div className="p-6">
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Card>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid gap-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Basic Information</h3>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="shrink-0"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="orgName" className={fieldErrors.orgName ? "text-red-500" : ""}>
                          Organization Name *
                        </Label>
                        <Input
                          id="orgName"
                          placeholder="e.g., PT Maju Jaya"
                          value={formData.orgName}
                          onChange={(e) => updateFieldWithValidation("orgName", e.target.value.slice(0, 100))}
                          disabled={isSubmitting}
                          minLength={2}
                          maxLength={100}
                          className={fieldErrors.orgName ? "border-red-500 focus-visible:ring-red-500" : ""}
                        />
                        {fieldErrors.orgName ? (
                          <p className="text-xs text-red-500 font-medium"> {fieldErrors.orgName}</p>
                        ) : (
                          <div className="flex justify-between items-center">
                            <p className={`text-xs ${formData.orgName.length > 90 ? "text-amber-500" : "text-muted-foreground"}`}>
                              {formData.orgName.length}/100
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="orgCode" className={fieldErrors.orgCode ? "text-red-500" : ""}>
                          Organization Code *
                        </Label>
                        <div className="relative">
                          <Input
                            id="orgCode"
                            placeholder="e.g., PTMJ"
                            value={formData.orgCode}
                            onChange={handleCodeChange}
                            disabled={isSubmitting}
                            className={`pr-10 ${fieldErrors.orgCode ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                            maxLength={20}
                          />
                          {codeValidating && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                          )}
                          {!codeValidating && codeValid && formData.orgCode && !fieldErrors.orgCode && (
                            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                          )}
                        </div>
                        {fieldErrors.orgCode ? (
                          <p className="text-xs text-red-500 font-medium"> {fieldErrors.orgCode}</p>
                        ) : (
                          <div className="flex justify-between items-center">
                            <p className="text-xs text-muted-foreground">Max 20 characters, auto-uppercase</p>
                            <p className={`text-xs ${formData.orgCode.length > 15 ? "text-amber-500" : "text-muted-foreground"}`}>
                              {formData.orgCode.length}/20
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="timezone">Timezone *</Label>
                        <Select value={formData.timezone} onValueChange={(value) => setFormData((prev) => ({ ...prev, timezone: value }))}>
                          <SelectTrigger id="timezone" disabled={isSubmitting || isLoadingData}>
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

                      <div className="space-y-2">
                        <Label htmlFor="industry">Industry</Label>
                        <Select value={formData.industry} onValueChange={(value) => setFormData((prev) => ({ ...prev, industry: value }))}>
                          <SelectTrigger id="industry" disabled={isSubmitting}>
                            <SelectValue placeholder="Select industry type" />
                          </SelectTrigger>
                          <SelectContent className="max-h-64 overflow-y-auto">
                            {INDUSTRY_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className={fieldErrors.phone ? "text-red-500" : ""}>
                          Phone Number
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="e.g., +62-821-1234-5678"
                          value={formData.phone}
                          onChange={(e) => updateFieldWithValidation("phone", e.target.value.slice(0, 20))}
                          disabled={isSubmitting}
                          maxLength={20}
                          className={fieldErrors.phone ? "border-red-500 focus-visible:ring-red-500" : ""}
                        />
                        {fieldErrors.phone ? (
                          <p className="text-xs text-red-500 font-medium"> {fieldErrors.phone}</p>
                        ) : (
                          <div className="flex justify-between items-center">
                            <p className={`text-xs ${formData.phone.length > 15 ? "text-amber-500" : "text-muted-foreground"}`}>
                              {formData.phone.length}/20
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className={fieldErrors.email ? "text-red-500" : ""}>
                          Email Address
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="e.g., info@company.com"
                          value={formData.email}
                          onChange={(e) => updateFieldWithValidation("email", e.target.value.slice(0, 100))}
                          disabled={isSubmitting}
                          maxLength={100}
                          className={fieldErrors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
                        />
                        {fieldErrors.email ? (
                          <p className="text-xs text-red-500 font-medium"> {fieldErrors.email}</p>
                        ) : (
                          <div className="flex justify-between items-center">
                            <p className={`text-xs ${formData.email.length > 90 ? "text-amber-500" : "text-muted-foreground"}`}>
                              {formData.email.length}/100
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6">
                    <h3 className="text-lg font-semibold">Address & Location</h3>
                    <p className="text-sm text-muted-foreground">All fields are optional and can be updated later</p>

                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="address">Street Address</Label>
                        <Input
                          id="address"
                          placeholder="e.g., Jl. Merdeka No. 123"
                          value={formData.address}
                          onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="state">State/Province</Label>
                          <Select
                            value={formData.stateProvince}
                            onValueChange={handleStateChange}
                            disabled={isSubmitting || !locationData || isLoadingData}
                          >
                            <SelectTrigger id="state">
                              <SelectValue placeholder={isLoadingData ? "Loading..." : "Select state"} />
                            </SelectTrigger>
                            <SelectContent>
                              {locationData?.states?.map((state) => (
                                <SelectItem key={state.value} value={state.value}>
                                  {state.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="city">City</Label>
                          <Select
                            value={formData.city}
                            onValueChange={handleCityChange}
                            disabled={isSubmitting || availableCities.length === 0}
                          >
                            <SelectTrigger id="city">
                              <SelectValue placeholder="Select city" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableCities.map((city) => (
                                <SelectItem key={city.value} value={city.value}>
                                  {city.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="postalCode">Postal Code</Label>
                          <Select
                            value={formData.postalCode}
                            onValueChange={(value) => setFormData((prev) => ({ ...prev, postalCode: value }))}
                            disabled={isSubmitting || availablePostalCodes.length === 0}
                          >
                            <SelectTrigger id="postalCode">
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
                  </div>

                  <div className="flex gap-3 pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting || !codeValid || !formData.orgName || !formData.orgCode || isLoadingData}
                      className="ml-auto"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
