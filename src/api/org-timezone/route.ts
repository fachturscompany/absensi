import { NextResponse } from "next/server";
import { getOrganizationTimezoneByUserId } from "@/action/organization";

// Config untuk route
export const dynamic = 'force-dynamic'; // Atau hapus jika mau default
export const runtime = 'edge'; // Pilih satu: 'edge' atau 'nodejs'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { 
          timezone: "Asia/Jakarta",
          message: "Using default timezone" 
        },
        {
          headers: {
            "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
            "CDN-Cache-Control": "public, s-maxage=3600"
          }
        }
      );
    }

    const timezone = await getOrganizationTimezoneByUserId(userId);
    
    return NextResponse.json(
      { timezone },
      {
        headers: {
          "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
          "CDN-Cache-Control": "no-cache"
        }
      }
    );
    
  } catch (error) {
    console.error("Error fetching timezone:", error);
    
    return NextResponse.json(
      { 
        timezone: "UTC",
        error: "Failed to fetch user timezone" 
      },
      { 
        status: 500,
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  }
}
