'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  Info,
  X,
  Bell,
  Loader2,
  Zap,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading' | 'custom';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  updateToast: (id: string, toast: Partial<Toast>) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Default icons for toast types
const defaultIcons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  loading: Loader2,
  custom: Bell,
};

// Default colors for toast types
const toastColors = {
  success: 'border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100',
  error: 'border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100',
  warning: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100',
  info: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100',
  loading: 'border-muted bg-background',
  custom: 'border bg-background',
};

const iconColors = {
  success: 'text-green-600 dark:text-green-400',
  error: 'text-red-600 dark:text-red-400',
  warning: 'text-amber-600 dark:text-amber-400',
  info: 'text-blue-600 dark:text-blue-400',
  loading: 'text-primary',
  custom: 'text-foreground',
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const Icon = toast.icon || defaultIcons[toast.type];
  const isLoading = toast.type === 'loading';

  useEffect(() => {
    if (!isLoading && toast.duration !== 0 && toast.duration !== Infinity) {
      const timer = setTimeout(() => {
        onDismiss();
      }, toast.duration || 5000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [toast.duration, onDismiss, isLoading]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.5 }}
      transition={{ type: "spring", stiffness: 500, damping: 40 }}
      className={cn(
        'relative flex items-start gap-3 rounded-lg border-2 p-4 shadow-lg',
        'min-w-[320px] max-w-[420px]',
        toastColors[toast.type],
        toast.className
      )}
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        <Icon className={cn(
          'h-5 w-5',
          iconColors[toast.type],
          isLoading && 'animate-spin'
        )} />
      </div>

      {/* Content */}
      <div className="flex-1 space-y-1">
        <p className="text-sm font-semibold leading-none">
          {toast.title}
        </p>
        {toast.description && (
          <p className="text-sm opacity-90">
            {toast.description}
          </p>
        )}
        {toast.action && (
          <Button
            variant="link"
            size="sm"
            onClick={toast.action.onClick}
            className="h-auto p-0 text-xs font-medium"
          >
            {toast.action.label}
          </Button>
        )}
      </div>

      {/* Close button */}
      {toast.dismissible !== false && !isLoading && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {/* Progress bar for auto-dismiss */}
      {!isLoading && toast.duration !== 0 && toast.duration !== Infinity && (
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: (toast.duration || 5000) / 1000, ease: 'linear' }}
          className="absolute bottom-0 left-0 h-1 rounded-b-lg bg-current opacity-20"
        />
      )}
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const updateToast = useCallback((id: string, updatedToast: Partial<Toast>) => {
    setToasts((prev) =>
      prev.map((toast) =>
        toast.id === id ? { ...toast, ...updatedToast } : toast
      )
    );
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, updateToast, clearToasts }}>
      {children}
      <div className="fixed bottom-0 right-0 z-50 flex flex-col-reverse gap-2 p-4 sm:flex-col">
        <AnimatePresence>
          {toasts.map((toast) => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onDismiss={() => removeToast(toast.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

// Utility functions for common toast types
export function toast(options: Omit<Toast, 'id' | 'type'> & { type?: ToastType }) {
  const { addToast } = useToast();
  return addToast({ type: 'custom', ...options });
}

toast.success = (title: string, options?: Partial<Toast>) => {
  const { addToast } = useToast();
  return addToast({ type: 'success', title, ...options });
};

toast.error = (title: string, options?: Partial<Toast>) => {
  const { addToast } = useToast();
  return addToast({ type: 'error', title, ...options });
};

toast.warning = (title: string, options?: Partial<Toast>) => {
  const { addToast } = useToast();
  return addToast({ type: 'warning', title, ...options });
};

toast.info = (title: string, options?: Partial<Toast>) => {
  const { addToast } = useToast();
  return addToast({ type: 'info', title, ...options });
};

toast.loading = (title: string, options?: Partial<Toast>) => {
  const { addToast } = useToast();
  return addToast({
    type: 'loading',
    title,
    duration: Infinity,
    dismissible: false,
    ...options,
  });
};

toast.promise = async <T,>(
  promise: Promise<T>,
  options: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: any) => string);
  }
): Promise<T> => {
  const { addToast, updateToast } = useToast();
  
  const id = addToast({
    type: 'loading',
    title: options.loading,
    duration: Infinity,
    dismissible: false,
  });

  try {
    const result = await promise;
    updateToast(id, {
      type: 'success',
      title: typeof options.success === 'function' ? options.success(result) : options.success,
      duration: 5000,
      dismissible: true,
    });
    return result;
  } catch (error) {
    updateToast(id, {
      type: 'error',
      title: typeof options.error === 'function' ? options.error(error) : options.error,
      duration: 5000,
      dismissible: true,
    });
    throw error;
  }
};

// Custom themed toasts
export function AttendanceToast({ 
  type, 
  name, 
  time 
}: { 
  type: 'checkin' | 'checkout'; 
  name: string; 
  time: string 
}) {
  const { addToast } = useToast();
  
  return addToast({
    type: 'success',
    title: type === 'checkin' ? 'Checked In' : 'Checked Out',
    description: `${name} at ${time}`,
    icon: type === 'checkin' ? Zap : Sparkles,
    className: type === 'checkin' 
      ? 'border-green-400 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950'
      : 'border-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950',
  });
}
