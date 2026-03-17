export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

import { authLogger } from '@/lib/logger';
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  // Check for errors from OAuth provider
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (errorParam) {
    authLogger.error('OAuth error:', errorParam, errorDescription);
    const errorMessage = errorDescription
      ? decodeURIComponent(errorDescription)
      : 'Authentication failed';
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(errorMessage)}`
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    } else {
      // Log the detailed error for debugging
      authLogger.error('Exchange code error:', error);

      // Provide more specific error messages
      let errorMessage = 'Could not authenticate user';
      if (error.message.includes('invalid_client')) {
        errorMessage = 'OAuth configuration error. Please contact administrator.';
      } else if (error.message.includes('code')) {
        errorMessage = 'Invalid authorization code. Please try again.';
      }

      return NextResponse.redirect(
        `${origin}/auth/login?error=${encodeURIComponent(errorMessage)}`
      );
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=Missing authorization code`);
}
