"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { User, Briefcase, CreditCard, Calendar, MapPin, Building, Shield, ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"

import { IOrganization_member, IRfidCard } from "@/interface"
import {
    updateOrganizationMember,
} from "@/action/members"
import { createRfidCard, updateRfidCard } from "@/action/rfid_card"
import { useGroups } from "@/hooks/use-groups"
import { usePositions } from "@/hooks/use-positions"
import { CARD_TYPE_OPTIONS } from "@/constants"
import { useQuery } from "@tanstack/react-query"
import { getOrgRoles } from "@/lib/rbac"

interface MemberEditFormProps {
    initialValues: Partial<IOrganization_member>
    rfidInitial?: Partial<IRfidCard>
}

const MemberFormSchema = z.object({
    // Employment Info
    department_id: z.string().min(1, "Department is required"),
    position_id: z.string().min(1, "Position is required"),
    role_id: z.string().min(1, "Role is required"),
    is_active: z.boolean(),
    contract_type: z.string().optional(),
    hire_date: z.string().optional(),
    probation_end_date: z.string().optional(),
    work_location: z.string().optional(),
    
    // RFID Info (optional)
    card_number: z.string().optional(),
    card_type: z.string().optional(),
})

type FormValues = z.infer<typeof MemberFormSchema>

