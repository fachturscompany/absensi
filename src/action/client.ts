"use server";

import { createClient } from "@/utils/supabase/server";
import { getUserOrganization } from "@/utils/get-user-org";
import { IClient } from "@/interface";

async function getSupabase() {
    return await createClient();
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClientRow extends Omit<IClient, 'project_count' | 'task_count'> {
    client_projects: Array<{
        project_id: number
        projects: {
            id: number
            name: string
            tasks: Array<{ id: number }>
        } | null
    }>
}

interface ClientInsertPayload {
    organization_id: number
    name: string
    address?: string | null
    phone?: string | null
    email?: string | null
    status: 'active' | 'archived'
    budget_type?: string | null
    budget_amount?: number | null
    notify_percentage?: number
    invoice_notes?: string | null
    net_terms_days?: number
    auto_invoice_frequency?: string | null
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export const getClients = async (organizationId?: string | number) => {
    const supabase = await getSupabase();
    let targetOrgId = organizationId;

    if (!targetOrgId) {
        try {
            targetOrgId = await getUserOrganization(supabase);
        } catch (error) {
            console.error("getClients: org resolution failed:", error);
            return { success: false, message: "Unauthorized or no organization found", data: [] as IClient[] };
        }
    }

    const { data, error } = await supabase
        .from("clients")
        .select(`
            *
        `)
        .eq("organization_id", targetOrgId)
        .order("name", { ascending: true });

    if (error) {
        console.error("getClients error:", error);
        return { success: false, message: error.message, data: [] as IClient[] };
    }

    const mapped = (data as ClientRow[]).map((client) => {
        return {
            ...client,
            project_count: 0,
            task_count: 0,
        } as unknown as IClient
    })

    return { success: true, data: mapped };
};

// ─── Create ───────────────────────────────────────────────────────────────────

export const createClientAction = async (formData: FormData) => {
    const supabase = await getSupabase();

    let organizationId: number;
    try {
        organizationId = await getUserOrganization(supabase) as number;
    } catch {
        return { success: false, message: "Unauthorized", data: null };
    }

    const project_ids_raw = formData.get("project_ids") as string | null;
    const projectIds: number[] = project_ids_raw ? JSON.parse(project_ids_raw) : [];

    const budgetAmountRaw = formData.get("budget_amount") as string | null
    const notifyRaw = formData.get("notify_percentage") as string | null
    const netTermsRaw = formData.get("net_terms_days") as string | null

    const clientData: ClientInsertPayload = {
        organization_id: organizationId,
        name: formData.get("name") as string,
        address: formData.get("address") as string || null,
        phone: formData.get("phone") as string || null,
        email: formData.get("email") as string || null,
        status: (formData.get("status") as 'active' | 'archived') || 'active',
        budget_type: formData.get("budget_type") as string || null,
        budget_amount: budgetAmountRaw ? parseFloat(budgetAmountRaw) : null,
        notify_percentage: notifyRaw ? parseInt(notifyRaw) : 80,
        invoice_notes: formData.get("invoice_notes") as string || null,
        net_terms_days: netTermsRaw ? parseInt(netTermsRaw) : 30,
        auto_invoice_frequency: formData.get("auto_invoice_frequency") as string || null,
    };

    const { data, error } = await supabase
        .from("clients")
        .insert([clientData])
        .select()
        .single();

    if (error) {
        return { success: false, message: error.message, data: null };
    }

    if (projectIds.length > 0) {
        const clientProjects = projectIds.map((projectId) => ({
            client_id: data.id as number,
            project_id: projectId,
        }));
        await supabase.from("client_projects").insert(clientProjects);
    }

    return { success: true, message: "Client created successfully", data: data as IClient };
};

// ─── Update ───────────────────────────────────────────────────────────────────

export const updateClientAction = async (formData: FormData) => {
    const supabase = await getSupabase();
    const id = Number(formData.get("id"));

    const project_ids_raw = formData.get("project_ids") as string | null;
    const projectIds: number[] | undefined = project_ids_raw ? JSON.parse(project_ids_raw) : undefined;

    const budgetAmountRaw = formData.get("budget_amount") as string | null
    const notifyRaw = formData.get("notify_percentage") as string | null
    const netTermsRaw = formData.get("net_terms_days") as string | null

    const clientData: Partial<ClientInsertPayload> = {
        name: formData.get("name") as string,
        address: formData.get("address") as string || null,
        phone: formData.get("phone") as string || null,
        email: formData.get("email") as string || null,
        budget_type: formData.get("budget_type") as string || null,
        budget_amount: budgetAmountRaw ? parseFloat(budgetAmountRaw) : null,
        notify_percentage: notifyRaw ? parseInt(notifyRaw) : 80,
        invoice_notes: formData.get("invoice_notes") as string || null,
        net_terms_days: netTermsRaw ? parseInt(netTermsRaw) : 30,
        auto_invoice_frequency: formData.get("auto_invoice_frequency") as string || null,
    };

    const { data, error } = await supabase
        .from("clients")
        .update(clientData)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        return { success: false, message: error.message, data: null };
    }

    if (projectIds !== undefined) {
        await supabase.from("client_projects").delete().eq("client_id", id);
        if (projectIds.length > 0) {
            const clientProjects = projectIds.map((projectId) => ({
                client_id: id,
                project_id: projectId,
            }));
            await supabase.from("client_projects").insert(clientProjects);
        }
    }

    return { success: true, message: "Client updated successfully", data: data as IClient };
};

// ─── Status ───────────────────────────────────────────────────────────────────

export const updateClientStatus = async (formData: FormData) => {
    const supabase = await getSupabase();
    const id = Number(formData.get("id"));
    const status = formData.get("status") as 'active' | 'archived';

    const { error } = await supabase
        .from("clients")
        .update({ status })
        .eq("id", id);

    if (error) return { success: false, message: error.message };
    return { success: true, message: `Client ${status === 'archived' ? 'archived' : 'restored'} successfully` };
};

// ─── Delete ───────────────────────────────────────────────────────────────────

export const deleteClientAction = async (formData: FormData) => {
    const supabase = await getSupabase();
    const id = Number(formData.get("id"));

    const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", id);

    if (error) return { success: false, message: error.message };
    return { success: true, message: "Client deleted successfully" };
};