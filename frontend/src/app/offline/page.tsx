"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  RefreshCcw,
  ShieldCheck,
  WifiOff,
  ArrowLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function OfflinePage() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    // Monitor online status
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    // Check initial status
    updateOnlineStatus();

    // Listen for online/offline events
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  const handleRetry = () => {
    // Go back 1 step; fallback to home if no history
    if (typeof window !== 'undefined') {
      if (window.history.length > 1) {
        window.history.go(-1);
      } else {
        router.replace("/");
      }
    }
  };

  const handleGoBack = () => {
    // Go back 2 steps; fallback to home if history stack too short
    if (typeof window !== 'undefined') {
      if (window.history.length > 2) {
        window.history.go(-2);
      } else if (window.history.length > 1) {
        window.history.go(-1);
      } else {
        router.replace("/");
      }
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4 dark:from-neutral-950 dark:to-neutral-900">
      <Card className="w-full max-w-md border-gray-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
        <CardHeader className="space-y-4 text-center pb-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800">
            <WifiOff className="h-8 w-8 text-gray-600 dark:text-neutral-400" />
          </div>

          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-neutral-100">
              No Internet Connection
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 dark:text-neutral-400">
              Please check your network settings and try again
            </CardDescription>
          </div>

          {isOnline && (
            <Badge
              variant="outline"
              className="mx-auto inline-flex items-center gap-2 border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-900/20 dark:text-green-400"
            >
              <div className="h-2 w-2 rounded-full bg-green-600 dark:bg-green-400 animate-pulse" />
              Connection Restored
            </Badge>
          )}
        </CardHeader>

        <CardContent className="space-y-4 px-6 pb-6">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/50">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-gray-600 dark:text-neutral-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-900 dark:text-neutral-100">
                  Your data is safe
                </p>
                <p className="text-xs text-gray-600 dark:text-neutral-400">
                  Don't worry, your session and unsaved changes are preserved. Once you're back online, everything will continue where you left off.
                </p>
              </div>
            </div>
          </div>

          <Separator className="bg-gray-200 dark:bg-neutral-800" />

          <div className="space-y-3 text-center text-sm text-gray-600 dark:text-neutral-400">
            <p className="font-medium">Troubleshooting tips:</p>
            <ul className="space-y-1.5 text-xs text-left">
              <li className="flex items-start gap-2">
                <span className="text-gray-400">•</span>
                <span>Check if your Wi-Fi or mobile data is turned on</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400">•</span>
                <span>Try turning airplane mode off</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400">•</span>
                <span>Restart your router if using Wi-Fi</span>
              </li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 px-6 pb-6">
          <Button
            className="w-full bg-gray-900 text-white hover:bg-gray-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 font-medium"
            size="lg"
            onClick={handleRetry}
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Retry Connection
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="w-full text-gray-700 hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
            onClick={handleGoBack}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
