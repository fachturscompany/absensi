"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import {
  Mail,
  Send,
  Ban,
  Trash,
  Clock,
  CheckCircle2,
  XCircle,
  UserPlus,
  Loader2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { DataTable } from "@/components/tables/data-table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from "@/components/ui/empty";

import {
  getAllInvitations,
  resendInvitation,
  cancelInvitation,
  deleteInvitation
} from "@/action/invitations";
import { IMemberInvitation } from "@/interface";

// Extracted Actions cell to avoid using hooks inside table cell renderers
function InvitationActionsCell({
  invitation,
  onResend,
  onCancel,
  onDelete,
}: {
  invitation: IMemberInvitation;
  onResend: (id: string) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const canResend = invitation.status === "pending" || invitation.status === "expired";
  const canCancel = invitation.status === "pending";

  return (
    <div className="flex items-center gap-1">
      {canResend && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onResend(invitation.id)}
          className="h-8 w-8 hover:bg-muted"
          title="Resend Invitation"
        >
          <Send className="h-4 w-4" />
        </Button>
      )}

      {canCancel && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onCancel(invitation.id)}
          className="h-8 w-8 hover:bg-muted"
          title="Cancel Invitation"
        >
          <Ban className="h-4 w-4" />
        </Button>
      )}

      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowDeleteDialog(true)}
        className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
        title="Delete Invitation"
      >
        <Trash className="h-4 w-4" />
      </Button>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
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
              onClick={() => {
                onDelete(invitation.id);
                setShowDeleteDialog(false);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function InvitationsClient() {
  const router = useRouter();
  const [invitations, setInvitations] = useState<IMemberInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  const loadInvitations = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getAllInvitations();
      if (result.success) {
        setInvitations(result.data);
      } else {
        toast.error(result.message || "Failed to load invitations");
      }
    } catch {
      toast.error("An error occurred while loading invitations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInvitations();
  }, [loadInvitations]);

  async function handleResend(invitationId: string) {
    try {
      const result = await resendInvitation(invitationId);
      if (result.success) {
        toast.success("Invitation resent successfully");
        void loadInvitations();
      } else {
        toast.error(result.message || "Failed to resend invitation");
      }
    } catch {
      toast.error("An error occurred");
    }
  }

  async function handleCancel(invitationId: string) {
    try {
      const result = await cancelInvitation(invitationId);
      if (result.success) {
        toast.success("Invitation cancelled");
        void loadInvitations();
      } else {
        toast.error(result.message || "Failed to cancel invitation");
      }
    } catch {
      toast.error("An error occurred");
    }
  }

  async function handleDelete(invitationId: string) {
    try {
      const result = await deleteInvitation(invitationId);
      if (result.success) {
        toast.success("Invitation deleted");
        void loadInvitations();
      } else {
        toast.error(result.message || "Failed to delete invitation");
      }
    } catch {
      toast.error("An error occurred");
    }
  }

  const columns: ColumnDef<IMemberInvitation>[] = [
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span>{row.original.email}</span>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = (row.original as unknown as { role?: { name?: string } | null }).role;
        return role && role.name ? (
          <Badge variant="secondary">{role.name}</Badge>
        ) : (
          <span className="text-muted-foreground text-sm">Not assigned</span>
        );
      },
    },
    {
      accessorKey: "department",
      header: "Group",
      cell: ({ row }) => {
        const dept = (row.original as unknown as { department?: { name?: string } | null }).department;
        return dept && dept.name ? dept.name : <span className="text-muted-foreground text-sm">-</span>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const variants = {
          pending: { icon: Clock, color: "bg-yellow-100 text-yellow-800" },
          accepted: { icon: CheckCircle2, color: "bg-green-100 text-green-800" },
          expired: { icon: XCircle, color: "bg-red-100 text-red-800" },
          cancelled: { icon: Ban, color: "bg-gray-100 text-gray-800" },
        } as const;
        type StatusKey = keyof typeof variants;
        const variant = variants[(status as StatusKey)] ?? variants.pending;
        const Icon = variant.icon;

        return (
          <Badge className={`${variant.color} border-0`}>
            <Icon className="h-3 w-3 mr-1" />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Invited",
      cell: ({ row }) => {
        const date = new Date(row.original.created_at);
        return date.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric"
        });
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <InvitationActionsCell
          invitation={row.original}
          onResend={handleResend}
          onCancel={handleCancel}
          onDelete={handleDelete}
        />
      ),
    },
  ];

  // Filter invitations by status
  const filteredInvitations = activeTab === "all"
    ? invitations
    : invitations.filter(inv => inv.status === activeTab);

  // Stats
  const stats = {
    total: invitations.length,
    pending: invitations.filter(i => i.status === "pending").length,
    accepted: invitations.filter(i => i.status === "accepted").length,
    expired: invitations.filter(i => i.status === "expired").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invitations</h1>
          <p className="text-muted-foreground">
            Manage member invitations to your organization
          </p>
        </div>
        <Button onClick={() => router.push("/members/invite")}>
          <UserPlus className="mr-2 h-4 w-4" />
          New Invitation
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Accepted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Expired
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
          <TabsTrigger value="accepted">Accepted ({stats.accepted})</TabsTrigger>
          <TabsTrigger value="expired">Expired ({stats.expired})</TabsTrigger>
        </TabsList>

        {/* Table Content */}
        {loading ? (
          <div className="py-12 text-center text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            Loading invitations...
          </div>
        ) : filteredInvitations.length === 0 ? (
          <div className="mt-8">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Mail className="h-14 w-14 text-muted-foreground" />
                </EmptyMedia>
                <EmptyTitle>No invitations yet</EmptyTitle>
                <EmptyDescription>
                  {activeTab === "all"
                    ? "There are no invitations for this organization. Use the \"Invite Member\" button on the Members page to create one."
                    : `No ${activeTab} invitations found.`
                  }
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={() => router.push("/members")}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Go to Members
                </Button>
              </EmptyContent>
            </Empty>
          </div>
        ) : (
          <DataTable columns={columns} data={filteredInvitations} />
        )}
      </Tabs>
    </div>
  );
}
