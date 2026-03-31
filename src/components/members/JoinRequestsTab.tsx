"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle, XCircle, Clock, Users, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
    getJoinRequests,
    approveJoinRequest,
    rejectJoinRequest,
    type JoinRequestItem,
} from "@/action/join-organization";
import { TableSkeleton } from "@/components/ui/loading-skeleton";

interface JoinRequestsTabProps {
    organizationId: number | string | null;
}

function formatRelativeTime(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

function getInitials(name: string | null, email: string | null): string {
    if (name) {
        const parts = name.trim().split(" ");
        return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
    }
    if (email) return email[0]?.toUpperCase() ?? "?";
    return "?";
}

export function JoinRequestsTab({ organizationId }: JoinRequestsTabProps) {
    const queryClient = useQueryClient();
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [rejectDialog, setRejectDialog] = useState<{
        open: boolean;
        request: JoinRequestItem | null;
    }>({ open: false, request: null });
    const [rejectNote, setRejectNote] = useState("");

    const { data: result, isLoading, error } = useQuery({
        queryKey: ["join-requests", organizationId],
        queryFn: () => getJoinRequests(Number(organizationId)),
        enabled: !!organizationId,
        refetchInterval: 30_000,
    });

    const requests = result?.data ?? [];

    const handleApprove = async (req: JoinRequestItem) => {
        setProcessingId(req.id);
        try {
            const res = await approveJoinRequest(req.id);
            if (res.success) {
                toast.success(res.message);
                queryClient.invalidateQueries({ queryKey: ["join-requests"] });
                queryClient.invalidateQueries({ queryKey: ["members"] });
            } else {
                toast.error(res.message);
            }
        } finally {
            setProcessingId(null);
        }
    };

    const openRejectDialog = (req: JoinRequestItem) => {
        setRejectNote("");
        setRejectDialog({ open: true, request: req });
    };

    const handleRejectConfirm = async () => {
        if (!rejectDialog.request) return;
        setProcessingId(rejectDialog.request.id);
        try {
            const res = await rejectJoinRequest(rejectDialog.request.id, rejectNote || undefined);
            if (res.success) {
                toast.success(res.message);
                queryClient.invalidateQueries({ queryKey: ["join-requests"] });
            } else {
                toast.error(res.message);
            }
        } finally {
            setProcessingId(null);
            setRejectDialog({ open: false, request: null });
            setRejectNote("");
        }
    };

    // ── Loading ────────────────────────────────────────────────────────────────
    if (isLoading) return <TableSkeleton />;

    if (error || result?.success === false) {
        return (
            <Alert variant="destructive" className="max-w-xl">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                    {result?.message ?? "Failed to load join requests."}
                </AlertDescription>
            </Alert>
        );
    }

    if (requests.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                    <Users className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="font-semibold text-slate-700">No pending join requests</p>
                <p className="text-sm text-muted-foreground max-w-xs">
                    When someone requests to join via organization code, they&apos;ll appear here for your approval.
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-3">
                {requests.map((req) => {
                    const isProcessing = processingId === req.id;
                    const initials = getInitials(req.requester_name, req.requester_email);
                    const daysLeft = Math.max(
                        0,
                        Math.ceil(
                            (new Date(req.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                        )
                    );

                    return (
                        <div
                            key={req.id}
                            className="flex items-center gap-4 p-4 rounded-xl border bg-white shadow-sm hover:shadow-md transition-shadow"
                        >
                            {/* Avatar fallback */}
                            <div className="h-11 w-11 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                                {req.requester_avatar ? (
                                    <img
                                        src={req.requester_avatar}
                                        alt={req.requester_name ?? "User"}
                                        className="h-11 w-11 rounded-full object-cover"
                                    />
                                ) : (
                                    <span className="text-primary font-semibold text-sm">{initials}</span>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-900 truncate">
                                    {req.requester_name ?? "Unknown User"}
                                </p>
                                <p className="text-sm text-muted-foreground truncate">
                                    {req.requester_email ?? req.requested_by}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
                                        <Clock className="h-2.5 w-2.5" />
                                        {formatRelativeTime(req.created_at)}
                                    </Badge>
                                    {daysLeft <= 3 && (
                                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                            Expires in {daysLeft}d
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 shrink-0">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-9 gap-1.5 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                                    onClick={() => openRejectDialog(req)}
                                    disabled={isProcessing}
                                >
                                    <XCircle className="h-4 w-4" />
                                    <span className="hidden sm:inline">Reject</span>
                                </Button>
                                <Button
                                    size="sm"
                                    className="h-9 gap-1.5 bg-green-600 hover:bg-green-700"
                                    onClick={() => handleApprove(req)}
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <CheckCircle className="h-4 w-4" />
                                    )}
                                    <span className="hidden sm:inline">Approve</span>
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Reject Dialog */}
            <Dialog
                open={rejectDialog.open}
                onOpenChange={(open) =>
                    !open && setRejectDialog({ open: false, request: null })
                }
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Reject Join Request</DialogTitle>
                        <DialogDescription>
                            Reject{" "}
                            <span className="font-semibold">
                                {rejectDialog.request?.requester_name ??
                                    rejectDialog.request?.requester_email ??
                                    "this user"}
                            </span>
                            &apos;s request to join your organization.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Reason <span className="text-muted-foreground">(optional)</span>
                        </label>
                        <Textarea
                            placeholder="e.g., Not eligible at this time..."
                            value={rejectNote}
                            onChange={(e) => setRejectNote(e.target.value)}
                            rows={3}
                        />
                    </div>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setRejectDialog({ open: false, request: null })}
                            disabled={processingId !== null}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleRejectConfirm}
                            disabled={processingId !== null}
                        >
                            {processingId !== null ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Rejecting…
                                </>
                            ) : (
                                "Confirm Reject"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
