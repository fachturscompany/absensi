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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-400" />
          <p className="text-gray-300 text-lg">Verifying invitation...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <CardTitle className="text-red-400">Invalid Invitation</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-gray-300">
            <Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertTitle className="text-red-400">Error</AlertTitle>
              <AlertDescription className="text-red-300">{error || "Invitation not found"}</AlertDescription>
            </Alert>
            <div className="mt-6 space-y-2">
              <p className="text-sm text-gray-300">
                This invitation may have:
              </p>
              <ul className="text-sm text-gray-400 list-disc list-inside space-y-1">
                <li>Expired (invitations are valid for 7 days)</li>
                <li>Already been accepted</li>
                <li>Been cancelled by the organization</li>
              </ul>
            </div>
            <Button
              className="w-full mt-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0"
              onClick={() => router.push("/")}
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state - Show accept form
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-2xl space-y-6">
        {/* Invitation Details Card */}
        <Card className="shadow-xl bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-400" />
              <CardTitle className="text-2xl text-white">You're Invited!</CardTitle>
            </div>
            <CardDescription className="text-base text-gray-300">
              Complete your profile to join the organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Organization Info */}
              <div className="flex items-center gap-3 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                <Building2 className="h-5 w-5 text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-gray-300">Organization</p>
                  <p className="text-lg font-semibold text-white">
                    {(invitation.organization as any)?.name || "Unknown Organization"}
                  </p>
                </div>
              </div>

              {/* Pre-assigned Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {invitation.role && (
                  <div className="flex items-center gap-2 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                    <Shield className="h-4 w-4 text-purple-400" />
                    <div>
                      <p className="text-xs text-gray-400">Role</p>
                      <p className="text-sm font-medium text-gray-200">{(invitation.role as any)?.name}</p>
                    </div>
                  </div>
                )}
                
                {invitation.department && (
                  <div className="flex items-center gap-2 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                    <Users className="h-4 w-4 text-blue-400" />
                    <div>
                      <p className="text-xs text-gray-400">Group</p>
                      <p className="text-sm font-medium text-gray-200">{invitation.department.name}</p>
                    </div>
                  </div>
                )}
                
                {invitation.position && (
                  <div className="flex items-center gap-2 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                    <Briefcase className="h-4 w-4 text-green-400" />
                    <div>
                      <p className="text-xs text-gray-400">Position</p>
                      <p className="text-sm font-medium text-gray-200">{invitation.position.title}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Personal Message */}
              {invitation.message && (
                <>
                  <Separator className="bg-gray-600" />
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-sm font-medium text-blue-300 mb-2">Personal Message</p>
                    <p className="text-sm text-gray-300">{invitation.message}</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Accept Form Card */}
        <Card className="shadow-xl bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl text-white">Complete Your Profile</CardTitle>
            <CardDescription className="text-base text-gray-300">
              Create your account to accept the invitation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Email (Read-only) */}
                <div>
                  <FormLabel className="text-gray-200">Email Address</FormLabel>
                  <Input
                    value={invitation.email}
                    disabled
                    className="bg-gray-700/50 border-gray-600 text-gray-400"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    This will be your login email
                  </p>
                </div>

                {/* First Name */}
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-200">First Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John"
                          {...field}
                          disabled={submitting}
                          className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/20"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Last Name */}
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-200">Last Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Doe"
                          {...field}
                          disabled={submitting}
                          className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/20"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-200">Password *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            {...field}
                            disabled={submitting}
                            className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/20 pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-gray-400 hover:text-white"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <p className="text-xs text-gray-400">
                        Must be at least 8 characters
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Confirm Password */}
                <FormField
                  control={form.control}
                  name="confirm_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-200">Confirm Password *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••"
                            {...field}
                            disabled={submitting}
                            className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/20 pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-gray-400 hover:text-white"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white border-0"
                  size="lg"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Accept Invitation & Create Account"
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
