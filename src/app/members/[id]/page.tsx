"use client"

import React, { useState, useEffect, use } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import {
  Mail,
  Clock,
  ChevronDown,
  Info,
  X
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/profile&image/user-avatar"
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog"
import { useProfilePhotoUrl } from "@/hooks/use-profile"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { IOrganization_member, IMemberPerformance, IUser } from "@/interface"
import { cn } from "@/lib/utils"
// Server Actions
import { getOrganizationMembersById } from "@/action/members"
import { getMemberPerformance } from "@/action/member_performance"
import { useMemberRecentAttendance } from "@/hooks/use-member-recent-attendance"
import { PageSkeleton } from "@/components/ui/loading-skeleton"

// Types
type WorkSchedule = {
  name: string
  type: string
  workingHours: string
  workingDays: string[]
}

type TabType = "info" | "employment" | "roles" | "pay" | "worktime" | "settings"

// Helper Functions
const formatDate = (value?: string | null) => {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

const formatPhoneNumber = (phone?: string | null) => {
  if (!phone || phone === "-" || phone.trim() === "") return ""
  return phone
}

// Sub-Components
function ContactInfoRow({ icon: Icon, text }: { icon: typeof Mail; text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Icon className="h-4 w-4" />
      <span>{text}</span>
    </div>
  )
}

function FormField({
  label,
  value,
  placeholder,
  type = "text",
  linkText,
  disabled = false,
}: {
  label: string
  value?: string
  placeholder?: string
  type?: "text" | "email" | "phone" | "date"
  linkText?: string
  disabled?: boolean
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </Label>
        {linkText && (
          <button className="text-xs text-primary hover:underline">{linkText}</button>
        )}
      </div>
      {type === "phone" ? (
        <div className="flex gap-2">
          <Input
            type="tel"
            defaultValue={value}
            placeholder={placeholder || "+1 201-555-0123"}
            disabled={disabled}
            className="flex-1"
          />
        </div>
      ) : (
        <Input
          type={type}
          defaultValue={value}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full"
        />
      )}
    </div>
  )
}

function MemberProfileHeader({
  displayName,
  photoUrl,
  userId,
  joinDate,
  email,
  lastTracked,
}: {
  user?: IUser
  displayName: string
  photoUrl?: string
  userId?: string
  joinDate: string
  email: string
  lastTracked: string
}) {
  const resolvedPhotoUrl = useProfilePhotoUrl(photoUrl, userId)

  return (
    <div className="flex gap-8 mb-6 pb-6">
      {/* Left: Avatar */}
      <div className="flex-shrink-0">
        <div className="flex flex-col items-center text-center">
          <Dialog>
            <DialogTrigger asChild>
              <div className="cursor-pointer hover:opacity-80 transition-opacity rounded-full ring-2 ring-transparent hover:ring-primary/20 ring-offset-2">
                <UserAvatar
                  name={displayName}
                  photoUrl={photoUrl}
                  userId={userId}
                  size={20}
                />
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-fit border-none bg-transparent p-0 shadow-none [&>button]:hidden">
              <DialogTitle className="sr-only">Profile Picture</DialogTitle>
              {resolvedPhotoUrl ? (

                <img
                  src={resolvedPhotoUrl}
                  alt={displayName}
                  className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
                />
              ) : (
                <div className="w-64 h-64 bg-slate-100 rounded-full flex items-center justify-center text-5xl text-slate-400 font-semibold shadow-xl">
                  {displayName.split(/\s+/).filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                </div>
              )}
            </DialogContent>
          </Dialog>
          <p className="mt-3 text-xs text-muted-foreground">
            Joined
            <br />
            {joinDate}
          </p>
        </div>
      </div>

      {/* Right: Contact Info */}
      <div className="space-y-2">
        <ContactInfoRow icon={Mail} text={email || "No email"} />
        <ContactInfoRow icon={Clock} text={`Last tracked time ${lastTracked}`} />
      </div>
    </div>
  )
}

export default function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const activeTab = (searchParams.get("tab") as TabType) || "info"

  const [isSaving, setIsSaving] = useState(false)
  const [member, setMember] = useState<IOrganization_member | null>(null)
  const [, setPerformance] = useState<IMemberPerformance | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Fetch Data
  useEffect(() => {
    setMounted(true)
    const fetchData = async () => {
      try {
        const [memberRes, perfRes] = await Promise.all([
          getOrganizationMembersById(id),
          getMemberPerformance(id),
        ])

        if (memberRes && memberRes.success && memberRes.data) {
          setMember(memberRes.data as unknown as IOrganization_member)
        }
        if (perfRes && perfRes.success && perfRes.data) {
          setPerformance(perfRes.data)
        }
      } catch (error) {
        console.error("Failed to fetch member data", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  // Get recent attendance data
  const { data: recentAttendance } = useMemberRecentAttendance(id, 14)

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <PageSkeleton />
      </div>
    )
  }

  if (!member) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-xl font-semibold text-muted-foreground">Member not found.</p>
        </div>
      </div>
    )
  }

  // Derived State
  const user: IUser | undefined = member.user
  const email = user?.email || ""
  const phone = user?.phone || ""


  const displayName = user
    ? [user.first_name, user.last_name]
      .filter((part) => part && part.trim().length)
      .join(" ") ||
    (user.email && !user.email.toLowerCase().endsWith("@dummy.local") ? user.email : null) ||
    "Name unavailable"
    : "Name unavailable"

  const joinDate = formatDate(member.hire_date)
  const homeAddress = user
    ? [user.jalan, user.kelurahan, user.kecamatan].filter(Boolean).join(", ")
    : ""

  // Fix: Cast to prevent narrowing to "never" since it's constantly undefined currently
  const schedule = undefined as WorkSchedule | undefined

  const lastTracked = mounted && recentAttendance && recentAttendance.length > 0
    ? formatDate(recentAttendance?.[0]?.date)
    : "No recent activity"

  const rfidCards = member.rfid_cards
  const cardNumber = Array.isArray(rfidCards)
    ? (rfidCards[0]?.card_member || rfidCards[0]?.card_number)
    : ((rfidCards as any)?.card_member || (rfidCards as any)?.card_number)

  const handleSave = async () => {
    setIsSaving(true)
    setTimeout(() => setIsSaving(false), 1000)
  }

  const tabs = [
    { id: "info" as TabType, label: "INFO" },
    { id: "employment" as TabType, label: "EMPLOYMENT" },
    { id: "roles" as TabType, label: "ROLES" },
    { id: "pay" as TabType, label: "PAY / BILL" },
    { id: "worktime" as TabType, label: "WORK TIME & LIMITS" },
    { id: "settings" as TabType, label: "SETTINGS" },
  ]

  return (
    <div className="h-full bg-background">
      {/* Top Bar */}
      <div className="bg-card">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{displayName}</h1>
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Actions
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push(`/members/edit/${member.id}`)}>
                    Edit Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>Reset Password...</DropdownMenuItem>
                  <DropdownMenuItem>Manage profile fields</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/members")}>
                    Back to Members
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b bg-card">
        <div className="px-4">
          <div className="flex gap-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString())
                  params.set("tab", tab.id)
                  router.push(`${pathname}?${params.toString()}`, { scroll: false })
                }}
                className={cn(
                  "whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors hover:cursor-pointer",
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">

        <MemberProfileHeader
          displayName={displayName}
          photoUrl={user?.profile_photo_url || undefined}
          userId={user?.id}
          joinDate={joinDate}
          email={email}
          lastTracked={lastTracked}
        />

        {activeTab === "info" && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-sm font-bold">Identity</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  label="EMPLOYEE ID"
                  value={user?.nik || member.employee_id || user?.employee_code || ""}
                  placeholder="No employee ID"
                />

                <FormField
                  label="BIRTHDAY"
                  value={user?.date_of_birth ?? ""}
                  placeholder="YYYY-MM-DD"
                  type="date"
                />

                <FormField
                  label="CARD NUMBER"
                  value={cardNumber}
                  placeholder="No card assigned"
                  disabled={true}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-sm font-bold">Contact</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  label="HOME ADDRESS"
                  value={homeAddress}
                  placeholder="Search for an address"
                />
                <FormField
                  label="PERSONAL EMAIL"
                  value={email}
                  placeholder="name@example.com"
                  type="email"
                />
                <FormField
                  label="PERSONAL PHONE"
                  value={formatPhoneNumber(phone)}
                  type="phone"
                />
              </div>
            </div>

            {schedule && (
              <div className="space-y-4">
                <h2 className="text-sm font-bold">Work Schedule</h2>
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{schedule.name}</p>
                          <p className="text-xs text-muted-foreground">{schedule.type}</p>
                        </div>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Working Hours</p>
                          <p className="text-sm font-medium">{schedule.workingHours}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Working Days</p>
                          <p className="text-sm font-medium">{schedule.workingDays.join(", ")}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {activeTab === "employment" && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-sm font-bold">Employment Timeline</h2>
              <Card>
                <CardContent className="p-0">
                  <div className="grid divide-y md:grid-cols-3 md:divide-x md:divide-y-0">
                    <div className="p-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Start Date</p>
                      <p className="mt-1 font-medium">{formatDate(member.hire_date)}</p>
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Probation End</p>
                      <p className="mt-1 font-medium">{formatDate(member.probation_end_date)}</p>
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Duration</p>
                      <p className="mt-1 font-medium">
                        {(() => {
                          if (!member.hire_date) return "-"
                          const start = new Date(member.hire_date)
                          const end = member.termination_date ? new Date(member.termination_date) : new Date()
                          if (Number.isNaN(start.getTime())) return "-"

                          const diffTime = Math.abs(end.getTime() - start.getTime())
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

                          if (diffDays < 30) return `${diffDays} days`
                          const months = Math.floor(diffDays / 30)
                          if (months < 12) return `${months} months`
                          const years = Math.floor(months / 12)
                          const remainingMonths = months % 12
                          return `${years} year${years > 1 ? "s" : ""}${remainingMonths > 0 ? `, ${remainingMonths} month${remainingMonths > 1 ? "s" : ""}` : ""}`
                        })()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <h2 className="text-sm font-bold">Employment Details</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  label="JOB TITLE"
                  value={member.positions?.title || "No title assigned"}
                  disabled={true}
                />
                <FormField
                  label="DEPARTMENT"
                  value={
                    (member.departments as any)?.name || (member.groups as any)?.name || "No department"
                  }
                  disabled={true}
                />
                <FormField
                  label="MANAGER"
                  value="Not assigned"
                  disabled={true}
                />
                <FormField
                  label="EMPLOYMENT TYPE"
                  value={member.contract_type || "Not specified"}
                  disabled={true}
                />
                <FormField
                  label="EMPLOYMENT STATUS"
                  value={member.employment_status || (member.is_active ? "Active" : "Inactive")}
                  disabled={true}
                />
                <FormField
                  label="WORK LOCATION"
                  value={member.work_location || "Not specified"}
                  disabled={true}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold">Accounting</h2>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">View Only</span>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  label="TAX INFO"
                  value={member.tax_id_number || "Not set"}
                  disabled={true}
                />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      TAX TYPE
                    </Label>
                  </div>
                  <Select disabled defaultValue={member.tax_type || "employee"}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="contractor">Contractor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <FormField
                  label="ACCOUNT CODE"
                  value={member.account_code || "Not set"}
                  disabled={true}
                />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      CURRENCY
                    </Label>
                  </div>
                  <Select disabled defaultValue={member.currency || "IDR"}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IDR">IDR - Indonesian Rupiah</SelectItem>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="SGD">SGD - Singapore Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "roles" && (
          <div className="space-y-6">
            {/* Role Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  ROLE <span className="text-red-500">*</span>
                </Label>
                <button className="text-xs text-primary hover:underline">Learn more</button>
              </div>
              <Select defaultValue={member.role?.name || "Member"}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Owner">Owner</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Member">Member</SelectItem>
                  <SelectItem value="Project Viewer">Project Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Projects & Teams */}
            <div className="grid gap-8 md:grid-cols-2">
              {/* Projects Column */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold">Projects</h3>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-muted-foreground">Able to track time on these projects</Label>
                    <button className="text-xs text-primary hover:underline">Select all</button>
                  </div>
                  <div className="relative">
                    <div className="flex min-h-[40px] w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                      <span className="text-muted-foreground">0 projects</span>
                      <X className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-foreground" />
                    </div>
                    <div className="absolute left-0 top-0 h-full w-1 rounded-l-md bg-blue-500"></div>
                  </div>
                </div>
              </div>

              {/* Teams Column */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold">Teams</h3>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-muted-foreground">Member in these teams</Label>
                    <button className="text-xs text-primary hover:underline">Select all</button>
                  </div>
                  <Input placeholder="Select teams" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-muted-foreground">Manages these teams as <span className="font-semibold text-foreground">Team lead</span></Label>
                    <button className="text-xs text-primary hover:underline">Select all</button>
                  </div>
                  <Input placeholder="Select teams" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other tabs placeholder */}
        {activeTab !== "info" && activeTab !== "employment" && activeTab !== "roles" && (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">
              {tabs.find((t) => t.id === activeTab)?.label} content coming soon
            </p>
          </div>
        )}
      </div>
    </div >
  )
}
