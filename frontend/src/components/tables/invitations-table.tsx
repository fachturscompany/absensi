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
    XCircle
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
} from "@/components/ui/alert-dialog";
import { resendInvitation, cancelInvitation, deleteInvitation } from "@/action/invitations";
// import { useRouter } from "next/navigation";

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
            pending: { icon: Clock, color: "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/30" },
            accepted: { icon: CheckCircle2, color: "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/30" },
            expired: { icon: XCircle, color: "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/30" },
            cancelled: { icon: Ban, color: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700" },
        } as const;

        type StatusKey = keyof typeof variants;
        const variant = variants[status as StatusKey] || variants.pending;
        const Icon = variant.icon;

        return (
            <Badge className={`${variant.color} border-0 flex w-fit items-center gap-1`}>
                <Icon className="h-3 w-3" />
                <span className="capitalize">{status}</span>
            </Badge>
        );
    };

    return (
        <div className="w-full">
            <style jsx global>{`
        html body .custom-hover-row:hover,
        html body .custom-hover-row:hover > td {
          background-color: #d1d5db !important; /* dark gray hover */
        }
        html body.dark .custom-hover-row:hover,
        html body.dark .custom-hover-row:hover > td {
          background-color: #374151 !important;
        }
      `}</style>
            <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
                <table className="w-full text-sm text-left">
                    <thead className="bg-transparent border-b">
                        <tr>
                            <th className="p-3 w-8">
                                <input type="checkbox" className="rounded border-gray-300" />
                            </th>
                            <th className="p-3 font-medium text-gray-900 dark:text-gray-100">Member</th>
                            <th className="p-3 font-medium text-gray-900 dark:text-gray-100">Role</th>
                            <th className="p-3 font-medium text-gray-900 dark:text-gray-100">Teams</th>
                            <th className="p-3 font-medium text-gray-900 dark:text-gray-100">Projects</th>
                            <th className="p-3 font-medium text-gray-900 dark:text-gray-100">Payment</th>
                            <th className="p-3 font-medium text-gray-900 dark:text-gray-100">Weekly limit</th>
                            <th className="p-3 font-medium text-gray-900 dark:text-gray-100">Status</th>
                            <th className="p-3 font-medium text-gray-900 dark:text-gray-100 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={9} className="p-4 text-center text-muted-foreground">
                                    Loading invitations...
                                </td>
                            </tr>
                        ) : invitations.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="p-8 text-center text-muted-foreground border-b-0">
                                    <div className="flex flex-col items-start gap-2">
                                        <span className="text-lg font-medium text-gray-500">No invitations</span>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            invitations.map((invitation) => (
                                <tr key={invitation.id} className="border-b transition-colors hover:bg-muted/50">
                                    <td className="p-3">
                                        <input type="checkbox" className="rounded border-gray-300" />
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-2">
                                            {/* Avatar placeholder if needed, or just email */}
                                            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 font-medium text-xs">
                                                {invitation.email.substring(0, 2).toUpperCase()}
                                            </div>
                                            <span className="font-medium text-gray-900 dark:text-gray-100">{invitation.email}</span>
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        {(invitation as any).role?.name || "-"}
                                    </td>
                                    <td className="p-3">
                                        {(invitation as any).departments?.name || (invitation as any).department?.name || "-"}
                                    </td>
                                    <td className="p-3 text-muted-foreground">-</td>
                                    <td className="p-3 text-muted-foreground">-</td>
                                    <td className="p-3 text-muted-foreground">-</td>
                                    <td className="p-3">{getStatusBadge(invitation.status)}</td>
                                    <td className="p-3 text-right">
                                        <div className="flex justify-end gap-1">
                                            {(invitation.status === "pending" || invitation.status === "expired") && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 hover:bg-muted"
                                                    onClick={() => handleResend(invitation.id)}
                                                    title="Resend"
                                                >
                                                    <Send className="h-4 w-4" />
                                                </Button>
                                            )}
                                            {invitation.status === "pending" && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 hover:bg-muted"
                                                    onClick={() => handleCancel(invitation.id)}
                                                    title="Cancel"
                                                >
                                                    <Ban className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => setDeleteId(invitation.id)}
                                                title="Delete"
                                            >
                                                <Trash className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
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
    );
}
