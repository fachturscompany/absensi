import { NextResponse } from "next/server";
import { loadGeoCountry } from "@/lib/geo/loader";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ country: string }> },
) {
  const { country } = await params;
  const countryCode = country?.toUpperCase();
  if (!countryCode) {
    return NextResponse.json({ error: "Country code is required" }, { status: 400 });
  }

  const geoData = await loadGeoCountry(countryCode);
  if (!geoData) {
    return NextResponse.json({ error: "Country not supported" }, { status: 404 });
  }

  return NextResponse.json(geoData);
}

