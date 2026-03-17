"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { IAttendanceDevice, IDeviceType } from "@/interface";

import { attendanceLogger } from '@/lib/logger';
async function getSupabase() {
  return await createClient();
}

export const getAllAttendanceDevices = async (organizationId?: number | string) => {
  const supabase = await getSupabase();

  let query = supabase
    .from("attendance_devices")
    .select(`
      *,
      device_types (*),
      organizations (id, name)
    `)
    .order("created_at", { ascending: false });

  // Filter by organization if provided
  if (organizationId) {
    query = query.eq("organization_id", organizationId);
  }

  const { data, error } = await query;

  if (error) {
    attendanceLogger.error("❌ Error fetching attendance devices:", error);
    return { success: false, data: [] };
  }

  return { success: true, data: data as IAttendanceDevice[] };
};

export const getAttendanceDeviceById = async (id: string) => {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("attendance_devices")
    .select(`
      *,
      device_types (*),
      organizations (id, name)
    `)
    .eq("id", id)
    .single();

  if (error) {
    attendanceLogger.error("❌ Error fetching attendance device:", error);
    return { success: false, data: null };
  }

  return { success: true, data: data as IAttendanceDevice };
};

export const getDeviceTypes = async () => {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("device_types")
    .select("*")
    .order("name");

  if (error) {
    attendanceLogger.error("❌ Error fetching device types:", error);
    return { success: false, data: [] };
  }

  return { success: true, data: data as IDeviceType[] };
};

type CreateDevicePayload = {
  organization_id: number;
  device_type_id: number;
  device_code: string;
  device_name: string;
  serial_number?: string;
  ip_address?: string;
  mac_address?: string;
  location?: string;
  latitude?: string;
  longitude?: string;
  radius_meters?: number;
  firmware_version?: string;
  is_active?: boolean;
  configuration?: Record<string, unknown>;
};

export const createAttendanceDevice = async (payload: CreateDevicePayload) => {
  try {
    const supabase = await getSupabase();

    const { data, error } = await supabase
      .from("attendance_devices")
      .insert([payload])
      .select()
      .single();

    if (error) {
      attendanceLogger.error("❌ Error creating attendance device:", error);
      return { success: false, message: error.message };
    }

    revalidatePath("/attendance/locations");
    return { success: true, data };
  } catch (err) {
    attendanceLogger.error("❌ Exception creating attendance device:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "An error occurred",
    };
  }
};

type UpdateDevicePayload = Partial<CreateDevicePayload>;

export const updateAttendanceDevice = async (
  id: string,
  payload: UpdateDevicePayload
) => {
  try {
    const supabase = await getSupabase();

    const { data, error } = await supabase
      .from("attendance_devices")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      attendanceLogger.error("❌ Error updating attendance device:", error);
      return { success: false, message: error.message };
    }

    revalidatePath("/attendance/locations");
    return { success: true, data };
  } catch (err) {
    attendanceLogger.error("❌ Exception updating attendance device:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "An error occurred",
    };
  }
};

export const deleteAttendanceDevice = async (id: string) => {
  try {
    const supabase = await getSupabase();

    const { error } = await supabase
      .from("attendance_devices")
      .delete()
      .eq("id", id);

    if (error) {
      attendanceLogger.error("❌ Error deleting attendance device:", error);
      return { success: false, message: error.message };
    }

    revalidatePath("/attendance/locations");
    return { success: true };
  } catch (err) {
    attendanceLogger.error("❌ Exception deleting attendance device:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "An error occurred",
    };
  }
};

export const toggleDeviceStatus = async (id: string, is_active: boolean) => {
  try {
    const supabase = await getSupabase();

    const { error } = await supabase
      .from("attendance_devices")
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      attendanceLogger.error("❌ Error toggling device status:", error);
      return { success: false, message: error.message };
    }

    revalidatePath("/attendance/locations");
    return { success: true };
  } catch (err) {
    attendanceLogger.error("❌ Exception toggling device status:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "An error occurred",
    };
  }
};

