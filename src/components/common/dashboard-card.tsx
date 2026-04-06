import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// loading handled via simple animate-pulse placeholder
import type { LucideIcon } from "@/components/icons/lucide-exports";
import { cn } from "@/lib/utils";
import * as React from "react";

interface DashboardCardProps {
  title: string;
  value?: string | number;
  description?: string;
  icon?: LucideIcon;
  iconColor?: string;
  iconClass?: string;
  trend?: {
    value: number;
    label: string;
  };
  loading?: boolean;
  children?: React.ReactNode;
}

export function DashboardCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor = "text-slate-700",
  iconClass,
  trend,
  loading = false,
  children,
}: DashboardCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
  {Icon && <Icon className={cn(iconClass ?? "h-4 w-4", iconColor)} />}
      </CardHeader>
      <CardContent>
        {children ? (
          children
        ) : (
          <div className="space-y-1">
            {loading ? (
              <div className="h-7 w-16 bg-muted animate-pulse rounded" />
            ) : (
              <div className="text-2xl font-bold">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </div>
            )}
            {description && (
              <p className="text-xs text-muted-foreground">
                {description}
              </p>
            )}
            {trend && (
              <div className="flex items-center text-xs">
                <span className={cn(
                  "font-medium",
                  trend.value > 0 ? "text-slate-700" : 
                  trend.value < 0 ? "text-red-600" : 
                  "text-gray-600"
                )}>
                  {trend.value > 0 ? "+" : ""}{trend.value}%
                </span>
                <span className="text-muted-foreground ml-1">
                  {trend.label}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
