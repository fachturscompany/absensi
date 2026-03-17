"use server";

import { createClient } from "@/utils/supabase/server";

interface CancelRegisterResponse {
  success: boolean;
  message: string;
  rowsAffected?: number;
}

/**
 * Cancel pending finger registration for a user
 * @param userId - User ID to cancel registration for
 * @param deviceCode - Device code where registration was initiated
 * @param fingerNumber - Finger number (1 or 2) to cancel
 * @returns Response with success status and affected rows count
 */
export async function cancelRegister(
  userId: string,
  deviceCode: string,
  fingerNumber: 1 | 2
): Promise<CancelRegisterResponse> {
  // Validation
  if (!userId || !deviceCode) {
    return {
      success: false,
      message: "userId and deviceCode are required",
    };
  }

  if (![1, 2].includes(fingerNumber)) {
    return {
      success: false,
      message: "fingerNumber must be 1 or 2",
    };
  }

  try {
    const supabase = await createClient();

    // Get the current user to verify authorization
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        message: "User not authenticated",
      };
    }

    // Cancel the pending registration command
    const { data, error } = await supabase
      .from("device_commands")
      .update({
        status: "CANCELLED",
        // Don't set executed_at for cancelled commands
      })
      .eq("device_code", deviceCode)
      .eq("status", "PENDING")
      .filter("payload->user_id", "eq", userId)
      .filter("payload->finger_number", "eq", fingerNumber)
      .select("id");

    if (error) {
      console.error("[CANCEL-REGISTER] Error:", error.message);
      return {
        success: false,
        message: `Failed to cancel: ${error.message}`,
      };
    }

    const affectedRows = data?.length || 0;
    console.log(
      `[CANCEL-REGISTER] Successfully cancelled ${affectedRows} command(s) for user ${userId} finger ${fingerNumber}`
    );

    return {
      success: true,
      message: `Cancelled finger ${fingerNumber} registration`,
      rowsAffected: affectedRows,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error("[CANCEL-REGISTER] Unexpected error:", errorMsg);
    return {
      success: false,
      message: `Unexpected error: ${errorMsg}`,
    };
  }
}

/**
 * Get pending registrations for a member
 */
export async function getPendingRegistrations(userId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("device_commands")
      .select("id, device_code, payload, created_at, status")
      .eq("status", "PENDING")
      .filter("payload->user_id", "eq", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[GET-PENDING] Error:", error.message);
      return { success: false, data: [] };
    }

    return { success: true, data: data || [] };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error("[GET-PENDING] Unexpected error:", errorMsg);
    return { success: false, data: [] };
  }
}
