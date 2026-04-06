'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/profile&image/user-avatar';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
// Removed Collapsible - not compatible with table structure
import {
  ChevronDown,
  ChevronRight,
  Clock,
  MapPin,
  FileText,
  Users,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from '@/components/icons/lucide-exports';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';
import { useOrgStore } from '@/store/org-store';

interface AttendanceRecord {
  id: number;
  member_id: number;
  member_name: string;
  department_name: string;
  status: string;
  actual_check_in: string | null;
  actual_check_out: string | null;
  work_duration_minutes: number | null;
  scheduled_duration_minutes?: number; // Default 8 jam (480 min) untuk estimasi
  late_minutes: number | null;
  notes: string | null;
  location: string | null;
  profile_photo_url: string | null;
}

interface LiveAttendanceTableProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
  pageSize?: number;
}

const statusConfig = {
  present: {
    label: 'Hadir',
    color: 'bg-slate-600/10 text-slate-700 dark:bg-slate-600/20 dark:text-green-400 border-green-500/20',
    icon: CheckCircle2,
    dotColor: 'bg-slate-600',
  },
  late: {
    label: 'Terlambat',
    color: 'bg-slate-400/10 text-slate-500 dark:bg-slate-400/20 dark:text-orange-400 border-orange-500/20',
    icon: AlertCircle,
    dotColor: 'bg-slate-400',
  },
  absent: {
    label: 'Tidak Hadir',
    color: 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400 border-red-500/20',
    icon: XCircle,
    dotColor: 'bg-red-500',
  },
  'on-leave': {
    label: 'Cuti',
    color: 'bg-black/10 text-slate-700 dark:bg-black/20 dark:text-blue-400 border-blue-500/20',
    icon: FileText,
    dotColor: 'bg-black',
  },
};


// Simple cache to prevent duplicate requests
const attendanceCache: {
  data: AttendanceRecord[] | null;
  timestamp: number;
  isLoading: boolean;
} = {
  data: null,
  timestamp: 0,
  isLoading: false,
};

const ATTENDANCE_CACHE_DURATION = 120000; // 2 minutes cache (increased from 10s)

function UserAvatarWrapper({ name, photoUrl, userId }: { name: string; photoUrl: string | null; userId?: string }) {
  return (
    <div className="flex items-center gap-3">
      <UserAvatar name={name} photoUrl={photoUrl} userId={userId} size={8} className="border border-border" />
      <span className="font-medium text-foreground">{name}</span>
    </div>
  );
}

