import type { Metadata } from "next";
import "./globals.css";

import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { UserProvider } from "@/components/auth/user-provider";
import { TimezoneProvider } from "@/components/providers/timezone-provider";
import { TimeFormatProvider } from "@/components/providers/time-format-provider";
import { QueryProvider } from "@/providers/query-provider";
import OrganizationStatusChecker from "@/components/organization/organization-status-checker";
import AccountStatusChecker from "@/components/organization/account-status-checker";
import { PermissionInitializer } from "@/components/auth/permission-initializer";
import { ToastProvider } from "@/components/notifications/toast-system";
import { DashboardLayoutWrapper } from "@/components/layout/dashboard-layout-wrapper";
import "leaflet/dist/leaflet.css"
import { createClient } from "@/utils/supabase/server";
import {
  getCachedUserProfile,
  getCachedOrganizationTimezone,
  getCachedOrganizationName
} from "@/lib/data-cache";

import { Geist, Geist_Mono } from "next/font/google";
import { InstallPrompt } from "@/components/common/install-prompt";
import { OfflineDetector } from "@/components/common/offline-detector";
import { GlobalTitleManager } from "@/components/common/global-title-manager";
import { AuthErrorHandler } from "@/components/auth/auth-error-handler";
import { PWACleanup } from "@/components/common/pwa-cleanup";


const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  fallback: ["system-ui", "arial"],
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  fallback: [
    "ui-monospace",
    "SFMono-Regular",
    "Monaco",
    "Consolas",
    "Liberation Mono",
    "Courier New",
    "monospace",
  ],
  display: "swap",
});



// Base metadata will be generated dynamically
export async function generateMetadata(): Promise<Metadata> {
  const description = "Sistem manajemen kehadiran digital untuk organisasi Anda. Kelola absensi, jadwal, dan laporan kehadiran dengan mudah.";

  return {
    title: {
      template: '%s',
      default: 'Absensi',
    },
    description,
    metadataBase: new URL(
      process.env.APP_URL
        ? `${process.env.APP_URL}`
        : process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : `https://absensi-ubig.vercel.app`
    ),
    alternates: { canonical: "/" },
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "Absensi",
    },
    formatDetection: {
      telephone: false,
    },
    openGraph: {
      url: "/",
      title: 'Absensi',
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: 'Absensi',
      description,
    },
  };
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" }
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch Supabase user (server-side)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const metadata = user?.user_metadata || {};

  // Use cached profile fetch to avoid duplicates
  const profile = user ? await getCachedUserProfile(user.id) : null;

  const resolvedFirstName = profile?.first_name ?? metadata.first_name ?? undefined;
  const resolvedLastName = profile?.last_name ?? metadata.last_name ?? undefined;

  const displayNameCandidates = [
    profile?.display_name,
    metadata.display_name,
    [resolvedFirstName, resolvedLastName].filter((part) => part && part.trim() !== "").join(" ") || null,
  ].filter((value): value is string => Boolean(value && value.trim() !== ""));

  const resolvedDisplayName = displayNameCandidates[0] ?? null;

  const mappedUser = user
    ? {
      id: user.id,
      email: user.email ?? undefined,
      employee_code: profile?.employee_code ?? undefined,
      first_name: resolvedFirstName ?? undefined,
      last_name: resolvedLastName ?? undefined,
      display_name: resolvedDisplayName ?? undefined,
      profile_photo_url: profile?.profile_photo_url ?? metadata.profile_photo_url ?? undefined,
    }
    : null;

  // ?? Fetch timezone and organization name from the user's organization (cached)
  const timezone = user ? await getCachedOrganizationTimezone(user.id) : "UTC"
  const organizationName = user ? await getCachedOrganizationName(user.id) : null

  // Generate dynamic short title for mobile based on organization
  const dynamicShortTitle = organizationName
    ? organizationName.split(' ').slice(0, 2).join(' ') // First 2 words for mobile
    : "Absensi"

  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512x512.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={dynamicShortTitle} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        <PWACleanup />
        <GlobalTitleManager />
        <InstallPrompt />
        <OfflineDetector />
        <AuthErrorHandler />
        <UserProvider user={mappedUser} />
        {user && <PermissionInitializer userId={user.id} />}
        <TimezoneProvider timezone={timezone}>
          <QueryProvider>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem={true}>
              <TimeFormatProvider>
                <ToastProvider>
                  <OrganizationStatusChecker>
                    <AccountStatusChecker>
                      <DashboardLayoutWrapper>
                        {children}
                      </DashboardLayoutWrapper>
                    </AccountStatusChecker>
                  </OrganizationStatusChecker>
                </ToastProvider>
              </TimeFormatProvider>
            </ThemeProvider>
          </QueryProvider>
          <Toaster />
        </TimezoneProvider>
      </body>
    </html>
  );
}
