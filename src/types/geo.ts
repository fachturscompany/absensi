// src/types/geo.ts
// Single source of truth untuk semua geo types
// Dipakai oleh loader.ts, api routes, dan hooks

export interface GeoCity {
  value: string;
  label: string;
}

export interface GeoState {
  value: string;
  label: string;
  state_code?: string;
  cities: GeoCity[];
}

export interface GeoCountry {
  code: string;
  label: string;   // konsisten dengan usage di hook & component
  states: GeoState[];
}

export interface CountryOption {
  value: string;  // e.g. "ID"
  label: string;  // e.g. "Indonesia"
}