export function LiveAttendanceTable({ autoRefresh = true, refreshInterval = 180000, pageSize = 10 }: LiveAttendanceTableProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [currentPage, setCurrentPage] = useState(1);
  const orgStore = useOrgStore();
  const [activeOrgId, setActiveOrgId] = useState<number | null>(null);

  console.log('[LiveAttendance] Initializing activeOrgId', { activeOrgId: orgStore.organizationId });

  useEffect(() => {
    setActiveOrgId(orgStore.organizationId);
  }, [orgStore.organizationId]);

  const toggleRow = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const fetchAttendanceRecords = useCallback(async (force = false) => {
    const now = Date.now();
    const storeOrgId = useOrgStore.getState().organizationId;
    const orgId = activeOrgId || storeOrgId;

    console.log('[LiveAttendance] fetchAttendanceRecords called', {
      activeOrgId,
      storeOrgId,
      finalOrgId: orgId,
      force,
    });

    if (!orgId) {
      console.log('[LiveAttendance] No active organization, skipping fetch');
      return;
    }

    // Check cache first
    if (!force && attendanceCache.data && (now - attendanceCache.timestamp) < ATTENDANCE_CACHE_DURATION) {
      setRecords(attendanceCache.data);
      setLastUpdate(new Date(attendanceCache.timestamp));
      return;
    }

    // Prevent concurrent requests
    if (attendanceCache.isLoading) {
      console.log('[LiveAttendance] Request already in progress, skipping duplicate');
      return;
    }

    attendanceCache.isLoading = true;

    try {
      const supabase = createClient();
      const today = new Date().toISOString().split('T')[0];

      // Get current user's organization
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('[LiveAttendance] Validating user membership', {
        userId: user.id,
        organizationId: orgId,
      });

      // Check membership - try by user_id first, then by any active member in the org
      const { data: orgMember, error: memberError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('organization_id', orgId)
        .eq('is_active', true)
        .maybeSingle();

      console.log('[LiveAttendance] Membership check result', {
        orgMember,
        memberError,
      });

      // If not found by user_id, check if user has any active membership in this org
      // (handles cases where user might be member via different means)
      let finalOrgId = orgMember?.organization_id;

      if (!finalOrgId) {
        // Try to find any active membership for this user in this organization
        const { data: anyMember } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .eq('organization_id', orgId)
          .maybeSingle();

        if (anyMember?.organization_id) {
          finalOrgId = anyMember.organization_id;
          console.log('[LiveAttendance] Found membership (without is_active check)', finalOrgId);
        }
      }

      if (!finalOrgId) {
        console.warn('[LiveAttendance] User not member of organization', {
          userId: user.id,
          organizationId: orgId,
        });
        // Don't throw error, just return early - allow component to show empty state
        attendanceCache.isLoading = false;
        setRecords([]);
        return;
      }

      console.log('[LiveAttendance] Fetching attendance records for org', finalOrgId);

      const { data, error: attendanceError } = await supabase
        .from('attendance_records')
        .select(`
          id,
          status,
          actual_check_in,
          actual_check_out,
          work_duration_minutes,
          late_minutes,
          notes,
          organization_member_id,
          organization_members!inner (
            id,
            user_id,
            organization_id,
            user_profiles!inner (
              first_name,
              last_name,
              profile_photo_url
            ),
            departments!organization_members_department_id_fkey (
              name
            )
          )
        `)
        .eq('organization_members.organization_id', finalOrgId)
        .eq('attendance_date', today)
        .order('actual_check_in', { ascending: false })
        .limit(50);

      if (attendanceError) {
        console.error('[LiveAttendance] Error fetching attendance records', attendanceError);
      }

      const transformedData = data?.map((record: any) => {
        const member = record.organization_members;
        const profile = member?.user_profiles;
        const department = member?.departments;

        return {
          id: record.id,
          member_id: member?.id,
          member_name: profile?.first_name || profile?.last_name || 'Unknown',
          department_name: department?.name || 'N/A',
          status: record.status,
          actual_check_in: record.actual_check_in,
          actual_check_out: record.actual_check_out,
          work_duration_minutes: record.work_duration_minutes,
          scheduled_duration_minutes: 480,
          late_minutes: record.late_minutes,
          notes: record.notes,
          location: null,
          profile_photo_url: profile?.profile_photo_url || null,
          user_id: member?.user_id, // Add user_id for hook to use
        };
      }) || [];

      attendanceCache.data = transformedData;
      attendanceCache.timestamp = Date.now();
      setRecords(transformedData);
      setLastUpdate(new Date());
      console.log('[LiveAttendance] Successfully fetched', transformedData.length, 'records');
    } catch (error) {
      console.error('[LiveAttendance] Failed to fetch attendance records:', error);
      // Don't throw, just log - allow component to continue
    } finally {
      attendanceCache.isLoading = false;
    }
  }, [activeOrgId]);

  // Organization change handler - removed as it's not used
  // const handleOrgChange = useCallback((orgId: string | null) => {
  //   setActiveOrgId(orgId);
  //   if (orgId) fetchAttendanceRecords(true);
  // }, [fetchAttendanceRecords]);

  // Initialize activeOrgId from store on mount
  useEffect(() => {
    const unsubscribe = useOrgStore.subscribe((state, prev) => {
      if (state.organizationId !== prev.organizationId) {
        setActiveOrgId(state.organizationId);
      }
    });
    return unsubscribe;
  }, []);

  // Fetch when activeOrgId changes
  useEffect(() => {
    if (activeOrgId) {
      console.log('[LiveAttendance] activeOrgId changed, fetching', { activeOrgId });
      fetchAttendanceRecords(true);
    }
  }, [activeOrgId, fetchAttendanceRecords]);

  // useEffect untuk auto refresh
  useEffect(() => {
    if (autoRefresh && activeOrgId) {
      console.log('[LiveAttendance] Setting up auto refresh', { activeOrgId, refreshInterval });
      const interval = setInterval(() => {
        fetchAttendanceRecords(true);
      }, refreshInterval);
      return () => {
        console.log('[LiveAttendance] Clearing auto refresh');
        clearInterval(interval);
      };
    }
    return undefined;
  }, [autoRefresh, refreshInterval, fetchAttendanceRecords, activeOrgId]);

  const paginatedRecords = useMemo(() => {
    return records.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize
    );
  }, [records, currentPage, pageSize]);

  const totalPages = useMemo(() => Math.ceil(records.length / pageSize), [records.length, pageSize]);

  const stats = useMemo(() => ({
    total: records.length,
    present: records.filter(r => r.status === 'present').length,
    late: records.filter(r => r.status === 'late').length,
    absent: records.filter(r => r.status === 'absent').length,
  }), [records]);

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
              <Users className="w-5 h-5 text-primary" />
              Live Attendance Today
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Last updated: {format(lastUpdate, 'HH:mm:ss', { locale: idLocale })}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAttendanceRecords()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <div className="text-sm">
              <p className="text-muted-foreground">Total</p>
              <p className="font-bold text-foreground">{stats.total}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-600/5">
            <div className="w-2 h-2 rounded-full bg-slate-600" />
            <div className="text-sm">
              <p className="text-muted-foreground">Present</p>
              <p className="font-bold text-slate-700 dark:text-green-400">{stats.present}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-400/5">
            <div className="w-2 h-2 rounded-full bg-slate-400" />
            <div className="text-sm">
              <p className="text-muted-foreground">Late</p>
              <p className="font-bold text-slate-500 dark:text-orange-400">{stats.late}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/5">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <div className="text-sm">
              <p className="text-muted-foreground">Absent</p>
              <p className="font-bold text-red-600 dark:text-red-400">{stats.absent}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No attendance records today</p>
          </div>
        ) : (
          <>
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Work Hours</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="[&>tr:nth-child(even)]:bg-muted/50">
                  {paginatedRecords.map((record) => {
                    const isExpanded = expandedRows.has(record.id);
                    const config = statusConfig[record.status as keyof typeof statusConfig] || statusConfig.present;
                    const StatusIcon = config.icon;

                    return (
                      <React.Fragment key={record.id}>
                        <TableRow
                          className="hover:bg-muted/50 cursor-pointer"
                          onClick={() => toggleRow(record.id)}
                        >
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-0 h-auto"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRow(record.id);
                              }}
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <UserAvatarWrapper
                              name={record.member_name}
                              photoUrl={record.profile_photo_url}
                              userId={(record as any).user_id}
                            />
                          </TableCell>
                          <TableCell className="text-muted-foreground">{record.department_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn("text-xs", config.color)}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {config.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-foreground">
                            {record.actual_check_in
                              ? format(new Date(record.actual_check_in), 'HH:mm', { locale: idLocale })
                              : '-'
                            }
                          </TableCell>
                          <TableCell className="text-foreground">
                            {record.work_duration_minutes ? (
                              <span className="font-medium">{(record.work_duration_minutes / 60).toFixed(1)}h</span>
                            ) : record.scheduled_duration_minutes && record.actual_check_in ? (
                              <span className="text-muted-foreground">{(record.scheduled_duration_minutes / 60).toFixed(1)}h</span>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow key={`${record.id}-details`}>
                            <TableCell colSpan={6} className="p-0 border-0">
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="p-4 bg-muted/30 border-t border-border">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-primary" />
                                        Time Details
                                      </h4>
                                      <div className="space-y-1 text-sm">
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Check In:</span>
                                          <span className="font-medium text-foreground">
                                            {record.actual_check_in
                                              ? format(new Date(record.actual_check_in), 'HH:mm:ss', { locale: idLocale })
                                              : '-'
                                            }
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Check Out:</span>
                                          <span className="font-medium text-foreground">
                                            {record.actual_check_out
                                              ? format(new Date(record.actual_check_out), 'HH:mm:ss', { locale: idLocale })
                                              : 'Not yet'
                                            }
                                          </span>
                                        </div>
                                        {record.late_minutes && record.late_minutes > 0 && (
                                          <div className="flex justify-between text-slate-500 dark:text-orange-400">
                                            <span>Late by:</span>
                                            <span className="font-bold">{record.late_minutes} min</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {record.location && (
                                      <div className="space-y-2">
                                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                          <MapPin className="w-4 h-4 text-primary" />
                                          Location
                                        </h4>
                                        <p className="text-sm text-muted-foreground">{record.location}</p>
                                      </div>
                                    )}

                                    {record.notes && (
                                      <div className="space-y-2">
                                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                          <FileText className="w-4 h-4 text-primary" />
                                          Notes
                                        </h4>
                                        <p className="text-sm text-muted-foreground">{record.notes}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, records.length)} of {records.length} records
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
