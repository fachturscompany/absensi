"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarIcon, ChevronDown, Loader2, Plus, Trash2, X } from "lucide-react"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { useForm, useFieldArray, useWatch } from "react-hook-form"
import type { Control } from "react-hook-form"
import { z } from "zod"

import { createManualAttendance } from "@/action/attendance"
import { getAllOrganization_member } from "@/action/members"
import { toTimestampWithTimezone } from "@/lib/timezone"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { IOrganization_member } from "@/interface"
import { toast } from "sonner"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

type ManualAttendancePayload = {
  organization_member_id: string
  attendance_date: string
  actual_check_in: string
  actual_check_out: string | null
  status: string
  remarks?: string
}

type MemberOption = {
  id: string
  label: string
  organizationId: string
  groupName?: string
  groupId?: string
}

// Strict validation function untuk member ID
const isValidMemberId = (id: string | undefined | null): id is string => {
  if (!id) return false
  const numId = Number(id)
  return !isNaN(numId) && numId > 0 && String(numId) === id
}

const HOURS = Array.from({ length: 24 }, (_, hour) => hour)
const MINUTES = Array.from({ length: 12 }, (_, idx) => idx * 5)

const QUICK_STATUSES = [
  { value: "present", label: "Present", color: "bg-green-100 text-green-800" },
  { value: "absent", label: "Absent", color: "bg-red-100 text-red-800" },
  { value: "late", label: "Late", color: "bg-yellow-100 text-yellow-800" },
  { value: "excused", label: "Excused", color: "bg-blue-100 text-blue-800" },
  { value: "early_leave", label: "Early Leave", color: "bg-purple-100 text-purple-800" },
]

const entrySchema = z.object({
  memberId: z.string().min(1, "Member is required."),
  checkInTime: z.date().refine(() => true, { message: "Check-in is required." }),
  checkOutTime: z.date().optional(),
  status: z.enum(["present", "absent", "late", "excused", "early_leave"]),
  remarks: z.string().max(500, "Notes max 500 characters.").optional(),
})

const formSchema = z.object({
  entries: z.array(entrySchema).min(1, "At least 1 attendance entry is required."),
})

type FormValues = z.infer<typeof formSchema>

