"use client"

import React, { useState, useEffect, use } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import {
  Mail,
  ChevronDown,
  Info,
  ExternalLink,
  Calendar,
  Globe,
  Plus,
  HelpCircle,
  Search,
} from "lucide-react"

interface ICountry {
  code: string;
  name: string;
  phone: string;
}

import staticCountries from "@/lib/countries.json"

import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/profile&image/user-avatar"
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogHeader, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useProfilePhotoUrl } from "@/hooks/use-profile"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import {
  getOrganizationMembersById,
  updateMemberInfo,
  updateMemberEmployment,
  updateMemberRole,
  getDepartmentsList,
  getPositionsList,
} from "@/action/members"
import { getAllRole } from "@/action/role"
import { getProjectNames } from "@/action/projects"
import { getTeams } from "@/action/teams"
import { requestPasswordReset } from "@/action/users"
import { PageSkeleton } from "@/components/ui/loading-skeleton"
import { toast } from "sonner"
import type { IRole } from "@/interface"

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

  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [resetConfirmText, setResetConfirmText] = useState("")

  const handleResetPassword = async () => {
    const emailToReset = member?.user?.email || (member as any)?.biodata?.email
    if (!emailToReset) {
      toast.error("No email registered for this member.")
      return
    }

    setIsResetting(true)
    try {
      const fd = new FormData()
      fd.append("email", emailToReset)
      const res = await requestPasswordReset(fd)
      if (res.success) {
        toast.success(res.message || "Password reset email sent.")
        setIsResetPasswordOpen(false)
        setResetConfirmText("")
      } else {
        toast.error(res.message || "Failed to send password reset email.")
      }
    } catch (error) {
      toast.error("An unexpected error occurred.")
    } finally {
      setIsResetting(false)
    }
  }

  const [isSaving, setIsSaving] = useState(false)
  const [member, setMember] = useState<IOrganization_member | null>(null)
  const [loading, setLoading] = useState(true)
  const [allCountries, setAllCountries] = useState<ICountry[]>(staticCountries)
  const [phoneSearch, setPhoneSearch] = useState("")
  const [mobileSearch, setMobileSearch] = useState("")
  const [phoneOpen, setPhoneOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Dropdown data from DB
  const [allRoles, setAllRoles] = useState<IRole[]>([])
  const [allDepartments, setAllDepartments] = useState<{ id: string; name: string }[]>([])
  const [allPositions, setAllPositions] = useState<{ id: string; title: string }[]>([])
  const [allProjects, setAllProjects] = useState<{ id: number; name: string }[]>([])
  const [allTeams, setAllTeams] = useState<{ id: number; name: string }[]>([])

  // Form state - Info tab
  const [formData, setFormData] = useState({
    phone: "",
    phone_code: "",
    mobile: "",
    mobile_code: "",
    employee_id: "",
    dob_day: "",
    dob_month: "",
    dob_year: "",
    home_location: "",
    personal_email: "",
  })

  // Form state - Employment tab
  const [employmentData, setEmploymentData] = useState({
    department_id: "",
    position_id: "",
    contract_type: "",
    work_location: "",
    hire_date: "",
    termination_date: "",
    tax_id_number: "",
    tax_type: "",
    account_code: "",
    employment_comments: "",
  })

  // Form state - Roles tab
  const [selectedRoleId, setSelectedRoleId] = useState<string>("")

  // Fetch Countries from RestCountries API (with Static Fallback)
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await fetch("https://restcountries.com/v3.1/all?fields=name,cca2,idd")
        if (!res.ok) throw new Error("API responded with error")
        const data = await res.json()
        const mapped = data.flatMap((c: any) => {
          if (!c.idd || !c.idd.root) return []
          const root = c.idd.root
          const suffixes = c.idd.suffixes && c.idd.suffixes.length > 0 ? c.idd.suffixes : [""]
          return [{
            code: c.cca2.toLowerCase(),
            name: c.name.common,
            phone: (root + suffixes[0]).replace('+', '')
          }]
        }).sort((a: ICountry, b: ICountry) => a.name.localeCompare(b.name))
        
        if (mapped.length > 0) {
          setAllCountries(mapped)
        }
      } catch (err) {
        console.warn("Failed to fetch from restcountries.com, using offline JSON fallback.", err)
        // Sudah ada staticCountries sebagai default value, jadi aman
      }
    }
    fetchCountries()
  }, [])

  // Detect Geo IP
  useEffect(() => {
    const detectGeo = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/")
        const data = await res.json()
        if (data.country_calling_code) {
          const code = data.country_calling_code.replace("+", "")
          setFormData(prev => ({
            ...prev,
            phone_code: prev.phone_code || code,
            mobile_code: prev.mobile_code || code
          }))
        }
      } catch (err) {
        console.error("Geo detection failed", err)
      }
    }
    detectGeo()
  }, [])

  // Fetch Member Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const memberRes = await getOrganizationMembersById(id)

        if (memberRes && memberRes.success && memberRes.data) {
          const m = memberRes.data as unknown as IOrganization_member
          setMember(m)
          const u = m.user as any

          let parsedPhoneCode = u?.phone_code?.replace('+', '') || ""
          if (parsedPhoneCode === "--" || !parsedPhoneCode) parsedPhoneCode = ""

          let parsedMobileCode = u?.mobile_code?.replace('+', '') || ""
          if (parsedMobileCode === "--" || !parsedMobileCode) parsedMobileCode = ""

          // Parse date_of_birth
          let dobDay = "", dobMonth = "", dobYear = ""
          if (u?.date_of_birth) {
            const dob = new Date(u.date_of_birth)
            if (!isNaN(dob.getTime())) {
              dobDay = String(dob.getDate())
              dobMonth = String(dob.getMonth() + 1)
              dobYear = String(dob.getFullYear())
            }
          }

          setFormData(prev => ({
            ...prev,
            phone: u?.phone || "",
            phone_code: parsedPhoneCode || prev.phone_code,
            mobile: u?.mobile || "",
            mobile_code: parsedMobileCode || prev.mobile_code,
            employee_id: m.employee_id || "",
            dob_day: dobDay,
            dob_month: dobMonth,
            dob_year: dobYear,
            home_location: u?.home_location || "",
            personal_email: u?.personal_email || "",
          }))

          setEmploymentData({
            department_id: String(m.department_id || ""),
            position_id: String(m.position_id || ""),
            contract_type: m.contract_type || "",
            work_location: m.work_location || "",
            hire_date: m.hire_date || "",
            termination_date: m.termination_date || "",
            tax_id_number: m.tax_id_number || "",
            tax_type: m.tax_type || "",
            account_code: m.account_code || "",
            employment_comments: "",
          })

          // Set current role
          const currentRoleId = m.role?.id || m.role_id || ""
          setSelectedRoleId(String(currentRoleId))

          // Fetch dropdown data using organization_id from member
          const orgId = String(m.organization_id)
          const [rolesRes, deptRes, posRes, projRes, teamsRes] = await Promise.all([
            getAllRole(),
            getDepartmentsList(orgId),
            getPositionsList(orgId),
            getProjectNames(Number(orgId)),
            getTeams(Number(orgId)),
          ])

          if (rolesRes.success) setAllRoles(rolesRes.data)
          if (deptRes.success) setAllDepartments(deptRes.data)
          if (posRes.success) setAllPositions(posRes.data)
          if (projRes.success) setAllProjects(projRes.data)
          if (teamsRes.success) setAllTeams(teamsRes.data as { id: number; name: string }[])

        } else {
          toast.error(`Fetch failed for ID ${id}: ${memberRes.message || 'Unknown error'}`)
        }
      } catch (error) {
        console.error("Failed to fetch member data", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])


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
    if (!member) return
    setIsSaving(true)
    try {
      if (activeTab === "info") {
        // Build date_of_birth string
        let date_of_birth: string | undefined = undefined
        if (formData.dob_year && formData.dob_month && formData.dob_day) {
          const m = formData.dob_month.padStart(2, "0")
          const d = formData.dob_day.padStart(2, "0")
          date_of_birth = `${formData.dob_year}-${m}-${d}`
        }
        const res = await updateMemberInfo(member.id, member.user_id, {
          employee_id: formData.employee_id || undefined,
          phone: formData.phone || undefined,
          phone_code: formData.phone_code || undefined,
          mobile: formData.mobile || undefined,
          mobile_code: formData.mobile_code || undefined,
          home_location: formData.home_location || undefined,
          personal_email: formData.personal_email || undefined,
          date_of_birth,
        })

        // Also update work_location in organization_members since it's in the Contact section
        await updateMemberEmployment(member.id, {
          work_location: employmentData.work_location || null
        })
        if (res.success) {
          toast.success("Info saved successfully")
          // Update local updated_at to reflect the save time
          setMember(prev => {
            if (!prev || !prev.user) return prev;
            return {
              ...prev,
              user: {
                ...prev.user,
                updated_at: new Date().toISOString()
              }
            };
          });
        }
        else toast.error(res.message || "Failed to save info")
      } else if (activeTab === "employment") {
        const res = await updateMemberEmployment(member.id, {
          department_id: employmentData.department_id || null,
          position_id: employmentData.position_id || null,
          contract_type: employmentData.contract_type || null,
          work_location: employmentData.work_location || null,
          hire_date: employmentData.hire_date || null,
          termination_date: employmentData.termination_date || null,
          tax_id_number: employmentData.tax_id_number || null,
          tax_type: employmentData.tax_type || null,
          account_code: employmentData.account_code || null,
          employment_status: member.employment_status || null,
          employment_comments: employmentData.employment_comments || null,
        })
        if (res.success) toast.success("Employment data saved successfully")
        else toast.error(res.message || "Failed to save employment data")
      } else if (activeTab === "roles") {
        if (!selectedRoleId) { toast.error("Please select a role"); return }
        const res = await updateMemberRole(String(member.id), selectedRoleId)
        if (res.success) toast.success("Role updated successfully")
        else toast.error(res.message || "Failed to update role")
      }
    } catch (err) {
      toast.error("An unexpected error occurred")
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
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => router.push(`/settings/work-time-limit`)}>
                    Manage Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setIsResetPasswordOpen(true); }}>
                    Reset Password
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Dialog open={isResetPasswordOpen} onOpenChange={(open) => { setIsResetPasswordOpen(open); if(!open) setResetConfirmText(""); }}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reset Password</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to send a password reset email? The link will be sent to <strong>{member?.user?.email || (member as any)?.biodata?.email || "this member's email"}</strong>.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-2">
                    <Label className="text-sm font-medium text-slate-700 mb-2 block">
                      Type <span className="font-bold text-black border border-slate-200 px-1.5 py-0.5 rounded bg-slate-50">RESET</span> to confirm
                    </Label>
                    <Input
                      value={resetConfirmText}
                      onChange={(e) => setResetConfirmText(e.target.value)}
                      placeholder="Type RESET"
                      className="border-slate-300"
                    />
                  </div>
                  <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => setIsResetPasswordOpen(false)} disabled={isResetting}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleResetPassword} 
                      disabled={isResetting || resetConfirmText !== "RESET"} 
                      className="bg-black hover:bg-slate-800 text-white transition-opacity data-[disabled]:opacity-50"
                    >
                      {isResetting ? "Sending..." : "Send Reset Email"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button className="bg-black hover:bg-slate-800 text-white h-10 px-6 rounded-md transition-colors shadow-sm" onClick={handleSave} disabled={isSaving}>
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
                    value={formData.employee_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, employee_id: e.target.value }))}
                    placeholder="No employee ID"
                    className="w-full"
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
                  <Input disabled placeholder="-" className="bg-slate-50 border-slate-200 text-slate-500" />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2 mt-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">BIRTHDAY</Label>
                  <div className="flex gap-3">
                    <Select value={formData.dob_month} onValueChange={(v) => setFormData(prev => ({ ...prev, dob_month: v }))}>
                      <SelectTrigger className="w-full h-11 border-slate-200">
                        <SelectValue placeholder="Month" />
                      </SelectTrigger>
                      <SelectContent>
                        {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m, i) => (
                          <SelectItem key={i+1} value={String(i+1)}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={formData.dob_day} onValueChange={(v) => setFormData(prev => ({ ...prev, dob_day: v }))}>
                      <SelectTrigger className="w-full h-11 border-slate-200">
                        <SelectValue placeholder="Day" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 31 }, (_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>{i + 1}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={formData.dob_year} onValueChange={(v) => setFormData(prev => ({ ...prev, dob_year: v }))}>
                      <SelectTrigger className="w-full h-11 border-slate-200">
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 100 }, (_, i) => (
                          <SelectItem key={2026 - i} value={(2026 - i).toString()}>{2026 - i}</SelectItem>
                        ))}
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
                    value={member?.user?.updated_at ? new Date(member.user.updated_at).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    }) : "-"} 
                    readOnly 
                    disabled 
                    className="bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed" 
                  />
                </div>
              </div>


            </div>

            {/* Contact Section */}
            <div className="space-y-6 pt-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h2 className="text-lg font-medium text-slate-800">Contact</h2>
              </div>

              <div className="grid gap-12 md:grid-cols-2">
                <div className="space-y-8">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between h-5">
                      <div className="flex items-center gap-1">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">WORK ADDRESS</Label>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </div>
                    <Input 
                      placeholder="No address" 
                      className="h-11 border-slate-200"
                      value={employmentData.work_location}
                      onChange={(e) => setEmploymentData(prev => ({ ...prev, work_location: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between h-5">
                      <div className="flex items-center gap-1">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">WORK EMAIL</Label>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </div>
                    <Input defaultValue={email} className="h-11 border-slate-200 text-slate-500 bg-white" disabled />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between h-5">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">WORK PHONE</Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <DropdownMenu open={phoneOpen} onOpenChange={setPhoneOpen}>
                        <DropdownMenuTrigger asChild>
                          <div className="flex items-center gap-2 h-11 px-3 border border-slate-200 rounded-md bg-white hover:bg-slate-50 cursor-pointer transition-all active:scale-[0.98]">
                            <img
                              src={`https://flagcdn.com/w20/${(allCountries.find(c => c.phone === formData.phone_code)?.code || "us").toLowerCase()}.png`}
                              alt="Flag"
                              className="h-3 w-5 object-cover"
                              onError={(e) => { e.currentTarget.src = "https://flagcdn.com/w20/us.png" }}
                            />
                            <ChevronDown className="h-3 w-3 text-slate-400" />
                            <span className="text-sm">+{formData.phone_code || "1"}</span>
                          </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-[280px] p-0 shadow-xl border-slate-200">
                          <div className="p-2 border-b bg-slate-50/50 sticky top-0 z-10">
                            <div className="relative">
                              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                              <Input
                                placeholder="Search country or code..."
                                className="pl-9 h-9 text-xs border-slate-200 focus-visible:ring-slate-200"
                                value={phoneSearch}
                                onChange={(e) => setPhoneSearch(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>
                          <div className="max-h-[300px] overflow-y-auto py-1 custom-scrollbar">
                            {allCountries
                              .filter(c =>
                                c.name.toLowerCase().includes(phoneSearch.toLowerCase()) ||
                                c.phone.includes(phoneSearch)
                              )
                              .map((c) => (
                                <DropdownMenuItem
                                  key={c.code}
                                  className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-50 focus:bg-slate-50"
                                  onSelect={(e) => e.preventDefault()}
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, phone_code: c.phone }))
                                    setPhoneSearch("")
                                    setPhoneOpen(false)
                                  }}
                                >
                                  <img src={`https://flagcdn.com/w20/${c.code.toLowerCase()}.png`} alt={c.name} className="h-3 w-5" />
                                  <span className="flex-1 text-sm text-slate-700">{c.name}</span>
                                  <span className="text-xs text-slate-400 font-medium">+{c.phone}</span>
                                </DropdownMenuItem>
                              ))}
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Input 
                        placeholder="201-555-0123" 
                        className="h-11 border-slate-200" 
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between h-5">
                      <div className="flex items-center gap-1">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">HOME ADDRESS</Label>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </div>
                    <Input 
                      placeholder="Search for an address" 
                      className="h-11 border-slate-200" 
                      value={formData.home_location}
                      onChange={(e) => setFormData(prev => ({ ...prev, home_location: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between h-5">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">PERSONAL EMAIL</Label>
                    </div>
                    <Input 
                      placeholder="name@example.com" 
                      className="h-11 border-slate-200"
                      value={formData.personal_email}
                      onChange={(e) => setFormData(prev => ({ ...prev, personal_email: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between h-5">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">PERSONAL PHONE (MOBILE)</Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <DropdownMenu open={mobileOpen} onOpenChange={setMobileOpen}>
                        <DropdownMenuTrigger asChild>
                          <div className="flex items-center gap-2 h-11 px-3 border border-slate-200 rounded-md bg-white hover:bg-slate-50 cursor-pointer transition-all active:scale-[0.98]">
                            <img
                              src={`https://flagcdn.com/w20/${(allCountries.find(c => c.phone === formData.mobile_code)?.code || "us").toLowerCase()}.png`}
                              alt="Flag"
                              className="h-3 w-5 object-cover"
                              onError={(e) => { e.currentTarget.src = "https://flagcdn.com/w20/us.png" }}
                            />
                            <ChevronDown className="h-3 w-3 text-slate-400" />
                            <span className="text-sm">+{formData.mobile_code || "1"}</span>
                          </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-[280px] p-0 shadow-xl border-slate-200">
                          <div className="p-2 border-b bg-slate-50/50 sticky top-0 z-10">
                            <div className="relative">
                              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                              <Input
                                placeholder="Search country or code..."
                                className="pl-9 h-9 text-xs border-slate-200 focus-visible:ring-slate-200"
                                value={mobileSearch}
                                onChange={(e) => setMobileSearch(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>
                          <div className="max-h-[300px] overflow-y-auto py-1 custom-scrollbar">
                            {allCountries
                              .filter(c =>
                                c.name.toLowerCase().includes(mobileSearch.toLowerCase()) ||
                                c.phone.includes(mobileSearch)
                              )
                              .map((c) => (
                                <DropdownMenuItem
                                  key={c.code}
                                  className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-50 focus:bg-slate-50"
                                  onSelect={(e) => e.preventDefault()}
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, mobile_code: c.phone }))
                                    setMobileSearch("")
                                    setMobileOpen(false)
                                  }}
                                >
                                  <img src={`https://flagcdn.com/w20/${c.code.toLowerCase()}.png`} alt={c.name} className="h-3 w-5" />
                                  <span className="flex-1 text-sm text-slate-700">{c.name}</span>
                                  <span className="text-xs text-slate-400 font-medium">+{c.phone}</span>
                                </DropdownMenuItem>
                              ))}
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Input 
                        placeholder="201-555-0123" 
                        className="h-11 border-slate-200" 
                        value={formData.mobile}
                        onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
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
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">JOB TITLE</Label>
                    <Select value={employmentData.position_id} onValueChange={(v) => setEmploymentData(prev => ({ ...prev, position_id: v }))}>
                      <SelectTrigger className="h-11 border-slate-200">
                        <SelectValue placeholder="Select the job title" />
                      </SelectTrigger>
                      <SelectContent>
                        {allPositions.map(pos => (
                          <SelectItem key={pos.id} value={String(pos.id)}>{pos.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">JOB TYPE</Label>
                    <Select value={employmentData.contract_type} onValueChange={(v) => setEmploymentData(prev => ({ ...prev, contract_type: v }))}>
                      <SelectTrigger className="h-11 border-slate-200">
                        <SelectValue placeholder="Select the job type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full_time">Full Time</SelectItem>
                        <SelectItem value="part_time">Part Time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="internship">Internship</SelectItem>
                        <SelectItem value="freelance">Freelance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">DEPARTMENT</Label>
                    <Select value={employmentData.department_id} onValueChange={(v) => setEmploymentData(prev => ({ ...prev, department_id: v }))}>
                      <SelectTrigger className="h-11 border-slate-200">
                        <SelectValue placeholder="Select the department" />
                      </SelectTrigger>
                      <SelectContent>
                        {allDepartments.map(dept => (
                          <SelectItem key={dept.id} value={String(dept.id)}>{dept.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">WORK LOCATION</Label>
                    <Select value={employmentData.work_location} onValueChange={(v) => setEmploymentData(prev => ({ ...prev, work_location: v }))}>
                      <SelectTrigger className="h-11 border-slate-200">
                        <SelectValue placeholder="Select the workplace model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="office">Office</SelectItem>
                        <SelectItem value="remote">Remote</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Hiring details */}
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-slate-800">Hiring details</h2>
              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">EMPLOYMENT STATUS</Label>
                    <Select value={member.employment_status || ""} onValueChange={(v) => setMember(prev => prev ? { ...prev, employment_status: v } : prev)}>
                      <SelectTrigger className="h-11 border-slate-200">
                        <SelectValue placeholder="Select employment status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="probation">Probation</SelectItem>
                        <SelectItem value="on_leave">On Leave</SelectItem>
                        <SelectItem value="terminated">Terminated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Accounting */}
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-slate-800">Accounting</h2>
              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">TAX INFO</Label>
                    <Input value={employmentData.tax_id_number} onChange={(e) => setEmploymentData(prev => ({ ...prev, tax_id_number: e.target.value }))} placeholder="No tax info" className="h-11 border-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">TAX TYPE</Label>
                    <Input value={employmentData.tax_type} onChange={(e) => setEmploymentData(prev => ({ ...prev, tax_type: e.target.value }))} placeholder="Tax type" className="h-11 border-slate-200" />
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">ACCOUNT CODE</Label>
                    <Input value={employmentData.account_code} onChange={(e) => setEmploymentData(prev => ({ ...prev, account_code: e.target.value }))} placeholder="No account code" className="h-11 border-slate-200" />
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
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">START DATE (HIRE DATE)</Label>
                    <div className="relative">
                      <Input
                        type="date"
                        value={employmentData.hire_date ? employmentData.hire_date.split('T')[0] : ""}
                        onChange={(e) => setEmploymentData(prev => ({ ...prev, hire_date: e.target.value }))}
                        className="h-11 border-slate-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">END DATE</Label>
                    </div>
                    <div className="relative">
                      <Input
                        type="date"
                        value={employmentData.termination_date ? employmentData.termination_date.split('T')[0] : ""}
                        onChange={(e) => setEmploymentData(prev => ({ ...prev, termination_date: e.target.value }))}
                        className="h-11 border-slate-200"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 h-full">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">EMPLOYMENT COMMENTS</Label>
                  <textarea
                    className="w-full h-[calc(100%-28px)] min-h-[150px] p-4 border border-slate-200 rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                    value={employmentData.employment_comments}
                    onChange={(e) => setEmploymentData(prev => ({ ...prev, employment_comments: e.target.value }))}
                    placeholder="Add employment notes..."
                  />
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
              <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                <SelectTrigger className="w-full h-12 border-slate-200 bg-white">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {allRoles.map(role => (
                    <SelectItem key={role.id} value={String(role.id)}>
                      {role.name}
                    </SelectItem>
                  ))}
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
                  </div>
                  <p className="text-xs text-slate-500 mb-2">Able to track time on these projects</p>
                  {allProjects.length > 0 ? (
                    <div className="border border-slate-200 rounded-md divide-y max-h-60 overflow-y-auto">
                      {allProjects.map(proj => (
                        <div key={proj.id} className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700">
                          <div className="w-2 h-2 rounded-full bg-slate-400" />
                          {proj.name}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No projects found</p>
                  )}
                </div>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Teams</Label>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">Member in these teams</p>
                  {allTeams.length > 0 ? (
                    <div className="border border-slate-200 rounded-md divide-y max-h-60 overflow-y-auto">
                      {allTeams.map(team => (
                        <div key={team.id} className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700">
                          <div className="w-2 h-2 rounded-full bg-slate-300" />
                          {team.name}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No teams found</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PAY / BILL TAB */}
        {activeTab === "pay" && (
          <div className="space-y-8 animate-in fade-in duration-500">


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
                    <button className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500">
                      <Calendar className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <button className="flex items-center gap-2 text-sm text-slate-600 hover:underline">
                <Plus className="h-4 w-4" />
                Add note
              </button>

              <div className="pt-8 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-normal text-slate-800">Pay rate history</h3>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                      <div className="flex items-center scale-75">
                        <span className="font-bold italic tracking-tighter">7</span>
                        <span className="font-bold tracking-tighter italic">Hubstaff</span>
                      </div>
                      PEOPLE
                    </div>
                    <Badge className="bg-slate-200 text-slate-800 border-none text-[9px] font-bold py-0 h-4">BETA</Badge>
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
                                  : "bg-black text-white shadow-md active:scale-95"
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
                  <button className="text-xs text-slate-500 hover:underline">Remove</button>
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
                    <button className="text-[10px] text-slate-500 hover:underline">Remove</button>
                  </div>
                  <div className="pt-2 space-y-3">
                    <div className="flex justify-between items-end">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">This week</p>
                      <button className="text-[10px] text-slate-500 hover:underline">Edit limit</button>
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
                    <button className="text-[10px] text-slate-500 hover:underline">Remove</button>
                  </div>
                  <div className="pt-2 space-y-3">
                    <div className="flex justify-between items-end">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Today</p>
                      <button className="text-[10px] text-slate-500 hover:underline">Edit limit</button>
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
                        <Badge className="bg-slate-200 text-slate-800 border-none text-[8px] font-bold py-0 h-4">NEW</Badge>
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
    </div >
  )
}