export default function MemberEditFormImproved({
    initialValues,
    rfidInitial,
}: MemberEditFormProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [loading, setLoading] = React.useState(false)
    const [activeTab, setActiveTab] = React.useState("employment")
    
    // Use React Query hooks
    const { data: departments = [], isLoading: departmentsLoading } = useGroups()
    const { data: positions = [], isLoading: positionsLoading } = usePositions()
    
    // Fetch organization roles
    const { data: roles = [], isLoading: rolesLoading } = useQuery({
        queryKey: ['org-roles'],
        queryFn: getOrgRoles,
    })
    
    // Get user profile info
    const userProfile = initialValues.user as any
    const fullName = [
        userProfile?.first_name,
        userProfile?.userProfile?.last_name
    ].filter(Boolean).join(' ')
    
    const form = useForm<FormValues>({
        resolver: zodResolver(MemberFormSchema),
        defaultValues: {
            department_id: String(initialValues.department_id ?? ""),
            position_id: String(initialValues.position_id ?? ""),
            role_id: String(initialValues.role_id ?? ""),
            is_active: initialValues.is_active ?? true,
            contract_type: initialValues.contract_type ?? "",
            hire_date: initialValues.hire_date ?? "",
            probation_end_date: initialValues.probation_end_date ?? "",
            work_location: initialValues.work_location ?? "",
            card_number: rfidInitial?.card_number || ((initialValues as any)?.rfid_cards?.card_number) || "",
            card_type: rfidInitial?.card_type || ((initialValues as any)?.rfid_cards?.card_type) || "",
        },
    })

    const onSubmit = async (values: FormValues) => {
        if (!initialValues.id) {
            toast.error("Member ID is missing")
            return
        }

        try {
            setLoading(true)

            // Update organization member  
            const memberData: Partial<IOrganization_member> = {
                department_id: values.department_id,
                position_id: values.position_id,
                role_id: values.role_id,
                is_active: values.is_active,
                contract_type: values.contract_type || undefined,
                hire_date: values.hire_date || initialValues.hire_date || new Date().toISOString().split('T')[0],
                probation_end_date: values.probation_end_date || undefined,
                work_location: values.work_location || undefined,
            }

            const memberRes = await updateOrganizationMember(String(initialValues.id), memberData)

            if (!memberRes.success) {
                throw new Error(memberRes.message || "Failed to update member")
            }

            // Handle RFID card if provided
            if (values.card_number && values.card_number.trim() !== "") {
                const rfidData = {
                    organization_member_id: initialValues.id,
                    card_number: values.card_number,
                    card_type: values.card_type || "rfid",
                    is_active: true,
                }

                if (rfidInitial?.id) {
                    await updateRfidCard(String(rfidInitial.id), rfidData)
                } else {
                    await createRfidCard(rfidData)
                }
            }

            toast.success("Member updated successfully")
            await queryClient.invalidateQueries({ queryKey: ["members"] })
            router.push("/members")
            router.refresh()
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Unknown error"
            toast.error(msg)
        } finally {
            setLoading(false)
        }
    }

    const isLoading = departmentsLoading || positionsLoading || rolesLoading

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push("/members")}
                            className="shrink-0"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Edit Member</h2>
                            <p className="text-sm text-muted-foreground">
                                Update employment and access information
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Member Info Card */}
            <Card className="border-2">
                <CardContent className="pt-4 sm:pt-6">
                    <div className="flex flex-col items-center text-center gap-3 sm:gap-4">
                        <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                        </div>
                        <div className="space-y-1 sm:space-y-2">
                            <h3 className="text-lg sm:text-xl font-semibold">{fullName || "N/A"}</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              {userProfile?.email && !userProfile.email.toLowerCase().endsWith('@dummy.local') 
                                ? userProfile.email 
                                : ''}
                            </p>
                            <div className="flex gap-2 justify-center mt-3">
                                {initialValues.employee_id && (
                                    <Badge variant="secondary">
                                        ID: {initialValues.employee_id}
                                    </Badge>
                                )}
                                <Badge variant={initialValues.is_active ? "default" : "destructive"}>
                                    {initialValues.is_active ? "Active" : "Inactive"}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Form Tabs */}
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="employment" className="gap-1 sm:gap-2 text-xs sm:text-sm">
                                <Briefcase className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="hidden xs:inline sm:inline">Employment Info</span>
                                <span className="xs:hidden sm:hidden">Info</span>
                            </TabsTrigger>
                            <TabsTrigger value="access" className="gap-1 sm:gap-2 text-xs sm:text-sm">
                                <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="hidden xs:inline sm:inline">Access Control</span>
                                <span className="xs:hidden sm:hidden">Access</span>
                            </TabsTrigger>
                        </TabsList>

                        {/* Employment Info Tab */}
                        <TabsContent value="employment" className="space-y-6 mt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Building className="h-5 w-5" />
                                        Department, Position & Role
                                    </CardTitle>
                                    <CardDescription>
                                        Assign department, position, and role for this member
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="department_id"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Department *</FormLabel>
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        value={field.value}
                                                        disabled={isLoading}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select department" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {departments.map((dept: any) => (
                                                                <SelectItem key={dept.id} value={String(dept.id)}>
                                                                    {dept.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="position_id"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Position *</FormLabel>
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        value={field.value}
                                                        disabled={isLoading}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select position" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {positions.map((pos: any) => (
                                                                <SelectItem key={pos.id} value={String(pos.id)}>
                                                                    {pos.title}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="role_id"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Role *</FormLabel>
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        value={field.value}
                                                        disabled={isLoading}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select role" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {roles.map((role: any) => {
                                                                const isAdmin = role.code === "A001"
                                                                return (
                                                                    <SelectItem key={role.id} value={String(role.id)}>
                                                                        <div className="flex items-center gap-2">
                                                                            {isAdmin ? (
                                                                                <Shield className="h-3 w-3" />
                                                                            ) : (
                                                                                <User className="h-3 w-3" />
                                                                            )}
                                                                            {role.name}
                                                                        </div>
                                                                    </SelectItem>
                                                                )
                                                            })}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormDescription className="text-xs">
                                                        Admin Organisasi: full access, User: limited
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Calendar className="h-5 w-5" />
                                        Employment Details
                                    </CardTitle>
                                    <CardDescription>
                                        Employment status and important dates
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="is_active"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                    <div className="space-y-0.5">
                                                        <FormLabel className="text-base">Employment Status</FormLabel>
                                                        <FormDescription>
                                                            {field.value ? "Member is Active" : "Member is Inactive"}
                                                        </FormDescription>
                                                    </div>
                                                    <FormControl>
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="contract_type"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Contract Type</FormLabel>
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        value={field.value}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select contract type" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="permanent">Permanent</SelectItem>
                                                            <SelectItem value="contract">Contract</SelectItem>
                                                            <SelectItem value="temporary">Temporary</SelectItem>
                                                            <SelectItem value="internship">Internship</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="work_location"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Work Location</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                            <Input
                                                                placeholder="e.g., Main Office"
                                                                className="pl-9"
                                                                {...field}
                                                            />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="hire_date"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Hire Date</FormLabel>
                                                    <FormControl>
                                                        <Input type="date" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="probation_end_date"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Probation End Date</FormLabel>
                                                    <FormControl>
                                                        <Input type="date" {...field} />
                                                    </FormControl>
                                                    <FormDescription>
                                                        Leave empty if not applicable
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Access Control Tab */}
                        <TabsContent value="access" className="space-y-6 mt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Shield className="h-5 w-5" />
                                        RFID Access Card
                                    </CardTitle>
                                    <CardDescription>
                                        Manage RFID card for attendance and access control
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="card_number"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <div className="flex items-center gap-2">
                                                        <FormLabel>Card Number</FormLabel>
                                                        <span className="text-xs text-muted-foreground">
                                                            - Unique identifier on the RFID card
                                                        </span>
                                                    </div>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                            <Input
                                                                placeholder="Enter RFID card number"
                                                                className="pl-9 font-mono"
                                                                {...field}
                                                            />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="card_type"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Card Type</FormLabel>
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        value={field.value}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select type" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {CARD_TYPE_OPTIONS.map((option) => (
                                                                <SelectItem key={option.value} value={option.value}>
                                                                    {option.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {rfidInitial?.id && (
                                        <div className="rounded-lg bg-muted p-4">
                                            <p className="text-sm text-muted-foreground">
                                                <strong>Current Card Status:</strong> Active
                                            </p>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                <strong>Registered:</strong> Card is linked to this member
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    <Separator />

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push("/members")}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : "Save"}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    )
}
