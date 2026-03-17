"use client"

import { redirect } from "next/navigation"

export default function TasksPage() {
    redirect("/projects/tasks/list")
}
