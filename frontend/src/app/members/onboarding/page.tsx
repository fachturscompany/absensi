"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { X, Info, Send, ArrowLeft, Users } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Link from "next/link"
import { resendInvitation, getAllInvitations, createInvitation, sendInvitationReminderDirectly } from "@/action/invitations"
import { toast } from "sonner"
import { useQuery } from "@tanstack/react-query"
import { useHydration } from "@/hooks/useHydration"
import { Skeleton } from "@/components/ui/skeleton"

export default function TeamOnboardingPage() {
    const { isHydrated, organizationId } = useHydration()
    const [showOnboarded, setShowOnboarded] = useState(true) // Changed default to true to show all members

    // Fetch invitations
    const { data: invitationsResult, isLoading: loadingInvitations } = useQuery({
        queryKey: ["invitations", organizationId],
        queryFn: () => getAllInvitations(),
        enabled: isHydrated,
    })

    // Fetch members
    const { data: membersResult, isLoading: loadingMembers } = useQuery({
        queryKey: ["members-onboarding", organizationId],
        queryFn: async () => {
            const url = new URL('/api/members', window.location.origin)
            url.searchParams.set('limit', '1000') // Get all members
            url.searchParams.set('active', 'all')
            if (organizationId) url.searchParams.set('organizationId', String(organizationId))
            const res = await fetch(url.toString(), { credentials: 'same-origin' })
            const json = await res.json()
            if (!json?.success) throw new Error(json?.message || 'Failed to fetch members')
            return json
        },
        enabled: isHydrated,
    })

    const invitations = invitationsResult?.data || []
    const members = membersResult?.data || []

    // Combine invitations and members into unified onboarding list
    const onboardingList = React.useMemo(() => {
        const list: any[] = []
        const emailSet = new Set<string>() // Track emails to prevent duplicates

        // Add existing members (already onboarded) - ONLY hans for now
        members.forEach((member: any) => {
            const email = member.email || member.user?.email || ''
            // Only show hans member
            if (email && email.toLowerCase().includes('hans') && !email.endsWith('@dummy.local')) {
                const normalizedEmail = email.toLowerCase()
                if (!emailSet.has(normalizedEmail)) {
                    emailSet.add(normalizedEmail)
                    list.push({
                        id: member.id,
                        email: email,
                        type: 'member',
                        hasCreatedAccount: true,
                        hasDownloadedApp: true, // Assume true for existing members
                        hasTrackedTime: true, // Assume true for existing members
                        isFullyOnboarded: true
                    })
                }
            }
        })


        // Add invitations (but skip if email already exists from members)
        invitations.forEach((inv: any) => {
            const normalizedEmail = inv.email.toLowerCase()
            if (!emailSet.has(normalizedEmail)) {
                emailSet.add(normalizedEmail)
                const hasCreatedAccount = inv.status === "accepted" || !!inv.user_id
                list.push({
                    id: inv.id,
                    email: inv.email,
                    type: 'invitation',
                    status: inv.status, // Track invitation status
                    hasCreatedAccount: hasCreatedAccount,
                    hasDownloadedApp: hasCreatedAccount && (Math.random() > 0.5), // Mock for now
                    hasTrackedTime: hasCreatedAccount && (Math.random() > 0.5), // Mock for now
                    isFullyOnboarded: inv.status === "accepted" && inv.user_id,
                    invitationData: inv
                })
            }
        })

        return list
    }, [members, invitations])

    // Filter based on toggle
    const filteredList = showOnboarded
        ? onboardingList
        : onboardingList.filter((item: any) => !item.isFullyOnboarded)

    const handleSendReminder = async (id: string, email: string) => {
        try {
            const result = await resendInvitation(id);
            if (result.success) {
                toast.success(`Reminder sent to ${email}`);
            } else {
                toast.error(result.message || "Failed to send reminder");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    }

    // New: Send reminder for accepted invitations (bypass resend validation)
    const handleSendReminderForAccepted = async (email: string) => {
        try {
            // Send email directly without creating new invitation
            const result = await sendInvitationReminderDirectly(email);
            if (result.success) {
                toast.success(`Reminder sent to ${email}`);
            } else {
                toast.error(result.message || "Failed to send reminder");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    }


    const handleSendInvitation = async (email: string) => {
        try {
            // For fully onboarded members, always create new invitation
            const result = await createInvitation({ email });
            if (result.success) {
                toast.success(`Invitation sent to ${email}`);
            } else {
                toast.error(result.message || "Failed to send invitation");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    }

    if (!isHydrated || loadingInvitations || loadingMembers) {
        return (
            <div className="p-6 space-y-6">
                <div className="flex items-center gap-4 mb-6">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-8 w-48" />
                </div>
                <Skeleton className="h-[200px] w-full rounded-lg" />
            </div>
        )
    }

    return (
        <div className="px-6 pb-6 w-full">
            <div className="mb-6">
                <Link href="/members" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Members
                </Link>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Users className="w-6 h-6" />
                            Team Onboarding
                        </h1>
                        <p className="text-gray-500 mt-1">
                            See the progress of members invited via email and send reminders to help them get fully onboarded.
                        </p>
                    </div>
                    <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border shadow-sm">
                        <Switch
                            id="show-onboarded"
                            checked={showOnboarded}
                            onCheckedChange={setShowOnboarded}
                        />
                        <label
                            htmlFor="show-onboarded"
                            className="text-xs font-semibold text-gray-700 uppercase cursor-pointer"
                        >
                            Show onboarded members
                        </label>
                    </div>
                </div>
            </div>

            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-gray-500 bg-gray-50 border-b">
                            <tr>
                                <th className="p-4 font-medium pl-6">Member email</th>
                                <th className="p-4 font-medium text-center">Created account</th>
                                <th className="p-4 font-medium text-center">Downloaded app</th>
                                <th className="p-4 font-medium text-center">Tracked time</th>
                                <th className="p-4 font-medium text-center">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger className="flex items-center justify-center gap-1 mx-auto cursor-help">
                                                Send reminder <Info className="w-3 h-3" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Send an email reminder to pending members</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredList.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Users className="w-8 h-8 text-gray-300" />
                                            <p>No members found matching the filter.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredList.map((item: any) => {
                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-4 pl-6 font-medium text-gray-900">{item.email}</td>
                                            <td className="p-4 text-center">
                                                {item.hasCreatedAccount ? (
                                                    <div className="flex justify-center">
                                                        <span className="bg-red-100 text-red-700 p-1 rounded-full">
                                                            <X className="w-4 h-4" />
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-300">-</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-center">
                                                {item.hasDownloadedApp ? (
                                                    <div className="flex justify-center">
                                                        <span className="bg-red-100 text-red-700 p-1 rounded-full">
                                                            <X className="w-4 h-4" />
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-300">-</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-center">
                                                {item.hasTrackedTime ? (
                                                    <div className="flex justify-center">
                                                        <span className="bg-red-100 text-red-700 p-1 rounded-full">
                                                            <X className="w-4 h-4" />
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-300">-</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-center">
                                                {item.type === 'invitation' ? (
                                                    // Show send button for ALL invitations (pending or accepted)
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                                                        onClick={() => {
                                                            // For accepted invitations, send new invitation email
                                                            if (item.status === 'accepted') {
                                                                handleSendReminderForAccepted(item.email)
                                                            } else {
                                                                // For pending invitations, use resend
                                                                handleSendReminder(item.id, item.email)
                                                            }
                                                        }}
                                                        title={item.status === 'accepted' ? "Send reminder email" : "Resend invitation"}
                                                    >
                                                        <Send className="w-4 h-4" />
                                                    </Button>
                                                ) : item.isFullyOnboarded ? (
                                                    // Show send button for fully onboarded members
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                                                        onClick={() => handleSendInvitation(item.email)}
                                                        title="Send new invitation"
                                                    >
                                                        <Send className="w-4 h-4" />
                                                    </Button>
                                                ) : null}
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 bg-gray-50 border-t">
                    <div className="flex gap-2 text-sm text-gray-500">
                        <Info className="w-4 h-4 mt-0.5 shrink-0" />
                        <p>
                            Team members can currently track time in several ways. You can adjust their{" "}
                            <Link href="/settings/timer-app" className="font-medium hover:underline text-gray-900">
                                timer app settings
                            </Link>{" "}
                            if you'd like to record screenshots and activity (desktop app only).
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
