import { createClient } from "@/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"

/**
 * DELETE /api/applications/[id]
 * Revokes/Deletes a registered application.
 */
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const supabase = await createClient()

    try {
        // 1. Check authentication/authorization
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // 2. Delete the application
        const { error: deleteError } = await supabase
            .from('applications')
            .delete()
            .eq('id', id)

        if (deleteError) {
            console.error('[applications] Failed to delete:', deleteError)
            return NextResponse.json(
                { error: "Failed to delete application", details: deleteError.message },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[applications] Unexpected error:', error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

/**
 * PATCH /api/applications/[id]
 * Updates an application's details (status, note, etc).
 */
/**
 * PATCH /api/applications/[id]
 * Updates an application's details (status, note, etc).
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const supabase = await createClient()

    try {
        const body = await request.json()

        // 1. Auth check
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // 2. Validate fields (basic)
        // Allowed updates: name, developer, email, note, is_active
        const updates: any = {}
        if (body.name !== undefined) updates.name = body.name
        if (body.developer !== undefined) updates.developer = body.developer
        if (body.email !== undefined) updates.email = body.email
        if (body.note !== undefined) updates.note = body.note
        if (body.is_active !== undefined) updates.is_active = body.is_active

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
        }

        updates.updated_at = new Date().toISOString()

        // 3. Update application
        const { error: updateError } = await supabase
            .from('applications')
            .update(updates)
            .eq('id', id)

        if (updateError) {
            console.error('[applications] Failed to update:', updateError)
            return NextResponse.json(
                { error: "Failed to update application", details: updateError.message },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('[applications] Unexpected error:', error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}