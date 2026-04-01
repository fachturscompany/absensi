"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Building2, 
  Shield, 
  Users, 
  Briefcase,
  Eye,
  EyeOff
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { getInvitationByToken, acceptInvitation } from "@/action/invitations";
import { IMemberInvitation } from "@/interface";

const acceptSchema = z.object({
  first_name: z.string().min(2, "First name must be at least 2 characters"),
  last_name: z.string().min(2, "Last name must be at least 2 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

type AcceptFormValues = z.infer<typeof acceptSchema>;

export default function InvitationAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [invitation, setInvitation] = useState<IMemberInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<AcceptFormValues>({
    resolver: zodResolver(acceptSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      password: "",
      confirm_password: "",
    },
  });

  // Verify token on mount
  useEffect(() => {
    async function verifyToken() {
      try {
        setLoading(true);
        setError(null);

        const result = await getInvitationByToken(token);

        if (result.success && result.data) {
          setInvitation(result.data);
        } else {
          setError(result.message || "Invalid invitation");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to verify invitation");
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      verifyToken();
    }
  }, [token]);

  async function onSubmit(values: AcceptFormValues) {
    try {
      setSubmitting(true);

      const result = await acceptInvitation({
        token,
        first_name: values.first_name,
        last_name: values.last_name,
        password: values.password,
      });

      if (result.success) {
        toast.success("Welcome! Your account has been created successfully");
        
        // Redirect to login page
        setTimeout(() => {
          router.push("/auth/login?message=Account created. Please login.");
        }, 2000);
      } else {
        toast.error(result.message || "Failed to accept invitation");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  // Loading state (Monochrome, English)
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-6">
          <div className="p-5 bg-white rounded-full shadow-sm border border-black/5 animate-spin">
            <Loader2 className="h-10 w-10 text-black" />
          </div>
          <p className="text-black font-normal uppercase tracking-[0.3em] text-xs">Verifying...</p>
        </div>
      </div>
    );
  }

  // Error state (Monochrome, English)
  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-[0_30px_60px_rgba(0,0,0,0.08)] bg-white border border-black/10 overflow-hidden rounded-3xl">
          <div className="absolute top-0 left-0 w-full h-2 bg-black" />
          <CardHeader className="pb-4 pt-10 px-10 text-center">
            <div className="flex flex-col items-center gap-5">
              <div className="p-4 bg-black rounded-2xl">
                <AlertCircle className="h-10 w-10 text-white" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl font-normal text-black uppercase">Invitation Failed</CardTitle>
                <CardDescription className="text-black/50 font-normal">
                  Sorry, this invitation link could not be processed.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-10 px-10 pb-10">
            <div className="p-6 bg-black text-white rounded-2xl">
              <div className="flex gap-4 items-start">
                <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
                <p className="text-sm font-normal leading-relaxed">
                  {error || "Invitation not found or expired"}
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <p className="text-[10px] font-normal uppercase tracking-widest text-black/30">Common Causes:</p>
              <ul className="text-sm text-black space-y-4 font-normal">
                <li className="flex items-start gap-4">
                  <span className="h-1.5 w-1.5 rounded-full bg-black mt-2 shrink-0" />
                  <span>The link may have expired or was already used.</span>
                </li>
                <li className="flex items-start gap-4">
                  <span className="h-1.5 w-1.5 rounded-full bg-black/20 mt-2 shrink-0" />
                  <span>Double-check your invitation URL link.</span>
                </li>
              </ul>
            </div>
            <Button
              className="w-full bg-black hover:bg-zinc-800 text-white font-normal py-8 rounded-2xl text-md uppercase tracking-[0.2em] transition-all"
              onClick={() => router.push("/")}
            >
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state (Strict Monochrome, English)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4 py-16 selection:bg-black selection:text-white">
      <div className="w-full max-w-2xl space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-700">
        {/* Invitation Info Card */}
        <Card className="shadow-xl bg-white border border-slate-100 overflow-hidden rounded-2xl">
          <CardHeader className="pb-4 pt-10 px-10">
            <div className="flex items-center gap-5">
              <div className="p-3 bg-black rounded-2xl">
                <CheckCircle2 className="h-8 w-8 text-white" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-3xl font-normal text-black uppercase">Join Confirmation</CardTitle>
                <CardDescription className="text-black/50 font-normal">
                  You have been invited to join an organization
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-10 px-10 pb-10">
            {/* Main Organization Highlight */}
            <div className="flex items-center gap-6 p-8 bg-black/5 rounded-3xl border border-black/5 overflow-hidden">
              <div className="p-0 overflow-hidden bg-black rounded-[1.5rem] shadow-xl w-20 h-20 flex items-center justify-center shrink-0">
                {(invitation as any).organization?.logo_url ? (
                  <img 
                    src={(invitation as any).organization.logo_url} 
                    alt="Logo" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Building2 className="h-8 w-8 text-white" />
                )}
              </div>
              <div>
                <p className="text-[10px] font-normal uppercase tracking-[0.3em] text-black/40">Organization</p>
                <p className="text-3xl font-normal text-black leading-tight mt-1">
                  {(invitation as any).organization?.name || "Undefined"}
                </p>
              </div>
            </div>

            {/* Sub Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[
                { label: "Role", value: (invitation as any).role?.name || "Member", icon: Shield },
                { label: "Department", value: (invitation as any).department?.name || "-", icon: Users },
                { label: "Position", value: (invitation as any).position?.title || "-", icon: Briefcase },
              ].map((item, i) => (
                <div key={i} className="flex flex-col gap-3 p-6 bg-white border border-black/10 rounded-2xl hover:border-black transition-all group">
                  <item.icon className="h-5 w-5 text-black group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="text-[10px] font-normal text-black/30 uppercase tracking-[0.25em]">{item.label}</p>
                    <p className="text-md font-normal text-black h-6 leading-tight mt-1 truncate">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {invitation.message && (
              <div className="relative p-8 bg-zinc-50 border border-black/5 rounded-3xl">
                <span className="absolute top-0 left-8 -translate-y-1/2 bg-black text-white px-4 py-1 rounded-full text-[9px] font-normal uppercase tracking-widest">
                  Message
                </span>
                <p className="text-md text-black/70 leading-relaxed font-normal italic">"{invitation.message}"</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile Completion Card */}
        <Card className="shadow-xl bg-white border border-slate-100 rounded-2xl overflow-hidden">
          <CardHeader className="pt-10 px-10">
            <CardTitle className="text-2xl font-normal text-black uppercase">Profile Details</CardTitle>
            <CardDescription className="text-black/50 font-normal">
              This information will be used to create your account
            </CardDescription>
          </CardHeader>
          <CardContent className="px-10 pb-10 pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Email Field (Static) */}
                <div className="space-y-3">
                  <FormLabel className="text-[11px] font-normal text-black uppercase tracking-[0.2em]">Email Address</FormLabel>
                  <div className="p-5 bg-black/5 border border-black/10 rounded-2xl text-black font-normal text-lg select-none">
                    {invitation.email}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* First Name */}
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] font-normal text-black uppercase tracking-[0.2em]">First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} className="h-16 bg-white border-black/20 focus:border-black focus:ring-0 transition-all rounded-2xl px-6 font-normal text-black text-md placeholder:text-black/10" />
                        </FormControl>
                        <FormMessage className="text-[10px] font-normal text-red-600 uppercase" />
                      </FormItem>
                    )}
                  />
                  {/* Last Name */}
                  <FormField
                    control={form.control}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] font-normal text-black uppercase tracking-[0.2em]">Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} className="h-16 bg-white border-black/20 focus:border-black focus:ring-0 transition-all rounded-2xl px-6 font-normal text-black text-md placeholder:text-black/10" />
                        </FormControl>
                        <FormMessage className="text-[10px] font-normal text-red-600 uppercase" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Password Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] font-normal text-black uppercase tracking-[0.2em]">Password</FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Input 
                              type={showPassword ? "text" : "password"} 
                              placeholder="••••••••" 
                              {...field} 
                              className="h-16 bg-white border-black/20 focus:border-black focus:ring-0 transition-all rounded-2xl px-6 font-normal text-black text-md placeholder:text-black/10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-5 top-1/2 -translate-y-1/2 text-black/20 hover:text-black transition-colors"
                            >
                              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-[10px] font-normal text-red-600 uppercase" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirm_password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] font-normal text-black uppercase tracking-[0.2em]">Confirm Password</FormLabel>
                        <FormControl>
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="••••••••" 
                            {...field} 
                            className="h-16 bg-white border-black/20 focus:border-black focus:ring-0 transition-all rounded-2xl px-6 font-normal text-black text-md placeholder:text-black/10"
                          />
                        </FormControl>
                        <FormMessage className="text-[10px] font-normal text-red-600 uppercase" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Monochrome Submit Button (No Bold) */}
                <Button
                  type="submit"
                  className="w-full h-20 bg-black hover:bg-zinc-800 text-white font-normal shadow-2xl transition-all rounded-3xl mt-10 text-lg uppercase tracking-[0.3em]"
                  size="lg"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-4 h-6 w-6 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Join Now"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
