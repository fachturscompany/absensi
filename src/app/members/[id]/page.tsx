"use client"

import React, { useState, useEffect, use } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import {
  Mail,
  ChevronDown,
  Info,
  X,
  ExternalLink,
  Calendar,
  Globe,
  Plus,
  HelpCircle,
  Search,
} from "lucide-react"
import { CountryOption } from "@/types/geo"

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
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { IOrganization_member, IUser } from "@/interface"
import { cn } from "@/lib/utils"
// Server Actions
import { getOrganizationMembersById, updateMemberInfo } from "@/action/members"
import { PageSkeleton } from "@/components/ui/loading-skeleton"
import { toast } from "sonner"
import manifest from "@/lib/data/geo/manifest.json"

const COUNTRIES = manifest.countries.map(c => ({
  code: `+${c.phone_code}`,
  flag: `https://flagcdn.com/w20/${c.code.toLowerCase()}.png`,
  name: c.name,
  countryCode: c.code
}))

type TabType = "info" | "employment" | "roles" | "pay" | "worktime" | "settings"

interface ICountry {
  code: string;
  name: string;
  phone: string;
}

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


// Sub-Components
function ContactInfoRow({ icon: Icon, text, href }: { icon: typeof Mail; text: string; href?: string }) {
  const content = (
    <div className="flex items-center gap-2 text-sm text-muted-foreground group">
      <Icon className="h-4 w-4" />
      <span className="group-hover:text-foreground transition-colors">{text}</span>
      {href && <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
    </div>
  )

  if (href) {
    return <a href={href} target="_blank" rel="noopener noreferrer">{content}</a>
  }
  return content
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
}: {
  displayName: string
  photoUrl?: string
  userId?: string
  joinDate: string
  email: string
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
        <ContactInfoRow icon={Mail} text={email || "No email"} href={email ? `mailto:${email}` : undefined} />
        <ContactInfoRow icon={Globe} text="(GMT+07:00) Asia/Jakarta" href="#" />
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
  const [loading, setLoading] = useState(true)

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const memberRes = await getOrganizationMembersById(id)
        console.log("Member fetch result:", { id, success: memberRes.success, hasData: !!memberRes.data });

        if (memberRes && memberRes.success && memberRes.data) {
          const data = memberRes.data as unknown as IOrganization_member
          setMember(data)
          
          // Initialize form data
          const user = data.user
          const dob = user?.date_of_birth ? new Date(user.date_of_birth) : null
          
          setFormData({
            employee_id: data.employee_id || "",
            work_location: data.work_location || "",
            hire_date: data.hire_date || "",
            first_name: user?.first_name || "",
            last_name: user?.last_name || "",
            display_name: user?.display_name || "",
            phone: user?.phone || "",
            mobile: user?.mobile || "",
            date_of_birth: user?.date_of_birth || "",
            birth_day: dob ? String(dob.getDate()) : "",
            birth_month: dob ? String(dob.getMonth() + 1) : "",
            birth_year: dob ? String(dob.getFullYear()) : ""
          })
        } else {
          console.log("Member not found or fetch failed:", memberRes.message);
          toast.error(`Fetch failed for ID ${id}: ${memberRes.message || 'Unknown error'}`);
        }
      } catch (error) {
        console.error("Failed to fetch member data", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  // Geo Detection
  useEffect(() => {
    const detectGeo = async () => {
      // Only detect if both phones are currently default/empty
      if (formData.phone || formData.mobile) return

      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (data.country_calling_code) {
          const code = data.country_calling_code
          setFormData(prev => ({ ...prev, phone_code: code, mobile_code: code }))
        }
      } catch (e) {
        console.warn("Geo detection failed", e);
      }
    }
    detectGeo()
  }, [])


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

  const displayName = user
    ? [user.first_name, user.last_name]
      .filter((part) => part && part.trim().length)
      .join(" ") ||
    (user.email && !user.email.toLowerCase().endsWith("@dummy.local") ? user.email : null) ||
    "Name unavailable"
    : "Name unavailable"

  const joinDate = formatDate(member.hire_date)


  const handleSave = async () => {
    if (!member || !member.user_id) return
    
    setIsSaving(true)
    try {
      // Reconstruct date_of_birth from birth selects if changed
      let finalDob = formData.date_of_birth
      if (formData.birth_day && formData.birth_month && formData.birth_year) {
        finalDob = `${formData.birth_year}-${formData.birth_month.padStart(2, '0')}-${formData.birth_day.padStart(2, '0')}`
      }

      const res = await updateMemberInfo(id, member.user_id, {
        employee_id: formData.employee_id,
        work_location: formData.work_location,
        hire_date: formData.hire_date,
        phone: formData.phone,
        mobile: formData.mobile,
        date_of_birth: finalDob
      })

      if (res.success) {
        toast.success("Member information updated successfully")
        // Update member state locally or re-fetch
        router.refresh()
      } else {
        toast.error(res.message || "Failed to update member")
      }
    } catch (error) {
      console.error("Save error:", error)
      toast.error("An unexpected error occurred while saving")
    } finally {
      setIsSaving(false)
    }
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
                  <Button variant="outline" className="h-10 px-4 rounded-md border-slate-200">
                    Actions
                    <ChevronDown className="ml-2 h-4 w-4 text-slate-400" />
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
              <Button className="bg-blue-500 hover:bg-blue-600 text-white h-10 px-6 rounded-md transition-colors shadow-sm" onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
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
        />

        {/* INFO TAB */}
        {activeTab === "info" && (
          <div className="space-y-12 animate-in fade-in duration-500">
            {/* Identity Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-medium text-slate-800">Identity</h2>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">EMPLOYEE ID</Label>
                  <Input 
                    placeholder="No employee ID" 
                    className="h-11 border-slate-200" 
                    value={formData.employee_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, employee_id: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">IP ADDRESS</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>The IP address of the member.</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input defaultValue="2404:c0:9c2e:e57d:e1e1:827d:5493:ce8f" disabled className="bg-slate-50 border-slate-200 text-slate-500" />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2 mt-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">BIRTHDAY</Label>
                  <div className="flex gap-3">
                    <Select
                      value={formData.birth_month}
                      onValueChange={(val) => setFormData(prev => ({ ...prev, birth_month: val }))}
                    >
                      <SelectTrigger className="w-full h-11 border-slate-200">
                        <SelectValue placeholder="Select a month" />
                      </SelectTrigger>
                      <SelectContent>
                        {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((month, i) => (
                          <SelectItem key={month} value={String(i + 1)}>{month}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={formData.birth_day}
                      onValueChange={(val) => setFormData(prev => ({ ...prev, birth_day: val }))}
                    >
                      <SelectTrigger className="w-full h-11 border-slate-200">
                        <SelectValue placeholder="Select a day" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 31 }, (_, i) => (
                          <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={formData.birth_year}
                      onValueChange={(val) => setFormData(prev => ({ ...prev, birth_year: val }))}
                    >
                      <SelectTrigger className="w-full h-11 border-slate-200">
                        <SelectValue placeholder="Select a year" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 100 }, (_, i) => {
                          const year = new Date().getFullYear() - i
                          return <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">DATE</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>The current date for reference.</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input 
                    className="h-11 border-slate-200" 
                    type="date"
                    value={formData.hire_date ? formData.hire_date.split('T')[0] : ""} 
                    onChange={(e) => setFormData(prev => ({ ...prev, hire_date: e.target.value }))}
                  />
                </div>
              </div>

              {/* Hubstaff People BETA Banner */}
              <div className="relative p-6 bg-blue-50/30 border border-blue-100 rounded-xl overflow-hidden mt-8">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-white rounded-lg shadow-sm border border-blue-50">
                    <div className="flex items-center scale-75 origin-left">
                      <span className="font-bold italic tracking-tighter text-blue-600">7</span>
                      <span className="font-bold tracking-tighter italic text-blue-600">Hubstaff</span>
                      <span className="ml-1 font-bold text-slate-800">People</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800">Hubstaff People</p>
                      <Badge className="bg-blue-100 text-blue-600 border-none text-[8px] font-bold h-4">BETA</Badge>
                    </div>
                    <p className="text-xs text-slate-600">Try these new features for free while Hubstaff People is in BETA</p>
                    <ul className="text-xs text-slate-500 list-disc list-inside space-y-1 pt-2">
                      <li>View IP addresses</li>
                      <li>Create and manage custom fields</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Section */}
            <div className="space-y-6 pt-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h2 className="text-lg font-medium text-slate-800">Contact</h2>
                <button className="text-sm text-slate-900 font-medium hover:underline">Edit work address</button>
              </div>

              <div className="grid gap-12 md:grid-cols-2">
                <div className="space-y-8">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">WORK ADDRESS</Label>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <Input 
                      placeholder="No address" 
                      className="h-11 border-slate-200 bg-slate-50" 
                      value={formData.work_location}
                      onChange={(e) => setFormData(prev => ({ ...prev, work_location: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">WORK EMAIL</Label>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <Input defaultValue={email} className="h-11 border-slate-200 bg-slate-50 text-slate-500" disabled />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">WORK PHONE</Label>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 h-11 px-3 border border-slate-200 rounded-md bg-white">
                        <img src="https://flagcdn.com/w20/us.png" alt="US" className="h-3 w-5" />
                        <ChevronDown className="h-3 w-3 text-slate-400" />
                        <span className="text-sm">+1</span>
                      </div>
                      <Input placeholder="201-555-0123" className="h-11 border-slate-200" />
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">HOME ADDRESS</Label>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border rounded border-slate-200"></div>
                        <span className="text-xs text-slate-400">Mailing address</span>
                      </div>
                    </div>
                    <Input placeholder="Search for an address" className="h-11 border-slate-200" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">PERSONAL EMAIL</Label>
                    <Input placeholder="name@example.com" className="h-11 border-slate-200" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">PERSONAL PHONE</Label>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 h-11 px-3 border border-slate-200 rounded-md bg-white">
                        <img src="https://flagcdn.com/w20/us.png" alt="US" className="h-3 w-5" />
                        <ChevronDown className="h-3 w-3 text-slate-400" />
                        <span className="text-sm">+1</span>
                      </div>
                      <Input placeholder="201-555-0123" className="h-11 border-slate-200" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-10 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-slate-700">Custom fields</span>
                  <Info className="h-3 w-3 text-slate-400" />
                </div>
                <button className="text-sm text-slate-900 font-medium hover:underline">Manage custom fields</button>
              </div>
            </div>
          </div>
        )}

        {/* EMPLOYMENT TAB */}
        {activeTab === "employment" && (
          <div className="space-y-12 animate-in fade-in duration-500">
            {/* Job details */}
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-slate-800">Job details</h2>
              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-6">
                  <FormField label="JOB TITLE" placeholder="Select the job title" linkText="" />
                  <FormField label="JOB TYPE" placeholder="Select the job type" linkText="" />
                </div>
                <div className="space-y-6">
                  <FormField label="DEPARTMENT" placeholder="Select the department" linkText="" />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">WORK ADDRESS</Label>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border rounded border-slate-200"></div>
                        <span className="text-xs text-slate-400">Mailing address</span>
                      </div>
                    </div>
                    <Input placeholder="Search for an address" className="h-11 border-slate-200" />
                  </div>
                </div>
              </div>
            </div>

            {/* Hiring details */}
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-slate-800">Hiring details</h2>
              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-6">
                  <FormField label="EMPLOYMENT TYPE" placeholder="Select the employment type" linkText="" />
                  <FormField label="IN-OFFICE / REMOTE" placeholder="Select the workplace model" linkText="" />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="% IN-OFFICE" placeholder="In-office percentage" />
                    <FormField label="% REMOTE" placeholder="Remote percentage" />
                  </div>
                </div>
                <div className="space-y-6">
                  <FormField label="EMPLOYED THROUGH" placeholder="Select the hiring arrangement" linkText="" />
                </div>
              </div>
            </div>

            {/* Accounting */}
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-slate-800">Accounting</h2>
              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-6">
                  <FormField label="TAX INFO" placeholder="No tax info" />
                  <FormField label="TAX TYPE" placeholder="Select the tax type" />
                </div>
                <div className="space-y-6">
                  <FormField label="ACCOUNT CODE" placeholder="No account code" />
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">CURRENCY</Label>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <Input placeholder="Currency" disabled className="h-11 border-slate-200 bg-slate-50" />
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-slate-800">Timeline</h2>
              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">START DATE</Label>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <div className="relative">
                      <Input className="h-11 border-slate-200" defaultValue="Wed, Apr 1, 2026" />
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">END DATE</Label>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <button className="text-xs text-slate-900 font-medium hover:underline">Begin offboarding</button>
                    </div>
                    <div className="relative">
                      <Input className="h-11 border-slate-200 bg-slate-50" disabled />
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                    </div>
                  </div>

                  <FormField label="TERMINATION REASON" placeholder="Select the termination reason" />
                </div>

                <div className="space-y-2 h-full">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">EMPLOYMENT COMMENTS</Label>
                  <textarea className="w-full h-[calc(100%-28px)] min-h-[150px] p-4 border border-slate-200 rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"></textarea>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ROLES TAB */}
        {activeTab === "roles" && (
          <div className="space-y-12 animate-in fade-in duration-500">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">ROLE *</Label>
                <button className="text-xs text-primary hover:underline">Learn more</button>
              </div>
              <Select defaultValue="owner">
                <SelectTrigger className="w-full h-12 border-slate-200 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Organization owner</SelectItem>
                  <SelectItem value="manager">Organization manager</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-12 md:grid-cols-2">
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Projects</Label>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <button className="text-xs text-slate-900 font-medium hover:underline">Select all</button>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">Able to track time on these projects</p>
                  <Select>
                    <SelectTrigger className="h-12 border-slate-200 bg-white">
                      <SelectValue placeholder="Select projects" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="p1">Project 1</SelectItem>
                      <SelectItem value="p2">Project 2</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-400 font-medium pt-2">
                    Organization owner and organization managers can view and edit all projects by default
                  </p>
                </div>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Teams</Label>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <button className="text-xs text-slate-900 font-medium hover:underline">Select all</button>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">Member in these teams</p>
                  <Select>
                    <SelectTrigger className="h-12 border-slate-200 bg-white">
                      <SelectValue placeholder="Select teams" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="t1">Team Alpha</SelectItem>
                      <SelectItem value="t2">Team Beta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">Manages these teams as <span className="font-bold text-slate-800">Team lead</span></p>
                    <button className="text-xs text-slate-900 font-medium hover:underline">Select all</button>
                  </div>
                  <Select>
                    <SelectTrigger className="h-12 border-slate-200 bg-white">
                      <SelectValue placeholder="Select teams" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="t1">Team Alpha</SelectItem>
                      <SelectItem value="t2">Team Beta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PAY / BILL TAB */}
        {activeTab === "pay" && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Payment Integration Banner */}
            <div className="relative flex items-center justify-between p-6 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden group">
              <div className="flex items-center gap-6">
                <div className="flex items-center justify-center p-3">
                  <div className="flex items-center">
                    <span className="text-2xl font-bold italic tracking-tighter">7</span>
                    <span className="text-2xl font-bold tracking-tighter text-blue-500 italic">Wise</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium">Pay your team through Wise with our automated payroll system</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button className="text-sm text-blue-500 font-medium hover:underline">Learn More</button>
                <Button variant="default" className="bg-blue-500 hover:bg-blue-600 text-white rounded-md px-6">Try out</Button>
              </div>
              <button className="absolute top-2 right-2 text-slate-300 hover:text-slate-500">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Payment Rates</Label>
                <HelpCircle className="h-3 w-3 text-muted-foreground" />
              </div>

              <ToggleGroup type="single" defaultValue="pay" className="justify-start bg-slate-100 p-1 rounded-full w-fit">
                <ToggleGroupItem value="pay" className="rounded-full px-6 py-2 text-xs data-[state=on]:bg-white data-[state=on]:shadow-sm">Pay rate</ToggleGroupItem>
                <ToggleGroupItem value="bill" className="rounded-full px-6 py-2 text-xs data-[state=on]:bg-white data-[state=on]:shadow-sm">Bill rate</ToggleGroupItem>
              </ToggleGroup>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Pay Period</Label>
                  <Select defaultValue="none">
                    <SelectTrigger className="w-full h-11 border-slate-200">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-3 py-2">
                <Switch id="require-approval" />
                <Label htmlFor="require-approval" className="text-sm font-medium text-slate-500">Require timesheet approval</Label>
              </div>

              <div className="grid gap-6 md:grid-cols-4 items-end">
                <div className="md:col-span-1 space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Pay Rate</Label>
                  <div className="flex">
                    <div className="flex items-center justify-center px-4 border border-r-0 rounded-l-md bg-slate-50 text-slate-400 text-sm border-slate-200">USD</div>
                    <Input className="rounded-l-none h-11 border-slate-200" placeholder="0.00" />
                  </div>
                </div>
                <div className="md:col-span-1 space-y-2">
                  <Select defaultValue="hourly">
                    <SelectTrigger className="h-11 border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="fixed">Fixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-1 space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Effective Date</Label>
                  <div className="relative">
                    <Input className="h-11 pl-10 border-slate-200" defaultValue="Wed, Apr 1, 2026" />
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <button className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500">
                      <Calendar className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <button className="flex items-center gap-2 text-sm text-blue-500 hover:underline">
                <Plus className="h-4 w-4" />
                Add note
              </button>

              <div className="pt-8 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-normal text-slate-800">Pay rate history</h3>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-[10px] bg-blue-50 text-blue-500 px-2 py-0.5 rounded font-bold">
                      <div className="flex items-center scale-75">
                        <span className="font-bold italic tracking-tighter">7</span>
                        <span className="font-bold tracking-tighter italic">Hubstaff</span>
                      </div>
                      PEOPLE
                    </div>
                    <Badge className="bg-blue-100 text-blue-600 border-none text-[9px] font-bold py-0 h-4">BETA</Badge>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow className="border-b-0 hover:bg-transparent">
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest px-0">Status</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest">-</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest">Rate</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest">Type</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest">Effective Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="border-transparent group">
                      <TableCell className="px-0 py-6 text-sm">Current</TableCell>
                      <TableCell className="py-6 text-sm text-slate-400">-</TableCell>
                      <TableCell className="py-6 text-sm">$0.00</TableCell>
                      <TableCell className="py-6 text-sm">Hourly</TableCell>
                      <TableCell className="py-6 text-sm">Wed, Apr 1, 2026</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        {/* WORK TIME & LIMITS TAB */}
        {activeTab === "worktime" && (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div className="flex items-center gap-3">
              <Switch id="use-shifts" />
              <Label htmlFor="use-shifts" className="text-sm font-medium">Use shifts to set work allowance limits</Label>
            </div>

            <div className="grid gap-12 md:grid-cols-2">
              <div className="space-y-10">
                <div className="space-y-4">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Weekly Work Days</Label>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Set the week days members are expected to work. You can also set which days members are not allowed to track time.
                  </p>
                  <div className="space-y-4">
                    <p className="text-sm">Expected work days: <span className="font-medium text-slate-900">Mon - Fri</span></p>
                    <div className="flex gap-4">
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => {
                        const isWeekend = day === "Sat" || day === "Sun"
                        return (
                          <div key={day} className="flex flex-col items-center gap-2">
                            <button
                              className={cn(
                                "h-11 w-11 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                                isWeekend
                                  ? "bg-white border border-slate-200 text-slate-400 hover:border-slate-400"
                                  : "bg-blue-500 text-white shadow-md active:scale-95"
                              )}
                            >
                              {day}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <Switch id="disable-specific-days" />
                  <Label htmlFor="disable-specific-days" className="text-sm font-medium">Disable time tracking on specific days</Label>
                </div>
              </div>

              <div className="space-y-10">
                {/* Expected Weekly Hours */}
                <div className="space-y-4">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Expected weekly work hours</Label>
                  <p className="text-xs text-slate-500">Set the hours members are expected to work weekly</p>
                  <div className="flex gap-3 items-center">
                    <div className="flex-1 flex">
                      <Input className="rounded-r-none h-11 border-r-0 border-slate-200" defaultValue="40" />
                      <div className="flex items-center justify-center px-4 border rounded-r-md bg-slate-50 text-slate-500 text-sm whitespace-nowrap border-slate-200">hrs/wk</div>
                    </div>
                  </div>
                  <button className="text-xs text-blue-500 hover:underline">Remove</button>
                </div>

                {/* Weekly Limit */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Weekly limit</Label>
                    <HelpCircle className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-slate-500">Set the hours members are allowed to work weekly</p>
                  <div className="flex gap-3 items-center">
                    <div className="flex-1 flex">
                      <Input className="rounded-r-none h-11 border-r-0 border-slate-200" defaultValue="40" />
                      <div className="flex items-center justify-center px-4 border rounded-r-md bg-slate-50 text-slate-500 text-sm whitespace-nowrap border-slate-200">hrs/wk</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-slate-400 uppercase tracking-tight font-medium">40:00 hours per week</p>
                    <button className="text-[10px] text-blue-500 hover:underline">Remove</button>
                  </div>
                  <div className="pt-2 space-y-3">
                    <div className="flex justify-between items-end">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">This week</p>
                      <button className="text-[10px] text-blue-500 hover:underline">Edit limit</button>
                    </div>
                    <div className="flex gap-3 items-center">
                      <div className="text-[11px] font-medium min-w-[70px] text-slate-600">0:00 / 40:00</div>
                      <Progress value={0} className="h-2 bg-slate-100" />
                    </div>
                  </div>
                </div>

                {/* Daily Limit */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Daily limit</Label>
                    <HelpCircle className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-slate-500">Set the hours members are allowed to work daily</p>
                  <div className="flex gap-3 items-center">
                    <div className="flex-1 flex">
                      <Input className="rounded-r-none h-11 border-r-0 border-slate-200" defaultValue="8" />
                      <div className="flex items-center justify-center px-4 border rounded-r-md bg-slate-50 text-slate-500 text-sm whitespace-nowrap border-slate-200">hrs/day</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-slate-400 uppercase tracking-tight font-medium">8:00 hours per day</p>
                    <button className="text-[10px] text-blue-500 hover:underline">Remove</button>
                  </div>
                  <div className="pt-2 space-y-3">
                    <div className="flex justify-between items-end">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Today</p>
                      <button className="text-[10px] text-blue-500 hover:underline">Edit limit</button>
                    </div>
                    <div className="flex gap-3 items-center">
                      <div className="text-[11px] font-medium min-w-[70px] text-slate-600">0:00 / 8:00</div>
                      <Progress value={0} className="h-2 bg-slate-100" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === "settings" && (
          <div className="space-y-12 animate-in fade-in duration-500 max-w-3xl">
            {/* Time Tracking Settings Section */}
            <div className="space-y-8">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                <h2 className="text-lg font-medium text-slate-800">Time tracking settings</h2>
              </div>

              <div className="space-y-10">
                {/* Tracking Permissions */}
                <div className="space-y-4">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tracking Permissions</Label>
                  <div className="flex items-center gap-3">
                    <Switch id="tracking-permission" defaultChecked className="data-[state=checked]:bg-black" />
                    <Label htmlFor="tracking-permission" className="text-sm font-medium text-slate-700">Able to track time</Label>
                  </div>
                </div>

                {/* Keep Idle Time */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Keep Idle Time</Label>
                    <HelpCircle className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <ToggleGroup type="single" defaultValue="prompt" className="justify-start border border-slate-200 rounded-md overflow-hidden bg-white w-fit">
                    <ToggleGroupItem value="prompt" className="px-8 border-r border-slate-200 rounded-none data-[state=on]:bg-slate-50 transition-all font-medium py-2 text-sm">Prompt</ToggleGroupItem>
                    <ToggleGroupItem value="always" className="px-8 border-r border-slate-200 rounded-none data-[state=on]:bg-slate-50 transition-all font-medium py-2 text-sm">Always</ToggleGroupItem>
                    <ToggleGroupItem value="never" className="px-8 rounded-none data-[state=on]:bg-slate-50 transition-all font-medium py-2 text-sm">Never</ToggleGroupItem>
                  </ToggleGroup>
                </div>

                {/* Idle Timeout */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Idle Timeout</Label>
                    <HelpCircle className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <div className="w-[300px]">
                    <Select defaultValue="20">
                      <SelectTrigger className="h-12 bg-white border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 mins</SelectItem>
                        <SelectItem value="10">10 mins</SelectItem>
                        <SelectItem value="20">20 mins</SelectItem>
                        <SelectItem value="30">30 mins</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Modify Time */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Modify time (manual time)</Label>
                    <HelpCircle className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <div className="flex items-center gap-12">
                    <ToggleGroup type="single" defaultValue="add-edit" className="justify-start border border-slate-200 rounded-full overflow-hidden bg-white w-fit p-0.5">
                      <ToggleGroupItem value="add-edit" className="rounded-full px-6 py-2 data-[state=on]:bg-slate-50 transition-all font-medium text-sm">Add & Edit</ToggleGroupItem>
                      <ToggleGroupItem value="off" className="rounded-full px-6 py-2 data-[state=on]:bg-slate-50 transition-all font-medium text-sm">Off</ToggleGroupItem>
                    </ToggleGroup>
                    <div className="flex items-center gap-3">
                      <Switch id="require-approval-settings" className="data-[state=checked]:bg-black opacity-40" disabled />
                      <Label htmlFor="require-approval-settings" className="flex items-center gap-2 text-sm font-medium text-slate-400 cursor-not-allowed">
                        Require approval
                        <HelpCircle className="h-3 w-3" />
                        <Badge className="bg-slate-100 text-slate-600 border-none text-[8px] font-bold py-0 h-4">NEW</Badge>
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Project & App Access Section */}
            <div className="space-y-8">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                <h2 className="text-lg font-medium text-slate-800">Project & app access</h2>
              </div>

              <div className="space-y-10">
                {/* Project Access */}
                <div className="space-y-4">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Project Access</Label>
                  <div className="flex items-center gap-3">
                    <Switch id="add-to-projects" className="data-[state=checked]:bg-black opacity-40 text-slate-300" />
                    <Label htmlFor="add-to-projects" className="text-sm font-medium text-slate-600">Add to all new projects</Label>
                  </div>
                </div>

                {/* Allowed Apps */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Allowed apps</Label>
                    <HelpCircle className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <ToggleGroup type="single" defaultValue="desktop" className="justify-start bg-slate-100 p-1 rounded-full w-fit">
                    <ToggleGroupItem value="all" className="rounded-full px-6 py-2 text-xs data-[state=on]:bg-white data-[state=on]:shadow-sm">All apps</ToggleGroupItem>
                    <ToggleGroupItem value="desktop" className="rounded-full px-8 py-2 text-xs data-[state=on]:bg-white data-[state=on]:shadow-sm">Desktop only</ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab !== "info" && activeTab !== "employment" && activeTab !== "roles" && activeTab !== "pay" && activeTab !== "worktime" && activeTab !== "settings" && (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">
              {tabs.find((t) => t.id === activeTab)?.label} content coming soon
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
