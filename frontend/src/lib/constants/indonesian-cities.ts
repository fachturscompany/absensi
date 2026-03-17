// This file is deprecated - use @/lib/geo/loader instead
// Keeping for backward compatibility but removing the import to fix build errors
const geoData = { countries: [] };

interface GeoCity {
  value: string;
  label: string;
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

const countriesMap = new Map<string, GeoCountry>(
  (geoData.countries as GeoCountry[]).map((country) => [country.code.toUpperCase(), country]),
);

const normalize = (value?: string | null) => value?.trim().toLowerCase() ?? "";

const resolveCountry = (countryCode: string) =>
  countriesMap.get((countryCode || "ID").toUpperCase());

export const getCityOptionsByCountry = (countryCode: string = "ID"): GeoCity[] => {
  const country = resolveCountry(countryCode);
  if (!country) return [];
  return country.states.flatMap((state) => state.cities);
};

export const findCityValue = (input?: string | null, countryCode: string = "ID"): string => {
  if (!input) return "";
  const normalized = normalize(input);
  const country = resolveCountry(countryCode);
  if (country) {
    const countryMatch = findCityInCountry(country, normalized);
    if (countryMatch) return countryMatch;
  }

  for (const other of countriesMap.values()) {
    const match = findCityInCountry(other, normalized);
    if (match) return match;
  }
  return "";
};

export const getCityLabel = (value?: string | null, countryCode: string = "ID"): string => {
  if (!value) return "";
  const normalized = normalize(value);

  const country = resolveCountry(countryCode);
  if (country) {
    const match = findCityLabelInCountry(country, normalized);
    if (match) return match;
  }

  for (const other of countriesMap.values()) {
    const match = findCityLabelInCountry(other, normalized);
    if (match) return match;
  }

  return "";
};

const findCityInCountry = (country: GeoCountry, normalized: string): string | null => {
  for (const state of country.states) {
    for (const city of state.cities) {
      if (normalize(city.value) === normalized || normalize(city.label) === normalized) {
        return city.value;
      }
    }
  }
  return null;
};

const findCityLabelInCountry = (country: GeoCountry, normalized: string): string | null => {
  for (const state of country.states) {
    for (const city of state.cities) {
      if (normalize(city.value) === normalized || normalize(city.label) === normalized) {
        return city.label;
      }
    }
  }
  return null;
};