export function AttendanceForm() {
  const router = useRouter()
  const [members, setMembers] = useState<MemberOption[]>([])
  const [groups, setGroups] = useState<string[]>([])
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [selectedGroup, setSelectedGroup] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"single" | "batch">("single")

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      entries: [
        {
          checkInTime: undefined,
          checkOutTime: undefined,
          status: "present",
          remarks: "",
        },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "entries",
  })

  useEffect(() => {
    const loadMembers = async () => {
      try {
        setLoadingMembers(true)
        const membersRes = await getAllOrganization_member()

        if (!membersRes.success) {
          throw new Error(membersRes.message || "Failed to load members data")
        }

        const membersData = (membersRes.data || []) as IOrganization_member[]

        const options: MemberOption[] = membersData
          .filter((member) => {
            // Member valid jika punya id (user_id optional)
            if (!member.id) return false
            const memberId = Number(member.id)
            return !isNaN(memberId) && memberId > 0
          })
          .map((member) => {
            const user = member.user
            
            // Get name from user_profiles
            let resolvedLabel = "No Name"
            if (user) {
              const displayName = user.display_name?.trim()
              const concatenated = [user.first_name, user.last_name]
                .filter(Boolean)
                .join(" ")
              const fullName = concatenated.trim()
              resolvedLabel = displayName || fullName || user.email || "No Name"
            }

            const memberId = String(Number(member.id))
            return {
              id: memberId,
              label: resolvedLabel,
              organizationId: String(member.organization_id),
              groupId: member.department_id,
              groupName: member.departments?.name || "",
            }
          })
          .filter((opt) => isValidMemberId(opt.id))

        setMembers(options)

        // Extract unique groups
        const depts = Array.from(
          new Set(options.map((m) => m.groupName).filter(Boolean))
        ).sort() as string[]
        setGroups(depts)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "An error occurred"
        toast.error(message)
      } finally {
        setLoadingMembers(false)
      }
    }

    loadMembers()
  }, [])

  const filteredMembers = useMemo(
    () =>
      members
        .filter((m) => !selectedGroup || m.groupName === selectedGroup)
        .filter((m) =>
          searchQuery
            ? m.label.toLowerCase().includes(searchQuery.toLowerCase())
            : true
        )
        .sort((a, b) => a.label.localeCompare(b.label)),
    [members, selectedGroup, searchQuery],
  )

  const onSubmit = async (values: FormValues) => {
    try {
      const payloads: ManualAttendancePayload[] = values.entries.map((entry) => ({
        organization_member_id: entry.memberId,
        attendance_date: entry.checkInTime.toISOString().slice(0, 10),
        actual_check_in: toTimestampWithTimezone(entry.checkInTime),
        actual_check_out: entry.checkOutTime ? toTimestampWithTimezone(entry.checkOutTime) : null,
        status: entry.status,
        remarks: entry.remarks?.trim() ? entry.remarks.trim() : undefined,
      }))

      // Submit all payloads
      let successCount = 0
      for (const payload of payloads) {
        const res = await createManualAttendance(payload)
        if (res.success) {
          successCount++
        } else {
          toast.error(`Error: ${res.message}`)
        }
      }

      if (successCount === payloads.length) {
        toast.success(`${successCount} attendance records created successfully`)
        router.push("/attendance")
      } else {
        toast.warning(`${successCount} of ${payloads.length} attendance records created successfully`)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred"
      toast.error(message)
    }
  }

  const isSubmitting = form.formState.isSubmitting

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "single" | "batch")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">Single Entry</TabsTrigger>
            <TabsTrigger value="batch">Batch Entry</TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add Attendance (Single)</CardTitle>
                <CardDescription>
                  Add attendance records one by one for your team members.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SingleEntryForm
                  control={form.control}
                  members={filteredMembers}
                  groups={groups}
                  selectedGroup={selectedGroup}
                  setSelectedGroup={setSelectedGroup}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  loadingMembers={loadingMembers}
                  isSubmitting={isSubmitting}
                  memberCount={members.length}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="batch" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add Attendance (Batch)</CardTitle>
                <CardDescription>
                  Add multiple attendance records at once for a specific department or group.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <BatchEntryForm
                  control={form.control}
                  fields={fields}
                  members={filteredMembers}
                  groups={groups}
                  selectedGroup={selectedGroup}
                  setSelectedGroup={setSelectedGroup}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  loadingMembers={loadingMembers}
                  isSubmitting={isSubmitting}
                  append={append}
                  remove={remove}
                  memberCount={members.length}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            <X className="mr-2 h-4 w-4" /> Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              `Save ${activeTab === "batch" ? fields.length : "1"} Attendance Records`
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}

type SingleEntryFormProps = {
  control: Control<FormValues>
  members: MemberOption[]
  groups: string[]
  selectedGroup: string
  setSelectedGroup: (group: string) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  loadingMembers: boolean
  isSubmitting: boolean
  memberCount: number
}