// Device activation function
export const activateDevice = async (serialNumber: string, organizationId: number) => {
  try {
    const supabase = await getSupabase();

    // Check if device with this serial number exists and is not activated
    const { data: device, error: fetchError } = await supabase
      .from("attendance_devices")
      .select("*, device_types(*)")
      .eq("serial_number", serialNumber)
      .is("organization_id", null)
      .single();

    if (fetchError || !device) {
      attendanceLogger.error("❌ Device not found or already activated:", fetchError);
      return {
        success: false,
        message: "Device not found or already activated. Please check the serial number."
      };
    }

    // Update device with organization_id
    const { data: updatedDevice, error: updateError } = await supabase
      .from("attendance_devices")
      .update({
        organization_id: organizationId,
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .eq("id", device.id)
      .select()
      .single();

    if (updateError) {
      attendanceLogger.error("❌ Error activating device:", updateError);
      return { success: false, message: updateError.message };
    }

    revalidatePath("/attendance/devices");
    return { success: true, data: updatedDevice, message: "Device activated successfully!" };
  } catch (err) {
    attendanceLogger.error("❌ Exception activating device:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "An error occurred",
    };
  }
};

// Get devices for a specific organization
export const getOrganizationDevices = async (organizationId: number) => {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("attendance_devices")
    .select(`
      *,
      device_types (*),
      organizations (id, name)
    `)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    attendanceLogger.error("❌ Error fetching organization devices:", error);
    return { success: false, data: [] };
  }

  return { success: true, data: data as IAttendanceDevice[] };
};

// Deactivate device (set organization_id to null)
export const deactivateDevice = async (deviceId: string) => {
  try {
    const supabase = await getSupabase();

    const { error } = await supabase
      .from("attendance_devices")
      .update({
        organization_id: null,
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq("id", deviceId);

    if (error) {
      attendanceLogger.error("❌ Error deactivating device:", error);
      return { success: false, message: error.message };
    }

    revalidatePath("/attendance/devices");
    return { success: true, message: "Device deactivated successfully!" };
  } catch (err) {
    attendanceLogger.error("❌ Exception deactivating device:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "An error occurred",
    };
  }
};

// CRUD for device_types
export const createDeviceType = async (payload: {
  code: string;
  name: string;
  category: string;
  manufacturer?: string;
  model?: string;
  specifications?: Record<string, unknown>;
}) => {
  try {
    const supabase = await getSupabase();

    const { data, error } = await supabase
      .from("device_types")
      .insert([payload])
      .select()
      .single();

    if (error) {
      attendanceLogger.error("❌ Error creating device type:", error);
      return { success: false, message: error.message };
    }

    revalidatePath("/attendance/devices");
    return { success: true, data };
  } catch (err) {
    attendanceLogger.error("❌ Exception creating device type:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "An error occurred",
    };
  }
};

export const updateDeviceType = async (
  id: string,
  payload: {
    code?: string;
    name?: string;
    category?: string;
    manufacturer?: string;
    model?: string;
    specifications?: Record<string, unknown>;
  }
) => {
  try {
    const supabase = await getSupabase();

    const { data, error } = await supabase
      .from("device_types")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      attendanceLogger.error("❌ Error updating device type:", error);
      return { success: false, message: error.message };
    }

    revalidatePath("/attendance/devices");
    return { success: true, data };
  } catch (err) {
    attendanceLogger.error("❌ Exception updating device type:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "An error occurred",
    };
  }
};

export const deleteDeviceType = async (id: string) => {
  try {
    const supabase = await getSupabase();

    const { error } = await supabase
      .from("device_types")
      .delete()
      .eq("id", id);

    if (error) {
      attendanceLogger.error("❌ Error deleting device type:", error);
      return { success: false, message: error.message };
    }

    revalidatePath("/attendance/devices");
    return { success: true };
  } catch (err) {
    attendanceLogger.error("❌ Exception deleting device type:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "An error occurred",
    };
  }
};
