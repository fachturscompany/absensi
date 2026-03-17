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
  name: string;
  states: GeoState[];
}