function SingleEntryForm({
  control,
  members,
  groups,
  selectedGroup,
  setSelectedGroup,
  searchQuery,
  setSearchQuery,
  loadingMembers,
  isSubmitting,
}: SingleEntryFormProps) {
  const checkInTime = useWatch({ control, name: "entries.0.checkInTime" })

  return (
    <div className="space-y-6">
      {/* Member Selection with Filters */}
      <div className="space-y-3">
        <FormLabel>Filter & Search Members</FormLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select value={selectedGroup} onValueChange={setSelectedGroup}>
            <SelectTrigger>
              <SelectValue placeholder="All Groups" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Groups</SelectItem>
              {groups.map((group) => (
                <SelectItem key={group} value={group}>
                  {group}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Search member name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={loadingMembers}
          />
        </div>
      </div>

      {/* Member Selection */}
      <FormField
        control={control}
        name="entries.0.memberId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Member</FormLabel>
            <Select
              disabled={loadingMembers || isSubmitting}
              onValueChange={field.onChange}
              value={field.value}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={loadingMembers ? "Loading..." : "Select member"}
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="max-h-64">
                {members.length > 0 ? (
                  members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <span>{member.label}</span>
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-muted-foreground text-center py-6">
                    {loadingMembers ? "Loading data..." : "No members available."}
                  </div>
                )}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Quick Status Buttons */}
      <FormField
        control={control}
        name="entries.0.status"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Status (Quick Select)</FormLabel>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {QUICK_STATUSES.map((status) => (
                <Button
                  key={status.value}
                  type="button"
                  variant={field.value === status.value ? "default" : "outline"}
                  onClick={() => field.onChange(status.value)}
                  className={field.value === status.value ? "" : ""}
                  disabled={isSubmitting}
                >
                  {status.label}
                </Button>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Date and Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DateTimePickerField
          control={control}
          name="entries.0.checkInTime"
          label="Check-in"
          description="Pilih tanggal dan waktu check-in (format 24 jam)."
          required
        />

        <DateTimePickerField
          control={control}
          name="entries.0.checkOutTime"
          label="Check-out (opsional)"
          description="Isi jika sudah ada jam pulang."
          getReferenceDate={() => checkInTime}
        />
      </div>

      {/* Remarks */}
      <FormField
        control={control}
        name="entries.0.remarks"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Notes (Optional)</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Add notes or special reason..."
                rows={3}
                {...field}
                value={field.value ?? ""}
                disabled={isSubmitting}
              />
            </FormControl>
            <FormDescription>
              Use to explain the context or reason for status change.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

type BatchEntryFormProps = {
  control: Control<FormValues>
  fields: ReturnType<typeof useFieldArray<FormValues>>['fields']
  members: MemberOption[]
  groups: string[]
  selectedGroup: string
  setSelectedGroup: (group: string) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  loadingMembers: boolean
  isSubmitting: boolean
  append: (data: any) => void
  remove: (index: number) => void
  memberCount: number
}

function BatchEntryForm({
  control,
  fields,
  members,
  groups,
  selectedGroup,
  setSelectedGroup,
  searchQuery,
  setSearchQuery,
  loadingMembers,
  isSubmitting,
  append,
  remove,
}: BatchEntryFormProps) {
  return (
    <div className="space-y-6">
      {/* Filter Section */}
      <div className="space-y-3">
        <FormLabel>Filter Group & Members</FormLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select value={selectedGroup} onValueChange={setSelectedGroup}>
            <SelectTrigger>
              <SelectValue placeholder="All Groups" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Groups</SelectItem>
              {groups.map((group) => (
                <SelectItem key={group} value={group}>
                  {group}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Search member name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={loadingMembers}
          />
        </div>
      </div>

      {/* Quick Select All */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:underline">
          <ChevronDown className="h-4 w-4" />
          Quick Add ({members.length} member{members.length !== 1 ? "s" : ""})
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 mt-3 pt-3 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {members.map((member) => (
              <Button
                key={member.id}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const alreadyAdded = fields.some((f) => f.memberId === member.id)
                  if (!alreadyAdded) {
                    append({
                      memberId: member.id,
                      checkInTime: undefined,
                      checkOutTime: undefined,
                      status: "present",
                      remarks: "",
                    })
                    toast.success(`${member.label} ditambahkan`)
                  } else {
                    toast.info(`${member.label} sudah ada dalam daftar`)
                  }
                }}
                disabled={isSubmitting}
                className="flex flex-col items-start gap-1 h-auto py-2"
              >
                <div className="flex items-center gap-1">
                  <Plus className="h-3 w-3" /> 
                  <span className="text-xs font-medium">{member.label}</span>
                </div>
                {member.groupName && (
                  <span className="text-xs text-muted-foreground">{member.groupName}</span>
                )}
              </Button>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Entry List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <FormLabel>Attendance Records ({fields.length})</FormLabel>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const newEntry: any = {
                checkInTime: undefined,
                checkOutTime: undefined,
                status: "present",
                remarks: "",
              }
              append(newEntry)
            }}
            disabled={isSubmitting}
          >
            <Plus className="mr-1 h-4 w-4" /> Add Entry
          </Button>
        </div>

        {fields.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No entries yet. Use the "Quick Add" or "Add Entry" button to start.
          </div>
        )}

        {fields.map((field, index) => (
          <BatchEntryItem
            key={field.id}
            control={control}
            index={index}
            members={members}
            isSubmitting={isSubmitting}
            onRemove={() => remove(index)}
          />
        ))}
      </div>
    </div>
  )
}

type BatchEntryItemProps = {
  control: Control<FormValues>
  index: number
  members: MemberOption[]
  isSubmitting: boolean
  onRemove: () => void
}

function BatchEntryItem({
  control,
  index,
  members,
  isSubmitting,
  onRemove,
}: BatchEntryItemProps) {
  const selectedMemberId = useWatch({ control, name: `entries.${index}.memberId` })
  const checkInTime = useWatch({ control, name: `entries.${index}.checkInTime` })
  const selectedMember = members.find((m) => m.id === selectedMemberId)

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {selectedMember && (
              <div className="text-sm">
                <div className="font-semibold">{selectedMember.label}</div>
                {selectedMember.groupName && (
                  <div className="text-xs text-muted-foreground">
                    {selectedMember.groupName}
                  </div>
                )}
              </div>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            disabled={isSubmitting}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>

        {/* Member Selection */}
        <FormField
          control={control}
          name={`entries.${index}.memberId`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Member</FormLabel>
              <Select
                disabled={isSubmitting}
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih member" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="max-h-64">
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <span>{member.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Status Selection */}
        <FormField
          control={control}
          name={`entries.${index}.status`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {QUICK_STATUSES.map((status) => (
                  <Button
                    key={status.value}
                    type="button"
                    variant={field.value === status.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => field.onChange(status.value)}
                    disabled={isSubmitting}
                  >
                    {status.label}
                  </Button>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Date and Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DateTimePickerField
            control={control}
            name={`entries.${index}.checkInTime` as any}
            label="Check-in"
            required
          />

          <DateTimePickerField
            control={control}
            name={`entries.${index}.checkOutTime` as any}
            label="Check-out (opsional)"
            getReferenceDate={() => checkInTime}
          />
        </div>

        {/* Remarks */}
        <FormField
          control={control}
          name={`entries.${index}.remarks`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Notes for this entry..."
                  rows={2}
                  {...field}
                  value={field.value ?? ""}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  )
}

type DateTimePickerFieldProps = {
  control: Control<FormValues>
  name: any
  label: string
  description?: string
  required?: boolean
  getReferenceDate?: () => Date | undefined
}

function DateTimePickerField({
  control,
  name,
  label,
  description,
  required,
  getReferenceDate,
}: DateTimePickerFieldProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const referenceDate = getReferenceDate?.()

        const handleDateSelect = (date: Date | undefined) => {
          if (!date) {
            field.onChange(undefined)
            return
          }

          const baseTimeSource = field.value ?? referenceDate ?? new Date()
          const next = new Date(date)
          next.setHours(baseTimeSource.getHours(), baseTimeSource.getMinutes(), 0, 0)

          field.onChange(next)
        }

        const handleTimeChange = (type: "hour" | "minute", value: number) => {
          const baseTimeSource = field.value ?? referenceDate ?? new Date()
          const base = new Date(baseTimeSource)

          if (!field.value) {
            base.setSeconds(0, 0)
          }

          if (type === "hour") {
            base.setHours(value)
          } else {
            base.setMinutes(value)
          }

          field.onChange(base)
        }

        return (
          <FormItem className="flex flex-col">
            <FormLabel>
              {label}
              {required ? <span className="text-destructive">*</span> : null}
            </FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !field.value && "text-muted-foreground",
                    )}
                  >
                    {field.value ? (
                      format(field.value, "MM/dd/yyyy HH:mm")
                    ) : (
                      <span>MM/DD/YYYY HH:mm</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="sm:flex">
                  <Calendar
                    mode="single"
                    selected={field.value ?? referenceDate}
                    onSelect={handleDateSelect}
                    initialFocus
                  />
                  <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
                    <ScrollArea className="w-64 sm:w-auto">
                      <div className="flex sm:flex-col p-2">
                        {HOURS.map((hour) => (
                          <Button
                            key={hour}
                            size="icon"
                            type="button"
                            variant={field.value && field.value.getHours() === hour ? "default" : "ghost"}
                            className="sm:w-full shrink-0 aspect-square"
                            onClick={() => handleTimeChange("hour", hour)}
                          >
                            {hour.toString().padStart(2, "0")}
                          </Button>
                        ))}
                      </div>
                      <ScrollBar orientation="horizontal" className="sm:hidden" />
                    </ScrollArea>
                    <ScrollArea className="w-64 sm:w-auto">
                      <div className="flex sm:flex-col p-2">
                        {MINUTES.map((minute) => (
                          <Button
                            key={minute}
                            size="icon"
                            type="button"
                            variant={field.value && field.value.getMinutes() === minute ? "default" : "ghost"}
                            className="sm:w-full shrink-0 aspect-square"
                            onClick={() => handleTimeChange("minute", minute)}
                          >
                            {minute.toString().padStart(2, "0")}
                          </Button>
                        ))}
                      </div>
                      <ScrollBar orientation="horizontal" className="sm:hidden" />
                    </ScrollArea>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            {description ? <FormDescription>{description}</FormDescription> : null}
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}
