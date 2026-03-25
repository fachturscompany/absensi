import { NextRequest, NextResponse } from "next/server"

/**
 * POST /api/organizations/select
 * Sets the org_id cookie so subsequent requests know which organization is active.
 */
export async function POST(req: NextRequest) {
    try {
        const { organizationId } = await req.json()

        console.log(`[API-SELECT] Received request with organizationId: ${organizationId}`)

        if (!organizationId) {
            console.error("[API-SELECT] Organization ID is missing")
            return NextResponse.json(
                { error: "Organization ID is required" },
                { status: 400 }
            )
        }

        const response = NextResponse.json(
            { success: true, message: "Organization selected", organizationId },
            { status: 200 }
        )

        console.log(`[API-SELECT] Setting cookie: org_id=${organizationId}`)
        response.cookies.set({
            name: "org_id",
            value: String(organizationId),
            path: "/",
            maxAge: 2592000, // 30 days
            sameSite: "lax",
            httpOnly: false,
        })

        console.log(`[API-SELECT] Cookie set successfully for organization: ${organizationId}`)
        console.log(`[API-SELECT] Response cookies:`, response.cookies.getAll())

        return response
    } catch (error) {
        console.error("[API-SELECT] Error selecting organization:", error)
        return NextResponse.json(
            { error: "Failed to select organization", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        )
    }
}
