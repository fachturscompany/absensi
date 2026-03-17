import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { logger } from '@/lib/logger';

/**
 * Performance monitoring hook
 * Tracks page views, performance metrics, and errors
 */
export function useMonitoring() {
  const pathname = usePathname();

  useEffect(() => {
    // Track page view
    if (pathname) {
      trackPageView(pathname);
    }
  }, [pathname]);

  useEffect(() => {
    // Track Web Vitals
    if (typeof window !== 'undefined' && 'web-vital' in window) {
      trackWebVitals();
    }

    // Setup error tracking
    const errorHandler = (event: ErrorEvent) => {
      logger.error('Unhandled error', event.error, {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
      
      // Send to monitoring service
      sendToMonitoring('error', {
        message: event.message,
        stack: event.error?.stack,
        url: window.location.href,
      });
    };

    const rejectionHandler = (event: PromiseRejectionEvent) => {
      logger.error('Unhandled promise rejection', event.reason);
      
      // Send to monitoring service
      sendToMonitoring('unhandledRejection', {
        reason: event.reason,
        url: window.location.href,
      });
    };

    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', rejectionHandler);

    return () => {
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', rejectionHandler);
    };
  }, []);

  return null;
}

/**
 * Track page views
 */
function trackPageView(pathname: string) {
  // Google Analytics
  if (typeof window !== 'undefined' && 'gtag' in window) {
    (window as any).gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
      page_path: pathname,
    });
  }

  // Custom analytics
  logger.debug('Page view', { pathname, timestamp: new Date().toISOString() });
}

/**
 * Track Web Vitals
 */
function trackWebVitals() {
  if ('PerformanceObserver' in window) {
    try {
      // Track Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        
        logger.debug('LCP', { value: lastEntry.renderTime || lastEntry.loadTime });
        sendToMonitoring('webVital', {
          name: 'LCP',
          value: lastEntry.renderTime || lastEntry.loadTime,
        });
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // Track First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          logger.debug('FID', { value: entry.processingStart - entry.startTime });
          sendToMonitoring('webVital', {
            name: 'FID',
            value: entry.processingStart - entry.startTime,
          });
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Track Cumulative Layout Shift (CLS)
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        let cls = 0;
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            cls += entry.value;
          }
        });
        
        logger.debug('CLS', { value: cls });
        sendToMonitoring('webVital', {
          name: 'CLS',
          value: cls,
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      logger.warn('Failed to setup performance observers', { error });
    }
  }
}

/**
 * Send data to monitoring service
 */
async function sendToMonitoring(type: string, data: any) {
  if (process.env.NODE_ENV === 'production') {
    try {
      // Example: Send to your monitoring endpoint
      await fetch('/api/monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          data,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      });
    } catch (error) {
      // Silently fail to avoid infinite loops
      logger.debug('Failed to send monitoring data', { error });
    }
  }
}

/**
 * Track custom events
 */
export function trackEvent(category: string, action: string, label?: string, value?: number) {
  // Google Analytics
  if (typeof window !== 'undefined' && 'gtag' in window) {
    (window as any).gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }

  // Custom analytics
  logger.debug('Event tracked', { category, action, label, value });
  
  sendToMonitoring('event', {
    category,
    action,
    label,
    value,
  });
}

/**
 * Track user interactions
 */
export function trackInteraction(element: string, action: string, metadata?: any) {
  trackEvent('User Interaction', action, element);
  
  logger.debug('User interaction', {
    element,
    action,
    metadata,
    timestamp: new Date().toISOString(),
  });
}
