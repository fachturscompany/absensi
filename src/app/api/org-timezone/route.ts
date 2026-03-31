import { NextResponse } from "next/server";
import { getOrganizationTimezoneByUserId } from "@/action/organization";

// Gunakan 'nodejs' jika database driver Anda tidak mendukung Edge
export const runtime = 'nodejs'; 
export const dynamic = 'force-dynamic';

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
          status: 200,
          headers: {
            "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
          }
        }
      );
    }

    const timezone = await getOrganizationTimezoneByUserId(userId);
    
    // Pastikan jika data tidak ditemukan, return default
    const finalTimezone = timezone || "Asia/Jakarta";

    return NextResponse.json(
      { timezone: finalTimezone },
      {
        status: 200,
        headers: {
          // 'private' karena data ini spesifik untuk user/organisasi tertentu
          "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
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
        status: 500
      }
    );
  }
}