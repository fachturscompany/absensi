
"use server";
import {createSupabaseClient} from "@/config/supabase-config";
import {IPermission } from "@/interface";

export const getAllPermission = async () => {
    const supabase = await createSupabaseClient();
    const { data, error } = await supabase.from("permissions")
        .select("*")
        .order("created_at", { ascending: false })

    if (error) {
        return { success: false, message: error.message, data: [] };
    }

    return { success: true, data: data as IPermission[] };
};

export async function createPermission(payload: Partial<IPermission>) {
    const supabase = await createSupabaseClient();
    const { data, error } = await supabase
        .from("permissions")
        .insert(payload)
        .select()
        .single()

    if (error) {
        return { success: false, message: error.message, data: [] };
    }

    return { success: true, data: data as IPermission[] };
}

export async function updatePermission(id: string, payload: Partial<IPermission>) {
    const supabase = await createSupabaseClient();
    const { data, error } = await supabase
        .from("permissions")
        .update({ ...payload})
        .eq("id", id)
        .select()
        .single()

    if (error) {
        return { success: false, message: error.message, data: [] };
    }

    return { success: true, data: data as IPermission[] };
}


export const deletePermission = async ( PermissionId: string | number) => {
     const id = String(PermissionId) // convert to string
    const supabase = await createSupabaseClient();
    const { data, error } = await supabase
        .from("permissions").delete().eq("id", id)
        .select()
        .single();

    if (error) {
        return { success: false, message: error.message, data: null };
    }
    return { success: true, message: "Deleted successfully", data: data as IPermission };
};
