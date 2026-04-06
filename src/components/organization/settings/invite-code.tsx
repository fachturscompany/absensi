"use client";

// src/components/organization/settings/InviteCodeControl.tsx

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  Eye,
  EyeOff,
  ClipboardCheck,
  Check,
  RefreshCw,
  Loader2,
} from "@/components/icons/lucide-exports";

interface InviteCodeControlProps {
  invCode: string | undefined;
  showInviteCode: boolean;
  inviteCodeCopied: boolean;
  regenerating: boolean;
  onToggleShow: () => void;
  onCopy: () => void;
  onRegenerate: () => void;
}

export function InviteCodeControl({
  invCode,
  showInviteCode,
  inviteCodeCopied,
  regenerating,
  onToggleShow,
  onCopy,
  onRegenerate,
}: InviteCodeControlProps) {
  return (
    <div className="flex items-center gap-4 mt-4">
      <Label className="text-sm font-medium text-muted-foreground">Invitation Code:</Label>
      <div className="flex items-center gap-2">
        <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
          {showInviteCode ? invCode : "••••••••"}
        </code>

        {/* Toggle visibility */}
        <Button size="sm" variant="ghost" onClick={onToggleShow} className="h-8 w-8 p-0">
          {showInviteCode ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
        </Button>

        {/* Copy */}
        <Button
          size="sm"
          variant="ghost"
          onClick={onCopy}
          disabled={!showInviteCode}
          className="h-8 w-8 p-0"
        >
          {inviteCodeCopied ? (
            <Check className="h-3 w-3 text-slate-700" />
          ) : (
            <ClipboardCheck className="h-3 w-3" />
          )}
        </Button>

        {/* Regenerate */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              disabled={regenerating}
              className="h-8 w-8 p-0"
            >
              {regenerating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Regenerate invite code?</AlertDialogTitle>
              <AlertDialogDescription>
                This action will deactivate the current invitation code immediately. New members
                must use the new code.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={regenerating}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onRegenerate} disabled={regenerating}>
                {regenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  "Yes, regenerate"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}