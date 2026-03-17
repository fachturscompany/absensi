"use server"

import { getTasks, getTaskStatuses } from "@/action/task"
import { getAllOrganization_member } from "@/action/members"
import { ITask, IOrganization_member, ITaskStatus } from "@/interface"

interface TasksListPageData {
    tasks: ITask[]
    members: IOrganization_member[]
    taskStatuses: ITaskStatus[]
}

export async function getTasksListPageData(): Promise<TasksListPageData> {
    const [tasksRes, membersRes, statusesRes] = await Promise.all([
        getTasks(),
        getAllOrganization_member(),
        getTaskStatuses(),
    ])

    return {
        tasks: tasksRes.success ? tasksRes.data : [],
        members: membersRes.success ? membersRes.data : [],
        taskStatuses: statusesRes.success ? statusesRes.data : [],
    }
}
