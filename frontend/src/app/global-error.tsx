'use client';

import { useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';

// Global flag to prevent multiple logs across component instances
const globalErrorLogCache = new Set<string>();

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Create stable error identifier using useMemo
  const errorId = useMemo(() => {
    const message = error?.message || 'unknown';
    const digest = error?.digest || 'no-digest';
    return `${message}-${digest}`;
  }, [error?.message, error?.digest]);

  // Use useEffect with stable error ID to log only once per unique error
  // We use errorId (memoized) to avoid loops
  useEffect(() => {
    // Skip if already logged this exact error
    if (globalErrorLogCache.has(errorId)) {
      return;
    }

    try {
      // Minimal logging - direct to console, no logger utility to avoid loops
      console.error('[GlobalError]', {
        message: error?.message || 'Unknown error',
        digest: error?.digest,
        name: error?.name,
      });
      
      // Mark as logged
      globalErrorLogCache.add(errorId);
      
      // Clean up cache after 10 entries to prevent memory leak
      if (globalErrorLogCache.size > 10) {
        const firstEntry = globalErrorLogCache.values().next().value;
        if (firstEntry) {
          globalErrorLogCache.delete(firstEntry);
        }
      }
    } catch {
      // Silently fail to prevent any loops
    }
  }, [errorId]); // Only depend on memoized errorId

  return (
    <html>
      <body>
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full space-y-4 text-center">
            <h1 className="text-4xl font-bold">500</h1>
            <h2 className="text-xl font-semibold">Something went wrong!</h2>
            <p className="text-muted-foreground">
              We're sorry for the inconvenience. Our team has been notified.
            </p>
            
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg text-left">
                <p className="text-sm font-mono text-red-600 dark:text-red-400">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
            )}
            
            <div className="flex gap-4 justify-center mt-6">
              <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
              >
                Go Home
              </Button>
              <Button onClick={() => reset()}>
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
