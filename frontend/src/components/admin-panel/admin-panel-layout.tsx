"use client";

import { DashboardLayoutWrapper } from "@/components/layout/dashboard-layout-wrapper";

export default function AdminPanelLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayoutWrapper>{children}</DashboardLayoutWrapper>;
}
