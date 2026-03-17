import React from "react"
import { Info, Loader2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { ModifyTimeOption } from "./MemberSettingsTable"

interface GlobalTimesheetSettingsProps {
    globalModifySetting: ModifyTimeOption
    globalRequireApproval: boolean
    allowManagersApprove: boolean
    loading: boolean
    modifyOptions: { value: ModifyTimeOption; label: string }[]
    onGlobalModifyChange: (value: ModifyTimeOption) => void
    onGlobalApprovalChange: (value: boolean) => void
    onAllowManagersApproveChange: (value: boolean) => void
    onApplyToAll: () => void
}

export function GlobalTimesheetSettings({
    globalModifySetting,
    globalRequireApproval,
    allowManagersApprove,
    loading,
    modifyOptions,
    onGlobalModifyChange,
    onGlobalApprovalChange,
    onAllowManagersApproveChange,
    onApplyToAll
}: GlobalTimesheetSettingsProps) {
    return (
        <div className="mb-10">
            {/* Default Label */}
            <div className="flex items-center gap-1 mb-3">
                <span className="text-[11px] font-normal text-gray-500 uppercase tracking-wider">
                    DEFAULT
                </span>
                <Info className="w-3.5 h-3.5 text-gray-400" />
            </div>

            {/* Default Settings Row */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-8">
                {/* Modify Time Toggle */}
                <div className="inline-flex rounded-full bg-gray-100 p-0.5 shrink-0">
                    {modifyOptions.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => onGlobalModifyChange(option.value)}
                            className={`px-5 py-2 text-sm font-medium rounded-full transition-all whitespace-nowrap ${globalModifySetting === option.value
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-700 font-light"
                                }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>

                {/* Require Approval Switch Group */}
                <div className="flex items-center gap-3 shrink-0">
                    <Switch
                        checked={globalRequireApproval}
                        onCheckedChange={onGlobalApprovalChange}
                        className="data-[state=checked]:!bg-gray-900 data-[state=unchecked]:bg-slate-200 [&>span]:!bg-white"
                    />
                    <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-600 font-medium">Require approval</span>
                        <Info className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                </div>

                <Button
                    onClick={onApplyToAll}
                    disabled={loading}
                    className="bg-gray-900 text-white hover:bg-gray-800 h-10 px-6 rounded-lg text-sm font-medium w-full sm:w-auto transition-all active:scale-95"
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply to all"}
                </Button>
            </div>

            {/* Approval Permission */}
            <div className="flex items-center gap-1 mb-3">
                <span className="text-[11px] font-normal text-gray-500 uppercase tracking-wider">
                    APPROVAL PERMISSION
                </span>
            </div>

            <div className="flex items-start sm:items-center gap-3">
                <Switch
                    checked={allowManagersApprove}
                    onCheckedChange={onAllowManagersApproveChange}
                    className="mt-0.5 sm:mt-0 data-[state=checked]:!bg-gray-900 data-[state=unchecked]:bg-slate-200 [&>span]:!bg-white"
                />
                <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                    <span className="text-sm text-gray-600 leading-snug font-light">Allow managers to approve or deny their own manual time</span>
                    <Info className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                </div>
            </div>
        </div>
    )
}
