// src/app/api/geo/[country]/route.ts
// Mengembalikan data geo (states + cities) untuk satu negara
// Hybrid: local JSON dulu → fallback Geonames API

import { NextResponse } from "next/server";
import { loadGeoCountry } from "@/lib/geo/loader";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ country: string }> },
) {
  const { country } = await params;
  const countryCode = country?.toUpperCase();

  if (!countryCode) {
    return NextResponse.json(
      { error: "Country code is required" },
      { status: 400 },
    );
  }

  const geoData = await loadGeoCountry(countryCode);

  if (!geoData) {
    return NextResponse.json(
      { error: `No geo data available for country: ${countryCode}` },
      { status: 404 },
    );
  }

  return NextResponse.json(geoData, {
    headers: {
      // Local data: cache lebih lama. Geonames data: 1 jam
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}