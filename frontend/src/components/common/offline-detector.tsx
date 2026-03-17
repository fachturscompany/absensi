"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export function OfflineDetector() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const publicPaths = ["/auth", "/invite", "/offline"];
    const isPublicPath = publicPaths.some((path) => pathname?.startsWith(path));

    if (isPublicPath) return;

    const handleOffline = () => {
      console.log("[OFFLINE] Redirecting to offline page");
      router.push("/offline");
    };

    if (!navigator.onLine) {
      handleOffline();
    }

    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("offline", handleOffline);
    };
  }, [pathname, router]);

  return null;
}
