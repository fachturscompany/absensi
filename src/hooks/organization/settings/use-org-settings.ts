"use client";

// src/hooks/organization/settings/use-org-settings.ts

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getCurrentUserOrganization, updateOrganization } from "@/action/organization-settings";
import { useOrgStore } from "@/store/org-store";
import { useQuery } from "@tanstack/react-query";

import type {
  OrganizationData,
  OrgSettingsFormData,
  GeoCountry,
  GeoCity,
  CountryOption,
  OrganizationUpdatePayload,
} from "@/types/organization/org-settings";

import { DEFAULT_FORM_DATA } from "@/types/organization/org-settings";

// ----------------------------------------------------------
// Geo helpers
// ----------------------------------------------------------
function getStateLabelFromGeo(geoData: GeoCountry | null, value: string | null): string {
  if (!geoData || !value) return "";
  return geoData.states.find((s) => s.value === value)?.label ?? "";
}

function getCityLabelFromGeo(geoData: GeoCountry | null, value: string | null): string {
  if (!geoData || !value) return "";
  for (const state of geoData.states) {
    const city = state.cities.find((c) => c.value === value);
    if (city) return city.label;
  }
  return "";
}

function normalizeStateValue(geoData: GeoCountry | null, input: string | null): string {
  if (!geoData || !input) return "";
  const normalized = input.trim().toLowerCase();
  const match = geoData.states.find(
    (s) => s.value.toLowerCase() === normalized || s.label.toLowerCase() === normalized,
  );
  return match?.value ?? "";
}

function normalizeCityValue(
  geoData: GeoCountry | null,
  input: string | null,
  stateValue: string,
): string {
  if (!geoData || !input || !stateValue) return "";
  const state = geoData.states.find((s) => s.value === stateValue);
  if (!state) return "";
  const normalized = input.trim().toLowerCase();
  const match = state.cities.find(
    (c) => c.value.toLowerCase() === normalized || c.label.toLowerCase() === normalized,
  );
  return match?.value ?? "";
}

// ----------------------------------------------------------
// Validation helpers
// ----------------------------------------------------------
function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ----------------------------------------------------------
// Fallback country list
// ----------------------------------------------------------
const FALLBACK_COUNTRY_OPTIONS: CountryOption[] = [
  { value: "ID", label: "Indonesia" },
  { value: "MY", label: "Malaysia" },
  { value: "SG", label: "Singapore" },
  { value: "TH", label: "Thailand" },
  { value: "PH", label: "Philippines" },
  { value: "VN", label: "Vietnam" },
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "AU", label: "Australia" },
];

