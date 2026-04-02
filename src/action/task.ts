"use server";

import { createClient } from "@/utils/supabase/server";
import { getUserOrganization } from "@/utils/get-user-org";
import { ITask, ITaskStatus } from "@/interface";

async function getSupabase() {
    return await createClient();
}

/**
 * Fetch all tasks for the current organization
 */
export const getTasks = async (organizationId?: string | number) => {
    const supabase = await getSupabase();
    let targetOrgId = organizationId;

    if (!targetOrgId) {
        try {
            targetOrgId = await getUserOrganization(supabase);
        } catch (error) {
            console.error("getTasks: org resolution failed:", error);
            return { success: false, message: "Unauthorized or no organization found", data: [] };
        }
    }

    const { data, error } = await supabase
        .from("tasks")
        .select(`
            *,
            assignees:task_assignees(
                id,
                organization_member_id,
                member:organization_members(
                    id,
                    user:user_profiles(id, first_name, last_name, display_name, profile_photo_url)
                )
            ),
            task_status:task_statuses(*)
        `)
        .eq("organization_id", targetOrgId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("getTasks error:", error);
        return { success: false, message: error.message, data: [] };
    }

    return {
        success: true,
        data: (data ?? []) as ITask[]
    };
};

/**
 * Fetch task statuses for the organization
 */
export const getTaskStatuses = async (organizationId?: string | number) => {
    const supabase = await getSupabase();
    let targetOrgId = organizationId;

    if (!targetOrgId) {
        try {
            targetOrgId = await getUserOrganization(supabase);
        } catch (error) {
            return { success: false, message: "Unauthorized", data: [] };
        }
    }

    const { data, error } = await supabase
        .from("task_statuses")
        .select("*")
        .eq("organization_id", targetOrgId)
        .order("position", { ascending: true });

    if (error) {
        return { success: false, message: error.message, data: [] };
    }

    return { success: true, data: data as ITaskStatus[] };
};

/**
 * Create a new task
 */
export const createTask = async (formData: FormData) => {
    const supabase = await getSupabase();

    let organizationId: string | number;
    try {
        organizationId = await getUserOrganization(supabase);
    } catch {
        return { success: false, message: "Unauthorized", data: null };
    }

    const task: Record<string, any> = {
        name: formData.get("name") as string,
        organization_id: organizationId,
        priority: (formData.get("priority") as string) || "medium",
        position_in_column: Number(formData.get("position_in_column") || 1),
    };

    if (formData.get("status_id")) task.status_id = Number(formData.get("status_id"));
    if (formData.get("description")) task.description = formData.get("description") as string;
    if (formData.get("parent_task_id")) task.parent_task_id = Number(formData.get("parent_task_id"));

    const { data, error } = await supabase
        .from("tasks")
        .insert([task])
        .select()
        .single();

    if (error) {
        console.error("createTask error:", error);
        return { success: false, message: error.message, data: null };
    }

    return { success: true, message: "Task created successfully", data: data as ITask };
};

/**
 * Update an existing task
 */
export const updateTask = async (formData: FormData) => {
    const supabase = await getSupabase();
    const id = formData.get("id") as string;
    const task: Record<string, any> = {};

    if (formData.has("name")) task.name = formData.get("name") as string;
    if (formData.has("status_id")) task.status_id = Number(formData.get("status_id"));
    if (formData.has("position_in_column")) task.position_in_column = Number(formData.get("position_in_column"));
    if (formData.has("priority")) task.priority = formData.get("priority") as string;
    if (formData.has("description")) task.description = formData.get("description") as string;

    const { data, error } = await supabase
        .from("tasks")
        .update(task)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("updateTask error:", error);
        return { success: false, message: error.message, data: null };
    }

    return { success: true, message: "Task updated successfully", data: data as ITask };
};

/**
 * Delete a task
 */
export const deleteTask = async (formData: FormData) => {
    const supabase = await getSupabase();
    const id = formData.get("id") as string;

    const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id);

    if (error) {
        return { success: false, message: error.message };
    }

    return { success: true, message: "Task deleted successfully" };
};

/**
 * Assign a member to a task (supports multiple assignees)
 */
export const assignTaskMember = async (
    taskId: number,
    memberId: number,
    role: string = "assignee"
) => {
    const supabase = await getSupabase();

    // Upsert to avoid duplicate assignee error
    const { data, error } = await supabase
        .from("task_assignees")
        .upsert(
            [{ task_id: taskId, organization_member_id: memberId, role }],
            { onConflict: "task_id,organization_member_id" }
        )
        .select()
        .single();

    if (error) {
        console.error("assignTaskMember error:", error);
        return { success: false, message: error.message };
    }

    return { success: true, data };
};

/**
 * Remove a member from a task
 */
export const removeTaskMember = async (taskId: number, memberId: number) => {
    const supabase = await getSupabase();

    const { error } = await supabase
        .from("task_assignees")
        .delete()
        .eq("task_id", taskId)
        .eq("organization_member_id", memberId);

    if (error) {
        return { success: false, message: error.message };
    }

    return { success: true };
};
