"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Check, Info, CloudUpload } from "lucide-react"
import { MemberSelectionModal } from "@/components/settings/MemberSelectionModal"

interface AddTimeOffPolicyDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (policy: any) => void
    initialData?: any
    mode?: "default" | "members" | "policy"
}

export function AddTimeOffPolicyDialog({ open, onOpenChange, onSave, initialData, mode = "default" }: AddTimeOffPolicyDialogProps) {
    const [step, setStep] = useState(1)

    // Form states
    const [policyName, setPolicyName] = useState("")
    const [accrualSchedule, setAccrualSchedule] = useState("annual")
    const [maxAccrual, setMaxAccrual] = useState("")
    const [accrualAmount, setAccrualAmount] = useState("")
    const [accrualRate, setAccrualRate] = useState("")
    const [accrualPer, setAccrualPer] = useState("")
    const [accrualDay, setAccrualDay] = useState("monthly_anniversary")
    const [startingBalance, setStartingBalance] = useState("")
    const [allowNegative, setAllowNegative] = useState(true)
    const [rollover, setRollover] = useState(true)
    const [requireApproval, setRequireApproval] = useState(false)
    const [paidType, setPaidType] = useState<"paid" | "unpaid">("paid")

    // Step 2 states
    const [assignMethod, setAssignMethod] = useState("")
    const [autoAdd, setAutoAdd] = useState(false)
    const [isMemberSelectionOpen, setIsMemberSelectionOpen] = useState(false)
    const [selectedMembers, setSelectedMembers] = useState<string[]>([])

    const [uploadedFile, setUploadedFile] = useState<File | null>(null)
    const [csvMemberCount, setCsvMemberCount] = useState(0)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Handle file selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setUploadedFile(file)

            // Parse CSV to count members
            const reader = new FileReader()
            reader.onload = (event) => {
                const text = event.target?.result as string
                // Split by newline, filter empty lines, remove header (first line)
                const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0)
                // Assume first line is header, count rest
                const count = Math.max(0, lines.length - 1)
                setCsvMemberCount(count)
            }
            reader.readAsText(file)

            // Reset input value to allow selecting same file again if needed
            e.target.value = ''
        }
    }
    // Fetch members on mount - MOVED TO MODAL
    useEffect(() => {
        // Member fetching is now handled inside MemberSelectionModal
    }, [])

    // Populate data for Edit Mode
    useEffect(() => {
        if (open) {
            if (initialData) {
                // Edit Mode: Fill form
                setPolicyName(initialData.name || "")
                // Map display string back to value if needed, or store value directly
                // Assuming 'accrualSchedule' in policy object matches value keys
                setAccrualSchedule(
                    initialData.accrualSchedule === "Policy joined date" ? "joined_date" :
                        initialData.accrualSchedule === "Hours worked" ? "hours_worked" :
                            initialData.accrualSchedule === "Monthly" ? "monthly" :
                                initialData.accrualSchedule === "Annual" ? "annual" : "none"
                )


                // Restore member assignment state if available
                if (initialData.assignMethod) {
                    setAssignMethod(initialData.assignMethod)
                    if (initialData.selectedMembers) setSelectedMembers(initialData.selectedMembers)
                    if (initialData.csvMemberCount) setCsvMemberCount(initialData.csvMemberCount)
                    if (initialData.autoAdd) setAutoAdd(initialData.autoAdd)
                }

                // Restore other policy fields
                setMaxAccrual(initialData.maxAccrual || "")
                setAccrualAmount(initialData.accrualAmount || "")
                setAccrualRate(initialData.accrualRate || "")
                setAccrualPer(initialData.accrualPer || "")
                setAccrualDay(initialData.accrualDay || "monthly_anniversary")
                setStartingBalance(initialData.startingBalance || "")
                setAllowNegative(initialData.allowNegative !== undefined ? initialData.allowNegative : true)
                setRollover(initialData.rollover !== undefined ? initialData.rollover : true)
                setRequireApproval(initialData.requireApproval !== undefined ? initialData.requireApproval : false)
                setPaidType(initialData.paidType || "paid")

                setStep(1)
            } else {
                // Add Mode: Reset form
                setStep(1)
                setPolicyName("")
                setAccrualSchedule("annual")
                setUploadedFile(null)
                setCsvMemberCount(0)
                setSelectedMembers([])
                setAssignMethod("")
                setUploadedFile(null)

                // Reset all other fields
                setMaxAccrual("")
                setAccrualAmount("")
                setAccrualRate("")
                setAccrualPer("")
                setAccrualDay("monthly_anniversary")
                setStartingBalance("")
                setAllowNegative(true)
                setRollover(true)
                setRequireApproval(false)
                setPaidType("paid")
            }
            // Override step for members mode
            if (mode === "members") {
                setStep(2)
            }
        }
    }, [open, initialData, mode])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
                <DialogHeader className="p-6 pb-2 flex-shrink-0">
                    <DialogTitle className="text-xl">
                        {mode === "members" ? "Edit assigned members" :
                            mode === "policy" ? "Edit time off policy" :
                                (initialData ? "Edit time off policy" : "Add time off policy")}
                    </DialogTitle>
                </DialogHeader>

                {/* Progress Steps */}
                {mode === "default" && (
                    <div className="px-6 pb-6 flex-shrink-0">
                        <div className="relative flex items-center justify-between px-10 mb-4 items-start">
                            {/* Connecting Line */}
                            <div className="absolute left-0 right-0 top-4 -translate-y-1/2 h-1.5 bg-slate-200 -z-10 mx-14 rounded-full" />

                            {/* Step 1 */}
                            <div className="flex flex-col items-center gap-2 bg-white z-10">
                                <div className={cn(
                                    "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium border-2 transition-colors",
                                    step === 1
                                        ? "border-slate-900 bg-white text-slate-900"
                                        : "border-slate-900 bg-slate-900 text-white"
                                )}>
                                    {step > 1 ? <Check className="h-5 w-5" /> : "1"}
                                </div>
                                <span className={cn(
                                    "text-xs font-medium uppercase",
                                    step === 1 ? "text-slate-900" : "text-slate-500"
                                )}>Set up policy</span>
                            </div>

                            {/* Step 2 */}
                            <div className="flex flex-col items-center gap-2 bg-white z-10">
                                <div className={cn(
                                    "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium border-2",
                                    step === 2
                                        ? "border-slate-900 bg-white text-slate-900"
                                        : "border-slate-200 bg-white text-slate-300"
                                )}>
                                    2
                                </div>
                                <span className={cn(
                                    "text-xs font-medium uppercase",
                                    step === 2 ? "text-slate-900" : "text-slate-400"
                                )}>Assign members</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Scrollable Content */}
                <div className="px-6 py-2 overflow-y-auto flex-1 space-y-8">
                    {step === 1 ? (
                        <>
                            {/* Policy Name */}
                            <div className="space-y-3">
                                <Label htmlFor="policyName" className="text-xs font-bold text-slate-500 uppercase">
                                    POLICY NAME*
                                </Label>
                                <Input
                                    id="policyName"
                                    placeholder="Enter the policy name"
                                    value={policyName}
                                    onChange={(e) => setPolicyName(e.target.value)}
                                    className="h-11"
                                />
                            </div>

                            {/* Accrual Section */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-slate-800">ACCRUAL</h3>

                                <div className="space-y-3">
                                    <Label className="text-xs font-bold text-slate-500 uppercase">
                                        SCHEDULE OF ACCRUAL
                                    </Label>
                                    <RadioGroup
                                        value={accrualSchedule}
                                        onValueChange={setAccrualSchedule}
                                        className="flex flex-wrap gap-2"
                                    >
                                        {[
                                            { value: "none", label: "None" },
                                            { value: "annual", label: "Annual" },
                                            { value: "monthly", label: "Monthly" },
                                            { value: "hours_worked", label: "Hours worked" },
                                            { value: "joined_date", label: "Policy joined date" },
                                        ].map((option) => (
                                            <div key={option.value}>
                                                <RadioGroupItem value={option.value} id={`accrual-${option.value}`} className="peer sr-only" />
                                                <Label
                                                    htmlFor={`accrual-${option.value}`}
                                                    className={cn(
                                                        "flex items-center justify-center rounded-full border px-4 py-2 text-sm font-medium cursor-pointer transition-all hover:bg-slate-50",
                                                        accrualSchedule === option.value
                                                            ? "border-slate-900 text-slate-900 bg-slate-50 ring-1 ring-slate-900"
                                                            : "border-slate-200 text-slate-600"
                                                    )}
                                                >
                                                    {option.label}
                                                </Label>
                                            </div>
                                        ))}

                                    </RadioGroup>
                                </div>

                                {accrualSchedule === "monthly" ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <Label htmlFor="accrualAmount" className="text-xs font-bold text-slate-500 uppercase">
                                                    ACCRUAL AMOUNT*
                                                </Label>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            <Info className="h-4 w-4 text-slate-400" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Amount of time accrued per month</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center group">
                                                    <Input
                                                        id="accrualAmount"
                                                        className="h-11 rounded-r-none border-r-0 w-32 focus-visible:ring-0 focus-visible:border-slate-300 shadow-none z-10"
                                                        value={accrualAmount}
                                                        onChange={(e) => setAccrualAmount(e.target.value)}
                                                    />
                                                    <div className="flex h-11 items-center px-4 rounded-r-md border border-l-0 bg-slate-100 text-slate-600 text-sm whitespace-nowrap group-focus-within:border-slate-300 transition-colors">
                                                        hours / month
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <Label className="text-xs font-bold text-slate-500 uppercase">
                                                    ACCRUAL DAY
                                                </Label>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            <Info className="h-4 w-4 text-slate-400" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>When the accrual happens</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                            <Select value={accrualDay} onValueChange={setAccrualDay}>
                                                <SelectTrigger className="h-11 border-slate-300">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="monthly_anniversary">Monthly anniversary</SelectItem>
                                                    <SelectItem value="start_of_month">Start of month</SelectItem>
                                                    <SelectItem value="end_of_month">End of month</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                ) : accrualSchedule === "hours_worked" ? (
                                    <div className="space-y-6">
                                        <div className="rounded-md bg-slate-50 p-4 border border-slate-200">
                                            <div className="flex gap-3">
                                                <Info className="h-5 w-5 text-slate-900 flex-shrink-0 mt-0.5" />
                                                <div className="text-sm text-slate-700">
                                                    <p>
                                                        Time off hours accrue only when hours are <strong>marked as paid</strong> — they're included in a payment record, not necessarily paid out. <a href="#" className="text-slate-900 hover:underline">Learn more</a>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold text-slate-500 uppercase">
                                                AMOUNT ACCRUED*
                                            </Label>
                                            <div className="flex items-center">
                                                <Input
                                                    className="h-11 rounded-r-none border-r-0 w-24 z-10 focus-visible:ring-0 focus-visible:border-slate-300"
                                                    value={accrualRate}
                                                    onChange={(e) => setAccrualRate(e.target.value)}
                                                />
                                                <div className="flex h-11 items-center px-4 border-y bg-slate-100 text-slate-600 text-sm whitespace-nowrap border-slate-200">
                                                    hour(s) accrued for every
                                                </div>
                                                <Input
                                                    className="h-11 rounded-none border-x-0 w-24 z-10 focus-visible:ring-0 focus-visible:border-slate-300"
                                                    value={accrualPer}
                                                    onChange={(e) => setAccrualPer(e.target.value)}
                                                />
                                                <div className="flex h-11 items-center px-4 rounded-r-md border border-l-0 bg-slate-100 text-slate-600 text-sm whitespace-nowrap border-slate-200">
                                                    hours worked
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <Label htmlFor="maxAccrual" className="text-xs font-bold text-slate-500 uppercase">
                                                MAXIMUM ACCRUAL AMOUNT*
                                            </Label>
                                            <div className="flex items-center group">
                                                <Input
                                                    id="maxAccrual"
                                                    className="h-11 rounded-r-none border-r-0 w-32 focus-visible:ring-0 focus-visible:border-slate-300 shadow-none z-10"
                                                    value={maxAccrual}
                                                    onChange={(e) => setMaxAccrual(e.target.value)}
                                                    placeholder="800"
                                                />
                                                <div className="flex h-11 items-center px-4 rounded-r-md border border-l-0 bg-slate-100 text-slate-600 text-sm group-focus-within:border-slate-300 transition-colors">
                                                    hours per year
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <Label htmlFor="startingBalance" className="text-xs font-bold text-slate-500 uppercase">
                                                STARTING BALANCE
                                            </Label>
                                            <Input
                                                id="startingBalance"
                                                placeholder="Enter initial hours"
                                                value={startingBalance}
                                                onChange={(e) => setStartingBalance(e.target.value)}
                                                className="h-11 border-slate-300"
                                            />
                                        </div>
                                    </div>
                                ) : accrualSchedule === "joined_date" ? (
                                    <div className="space-y-6">
                                        <div className="rounded-md bg-white p-4 border border-slate-200 shadow-sm relative overflow-hidden">
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-500"></div>
                                            <div className="flex gap-3">
                                                <Info className="h-5 w-5 text-slate-500 flex-shrink-0 mt-0.5" />
                                                <div className="text-sm text-slate-700">
                                                    <p>
                                                        Balances are prorated and may take up to <strong>24 hours</strong> to display for members added to a time off policy set to &ldquo;Policy joined date&rdquo;.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <Label htmlFor="maxAccrual" className="text-xs font-bold text-slate-500 uppercase">
                                                MAXIMUM ACCRUAL AMOUNT*
                                            </Label>
                                            <div className="flex items-center group">
                                                <Input
                                                    id="maxAccrual"
                                                    className="h-11 rounded-r-none border-r-0 w-32 focus-visible:ring-0 focus-visible:border-slate-300 shadow-none z-10"
                                                    value={maxAccrual}
                                                    onChange={(e) => setMaxAccrual(e.target.value)}
                                                    placeholder="800"
                                                />
                                                <div className="flex h-11 items-center px-4 rounded-r-md border border-l-0 bg-slate-100 text-slate-600 text-sm group-focus-within:border-slate-300 transition-colors">
                                                    hours per year
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <Label htmlFor="startingBalance" className="text-xs font-bold text-slate-500 uppercase">
                                                STARTING BALANCE
                                            </Label>
                                            <Input
                                                id="startingBalance"
                                                placeholder="Enter initial hours"
                                                value={startingBalance}
                                                onChange={(e) => setStartingBalance(e.target.value)}
                                                className="h-11 border-slate-300"
                                            />
                                        </div>
                                    </div>
                                ) : accrualSchedule === "none" ? (
                                    <div className="space-y-3">
                                        <Label htmlFor="startingBalance" className="text-xs font-bold text-slate-500 uppercase">
                                            STARTING BALANCE
                                        </Label>
                                        <Input
                                            id="startingBalance"
                                            placeholder="Enter amount of hours"
                                            value={startingBalance}
                                            onChange={(e) => setStartingBalance(e.target.value)}
                                            className="h-11 border-slate-200"
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <Label htmlFor="maxAccrual" className="text-xs font-bold text-slate-500 uppercase">
                                                MAXIMUM ACCRUAL AMOUNT*
                                            </Label>
                                            <div className="flex items-center group">
                                                <Input
                                                    id="maxAccrual"
                                                    className="h-11 rounded-r-none border-r-0 w-32 focus-visible:ring-0 focus-visible:border-slate-300 shadow-none z-10"
                                                    value={maxAccrual}
                                                    onChange={(e) => setMaxAccrual(e.target.value)}
                                                    placeholder="800"
                                                />
                                                <div className="flex h-11 items-center px-4 rounded-r-md border border-l-0 bg-slate-100 text-slate-600 text-sm group-focus-within:border-slate-300 transition-colors">
                                                    hours per year
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <Label htmlFor="startingBalance" className="text-xs font-bold text-slate-500 uppercase">
                                                STARTING BALANCE
                                            </Label>
                                            <Input
                                                id="startingBalance"
                                                placeholder="Enter initial hours"
                                                value={startingBalance}
                                                onChange={(e) => setStartingBalance(e.target.value)}
                                                className="h-11 border-slate-300"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Options Section */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-slate-800">OPTIONS</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className={cn(
                                        "flex items-start space-x-3 rounded-lg border p-4 transition-colors cursor-pointer",
                                        allowNegative ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:bg-slate-50"
                                    )} onClick={() => setAllowNegative(!allowNegative)}>
                                        <Checkbox
                                            id="allowNegative"
                                            checked={allowNegative}
                                            onCheckedChange={(checked: boolean | 'indeterminate') => setAllowNegative(checked as boolean)}
                                            className="mt-1"
                                        />
                                        <div className="space-y-1">
                                            <Label htmlFor="allowNegative" className="font-medium cursor-pointer">
                                                Allow negative balances
                                            </Label>
                                            <p className="text-sm text-slate-500 leading-relaxed">
                                                Members may request time off even if it lowers their balance to below 0
                                            </p>
                                        </div>
                                    </div>

                                    <div className={cn(
                                        "flex items-start space-x-3 rounded-lg border p-4 transition-colors cursor-pointer",
                                        rollover ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:bg-slate-50"
                                    )} onClick={() => setRollover(!rollover)}>
                                        <Checkbox
                                            id="rollover"
                                            checked={rollover}
                                            onCheckedChange={(checked: boolean | 'indeterminate') => setRollover(checked as boolean)}
                                            className="mt-1"
                                        />
                                        <div className="space-y-1">
                                            <Label htmlFor="rollover" className="font-medium cursor-pointer">
                                                Balance rolls over annually
                                            </Label>
                                            <p className="text-sm text-slate-500 leading-relaxed">
                                                Any remaining balance will be kept on January 1st
                                            </p>
                                        </div>
                                    </div>

                                    <div className={cn(
                                        "flex items-start space-x-3 rounded-lg border p-4 transition-colors cursor-pointer md:col-span-2 md:w-1/2",
                                        requireApproval ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:bg-slate-50"
                                    )} onClick={() => setRequireApproval(!requireApproval)}>
                                        <Checkbox
                                            id="requireApproval"
                                            checked={requireApproval}
                                            onCheckedChange={(checked: boolean | 'indeterminate') => setRequireApproval(checked as boolean)}
                                            className="mt-1"
                                        />
                                        <div className="space-y-1">
                                            <Label htmlFor="requireApproval" className="font-medium cursor-pointer">
                                                Require approval
                                            </Label>
                                            <p className="text-sm text-slate-500 leading-relaxed">
                                                Requests must be manually approved by a manager or team lead
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase">
                                        PAID OR UNPAID
                                    </Label>
                                    <div className="flex">
                                        <button
                                            type="button"
                                            onClick={() => setPaidType("paid")}
                                            className={cn(
                                                "px-6 py-2 text-sm font-medium border transition-colors first:rounded-l-md last:rounded-r-md focus:z-10",
                                                paidType === "paid"
                                                    ? "bg-slate-900 border-slate-900 text-white z-10"
                                                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                            )}
                                        >
                                            Paid
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPaidType("unpaid")}
                                            className={cn(
                                                "px-6 py-2 text-sm font-medium border border-l-0 transition-colors first:rounded-l-md last:rounded-r-md focus:z-10",
                                                paidType === "unpaid"
                                                    ? "bg-slate-900 border-slate-900 text-white z-10"
                                                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                            )}
                                        >
                                            Unpaid
                                        </button>
                                    </div>
                                    <p className="text-sm text-slate-500">
                                        Hours in approved time off requests will count towards amounts owed
                                    </p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-6">
                            <p className="text-slate-600 text-sm">
                                Choose how you want to assign members to the time off policy
                            </p>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase">
                                        ADD MEMBERS THROUGH
                                    </Label>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <Info className="h-4 w-4 text-slate-400" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Select criteria to add members</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                <Select value={assignMethod} onValueChange={setAssignMethod}>
                                    <SelectTrigger className="w-full h-11 border-slate-300 text-left">
                                        {assignMethod ? (
                                            <span className="text-slate-900 font-medium">
                                                {assignMethod === "list" && "List of members"}

                                                {assignMethod === "import" && "Import CSV"}
                                            </span>
                                        ) : (
                                            <span className="text-slate-500 font-normal">Select how to add members</span>
                                        )}
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="list" textValue="List of members" className="py-3 cursor-pointer focus:bg-slate-50">
                                            <div className="flex flex-col text-left gap-0.5">
                                                <span className="font-medium text-slate-900">List of members</span>
                                                <span className="text-xs text-slate-500">List of all members belonging to the organization</span>
                                            </div>
                                        </SelectItem>

                                        <SelectItem value="import" textValue="Import CSV" className="py-3 cursor-pointer focus:bg-slate-50">
                                            <div className="flex flex-col text-left gap-0.5">
                                                <span className="font-medium text-slate-900">Import CSV</span>
                                                <span className="text-xs text-slate-500">Upload CSV file</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {assignMethod === "list" && (
                                <div className="space-y-4 pt-2">
                                    <div className="space-y-3">
                                        <div
                                            className="relative cursor-pointer"
                                            onClick={() => setIsMemberSelectionOpen(true)}
                                        >
                                            <Input
                                                placeholder="Select members"
                                                className="h-11 cursor-pointer"
                                                readOnly
                                                value={selectedMembers.length > 0 ? `${selectedMembers.length} members selected` : ""}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2 pt-2">
                                        <Checkbox
                                            id="autoAdd"
                                            checked={autoAdd}
                                            onCheckedChange={(checked: boolean | 'indeterminate') => setAutoAdd(checked as boolean)}
                                        />
                                        <Label htmlFor="autoAdd" className="text-sm font-normal text-slate-700 cursor-pointer">
                                            Automatically add all new members to this policy
                                        </Label>
                                    </div>
                                </div>
                            )}



                            {assignMethod === "import" && (
                                <div className="space-y-4 pt-2">
                                    {!uploadedFile ? (
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="border-2 border-dashed border-slate-200 rounded-lg p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 transition-colors"
                                        >
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="hidden"
                                                accept=".csv"
                                                onChange={handleFileChange}
                                            />
                                            <div className="h-12 w-12 bg-slate-100 text-slate-900 rounded-full flex items-center justify-center mb-4">
                                                <CloudUpload className="h-6 w-6" />
                                            </div>
                                            <h3 className="text-sm font-medium text-slate-900 mb-1">
                                                Click to upload or drag and drop
                                            </h3>
                                            <p className="text-xs text-slate-500 mb-4">
                                                CSV file up to 10MB
                                            </p>
                                            <Button variant="outline" className="h-9" onClick={(e) => {
                                                e.stopPropagation()
                                                fileInputRef.current?.click()
                                            }}>
                                                Browse file
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="border rounded-lg p-4 flex items-center justify-between bg-white">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                                    <div className="text-green-600 font-bold text-xs">CSV</div>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-slate-900 truncate max-w-[200px]">
                                                        {uploadedFile.name}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {(uploadedFile.size / 1024).toFixed(1)} KB • {csvMemberCount} members found
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setUploadedFile(null)
                                                    setCsvMemberCount(0)
                                                }}
                                                className="text-slate-500 hover:text-red-600 hover:bg-red-50"
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center text-xs text-slate-500">
                                        <span>Supported format: .csv</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const csvContent = "Email\nemail1@email.com\nemail2@example.com";
                                                const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                                                const link = document.createElement("a");
                                                const url = URL.createObjectURL(blob);
                                                link.setAttribute("href", url);
                                                link.setAttribute("download", "members_email.csv");
                                                link.style.visibility = "hidden";
                                                document.body.appendChild(link);
                                                link.click();
                                                document.body.removeChild(link);
                                            }}
                                            className="text-slate-900 hover:underline flex items-center gap-1 font-medium"
                                        >
                                            Download template
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 border-t border-slate-100 flex items-center justify-between sm:justify-between">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="h-11 px-8">
                        Cancel
                    </Button>
                    <div className="flex gap-2">
                        {step === 2 && mode !== "members" && (
                            <Button variant="outline" onClick={() => setStep(1)} className="h-11 px-8">
                                Back
                            </Button>
                        )}
                        <Button
                            onClick={() => {
                                if (step === 1 && mode !== "policy") {
                                    setStep(2)
                                } else {
                                    onSave({
                                        name: policyName,
                                        members: assignMethod === "import" ? csvMemberCount : selectedMembers.length,
                                        // Persist state for editing
                                        assignMethod,
                                        selectedMembers,
                                        csvMemberCount,
                                        autoAdd,
                                        accrualSchedule: accrualSchedule === "joined_date" ? "Policy joined date" :
                                            accrualSchedule === "hours_worked" ? "Hours worked" :
                                                accrualSchedule === "monthly" ? "Monthly" :
                                                    accrualSchedule === "annual" ? "Annual" : "None",
                                        // Data fields
                                        maxAccrual,
                                        accrualAmount,
                                        accrualRate,
                                        accrualPer,
                                        accrualDay,
                                        startingBalance,
                                        allowNegative,
                                        rollover,
                                        requireApproval,
                                        paidType
                                    })
                                    onOpenChange(false)
                                    // Reset step for next time
                                    setTimeout(() => setStep(1), 300)
                                }
                            }}
                            className={cn(
                                "h-11 px-8 text-white",
                                "bg-slate-900 hover:bg-slate-800"
                            )}>
                            {step === 1 && mode !== "policy" ? "Next" : "Save"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent >

            <MemberSelectionModal
                open={isMemberSelectionOpen}
                onOpenChange={setIsMemberSelectionOpen}
                selectedMembers={selectedMembers}
                onSave={setSelectedMembers}
                title="Select Policy Members"
            />
        </Dialog >
    )
}


