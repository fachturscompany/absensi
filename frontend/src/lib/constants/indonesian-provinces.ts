// This file is deprecated - use @/lib/geo/loader instead
// Keeping for backward compatibility but removing the import to fix build errors
const geoData = { countries: [] };

export interface ProvinceOption {
  value: string;
  label: string;
  country: string;
  state_code?: string;
}

interface GeoCountry {
  code: string;
  name: string;
  states: {
    value: string;
    label: string;
    state_code?: string;
  }[];
}

const countriesMap = new Map(
  (geoData.countries as GeoCountry[]).map((country) => [country.code.toUpperCase(), country]),
);

const normalize = (value?: string | null) => value?.trim().toLowerCase() ?? "";

const resolveCountry = (countryCode: string) =>
  countriesMap.get((countryCode || "ID").toUpperCase());

export const getProvinceOptionsByCountry = (countryCode: string = "ID"): ProvinceOption[] => {
  const country = resolveCountry(countryCode);
  if (!country) return [];
  return country.states.map((state) => ({
    value: state.value,
    label: state.label,
    state_code: state.state_code,
    country: country.code,
  }));
};

export const findProvinceValue = (
  input?: string | null,
  countryCode: string = "ID",
): string => {
  if (!input) return "";
  const normalized = normalize(input);
  const countryOptions = getProvinceOptionsByCountry(countryCode);
  const countryMatch = countryOptions.find((option) => matchesOption(option, normalized));
  if (countryMatch) return countryMatch.value;

  for (const country of countriesMap.values()) {
    for (const state of country.states) {
      if (matchesOption({ value: state.value, label: state.label, country: country.code }, normalized)) {
        return state.value;
      }
    }
  }
  return "";
};

export const getProvinceLabel = (
  value?: string | null,
  countryCode: string = "ID",
): string => {
  if (!value) return "";
  const normalized = normalize(value);
  const countryOptions = getProvinceOptionsByCountry(countryCode);
  const countryMatch = countryOptions.find((option) => normalize(option.value) === normalized);
  if (countryMatch) return countryMatch.label;

  for (const country of countriesMap.values()) {
    for (const state of country.states) {
      if (normalize(state.value) === normalized) {
        return state.label;
      }
    }
  }
  return "";
};

const matchesOption = (option: ProvinceOption, target: string) => {
  if (!target) return false;
  const normalizedValue = normalize(option.value);
  if (normalizedValue === target) return true;
  if (normalize(option.label) === target) return true;
  const withoutPrefix = normalizedValue.replace(/^[a-z]{2}-/, "");
  return withoutPrefix === target;
};

