"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { getOrganizationMembersById } from "@/action/members"
import MemberEditFormImproved from "@/components/form/member-edit-form-improved"
import { IOrganization_member } from "@/interface"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function EditOrganizationMembersPage() {
    const params = useParams()
    const id = params.id as string

    const [member, setMember] = useState<Partial<IOrganization_member> | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            const { success, data } = await getOrganizationMembersById(id)
            if (success) {
                setMember(data)
            }
            setLoading(false)
        }
        fetchData()
    }, [id])

    if (loading) {
        return (
            <div className="flex flex-1 flex-col gap-4 w-full min-w-0">
                <div className="w-full p-4 md:p-6 lg:p-8 space-y-6 min-w-0">
                    {/* Header Skeleton */}
                    <div className="space-y-3">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-96" />
                    </div>

                    {/* Member Info Card Skeleton */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-16 w-16 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-6 w-48" />
                                    <Skeleton className="h-4 w-64" />
                                    <div className="flex gap-2">
                                        <Skeleton className="h-6 w-20" />
                                        <Skeleton className="h-6 w-16" />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Form Skeleton */}
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    if (!member) {
        return (
            <div className="flex flex-1 flex-col gap-4 w-full min-w-0">
                <div className="w-full p-4 md:p-6 lg:p-8 min-w-0">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Member Not Found</AlertTitle>
                        <AlertDescription>
                            The member you're trying to edit could not be found. Please check the ID and try again.
                        </AlertDescription>
                    </Alert>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-1 flex-col gap-4 w-full min-w-0">
            <div className="w-full p-4 md:p-6 lg:p-8 min-w-0">
                <MemberEditFormImproved
                    initialValues={member}
                    rfidInitial={member.rfid_cards || undefined}
                />
            </div>
        </div>
    )
}

