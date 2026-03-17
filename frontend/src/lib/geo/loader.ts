import type { GeoCountry } from "@/types/geo";
import manifest from "@/lib/data/geo/manifest.json";

const geoLoaders = {
  ID: () => import("@/lib/data/geo/ID.json").then((mod) => mod.default as GeoCountry),
  MY: () => import("@/lib/data/geo/MY.json").then((mod) => mod.default as GeoCountry),
  SG: () => import("@/lib/data/geo/SG.json").then((mod) => mod.default as GeoCountry),
  TH: () => import("@/lib/data/geo/TH.json").then((mod) => mod.default as GeoCountry),
  PH: () => import("@/lib/data/geo/PH.json").then((mod) => mod.default as GeoCountry),
  VN: () => import("@/lib/data/geo/VN.json").then((mod) => mod.default as GeoCountry),
  US: () => import("@/lib/data/geo/US.json").then((mod) => mod.default as GeoCountry),
  GB: () => import("@/lib/data/geo/GB.json").then((mod) => mod.default as GeoCountry),
  AU: () => import("@/lib/data/geo/AU.json").then((mod) => mod.default as GeoCountry),
} as const;

const geoCache = new Map<string, GeoCountry>();

export const getSupportedCountries = () =>
  (manifest?.countries ?? []).map((country) => ({
    code: country.code,
    name: country.name,
    states: country.states,
    cities: country.cities,
  }));

export const loadGeoCountry = async (code: string): Promise<GeoCountry | null> => {
  const key = (code || "").toUpperCase();
  if (geoCache.has(key)) {
    return geoCache.get(key)!;
  }

  const loader = (geoLoaders as Record<string, () => Promise<GeoCountry>>)[key];
  if (!loader) return null;

  const data = await loader();
  geoCache.set(key, data);
  return data;
};

export const findStateValue = (geo: GeoCountry | null, input?: string | null) => {
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
) => {
  if (!geo || !input) return "";
  const normalized = normalize(input);
  const states = stateValue
    ? geo.states.filter((state) => state.value === stateValue)
    : geo.states;

  for (const state of states) {
    const city = state.cities.find(
      (c) => normalize(c.value) === normalized || normalize(c.label) === normalized,
    );
    if (city) {
      return city.value;
    }
  }
  return "";
};

export const getStateLabel = (geo: GeoCountry | null, value?: string | null) => {
  if (!geo || !value) return "";
  const normalized = normalize(value);
  const match = geo.states.find((state) => normalize(state.value) === normalized);
  return match?.label ?? "";
};

export const getCityLabel = (geo: GeoCountry | null, value?: string | null) => {
  if (!geo || !value) return "";
  const normalized = normalize(value);
  for (const state of geo.states) {
    const city = state.cities.find((c) => normalize(c.value) === normalized);
    if (city) {
      return city.label;
    }
  }
  return "";
};

const normalize = (value?: string | null) => value?.trim().toLowerCase() ?? "";

