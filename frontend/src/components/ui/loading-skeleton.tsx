import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 8 }: TableSkeletonProps) {
  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-border">
            {/* 1. Avatar */}
            <TableHead className="w-10 px-4">
            </TableHead>
            
            {/* 2. Name */}
            <TableHead className="font-medium text-xs uppercase tracking-wide py-3">
              <div className="h-4 w-20 rounded bg-muted/90 animate-pulse" />
            </TableHead>
            
            {/* 3. Identification */}
            <TableHead className="font-medium text-xs uppercase tracking-wide">
              <div className="h-3.5 w-16 rounded bg-muted/80 animate-pulse" />
            </TableHead>
            
            {/* 4. Group */}
            <TableHead className="font-medium text-xs uppercase tracking-wide">
              <div className="h-3.5 w-14 rounded bg-muted/80 animate-pulse" />
            </TableHead>
            
            {/* 5. Gender (hidden md) */}
            <TableHead className="font-medium text-xs uppercase tracking-wide hidden md:table-cell">
              <div className="h-3.5 w-12 rounded bg-muted/70 animate-pulse" />
            </TableHead>
            
            {/* 6. Religion (hidden md) */}
            <TableHead className="font-medium text-xs uppercase tracking-wide hidden md:table-cell">
              <div className="h-3.5 w-14 rounded bg-muted/70 animate-pulse" />
            </TableHead>
            
            {/* 7. Status */}
            <TableHead className="font-medium text-xs uppercase tracking-wide">
              <div className="h-3.5 w-16 rounded bg-muted/80 animate-pulse" />
            </TableHead>
            
            {/* 8. Actions */}
            <TableHead className="w-20 text-right pr-6 font-medium text-xs uppercase tracking-wide">
              <div className="flex gap-1 justify-end w-16">
                <div className="size-6 rounded bg-muted/70 animate-pulse" />
                <div className="size-6 rounded bg-muted/70 animate-pulse" />
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex} className="group hover:bg-muted/50 transition-colors">
              {/* 1. Avatar */}
              <TableCell className="px-4 py-3">
                <div className="h-8 w-8 rounded-full bg-muted/80 animate-pulse" />
              </TableCell>

              {/* 2. Name */}
              <TableCell className="py-3">
                <div className="space-y-1">
                  <div className="h-4 w-[180px] rounded-full bg-muted animate-pulse" />
                </div>
              </TableCell>

              {/* 3. Identification (NIK) */}
              <TableCell className="text-sm">
                <div className="h-3.5 w-32 rounded bg-muted/90 animate-pulse" />
              </TableCell>

              {/* 4. Group (badge style) */}
              <TableCell>
                <div className="h-6 w-20 rounded-md bg-muted/80 animate-pulse" />
              </TableCell>

              {/* 5. Gender (hidden md) */}
              <TableCell className="hidden md:table-cell text-sm">
                <div className="h-4 w-16 rounded bg-muted/80 animate-pulse" />
              </TableCell>

              {/* 6. Religion (hidden md) */}
              <TableCell className="hidden md:table-cell text-sm">
                <div className="h-4 w-20 rounded bg-muted/80 animate-pulse" />
              </TableCell>

              {/* 7. Status (dot + text) */}
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-muted/80 animate-pulse" />
                  <div className="h-3.5 w-16 rounded bg-muted/90 animate-pulse" />
                </div>
              </TableCell>

              {/* 8. Actions */}
              <TableCell className="px-4 pr-6 text-right">
                <div className="flex justify-end gap-1">
                  <div className="h-8 w-8 rounded bg-muted/70 animate-pulse" />
                  <div className="h-8 w-8 rounded bg-muted/70 animate-pulse" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <Card className="border-gray-200 dark:border-gray-700">
      <CardHeader className="space-y-3">
        <Skeleton className="h-7 w-[180px]" />
        <Skeleton className="h-5 w-[280px]" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
        </div>
      </CardContent>
    </Card>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-5 w-[120px]" />
          <Skeleton className="h-12 w-full" />
        </div>
      ))}
      <div className="flex gap-3 pt-4">
        <Skeleton className="h-11 w-[140px]" />
        <Skeleton className="h-11 w-[100px]" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <Skeleton className="h-5 w-[120px]" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-9 w-[80px] mb-2" />
              <Skeleton className="h-4 w-[140px]" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-gray-200 dark:border-gray-700">
          <CardHeader>
            <Skeleton className="h-7 w-[220px] mb-2" />
            <Skeleton className="h-4 w-[180px]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[320px] w-full rounded-lg" />
          </CardContent>
        </Card>

        <Card className="border-gray-200 dark:border-gray-700">
          <CardHeader>
            <Skeleton className="h-7 w-[200px] mb-2" />
            <Skeleton className="h-4 w-[160px]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[320px] w-full rounded-lg" />
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="border-gray-200 dark:border-gray-700">
        <CardHeader className="space-y-3">
          <Skeleton className="h-7 w-[180px]" />
          <Skeleton className="h-4 w-[240px]" />
        </CardHeader>
        <CardContent>
          <TableSkeleton rows={5} columns={5} />
        </CardContent>
      </Card>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* Avatar and Name */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-[200px]" />
          <Skeleton className="h-4 w-[150px]" />
        </div>
      </div>

      {/* Details */}
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-[80px]" />
            <Skeleton className="h-5 w-[150px]" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-3 border rounded-md">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-3 w-[150px]" />
          </div>
          <Skeleton className="h-8 w-[80px]" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="w-full h-[300px] flex items-end gap-3 p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="flex-1 flex flex-col justify-end">
          <Skeleton
            className="w-full rounded-t-lg"
            style={{ height: `${Math.random() * 60 + 40}%` }}
          />
        </div>
      ))}
    </div>
  );
}

import { Loader2 } from "lucide-react";

export function PageSkeleton() {
  return (
    <div className="flex min-h-[80vh] w-full flex-col items-center justify-center gap-3">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
    </div>
  );
}