// ----------------------------------------------------------
// Hook: useOrgSettings
// ----------------------------------------------------------
export function useOrgSettings() {
  const queryClient = useQueryClient();
  const orgStore = useOrgStore();

  const [formData, setFormData] = useState<OrgSettingsFormData>(DEFAULT_FORM_DATA);
  const [saving, setSaving] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  const [geoData, setGeoData] = useState<GeoCountry | null>(null);
  const geoCacheRef = useRef<Record<string, GeoCountry>>({});
  const [countryOptions, setCountryOptions] = useState<CountryOption[]>([]);
  const lastInitializedOrgId = useRef<number | null>(null);

  // ----------------------------------------------------------
  // Reset saat organizationId berubah (org switcher)
  // ----------------------------------------------------------
  useEffect(() => {
    if (!orgStore.organizationId) return;
    lastInitializedOrgId.current = null;
    setFormData(DEFAULT_FORM_DATA);
    setGeoData(null);
  }, [orgStore.organizationId]);

  // ----------------------------------------------------------
  // Fetch country list — sekali saat mount
  // ----------------------------------------------------------
  useEffect(() => {
    fetch("/api/geo/countries")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch countries");
        return res.json() as Promise<CountryOption[]>;
      })
      .then((data) => setCountryOptions(data))
      .catch(() => setCountryOptions(FALLBACK_COUNTRY_OPTIONS));
  }, []);

  // ----------------------------------------------------------
  // Fetch geo data (states + cities) per country
  // ----------------------------------------------------------
  const fetchGeoData = useCallback(async (countryCode: string): Promise<GeoCountry | null> => {
    const key = (countryCode || "ID").toUpperCase();
    if (geoCacheRef.current[key]) {
      setGeoData(geoCacheRef.current[key]);
      return geoCacheRef.current[key];
    }
    try {
      setGeoLoading(true);
      const res = await fetch(`/api/geo/${key}`);
      if (!res.ok) throw new Error("Failed to fetch geo data");
      const data: GeoCountry = await res.json();
      geoCacheRef.current[key] = data;
      setGeoData(data);
      return data;
    } catch (err) {
      console.error(`[useOrgSettings] Failed to load geo data for ${key}:`, err);
      toast.error("Failed to load geographic data");
      return null;
    } finally {
      setGeoLoading(false);
    }
  }, []);

  // ----------------------------------------------------------
  // TanStack Query: fetch organization data
  // ----------------------------------------------------------
  const {
    data: orgData,
    isLoading: loading,
    refetch: refetchOrg,
  } = useQuery<OrganizationData | null>({
    queryKey: ["organization", "settings", orgStore.organizationId],
    queryFn: async () => {
      const result = await getCurrentUserOrganization();
      if (!result.success || !result.data) {
        toast.error(result.message || "Failed to load organization data");
        return null;
      }

      const data = result.data as unknown as OrganizationData;
      const countryCode = (data.country_code || "ID").toUpperCase();
      const geo = await fetchGeoData(countryCode);

      if (geo) {
        geoCacheRef.current[countryCode] = geo;
        setGeoData(geo);
      }

      // Attach normalized fields agar bisa dipakai di useEffect & handleDiscard
      const normalizedState = normalizeStateValue(geo, data.state_province ?? null);
      const normalizedCity = normalizeCityValue(geo, data.city ?? null, normalizedState);

      let industryArray: string[] = [];
      const rawIndustry = (data as any).industry;
      if (rawIndustry) {
        try {
          const parsed = JSON.parse(rawIndustry);
          industryArray = Array.isArray(parsed) ? parsed : [String(parsed)];
        } catch {
          industryArray = String(rawIndustry).includes(",")
            ? String(rawIndustry).split(",").map((i: string) => i.trim())
            : [String(rawIndustry)];
        }
      }

      return {
        ...data,
        _normalizedState: normalizedState,
        _normalizedCity: normalizedCity,
        _industryArray: industryArray,
      } as OrganizationData;
    },
    enabled: !!orgStore.organizationId,
    staleTime: 1000 * 60 * 5,
  });

  // ----------------------------------------------------------
  // Helper internal: build formData dari orgData yang sudah di-fetch
  // ----------------------------------------------------------
  const buildFormData = useCallback((data: any): OrgSettingsFormData => ({
    name: data.name || "",
    description: data.description || "",
    address: data.address || "",
    city: data._normalizedCity || (data.city ?? ""),
    state_province: data._normalizedState || (data.state_province ?? ""),
    postal_code: data.postal_code || "",
    phone: data.phone || "",
    website: data.website || "",
    email: data.email || "",
    timezone: data.timezone || "UTC",
    currency_code: data.currency_code || "USD",
    country_code: (data.country_code || "ID").toUpperCase(),
    industry: data._industryArray || [],
    time_format: data.time_format || "24h",
  }), []);

  // ----------------------------------------------------------
  // Populate formData saat orgData tersedia untuk pertama kali
  // (atau setelah lastInitializedOrgId di-reset)
  // ----------------------------------------------------------
  useEffect(() => {
    if (!orgData || !orgStore.organizationId) return;
    if (lastInitializedOrgId.current === orgStore.organizationId) return;

    setFormData(buildFormData(orgData));
    lastInitializedOrgId.current = orgStore.organizationId;
  }, [orgData, orgStore.organizationId, buildFormData]);

  // ----------------------------------------------------------
  // ✅ Discard: kembalikan formData & geoData ke nilai server
  // Dipanggil saat user ingin membatalkan perubahan
  // ----------------------------------------------------------
  const handleDiscard = useCallback(async () => {
    if (!orgData) return;

    const data = orgData as any;
    const countryCode = (data.country_code || "ID").toUpperCase();

    // Kembalikan geoData ke country org yang tersimpan di server
    // (bukan country yang sempat dipilih user di form)
    let geo = geoCacheRef.current[countryCode] ?? null;
    if (!geo) {
      geo = await fetchGeoData(countryCode);
    } else {
      // Paksa update geoData state ke country org asli
      setGeoData(geo);
    }

    // Reset formData ke data server
    setFormData(buildFormData(data));

    toast.info("Changes discarded");
  }, [orgData, fetchGeoData, buildFormData]);

  // ----------------------------------------------------------
  // Derived geo values untuk UI
  // ----------------------------------------------------------
  const selectedCountry = (formData.country_code || "ID").toUpperCase();

  const stateOptions = geoData?.states ?? [];

  const cityOptions = useMemo<GeoCity[]>(() => {
    if (!geoData || !formData.state_province) return [];
    const state = geoData.states.find(
      (s) => s.value.toLowerCase() === formData.state_province.toLowerCase(),
    );
    return state ? state.cities : [];
  }, [geoData, formData.state_province]);

  const stateLabel = useMemo(() => {
    const val = formData.state_province.toLowerCase();
    return geoData?.states.find((s) => s.value.toLowerCase() === val)?.label ?? "";
  }, [geoData, formData.state_province]);

  const cityLabel = useMemo(() => {
    if (!geoData) return "";
    const val = formData.city.toLowerCase();
    for (const state of geoData.states) {
      const city = state.cities.find((c) => c.value.toLowerCase() === val);
      if (city) return city.label;
    }
    return "";
  }, [geoData, formData.city]);

  // ----------------------------------------------------------
  // Handle country change — hanya update formData lokal
  // tidak menyentuh orgData (server state)
  // ----------------------------------------------------------
  const handleCountryChange = useCallback(
    (countryCode: string) => {
      setFormData((prev) => ({
        ...prev,
        country_code: countryCode,
        state_province: "",
        city: "",
      }));
      fetchGeoData(countryCode);
    },
    [fetchGeoData],
  );

  // ----------------------------------------------------------
  // Save handler
  // ----------------------------------------------------------
  const handleSave = useCallback(
    async (logoUrl: string | null | undefined) => {
      if (!orgData) {
        toast.error("No organization data available");
        return false;
      }

      setSaving(true);
      try {
        let resolvedCityLabel = getCityLabelFromGeo(geoData, formData.city);
        let resolvedStateLabel = getStateLabelFromGeo(geoData, formData.state_province);

        if (!resolvedCityLabel && formData.city) {
          const looksLikeValue = /^[a-z]{2}-[a-z]{2}(-[a-z0-9-]+)?$/i.test(formData.city);
          if (!looksLikeValue) resolvedCityLabel = formData.city;
        }
        if (!resolvedStateLabel && formData.state_province) {
          const looksLikeValue = /^[a-z]{2}-[a-z]{2}$/i.test(formData.state_province);
          if (!looksLikeValue) resolvedStateLabel = formData.state_province;
        }

        const sanitize = (val: string | null | undefined) => {
          if (val === null || val === undefined) return null;
          const trimmed = val.trim();
          return trimmed === "" ? null : trimmed;
        };

        const emailToSave = sanitize(formData.email);
        const websiteToSave = sanitize(formData.website);
        const phoneToSave = sanitize(formData.phone);
        const addressToSave = sanitize(formData.address);

        if (emailToSave && !isValidEmail(emailToSave)) {
          toast.error("Please enter a valid email address");
          setSaving(false);
          return false;
        }

        const payload: OrganizationUpdatePayload = {
          name: formData.name,
          legal_name: formData.name,
          description: formData.description,
          address: addressToSave,
          city: resolvedCityLabel,
          state_province: resolvedStateLabel,
          postal_code: formData.postal_code,
          phone: phoneToSave,
          website: websiteToSave,
          email: emailToSave,
          timezone: formData.timezone,
          currency_code: formData.currency_code,
          country_code: formData.country_code,
          industry: JSON.stringify(formData.industry),
          logo_url: logoUrl,
          time_format: formData.time_format,
        };

        const result = await updateOrganization(String(orgStore.organizationId), payload as any);

        if (result.success) {
          toast.success("Organization settings updated successfully!");

          // ✅ Reset lastInitializedOrgId agar setelah refetch,
          // formData di-populate ulang dari data server terbaru
          lastInitializedOrgId.current = null;

          queryClient.invalidateQueries({ queryKey: ["organization"] });
          await refetchOrg();
          return true;
        } else {
          toast.error(result.message || "Failed to update organization settings");
          return false;
        }
      } catch {
        toast.error("An error occurred while updating organization settings");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [orgData, orgStore.organizationId, formData, geoData, queryClient, refetchOrg],
  );

  return {
    // Data
    orgData,
    formData,
    setFormData,

    // Status
    loading,
    saving,
    geoLoading,

    // Geo
    geoData,
    selectedCountry,
    countryOptions,
    stateOptions,
    cityOptions,
    stateLabel,
    cityLabel,
    handleCountryChange,
    fetchGeoData,

    // Actions
    handleSave,
    handleDiscard,
    refetchOrg,
  };
}