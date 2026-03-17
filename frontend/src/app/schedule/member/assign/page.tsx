"use client"

import { MemberScheduleAssignForm } from "@/components/form/member-schedule-assign-form"

export default function MemberScheduleAssignPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 w-full">
      <div className="w-full">
        <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 md:p-6 space-y-6 overflow-x-auto">
            <MemberScheduleAssignForm />
          </div>
        </div>
      </div>
    </div>
  )
}
