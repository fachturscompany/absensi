
"use server";
import { createAdminClient } from "@/utils/supabase/admin";
import { createSupabaseClient } from "@/config/supabase-config";
import { IRole } from "@/interface";

export const getAllRole = async () => {
    // Gunakan admin client untuk bypass RLS pada server side
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
        .from("system_roles")
        .select("*")
        .order("priority", { ascending: true })

    if (error) {
        console.error("[getAllRole] error:", error.message);
        return { success: false, message: error.message, data: [] as IRole[] };
    }

    return { success: true, data: data as IRole[] };
};


export async function createRole(payload: Partial<IRole>) {
    const supabase = await createSupabaseClient();
    const { data, error } = await supabase
        .from("system_roles")
        .insert(payload)
        .select()
        .single()

    if (error) {
        return { success: false, message: error.message, data: [] };
    }

    return { success: true, data: data as IRole[] };
}

export async function updateRole(id: string, payload: Partial<IRole>) {
    const supabase = await createSupabaseClient();
    const { data, error } = await supabase
        .from("system_roles")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()

    if (error) {
        return { success: false, message: error.message, data: [] };
    }

    return { success: true, data: data as IRole[] };
}


export const deleteRole = async ( RoleId: string | number) => {
     const id = String(RoleId) // convert to string
    const supabase = await createSupabaseClient();
    const { data, error } = await supabase
        .from("system_roles").delete().eq("id", id)
        .select()
        .single();

    if (error) {
        return { success: false, message: error.message, data: null };
    }
    return { success: true, message: "Deleted successfully", data: data as IRole };
};
