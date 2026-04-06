"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    AlertCircle,
    CheckCircle2,
    Loader2,
    Building2,
    Search,
    ArrowRight,
    Clock,
} from "lucide-react";
import { lookupOrganizationByCode, requestToJoinOrganization } from "@/action/join-organization";
import { toast } from "sonner";

type Step = "input" | "preview" | "submitted";

interface OrgPreview {
    id: number;
    name: string;
    code: string;
}

export default function JoinOrganizationPage() {
    const router = useRouter();

    const [step, setStep] = useState<Step>("input");
    const [code, setCode] = useState("");
    const [codeInput, setCodeInput] = useState("");
    const [orgPreview, setOrgPreview] = useState<OrgPreview | null>(null);

    const [isLooking, setIsLooking] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ── Step 1: Look up org by code ──────────────────────────────────────────

    const handleLookup = async () => {
        const trimmedCode = codeInput.trim().toUpperCase();
        if (!trimmedCode) {
            setError("Please enter a join code.");
            return;
        }

        setError(null);
        setIsLooking(true);

        try {
            const result = await lookupOrganizationByCode(trimmedCode);
            if (!result.success || !result.data) {
                setError(result.message || "Organization not found.");
                return;
            }
            setCode(trimmedCode);
            setOrgPreview(result.data);
            setStep("preview");
        } catch {
            setError("Failed to look up organization. Please try again.");
        } finally {
            setIsLooking(false);
        }
    };

    // ── Step 2: Submit the join request ──────────────────────────────────────

    const handleSubmit = async () => {
        if (!orgPreview) return;

        setError(null);
        setIsSubmitting(true);

        try {
            const result = await requestToJoinOrganization(code);
            if (!result.success) {
                setError(result.message || "Failed to submit request.");
                return;
            }
            toast.success(result.message);
            setStep("submitted");
        } catch {
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setStep("input");
        setCodeInput("");
        setCode("");
        setOrgPreview(null);
        setError(null);
    };

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground mb-4 shadow-lg">
                        <Building2 className="w-7 h-7" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        Join an Organization
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm">
                        Enter the join code shared by your organization admin.
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">

                    {/* ── Step: input ── */}
                    {step === "input" && (
                        <div className="px-6 py-8 space-y-5">
                            <div className="space-y-2">
                                <label htmlFor="join-code" className="text-sm font-medium text-slate-700">
                                    Organization Join Code
                                </label>
                                <div className="relative">
                                    <Input
                                        id="join-code"
                                        placeholder="e.g. AB12CD"
                                        value={codeInput}
                                        onChange={(e) => {
                                            setCodeInput(e.target.value.toUpperCase());
                                            setError(null);
                                        }}
                                        onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                                        className={`pr-10 text-center tracking-[0.4em] font-mono text-lg uppercase ${error ? "border-red-500" : ""}`}
                                        disabled={isLooking}
                                        maxLength={12}
                                        autoFocus
                                        autoComplete="off"
                                    />
                                    {isLooking && (
                                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                                    )}
                                </div>
                                <p className="text-xs text-slate-400">
                                    The code is case-insensitive (e.g. PTMJ or ptmj both work).
                                </p>
                            </div>

                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <Button
                                className="w-full gap-2"
                                onClick={handleLookup}
                                disabled={isLooking || !codeInput.trim()}
                            >
                                {isLooking ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Looking up…
                                    </>
                                ) : (
                                    <>
                                        <Search className="h-4 w-4" />
                                        Find Organization
                                    </>
                                )}
                            </Button>
                        </div>
                    )}

                    {/* ── Step: preview ── */}
                    {step === "preview" && orgPreview && (
                        <div className="px-6 py-8 space-y-6">
                            <div className="text-center">
                                <p className="text-sm text-slate-500 mb-3">You are requesting to join:</p>
                                <div className="inline-flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-primary/20 bg-primary/5 w-full">
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <Building2 className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg text-slate-900">{orgPreview.name}</p>
                                        <p className="text-xs text-slate-400 font-mono tracking-wider">
                                            Code: {orgPreview.code}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700 flex items-start gap-2">
                                <Clock className="h-4 w-4 mt-0.5 shrink-0" />
                                <p>Your request will be reviewed by an admin. You&apos;ll gain access once it&apos;s approved.</p>
                            </div>

                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={handleReset}
                                    disabled={isSubmitting}
                                >
                                    Back
                                </Button>
                                <Button
                                    className="flex-1 gap-2"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Submitting…
                                        </>
                                    ) : (
                                        <>
                                            <ArrowRight className="h-4 w-4" />
                                            Send Request
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* ── Step: submitted ── */}
                    {step === "submitted" && orgPreview && (
                        <div className="px-6 py-10 flex flex-col items-center text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                                <CheckCircle2 className="w-8 h-8 text-slate-700" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Request Submitted!</h2>
                                <p className="text-sm text-slate-500 mt-1">
                                    Your request to join <span className="font-semibold text-slate-700">{orgPreview.name}</span> is pending approval.
                                </p>
                                <p className="text-xs text-slate-400 mt-2">
                                    The admin will review your request. You&apos;ll be notified once you&apos;re approved.
                                </p>
                            </div>

                            <div className="pt-2 flex flex-col gap-2 w-full">
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => router.push("/onboarding")}
                                >
                                    Back to Onboarding
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="w-full text-sm text-slate-400"
                                    onClick={handleReset}
                                >
                                    Join a different organization
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer nudge */}
                {step === "input" && (
                    <p className="text-center text-xs text-slate-400 mt-6">
                        Want to create your own organization instead?{" "}
                        <a href="/onboarding/setup" className="text-primary underline underline-offset-2 hover:text-primary/80">
                            Set it up here
                        </a>
                    </p>
                )}
            </div>
        </div>
    );
}
