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
            project:projects!inner(id, name, organization_id, client:clients(id, name)),
            assignees:task_assignees(
                id,
                organization_member_id,
                role,
                member:organization_members(
                    id,
                    user:user_profiles(id, first_name, last_name, display_name, profile_photo_url)
                )
            ),
            task_status:task_statuses(*)
        `)
        .eq("projects.organization_id", targetOrgId)
        .order("created_at", { ascending: false });

    if (error) {
        return { success: false, message: error.message, data: [] };
    }

    const resultData = data || [];

    if (resultData.length > 0) {
        // Collect all unique user IDs from all task assignees
        const userIds = new Set<string>();
        resultData.forEach((task: any) => {
            if (task.assignees) {
                task.assignees.forEach((a: any) => {
                    const userId = a.member?.user?.id || a.organization_member?.user?.id;
                    if (userId) userIds.add(userId);
                });
            }
        });

        if (userIds.size > 0) {
            // Fetch profile photos from user_profiles
            const { data: profiles, error: profileError } = await supabase
                .from("user_profiles")
                .select("id, profile_photo_url")
                .in("id", Array.from(userIds));

            if (!profileError && profiles) {
                const photoMap = new Map();
                profiles.forEach((p: any) => {
                    if (p.profile_photo_url) photoMap.set(p.id, p.profile_photo_url);
                });

                // Inject profiles into assignees
                resultData.forEach((task: any) => {
                    if (task.assignees) {
                        task.assignees.forEach((a: any) => {
                            const user = a.member?.user || a.organization_member?.user;
                            if (user && user.id && photoMap.has(user.id)) {
                                user.profile_photo_url = photoMap.get(user.id);
                            }
                        });
                    }
                });
            }
        }
    }

    return {
        success: true,
        data: resultData as ITask[]
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
    const task: Partial<ITask> = {
        name: formData.get("name") as string,
        project_id: Number(formData.get("project_id")),
        status_id: Number(formData.get("status_id")),
        position_in_column: Number(formData.get("position_in_column") || 1),
        priority: (formData.get("priority") as any) || "medium",
        description: formData.get("description") as string || null,
        parent_task_id: formData.get("parent_task_id") ? Number(formData.get("parent_task_id")) : null
    };

    const { data, error } = await supabase
        .from("tasks")
        .insert([task])
        .select()
        .single();

    if (error) {
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
    const task: Partial<ITask> = {};

    if (formData.has("name")) task.name = formData.get("name") as string;
    if (formData.has("status_id")) task.status_id = Number(formData.get("status_id"));
    if (formData.has("position_in_column")) task.position_in_column = Number(formData.get("position_in_column"));
    if (formData.has("priority")) task.priority = formData.get("priority") as any;
    if (formData.has("project_id")) task.project_id = Number(formData.get("project_id"));
    if (formData.has("description")) task.description = formData.get("description") as string;

    const { data, error } = await supabase
        .from("tasks")
        .update(task)
        .eq("id", id)
        .select()
        .single();

    if (error) {
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
 * Assign a member to a task
 */
export const assignTaskMember = async (taskId: number, memberId: number, role: string = 'assignee') => {
    const supabase = await getSupabase();
    const { data, error } = await supabase
        .from("task_assignees")
        .insert([{ task_id: taskId, organization_member_id: memberId, role }])
        .select()
        .single();

    if (error) {
        return { success: false, message: error.message };
    }

    return { success: true, data };
};
