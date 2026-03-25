// src/app/api/geo/countries/route.ts
// Mengembalikan list semua negara dari Geonames API
// Cache di module level — tidak berubah antar request

import { NextResponse } from "next/server";
import type { CountryOption } from "@/types/organization/org-settings";

let cachedCountries: CountryOption[] | null = null;

interface GeonamesCountryEntry {
  countryCode: string;
  countryName: string;
}

interface GeonamesCountryResponse {
  geonames: GeonamesCountryEntry[];
}

async function fetchAllCountries(): Promise<CountryOption[]> {
  const username = process.env.GEONAMES_USERNAME;
  if (!username) {
    throw new Error("GEONAMES_USERNAME is not set in environment variables");
  }

  const res = await fetch(
    `http://api.geonames.org/countryInfoJSON?username=${username}`,
    { next: { revalidate: 86400 } }, // Cache 24 jam di Next.js fetch cache
  );

  if (!res.ok) {
    throw new Error(`Geonames API error: ${res.status}`);
  }

  const data: GeonamesCountryResponse = await res.json();

  return data.geonames
    .map((c) => ({
      value: c.countryCode,
      label: c.countryName,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export async function GET() {
  try {
    if (!cachedCountries) {
      cachedCountries = await fetchAllCountries();
    }

    return NextResponse.json(cachedCountries, {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch (error) {
    console.error("[geo/countries] Failed to fetch countries:", error);
    return NextResponse.json(
      { error: "Failed to fetch country list" },
      { status: 500 },
    );
  }
}