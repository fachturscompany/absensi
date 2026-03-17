"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";

const GEOFENCE_TYPE_CODE = "GEOFENCE";

export async function ensureGeofenceType() {
    const adminClient = createAdminClient();
    
    const { data: existingType } = await adminClient
        .from("device_types")
        .select("id")
        .eq("code", GEOFENCE_TYPE_CODE)
        .maybeSingle();

    if (existingType) return existingType.id;

    // Create type if not exists
    const { data: newType, error: createError } = await adminClient
        .from("device_types")
        .insert({
            code: GEOFENCE_TYPE_CODE,
            name: "Geofence Virtual Perimeter",
            category: "Virtual",
        })
        .select("id")
        .single();

    if (createError) {
        console.error("Error creating Geofence device type:", createError);
        throw new Error("Could not ensure Geofence device type");
    }

    return newType.id;
}

export async function getGeofences(organizationId: string | number) {
    try {
        const supabase = await createClient();
        
        const { data, error } = await supabase
            .from("attendance_devices")
            .select(`
                id,
                device_name,
                location,
                latitude,
                longitude,
                radius_meters,
                is_active,
                device_types!inner(code)
            `)
            .eq("organization_id", organizationId)
            .eq("device_types.code", GEOFENCE_TYPE_CODE);

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error("Error in getGeofences:", error);
        return { success: false, message: "Failed to fetch geofences" };
    }
}

export async function createGeofence(payload: {
    organization_id: string | number;
    device_name: string;
    radius_meters: number;
    latitude?: number;
    longitude?: number;
    location?: string;
}) {
    try {
        const typeId = await ensureGeofenceType();
        const supabase = await createClient();

        // Generate a random device code to satisfy the unique constraint
        const deviceCode = `GEO-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

        const { data, error } = await supabase
            .from("attendance_devices")
            .insert({
                organization_id: payload.organization_id,
                device_type_id: typeId,
                device_code: deviceCode,
                device_name: payload.device_name,
                radius_meters: payload.radius_meters,
                latitude: payload.latitude,
                longitude: payload.longitude,
                location: payload.location,
                is_active: true
            })
            .select()
            .single();

        if (error) throw error;

        revalidatePath("/settings/Map/geofencing");
        return { success: true, data };
    } catch (error) {
        console.error("Error in createGeofence:", error);
        return { success: false, message: error instanceof Error ? error.message : "Failed to create geofence" };
    }
}

export async function deleteGeofence(id: string | number) {
    try {
        const supabase = await createClient();
        const { error } = await supabase
            .from("attendance_devices")
            .delete()
            .eq("id", id);

        if (error) throw error;

        revalidatePath("/settings/Map/geofencing");
        return { success: true };
    } catch (error) {
        console.error("Error in deleteGeofence:", error);
        return { success: false, message: "Failed to delete geofence" };
    }
}
