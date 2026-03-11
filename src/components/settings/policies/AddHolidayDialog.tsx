"use client"

import { useState, useRef, useEffect } from "react"
import { DUMMY_MEMBERS } from "@/lib/data/dummy-data"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { Check, Info, CloudUpload } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { SearchBar } from "@/components/customs/search-bar"

interface AddHolidayDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (holiday: any) => void
    mode?: "add" | "edit-holiday" | "edit-members"
    initialData?: any
}

const PREDEFINED_HOLIDAYS = [
    { id: "victoria_day", name: "Victoria Day (Canada)", date: new Date(2026, 4, 18) }, // May 18, 2026
    { id: "eid_mubarak", name: "Eid Mubarak", date: new Date(2026, 2, 20) }, // March 20, 2026
    { id: "independence_day", name: "Independence Day", date: new Date(2026, 7, 17) }, // Aug 17, 2026
    { id: "christmas", name: "Christmas", date: new Date(2026, 11, 25) }, // Dec 25, 2026
    { id: "new_year", name: "New Year", date: new Date(2026, 0, 1) }, // Jan 1, 2026
]

export function AddHolidayDialog({ open, onOpenChange, onSave, mode = "add", initialData }: AddHolidayDialogProps) {
    const [step, setStep] = useState(1)

    const [selectedHoliday, setSelectedHoliday] = useState("")
    const [customHolidayName, setCustomHolidayName] = useState("")
    const [paidHours, setPaidHours] = useState("0:00")
    const [holidayDate, setHolidayDate] = useState<Date | undefined>(new Date())
    const [occursAnnually, setOccursAnnually] = useState(false)

    // Step 2 State
    const [assignMethod, setAssignMethod] = useState("list")
    const [autoAdd, setAutoAdd] = useState(false)
    const [isMemberSelectionOpen, setIsMemberSelectionOpen] = useState(false)
    const [selectedMembers, setSelectedMembers] = useState<string[]>([])
    const [uploadedFile, setUploadedFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Effect to sync when editing
    useEffect(() => {
        if (open) {
            if (initialData) {
                const isPredefined = PREDEFINED_HOLIDAYS.find(h => h.name === initialData.name)
                setSelectedHoliday(isPredefined ? isPredefined.id : "custom")
                setCustomHolidayName(isPredefined ? "" : initialData.name)
                setPaidHours(initialData.paidHours || "0:00")
                setHolidayDate(initialData.date ? new Date(initialData.date) : new Date())
                setOccursAnnually(!!initialData.occursAnnually)
                setSelectedMembers(initialData.selectedMembers || [])
                setAssignMethod(initialData.assignMethod || "list")
                setAutoAdd(!!initialData.autoAdd)

                if (mode === "edit-members") {
                    setStep(2)
                } else {
                    setStep(1)
                }
            } else {
                // Reset for "add" mode
                setStep(1)
                setSelectedHoliday("")
                setCustomHolidayName("")
                setPaidHours("0:00")
                setHolidayDate(new Date())
                setOccursAnnually(false)
                setSelectedMembers([])
                setAssignMethod("list")
                setAutoAdd(false)
            }
        }
    }, [open, initialData, mode])

    // Fetch members on mount - MOVED TO MODAL
    useEffect(() => {
        // We don't fetch all members here anymore.
        // The MemberSelectionModal handles fetching.
    }, [])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setUploadedFile(file)
            e.target.value = ''
        }
    }

    const handleSave = () => {
        onSave({
            ...(initialData || {}),
            name: selectedHoliday === "custom" ? customHolidayName : PREDEFINED_HOLIDAYS.find(h => h.id === selectedHoliday)?.name || selectedHoliday,
            date: holidayDate,
            assignMethod,
            selectedMembers,
            autoAdd,
            occursAnnually,
            paidHours
        })
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
                <DialogHeader className="p-6 pb-2 flex-shrink-0">
                    <DialogTitle className="text-xl">
                        {mode === "add" ? "Add holiday" : mode === "edit-holiday" ? "Edit holiday" : "Edit members"}
                    </DialogTitle>
                </DialogHeader>

                {/* Progress Steps - Only show in add mode */}
                {mode === "add" && (
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
                                )}>SET UP HOLIDAY</span>
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
                                )}>ASSIGN MEMBERS</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="px-6 py-2 overflow-y-auto flex-1 space-y-8 min-h-[300px]">
                    {step === 1 ? (
                        <div className="space-y-4">
                            <div className="space-y-3">
                                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-tight">
                                    HOLIDAY*
                                </Label>
                                <Select
                                    value={selectedHoliday}
                                    onValueChange={(value) => {
                                        setSelectedHoliday(value)
                                        if (value !== "custom") {
                                            const holiday = PREDEFINED_HOLIDAYS.find(h => h.id === value)
                                            if (holiday) {
                                                setHolidayDate(holiday.date)
                                                // Reset custom name if switching to predefined
                                                setCustomHolidayName("")
                                            }
                                        }
                                    }}
                                >
                                    <SelectTrigger className="w-full h-11 border-slate-300">
                                        <SelectValue placeholder="Select holiday" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="custom">Custom</SelectItem>
                                        {PREDEFINED_HOLIDAYS.map((holiday) => (
                                            <SelectItem key={holiday.id} value={holiday.id}>
                                                {holiday.name} ({format(holiday.date, "MMM do")})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {selectedHoliday && (
                                <div className="space-y-6 pt-2">
                                    <p className="text-slate-500 text-sm">
                                        Choose how you want to set up holidays
                                    </p>

                                    <div className="flex gap-4">
                                        <div className="flex-1 space-y-2">
                                            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-tight">
                                                HOLIDAY NAME*
                                            </Label>
                                            <Input
                                                placeholder="Enter the holiday name"
                                                className={cn(
                                                    "h-11 border-slate-300 text-slate-900 focus-visible:ring-1 focus-visible:ring-slate-400 focus-visible:ring-offset-0",
                                                    selectedHoliday !== "custom" && "bg-slate-50 border-slate-200 cursor-not-allowed"
                                                )}
                                                value={selectedHoliday === "custom" ? customHolidayName : PREDEFINED_HOLIDAYS.find(h => h.id === selectedHoliday)?.name || ""}
                                                onChange={(e) => setCustomHolidayName(e.target.value)}
                                                readOnly={selectedHoliday !== "custom"}
                                            />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-tight">
                                                PAID HOURS*
                                            </Label>
                                            <Input
                                                placeholder="0:00"
                                                className="h-11 border-slate-300 text-slate-900 focus-visible:ring-1 focus-visible:ring-slate-400 focus-visible:ring-offset-0"
                                                value={paidHours}
                                                onChange={(e) => setPaidHours(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        {selectedHoliday === "custom" && (
                                            <div className="flex-1 space-y-2">
                                                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-tight">
                                                    SELECT DATE*
                                                </Label>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "w-full h-11 justify-between text-left font-normal border-slate-300",
                                                                !holidayDate && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {holidayDate ? format(holidayDate, "EEE, MMM d, yyyy") : <span>Pick a date</span>}
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0">
                                                        <Calendar
                                                            mode="single"
                                                            selected={holidayDate}
                                                            onSelect={setHolidayDate}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        )}

                                        <div className={cn("flex items-center gap-2", selectedHoliday === "custom" ? "pt-6" : "pt-0")}>
                                            <Switch
                                                id="annually"
                                                checked={occursAnnually}
                                                onCheckedChange={setOccursAnnually}
                                            />
                                            <Label htmlFor="annually" className="text-slate-500 font-normal">
                                                Occurs annually
                                            </Label>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <p className="text-slate-600 text-sm bg-slate-50/50 p-3 rounded border border-slate-200/50 hidden">
                                Choose how you want to assign members into holidays
                            </p>
                            <label className="text-sm font-medium text-slate-900">
                                Choose how you want to assign members into holidays
                            </label>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-tight">
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
                                        <SelectValue placeholder="Select how to add members" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="list">List of members</SelectItem>
                                        <SelectItem value="import">Import CSV</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {assignMethod === "list" && (
                                <div className="space-y-3">
                                    <Input
                                        placeholder="Select members"
                                        className="h-11 cursor-pointer"
                                        readOnly
                                        value={selectedMembers.length > 0 ? `${selectedMembers.length} members selected` : ""}
                                        onClick={() => setIsMemberSelectionOpen(true)}
                                    />
                                </div>
                            )}

                            {assignMethod === "import" && (
                                <div className="space-y-4">
                                    {!uploadedFile ? (
                                        <UploadZone onUpload={() => fileInputRef.current?.click()} />
                                    ) : (
                                        <FileDisplay file={uploadedFile} onRemove={() => setUploadedFile(null)} />
                                    )}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept=".csv"
                                        onChange={handleFileChange}
                                    />
                                </div>
                            )}

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="autoAdd"
                                    checked={autoAdd}
                                    onCheckedChange={(checked) => setAutoAdd(checked as boolean)}
                                />
                                <Label htmlFor="autoAdd" className="text-sm font-normal text-slate-700 cursor-pointer">
                                    Automatically add all new members to this holiday
                                </Label>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 border-t border-slate-100 flex items-center justify-between sm:justify-between">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="h-11 px-8">
                        Cancel
                    </Button>
                    <div className="flex gap-2">
                        {mode === "add" ? (
                            <>
                                {step === 2 && (
                                    <Button variant="outline" onClick={() => setStep(1)} className="h-11 px-8">
                                        Back
                                    </Button>
                                )}
                                <Button
                                    onClick={() => {
                                        if (step === 1) {
                                            setStep(2)
                                        } else {
                                            handleSave()
                                        }
                                    }}
                                    className="h-11 px-8 bg-slate-900 hover:bg-slate-800 text-white"
                                >
                                    {step === 1 ? "Next" : "Save"}
                                </Button>
                            </>
                        ) : (
                            <Button
                                onClick={handleSave}
                                className="h-11 px-8 bg-slate-900 hover:bg-slate-800 text-white"
                            >
                                Save
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>

            <MemberSelectionModal
                open={isMemberSelectionOpen}
                onOpenChange={setIsMemberSelectionOpen}
                selectedMembers={selectedMembers}
                onSave={setSelectedMembers}
            />
        </Dialog>
    )
}

function MemberSelectionModal({ open, onOpenChange, selectedMembers, onSave }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedMembers: string[];
    onSave: (members: string[]) => void;
}) {
    const [localSelected, setLocalSelected] = useState<string[]>(selectedMembers)
    const [searchQuery, setSearchQuery] = useState("")

    const [members, setMembers] = useState<{ id: string; name: string }[]>([])
    const [totalMembers, setTotalMembers] = useState(0)
    const [isLoading, setIsLoading] = useState(false)

    const [currentPage, setCurrentPage] = useState(1)
    const ITEMS_PER_PAGE = 10

    // Effect to sync when opening
    useEffect(() => {
        if (open) {
            setLocalSelected(selectedMembers)
            setSearchQuery("") // Reset search when modal opens
            setCurrentPage(1) // Reset to first page
        }
    }, [open, selectedMembers])

    // Get filtered and paginated dummy members (client-side)
    useEffect(() => {
        setIsLoading(true)

        // Filter dummy members based on search query
        const filtered = DUMMY_MEMBERS.filter(member =>
            member.name.toLowerCase().includes(searchQuery.toLowerCase())
        )

        // Calculate pagination
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
        const endIndex = startIndex + ITEMS_PER_PAGE
        const paginated = filtered.slice(startIndex, endIndex)

        // Map to expected format
        const mapped = paginated.map(m => ({
            id: m.id,
            name: m.name
        }))

        setMembers(mapped)
        setTotalMembers(filtered.length)
        setIsLoading(false)
    }, [searchQuery, currentPage, open])

    const totalPages = Math.ceil(totalMembers / ITEMS_PER_PAGE)
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE

    const handleToggle = (id: string) => {
        if (localSelected.includes(id)) {
            setLocalSelected(localSelected.filter(i => i !== id))
        } else {
            setLocalSelected([...localSelected, id])
        }
    }

    const handleSelectAll = () => {
        if (totalMembers > 0 && localSelected.length >= totalMembers) {
            setLocalSelected([])
        } else {
            // Select all filtered members from DUMMY_MEMBERS
            const filtered = DUMMY_MEMBERS.filter(member =>
                member.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
            const allIds = filtered.map(m => m.id)

            if (searchQuery) {
                // Union with existing selection
                const newSet = new Set([...localSelected, ...allIds])
                setLocalSelected(Array.from(newSet))
            } else {
                // Replace with all IDs
                setLocalSelected(allIds)
            }
        }
    }

    const handleClearAll = () => {
        setLocalSelected([])
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden flex flex-col h-[85vh]">
                <DialogHeader className="p-4 pb-2 flex-shrink-0 border-b border-transparent">
                    <DialogTitle className="text-xl font-semibold">Members</DialogTitle>
                </DialogHeader>

                <div className="px-4 pb-0">
                    <div className="flex border-b border-slate-900 w-max">
                        <button className="px-1 py-2 text-sm font-medium text-slate-900">
                            MEMBERS
                        </button>
                    </div>
                </div>

                <div className="p-4 space-y-4 flex-1 overflow-hidden flex flex-col">
                    <div className="flex items-center gap-4">
                        <SearchBar
                            placeholder="Search members"
                            initialQuery={searchQuery}
                            onSearch={setSearchQuery}
                            className="w-64 border-slate-300 rounded-lg"
                        />
                        <div className="flex gap-2 text-sm">
                            <button onClick={handleSelectAll} className="text-slate-900 hover:underline font-medium" disabled={isLoading}>
                                {isLoading ? "Loading..." : (totalMembers > 0 && localSelected.length >= totalMembers ? "Deselect all" : "Select all")}
                            </button>
                            <button onClick={handleClearAll} className="text-slate-500 hover:underline">Clear all</button>
                        </div>
                    </div>

                    <div className="border border-slate-200 rounded-md flex-1 overflow-hidden flex flex-col">
                        <div className="bg-slate-50 p-3 border-b border-slate-200 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Checkbox
                                    checked={totalMembers > 0 && localSelected.length >= totalMembers}
                                    onCheckedChange={() => handleSelectAll()}
                                    className="data-[state=checked]:bg-slate-900 data-[state=checked]:border-slate-900 data-[state=checked]:text-white"
                                />
                                <span className="text-sm font-medium text-slate-700">
                                    Selected ({localSelected.length})
                                </span>
                            </div>
                        </div>
                        <div className="overflow-y-auto flex-1 p-2 space-y-1">
                            {isLoading ? (
                                <div className="p-4 text-center text-sm text-slate-500">Loading...</div>
                            ) : members.length > 0 ? (
                                members.map(member => (
                                    <div key={member.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-md transition-colors">
                                        <Checkbox
                                            id={`member-${member.id}`}
                                            checked={localSelected.includes(member.id)}
                                            onCheckedChange={() => handleToggle(member.id)}
                                            className="data-[state=checked]:bg-slate-900 data-[state=checked]:border-slate-900 data-[state=checked]:text-white"
                                        />
                                        <Label htmlFor={`member-${member.id}`} className="text-sm text-slate-700 font-normal cursor-pointer flex-1">
                                            {member.name}
                                        </Label>
                                    </div>
                                ))
                            ) : (
                                <div className="p-4 text-center text-sm text-slate-500">
                                    No members found
                                </div>
                            )}
                        </div>

                        {totalPages > 1 && (
                            <div className="p-2 border-t border-slate-100 flex items-center justify-between bg-slate-50">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1 || isLoading}
                                    className="h-8 px-2 text-xs"
                                >
                                    Previous
                                </Button>
                                <span className="text-xs text-slate-500">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages || isLoading}
                                    className="h-8 px-2 text-xs"
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="text-xs text-slate-500">
                        Showing {startIndex + 1}-{Math.min(startIndex + members.length, totalMembers)} of {totalMembers} members
                    </div>
                </div>

                <DialogFooter className="p-4 border-t border-slate-100">
                    <Button
                        onClick={() => {
                            onSave(localSelected)
                            onOpenChange(false)
                        }}
                        className="bg-slate-900 hover:bg-slate-800 text-white w-24"
                    >
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function UploadZone({ onUpload }: { onUpload: () => void }) {
    return (
        <div
            onClick={onUpload}
            className="border-2 border-dashed border-slate-200 rounded-lg p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 transition-colors"
        >
            <div className="h-12 w-12 bg-slate-100 text-slate-900 rounded-full flex items-center justify-center mb-4">
                <CloudUpload className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-medium text-slate-900 mb-1">
                Click to upload or drag and drop
            </h3>
            <p className="text-xs text-slate-500 mb-4">
                CSV file up to 10MB
            </p>
            <Button variant="outline" type="button" className="h-9">
                Browse file
            </Button>
        </div>
    )
}

function FileDisplay({ file, onRemove }: { file: File; onRemove: () => void }) {
    return (
        <div className="border rounded-lg p-4 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <div className="text-slate-600 font-bold text-xs">CSV</div>
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate max-w-[200px]">
                        {file.name}
                    </p>
                    <p className="text-xs text-slate-500">
                        {(file.size / 1024).toFixed(1)} KB
                    </p>
                </div>
            </div>
            <Button
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="text-slate-500 hover:text-red-600 hover:bg-red-50"
            >
                Remove
            </Button>
        </div>
    )
}
