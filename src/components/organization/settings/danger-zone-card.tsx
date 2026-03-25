"use client";

// src/components/organization/settings/DangerZoneCard.tsx

import { useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
import { Loader2 } from "@/components/icons/lucide-exports";
import { deleteOrganization } from "@/action/organization-settings";
import type { OrganizationData } from "@/types/organization/org-settings";

interface DangerZoneCardProps {
  orgData: OrganizationData | null | undefined;
}

export function DangerZoneCard({ orgData }: DangerZoneCardProps) {
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!orgData || deleteConfirmation !== orgData.name) {
      toast.error("Confirmation text does not match the organization name.");
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteOrganization(String(orgData.id));
      if (result.success) {
        toast.success("Organization deleted successfully. Redirecting...");
        await fetch("/api/organizations/clear", { method: "POST" });
        setTimeout(() => {
          window.location.href = "/organization";
        }, 1500);
      } else {
        toast.error(result.message || "Failed to delete organization.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="border-destructive/50 shadow-sm mt-6">
      <CardHeader>
        <CardTitle className="text-destructive">Delete {orgData?.name}</CardTitle>
        <CardDescription>These actions are permanent and cannot be undone.</CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Delete</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                <strong className="px-1">{orgData?.name}</strong>
                organization and all of its associated data, including members, groups, and
                attendance records.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2 py-2">
              <Label htmlFor="delete-confirmation">
                Please type <strong className="px-1">{orgData?.name}</strong> to confirm.
              </Label>
              <Input
                id="delete-confirmation"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                autoComplete="off"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={deleteConfirmation !== orgData?.name || isDeleting}
                onClick={handleDelete}
                className="bg-destructive hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "I understand, delete this organization"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}