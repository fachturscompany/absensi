"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Info, Loader2 } from "lucide-react"
import type { Project } from "@/interface"

interface IOrganizationOption {
    id: string
    name: string
}

type TransferProjectDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    project: Project | null
    onTransfer: (organizationId: string) => void
}

export default function TransferProjectDialog(props: TransferProjectDialogProps) {
    const { open, onOpenChange, project, onTransfer } = props
    const [selectedOrg, setSelectedOrg] = useState<string>("")
    const [organizations, setOrganizations] = useState<IOrganizationOption[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (open) fetchOrganizations()
    }, [open])

    const fetchOrganizations = async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await fetch("/api/organizations")
            const result = await response.json()
            if (result.success) {
                setOrganizations(result.data)
            } else {
                setError(result.error || "Failed to load organizations")
            }
        } catch {
            setError("Failed to load organizations")
        } finally {
            setLoading(false)
        }
    }

    const canTransfer = organizations.length > 1

    const handleTransfer = () => {
        if (!selectedOrg) return
        onTransfer(selectedOrg)
        setSelectedOrg("")
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Transfer project {project?.name}</DialogTitle>
                    <DialogDescription />
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold">DESTINATION ORGANIZATION</label>
                        <Select value={selectedOrg} onValueChange={setSelectedOrg} disabled={!canTransfer || loading}>
                            <SelectTrigger>
                                <SelectValue placeholder={loading ? "Loading..." : "Select organization"} />
                            </SelectTrigger>
                            <SelectContent>
                                {loading ? (
                                    <div className="flex items-center justify-center py-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    </div>
                                ) : organizations.length > 0 ? (
                                    organizations.map(org => (
                                        <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                                    ))
                                ) : (
                                    <div className="text-sm text-muted-foreground text-center py-2">No organizations available</div>
                                )}
                            </SelectContent>
                        </Select>
                        {error && <p className="text-sm text-destructive">{error}</p>}
                    </div>

                    <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex gap-2">
                            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>All project data will be preserved.</span>
                        </div>
                        <div className="flex gap-2">
                            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>You can only transfer projects to organizations you own.</span>
                        </div>
                        <div className="flex gap-2">
                            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>Project members who don't belong to the destination organization will be added to it.</span>
                        </div>
                    </div>

                    {!canTransfer && (
                        <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-3">
                            <div className="flex gap-2">
                                <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <span>Transfer is disabled because you only have one organization.</span>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleTransfer} disabled={!selectedOrg || !canTransfer || loading}>
                        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading...</> : "Save"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}