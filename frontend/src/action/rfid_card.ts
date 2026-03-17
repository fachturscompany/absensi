
"use server";
import { supabase } from "@/config/supabase-config";
import { IRfidCard } from "@/interface";

import { logger } from '@/lib/logger';
export const getAllRfidCard = async () => {
    const { data, error } = await supabase.from("rfid_cards")
        .select("*")
        .order("created_at", { ascending: false })

    if (error) {
        return { success: false, message: error.message, data: [] };
    }

    return { success: true, data: data as IRfidCard[] };
};

export async function createRfidCard(payload: Partial<IRfidCard>) {
    const { data, error } = await supabase
        .from("rfid_cards")
        .insert(payload)
        .select()
        .single()

    if (error) {
         logger.error("Insert RFID error:", error)
        return { success: false, message: error.message, data: [] };
    }

    return { success: true, data: data as IRfidCard[] };
}
export async function updateRfidCard(id: string, payload: Partial<IRfidCard>) {
    const { data, error } = await supabase
        .from("rfid_cards")
        .update({ ...payload, })
        .eq("id", id)
        .select()
        .single()

    if (error) {
        return { success: false, message: error.message, data: [] };
    }

    return { success: true, data: data as IRfidCard[] };
}

export const deleteRfidCard = async (CardId: string | number) => {
    const id = String(CardId) // convert to string
    const { data, error } = await supabase
        .from("rfid_cards").delete().eq("id", id)
        .select()
        .single();

    if (error) {
        return { success: false, message: error.message, data: null };
    }
    return { success: true, message: "Deleted successfully", data: data as IRfidCard };
};
export async function getRfidCards(organizationMemberId: number) {
  try {
    const { data, error } = await supabase
      .from("rfid_cards")
      .select("*")
      .eq("organization_member_id", organizationMemberId) // 🔹 filter sesuai member

    if (error) throw error
    return { success: true, data }
  } catch (err: unknown) {
    return { success: false, message: err instanceof Error ? err instanceof Error ? err.message : 'Unknown error' : 'Unknown error' }
  }
}
