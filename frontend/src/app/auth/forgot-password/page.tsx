"use client";

import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  return (
    <div className="flex h-dvh w-full items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Mail className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold">Forgot Password</CardTitle>
          <CardDescription>
            Enter your registered email address. We will send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ForgotPasswordForm />
          <Button variant="ghost" className="w-full" asChild>
            <Link href="/auth/login" className="flex items-center justify-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to login page
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
















































