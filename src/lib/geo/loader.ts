// src/lib/geo/loader.ts
// Loader hybrid: local JSON (9 negara) → fallback Geonames API
// Geonames dipakai untuk negara yang belum ada JSON lokalnya

import type { GeoCountry, CountryOption } from "@/types/geo";
import manifest from "@/lib/data/geo/manifest.json";

// In-memory cache untuk hasil fetch Geonames
const geoCache = new Map<string, GeoCountry>();

// ----------------------------------------------------------
// Geonames API helpers
// ----------------------------------------------------------
interface GeonamesState {
  adminCode1: string;
  name: string;
  geonameId: number;
}

interface GeonamesCity {
  name: string;
  adminCode1: string;
  postalCode?: string;
  geonameId: number;
}

interface GeonamesAdminResponse {
  geonames: GeonamesState[];
}

interface GeonamesCityResponse {
  geonames: GeonamesCity[];
}

async function fetchStatesFromGeonames(countryCode: string): Promise<GeonamesState[]> {
  const username = process.env.GEONAMES_USERNAME;
  if (!username) throw new Error("GEONAMES_USERNAME not set");

  const url =
    `http://api.geonames.org/searchJSON` +
    `?country=${countryCode}&featureCode=ADM1&maxRows=100&username=${username}`;

  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`Geonames states error: ${res.status}`);

  const data: GeonamesAdminResponse = await res.json();
  return data.geonames ?? [];
}

async function fetchCitiesFromGeonames(
  countryCode: string,
  adminCode: string,
): Promise<GeonamesCity[]> {
  const username = process.env.GEONAMES_USERNAME;
  if (!username) throw new Error("GEONAMES_USERNAME not set");

  const url =
    `http://api.geonames.org/searchJSON` +
    `?country=${countryCode}&adminCode1=${adminCode}&featureCode=PPL&maxRows=200&username=${username}`;

  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`Geonames cities error: ${res.status}`);

  const data: GeonamesCityResponse = await res.json();
  return data.geonames ?? [];
}

async function buildGeoCountryFromGeonames(countryCode: string): Promise<GeoCountry> {
  const rawStates = await fetchStatesFromGeonames(countryCode);

  // Fetch cities per state secara parallel (batasi 30 state pertama untuk menghindari rate limit)
  const statesToFetch = rawStates.slice(0, 30);

  const statesWithCities = await Promise.all(
    statesToFetch.map(async (state) => {
      try {
        const rawCities = await fetchCitiesFromGeonames(countryCode, state.adminCode1);
        const cities = rawCities.map((city) => ({
          value: city.name.toLowerCase().replace(/\s+/g, "-"),
          label: city.name,
        }));

        return {
          value: state.adminCode1,
          label: state.name,
          state_code: state.adminCode1,
          cities,
        };
      } catch {
        // Jika gagal fetch cities untuk satu state, tetap kembalikan state tanpa cities
        return {
          value: state.adminCode1,
          label: state.name,
          state_code: state.adminCode1,
          cities: [],
        };
      }
    }),
  );

  return {
    code: countryCode,
    label: countryCode, // label akan diisi dari countries list di client
    states: statesWithCities,
  };
}

// ----------------------------------------------------------
// Public: loadGeoCountry — Full fetch from Geonames API
// ----------------------------------------------------------
export const loadGeoCountry = async (code: string): Promise<GeoCountry | null> => {
  const key = (code || "").toUpperCase();

  // Cek cache dulu (In-memory)
  if (geoCache.has(key)) {
    return geoCache.get(key)!;
  }

  // Fetch langsung dari API
  try {
    const data = await buildGeoCountryFromGeonames(key);
    geoCache.set(key, data);
    return data;
  } catch (error) {
    console.error(`[geo/loader] Failed to fetch Geonames data for ${key}:`, error);
    return null;
  }
};

// ----------------------------------------------------------
// Public: getSupportedCountriesAsOptions — dari manifest (9 negara lokal)
// Ini hanya untuk keperluan internal jika tidak pakai API
// Untuk UI gunakan /api/geo/countries yang return semua negara dari Geonames
// ----------------------------------------------------------
export const getSupportedCountriesAsOptions = (): CountryOption[] =>
  (manifest?.countries ?? []).map((c) => ({
    value: c.code,
    label: c.name,
  }));

// ----------------------------------------------------------
// Helpers: find & get labels — dipakai di useOrgSettings
// ----------------------------------------------------------
const normalize = (value?: string | null) => value?.trim().toLowerCase() ?? "";

export const findStateValue = (geo: GeoCountry | null, input?: string | null): string => {
  if (!geo || !input) return "";
  const normalized = normalize(input);
  const match = geo.states.find(
    (state) =>
      normalize(state.value) === normalized ||
      normalize(state.label) === normalized ||
      (state.state_code && normalize(state.state_code) === normalized),
  );
  return match?.value ?? "";
};

export const findCityValue = (
  geo: GeoCountry | null,
  input?: string | null,
  stateValue?: string,
): string => {
  if (!geo || !input) return "";
  const normalized = normalize(input);
  const states = stateValue
    ? geo.states.filter((state) => state.value === stateValue)
    : geo.states;

  for (const state of states) {
    const city = state.cities.find(
      (c) => normalize(c.value) === normalized || normalize(c.label) === normalized,
    );
    if (city) return city.value;
  }
  return "";
};

export const getStateLabel = (geo: GeoCountry | null, value?: string | null): string => {
  if (!geo || !value) return "";
  const normalized = normalize(value);
  const match = geo.states.find((state) => normalize(state.value) === normalized);
  return match?.label ?? "";
};

export const getCityLabel = (geo: GeoCountry | null, value?: string | null): string => {
  if (!geo || !value) return "";
  const normalized = normalize(value);
  for (const state of geo.states) {
    const city = state.cities.find((c) => normalize(c.value) === normalized);
    if (city) return city.label;
  }
  return "";
};