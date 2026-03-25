// src/types/organization/org-settings.ts

// Geo types di-re-export dari types/geo.ts — jangan duplikat di sini
export type { GeoCity, GeoState, GeoCountry, CountryOption } from "@/types/geo";

// ----------------------------------------------------------
// Raw data shape from Supabase (tabel `organization`)
// ----------------------------------------------------------
export interface OrganizationData {
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
  time_format: "12h" | "24h";
  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------------
// Form state — apa yang diedit user di UI
// ----------------------------------------------------------
export interface OrgSettingsFormData {
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
  time_format: "12h" | "24h";
}

export const DEFAULT_FORM_DATA: OrgSettingsFormData = {
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
  time_format: "24h",
};

// ----------------------------------------------------------
// Payload untuk server action updateOrganization
// ----------------------------------------------------------
export interface OrganizationUpdatePayload {
  name: string;
  legal_name: string;
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
  logo_url: string | null | undefined;
  time_format: "12h" | "24h";
}

// ----------------------------------------------------------
// Timezone option (dari /api/timezones)
// ----------------------------------------------------------
export interface TimezoneOption {
  value: string;   // e.g. "Asia/Jakarta"
  label: string;   // e.g. "Asia/Jakarta (UTC+7)"
  offset: string;  // e.g. "+07:00"
  region: string;  // e.g. "Asia"
}

// ----------------------------------------------------------
// Currency option (dari /api/currencies)
// ----------------------------------------------------------
export interface CurrencyOption {
  code: string;    // e.g. "IDR"
  name: string;    // e.g. "Indonesian Rupiah"
  symbol: string;  // e.g. "Rp"
  label: string;   // e.g. "IDR — Indonesian Rupiah"
}

// ----------------------------------------------------------
// Server action result shape (generic)
// ----------------------------------------------------------
export interface ActionResult<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}