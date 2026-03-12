// app/projects/[id]/tasks/utils.ts

import { ITask } from "@/interface"
import { TaskNode } from "@/types/tasks"

export function buildTaskTree(tasks: ITask[]): TaskNode[] {
    const map = new Map<number, TaskNode>()
    tasks.forEach(t => map.set(t.id, { ...t, children: [] }))
    const roots: TaskNode[] = []
    map.forEach(node => {
        if (node.parent_task_id && map.has(node.parent_task_id)) {
            map.get(node.parent_task_id)!.children.push(node)
        } else {
            roots.push(node)
        }
    })
    return roots
}

export function flattenTree(
    nodes: TaskNode[],
    expandedIds: Set<number>,
    depth = 0,
): { node: TaskNode; depth: number; hasChildren: boolean }[] {
    const result: { node: TaskNode; depth: number; hasChildren: boolean }[] = []
    for (const node of nodes) {
        result.push({ node, depth, hasChildren: node.children.length > 0 })
        if (expandedIds.has(node.id) && node.children.length > 0) {
            result.push(...flattenTree(node.children, expandedIds, depth + 1))
        }
    }
    return result
}
