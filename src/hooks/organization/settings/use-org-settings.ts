"use client";

// src/hooks/organization/settings/use-org-settings.ts
// Mengelola fetch, state, dan save untuk organization settings
// Menggunakan TanStack Query untuk caching + invalidation

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
import { findIndustryValue } from "@/lib/constants/industries";

// ----------------------------------------------------------
// Geo helpers (tidak expose keluar — internal hook saja)
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
// Fallback country list — dipakai jika /api/geo/countries gagal
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

  // Geo state
  const [geoData, setGeoData] = useState<GeoCountry | null>(null);
  const geoCacheRef = useRef<Record<string, GeoCountry>>({});

  // Country options — dinamis dari /api/geo/countries
  const [countryOptions, setCountryOptions] = useState<CountryOption[]>([]);

  // ----------------------------------------------------------
  // Fetch country list saat mount — statis, cukup sekali
  // ----------------------------------------------------------
  useEffect(() => {
    fetch("/api/geo/countries")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch countries");
        return res.json() as Promise<CountryOption[]>;
      })
      .then((data) => setCountryOptions(data))
      .catch(() => {
        // Fallback ke daftar manual jika endpoint gagal
        setCountryOptions(FALLBACK_COUNTRY_OPTIONS);
      });
  }, []);

  // ----------------------------------------------------------
  // Fetch geo data (states + cities) per country
  // ----------------------------------------------------------
  const fetchGeoData = useCallback(async (countryCode: string): Promise<GeoCountry | null> => {
    const key = (countryCode || "ID").toUpperCase();
    console.log(`[useOrgSettings] Fetching geo data for ${key}`);
    if (geoCacheRef.current[key]) {
      console.log(`[useOrgSettings] Cache hit for ${key}`);
      setGeoData(geoCacheRef.current[key]);
      return geoCacheRef.current[key];
    }
    try {
      setGeoLoading(true);
      const res = await fetch(`/api/geo/${key}`);
      if (!res.ok) throw new Error("Failed to fetch geo data");
      const data: GeoCountry = await res.json();
      console.log(`[useOrgSettings] Received ${data.states.length} states for ${key}`);
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

      // IOrganization (dari server action) tidak overlap sempurna dengan OrganizationData
      // karena field `id` bertipe string di IOrganization vs number di OrganizationData.
      // Double cast via unknown untuk bridge perbedaan ini.
      const data = result.data as unknown as OrganizationData;
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
        time_format: data.time_format || "24h",
      });

      return data;
    },
    enabled: !!orgStore.organizationId,
    staleTime: 1000 * 60 * 5, // 5 menit
  });

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

  const stateLabel = useMemo(
    () => {
      const val = formData.state_province.toLowerCase();
      return geoData?.states.find((s) => s.value.toLowerCase() === val)?.label ?? "";
    },
    [geoData, formData.state_province],
  );

  const cityLabel = useMemo(
    () => {
      if (!geoData) return "";
      const val = formData.city.toLowerCase();
      for (const state of geoData.states) {
        const city = state.cities.find((c) => c.value.toLowerCase() === val);
        if (city) return city.label;
      }
      return "";
    },
    [geoData, formData.city],
  );

  // Sync geo data saat country berubah
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
        // Convert geo internal values → human-readable labels untuk disimpan ke DB
        let resolvedCityLabel = getCityLabelFromGeo(geoData, formData.city);
        let resolvedStateLabel = getStateLabelFromGeo(geoData, formData.state_province);

        // Fallback: jika sudah berupa label (bukan value berbentuk "id-ji-xxx")
        if (!resolvedCityLabel && formData.city) {
          const looksLikeValue = /^[a-z]{2}-[a-z]{2}(-[a-z0-9-]+)?$/i.test(formData.city);
          if (!looksLikeValue) resolvedCityLabel = formData.city;
        }
        if (!resolvedStateLabel && formData.state_province) {
          const looksLikeValue = /^[a-z]{2}-[a-z]{2}$/i.test(formData.state_province);
          if (!looksLikeValue) resolvedStateLabel = formData.state_province;
        }

        const payload: OrganizationUpdatePayload = {
          name: formData.name,
          legal_name: formData.name,
          description: formData.description,
          address: formData.address,
          city: resolvedCityLabel,
          state_province: resolvedStateLabel,
          postal_code: formData.postal_code,
          phone: formData.phone,
          website: formData.website,
          email: formData.email,
          timezone: formData.timezone,
          currency_code: formData.currency_code,
          country_code: formData.country_code,
          industry: formData.industry,
          logo_url: logoUrl,
          time_format: formData.time_format,
        };

        const result = await updateOrganization(String(orgStore.organizationId), payload as any);

        if (result.success) {
          toast.success("Organization settings updated successfully!");
          // Invalidate query cache agar semua komponen terupdate
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
    refetchOrg,
  };
}