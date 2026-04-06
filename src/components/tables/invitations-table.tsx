"use client";

import React, { useState } from "react";
import { IMemberInvitation } from "@/interface";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
    Send,
    Ban,
    Trash,
    Clock,
    CheckCircle2,
    XCircle,
} from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { resendInvitation, cancelInvitation, deleteInvitation } from "@/action/invitations";

interface InvitationsTableProps {
    invitations: IMemberInvitation[];
    isLoading?: boolean;
    onUpdate?: () => void;
}

export function InvitationsTable({ invitations, isLoading = false, onUpdate }: InvitationsTableProps) {
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const handleResend = async (id: string) => {
        try {
            const result = await resendInvitation(id);
            if (result.success) {
                toast.success("Invitation resent successfully");
                onUpdate?.();
            } else {
                toast.error(result.message || "Failed to resend invitation");
            }
        } catch {
            toast.error("An error occurred");
        }
    };

    const handleCancel = async (id: string) => {
        try {
            const result = await cancelInvitation(id);
            if (result.success) {
                toast.success("Invitation cancelled");
                onUpdate?.();
            } else {
                toast.error(result.message || "Failed to cancel invitation");
            }
        } catch {
            toast.error("An error occurred");
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            const result = await deleteInvitation(deleteId);
            if (result.success) {
                toast.success("Invitation deleted");
                onUpdate?.();
            } else {
                toast.error(result.message || "Failed to delete invitation");
            }
        } catch {
            toast.error("An error occurred");
        } finally {
            setDeleteId(null);
        }
    };

    const getStatusBadge = (status: string) => {
        const variants = {
            pending: { icon: Clock, color: "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400" },
            accepted: { icon: CheckCircle2, color: "bg-slate-100 dark:bg-green-900/20 text-green-800 dark:text-green-400" },
            expired: { icon: XCircle, color: "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400" },
            cancelled: { icon: Ban, color: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300" },
        } as const;

        type StatusKey = keyof typeof variants;
        const variant = variants[status as StatusKey] || variants.pending;
        const Icon = variant.icon;

        return (
            <Badge className={`${variant.color} border-0 flex w-fit items-center gap-1 text-xs`}>
                <Icon className="h-3 w-3" />
                <span className="capitalize">{status}</span>
            </Badge>
        );
    };

    return (
        <div className="w-full space-y-4">
            <Table>
                <TableHeader>
                    <TableRow className="border-b border-border">
                        <TableHead className="w-10 px-4" />
                        <TableHead className="font-medium text-xs uppercase tracking-wide py-3">Member</TableHead>
                        <TableHead className="font-medium text-xs uppercase tracking-wide">Role</TableHead>
                        <TableHead className="font-medium text-xs uppercase tracking-wide">Teams</TableHead>
                        <TableHead className="font-medium text-xs uppercase tracking-wide hidden md:table-cell">Projects</TableHead>
                        <TableHead className="font-medium text-xs uppercase tracking-wide hidden md:table-cell">Payment</TableHead>
                        <TableHead className="font-medium text-xs uppercase tracking-wide">Weekly limit</TableHead>
                        <TableHead className="font-medium text-xs uppercase tracking-wide">Status</TableHead>
                        <TableHead className="w-20 text-right pr-6 font-medium text-xs uppercase tracking-wide">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={9} className="h-32 text-center text-muted-foreground italic text-sm">
                                Loading invitations...
                            </TableCell>
                        </TableRow>
                    ) : invitations.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={9} className="h-24 text-center text-muted-foreground py-6">
                                No invitations found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        invitations.map((invitation) => {
                            const email = invitation.email;
                            const emailInitials = email.substring(0, 2).toUpperCase();

                            return (
                                <TableRow
                                    key={invitation.id}
                                    className="group cursor-pointer transition-colors w-full hover:bg-muted/50"
                                >
                                    {/* Checkbox */}
                                    <TableCell className="px-4 py-3" onClick={e => e.stopPropagation()}>
                                        <input type="checkbox" className="rounded border-gray-300" />
                                    </TableCell>

                                    {/* Member - Avatar + Email */}
                                    <TableCell className="py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-medium text-xs">
                                                {emailInitials}
                                            </div>
                                            <span className="font-medium text-sm block truncate max-w-[200px]">
                                                {email}
                                            </span>
                                        </div>
                                    </TableCell>

                                    {/* Role */}
                                    <TableCell className="text-sm text-muted-foreground">
                                        {(invitation as any).role?.name || <span className="text-muted-foreground/50">—</span>}
                                    </TableCell>

                                    {/* Teams */}
                                    <TableCell>
                                        {(invitation as any).departments?.name || (invitation as any).department?.name ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground">
                                                {(invitation as any).departments?.name || (invitation as any).department?.name}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground/50 text-sm">—</span>
                                        )}
                                    </TableCell>

                                    {/* Projects */}
                                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                                        <span className="text-muted-foreground/50">—</span>
                                    </TableCell>

                                    {/* Payment */}
                                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                                        <span className="text-muted-foreground/50">—</span>
                                    </TableCell>

                                    {/* Weekly limit */}
                                    <TableCell className="text-sm text-muted-foreground">
                                        <span className="text-muted-foreground/50">—</span>
                                    </TableCell>

                                    {/* Status */}
                                    <TableCell>
                                        {getStatusBadge(invitation.status)}
                                    </TableCell>

                                    {/* Actions */}
                                    <TableCell className="px-4 pr-6 text-right" onClick={e => e.stopPropagation()}>
                                        <div className="flex justify-end gap-1">
                                            {(invitation.status === "pending" || invitation.status === "expired") && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => handleResend(invitation.id)}
                                                    title="Resend"
                                                >
                                                    <Send className="w-3.5 h-3.5" />
                                                </Button>
                                            )}
                                            {invitation.status === "pending" && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => handleCancel(invitation.id)}
                                                    title="Cancel"
                                                >
                                                    <Ban className="w-3.5 h-3.5" />
                                                </Button>
                                            )}
                                            <AlertDialog open={deleteId === invitation.id} onOpenChange={(open) => !open && setDeleteId(null)}>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-destructive hover:bg-red-50 hover:border-red-200"
                                                        title="Delete"
                                                    >
                                                        <Trash className="w-3.5 h-3.5" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete Invitation</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Are you sure you want to delete this invitation? This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                            onClick={handleDelete}
                                                        >
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
