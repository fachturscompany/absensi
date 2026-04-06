"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createBrowserClient } from "@supabase/ssr";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const FormSchema = z
  .object({
    password: z.string().min(8, { message: "Password minimal harus 8 karakter." }),
    confirmPassword: z.string().min(8, { message: "Konfirmasi password minimal harus 8 karakter." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const setupSession = async () => {
      // PKCE flow: URL berisi ?code=xxx
      const code = searchParams.get("code");
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (!exchangeError) {
          setSessionReady(true);
          return;
        } else {
          setError("Link reset password sudah tidak valid atau expired. Silakan request ulang.");
          return;
        }
      }

      // Legacy flow: cek existing session atau hash token
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSessionReady(true);
        return;
      }

      // Listen untuk PASSWORD_RECOVERY event (implicit flow)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY") {
          setSessionReady(true);
        }
      });

      // Timeout: setelah 5 detik tidak ada session, kasih error
      const timeout = setTimeout(() => {
        if (!sessionReady) {
          setError("Session tidak ditemukan. Silakan klik link dari email lagi.");
        }
        subscription.unsubscribe();
      }, 5000);

      return () => {
        clearTimeout(timeout);
        subscription.unsubscribe();
      };
    };

    setupSession();
  }, []);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: z.infer<typeof FormSchema>) => {
    if (!sessionReady) {
      setError("Session belum siap. Gunakan link dari email.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const { error: updateError } = await supabase.auth.updateUser({
      password: values.password,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    setSuccess("Password berhasil diubah. Silakan login kembali.");
    setLoading(false);

    setTimeout(() => {
      router.push("/auth/login");
    }, 2000);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!sessionReady && !error && (
          <p className="text-sm text-amber-500">
            ⏳ Memverifikasi session...
          </p>
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}
        {success && <p className="text-sm text-slate-700">{success}</p>}

        <Button className="w-full" type="submit" disabled={loading || !sessionReady}>
          {loading ? "Saving..." : "Save New Password"}
        </Button>
      </form>
    </Form>
  );
}
