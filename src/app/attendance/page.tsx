'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Clock, Target,
  Building2, BarChart3, Activity,
  CheckCircle2, XCircle, Award, Timer
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { createClient } from '@/utils/supabase/client';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { DateFilterBar, DateFilterState } from '@/components/analytics/date-filter-bar';
import { EmptyState } from '@/components/dashboard/empty-state';
import { AnalyticsSkeleton } from '@/components/analytics/analytics-skeleton';
import { useHydration } from '@/hooks/useHydration';
import Link from 'next/link';
import {
  AreaChart,
  Area,
  PieChart as RechartsDonutChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface AttendanceRecord {
  id: string;
  member_name: string;
  department_name: string;
  status: string;
  actual_check_in: string | null;
  actual_check_out: string | null;
  work_duration_minutes: number | null;
  scheduled_duration_minutes?: number; // Default 8 jam (480 min) jika belum check out
  late_minutes: number | null;
  attendance_date: string;
}

interface MasterData {
  totalMembers: number;
  totalDepartments: number;
  averageTeamSize: number;
}

const COLORS = {
  present: '#10b981',
  late: '#f59e0b',
  absent: '#ef4444',
  leave: '#3b82f6',
  excused: '#8b5cf6',
};

export default function AnalyticsPage() {
  const { organizationId } = useHydration();
  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [masterData, setMasterData] = useState<MasterData>({ totalMembers: 0, totalDepartments: 0, averageTeamSize: 0 });
  const [deptMemberCounts, setDeptMemberCounts] = useState<Record<string, number>>({});
  // ✅ FIX 1: Initialize dateRange dengan useMemo untuk stability
  const initialDateRange = useMemo(() => {
    const today = new Date();
    const monthStart = startOfMonth(today);
    monthStart.setHours(0, 0, 0, 0);
    const monthEnd = endOfMonth(today);
    monthEnd.setHours(23, 59, 59, 999);

    return {
      from: monthStart,
      to: monthEnd,
      preset: 'thisMonth' as const,
    };
  }, []);

  const [dateRange, setDateRange] = useState<DateFilterState>(initialDateRange);

  // ✅ FIX 2: Refs untuk tracking state
  const cacheRef = useRef<Map<string, AttendanceRecord[]>>(new Map());
  const fetchInProgressRef = useRef<AbortController | null>(null);
  const lastFetchParamsRef = useRef<{ orgId: string; from: string; to: string } | null>(null);

  // ✅ FIX 3: Simplify getCacheKey (no useCallback needed)
  const getCacheKey = (from: Date, to: Date): string => {
    return `${format(from, 'yyyy-MM-dd')}_${format(to, 'yyyy-MM-dd')}`;
  };


  // ✅ FIX 4: Effect 1 - Trigger saat organizationId berubah ONLY
  useEffect(() => {
    if (!organizationId) {
      console.log('[DASHBOARD] Waiting for organization ID');
      return;
    }

    console.log('[DASHBOARD] Organization changed to:', organizationId);

    // Cancel previous fetch
    if (fetchInProgressRef.current) {
      fetchInProgressRef.current.abort();
    }

    // Reset state
    setDateRange(initialDateRange);
    setAllRecords([]);
    setIsLoading(true);

    const fetchData = async () => {
      try {
        const abortController = new AbortController();
        fetchInProgressRef.current = abortController;

        const supabase = createClient();
        const orgId = organizationId;

        // Fetch master data
        const [membersResult, deptsResult] = await Promise.all([
          supabase
            .from('organization_members')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', orgId)
            .eq('is_active', true),
          supabase
            .from('departments')
            .select('id, name', { count: 'exact' })
            .eq('organization_id', orgId)
        ]);

        if (abortController.signal.aborted) return;

        setMasterData({
          totalMembers: membersResult.count || 0,
          totalDepartments: deptsResult.count || 0,
          averageTeamSize: (membersResult.count || 0) / (deptsResult.count || 1),
        });

        // Fetch member counts
        const { data: memberRows } = await supabase
          .from('organization_members')
          .select('id, is_active, departments:departments!organization_members_department_id_fkey(name)')
          .eq('organization_id', orgId)
          .eq('is_active', true);

        if (abortController.signal.aborted) return;

        const counts: Record<string, number> = {};
        (memberRows || []).forEach((row: any) => {
          const depObj = Array.isArray(row.departments) ? row.departments[0] : row.departments;
          const name: string = depObj?.name || 'Unknown';
          counts[name] = (counts[name] || 0) + 1;
        });
        setDeptMemberCounts(counts);

        // Fetch initial attendance records
        await fetchAttendanceRecords(orgId, initialDateRange, abortController);

        setIsLoading(false);
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log('[DASHBOARD] Fetch aborted');
          return;
        }
        console.error('[DASHBOARD] Error fetching data:', error);
        setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      if (fetchInProgressRef.current) {
        fetchInProgressRef.current.abort();
      }
    };
  }, [organizationId, initialDateRange]);

  // ✅ FIX 5: Effect 2 - Trigger saat dateRange berubah with debounce
  useEffect(() => {
    if (!organizationId) return;

    console.log('[DASHBOARD] Date range changed:', format(dateRange.from, 'yyyy-MM-dd'), '-', format(dateRange.to, 'yyyy-MM-dd'));

    const timeoutId = setTimeout(async () => {
      try {
        const abortController = new AbortController();
        fetchInProgressRef.current = abortController;

        await fetchAttendanceRecords(organizationId, dateRange, abortController);
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('[DASHBOARD] Error fetching records:', error);
        }
      }
    }, 500); // Debounce

    return () => clearTimeout(timeoutId);
  }, [dateRange, organizationId]);

  // ✅ FIX 6: Helper function untuk fetch attendance records
  const fetchAttendanceRecords = async (
    orgId: string | number,
    range: DateFilterState,
    abortController: AbortController
  ) => {
    const cacheKey = getCacheKey(range.from, range.to);

    // Check cache
    if (cacheRef.current.has(cacheKey)) {
      console.log('[DASHBOARD] Using cached data for:', cacheKey);
      setAllRecords(cacheRef.current.get(cacheKey) || []);
      setIsLoading(false);
      return;
    }

    // Check duplicate request
    const fetchKey = {
      orgId: String(orgId),
      from: format(range.from, 'yyyy-MM-dd'),
      to: format(range.to, 'yyyy-MM-dd'),
    };

    if (lastFetchParamsRef.current &&
      lastFetchParamsRef.current.orgId === fetchKey.orgId &&
      lastFetchParamsRef.current.from === fetchKey.from &&
      lastFetchParamsRef.current.to === fetchKey.to) {
      console.log('[DASHBOARD] Duplicate request prevented');
      setIsLoading(false);
      return;
    }

    console.log('[DASHBOARD] Fetching attendance records for:', fetchKey);
    setIsLoading(true);

    const toYMD = (d: Date) => format(d, 'yyyy-MM-dd');
    const params = new URLSearchParams();
    params.set('organizationId', String(orgId));
    params.set('page', '1');
    params.set('limit', '1000');
    params.set('dateFrom', toYMD(range.from));
    params.set('dateTo', toYMD(range.to));

    try {
      const response = await fetch(`/api/attendance-records?${params.toString()}`, {
        method: 'GET',
        credentials: 'same-origin',
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const result = await response.json();

      if (!abortController.signal.aborted) {
        if (result.success && result.data) {
          setAllRecords(result.data);
          // ✅ FIX 7: Save to cache
          cacheRef.current.set(cacheKey, result.data);
          // ✅ FIX 8: Update lastFetchRef
          lastFetchParamsRef.current = fetchKey;
          console.log('[DASHBOARD] Records fetched and cached');
        } else {
          console.error('Failed to fetch records:', result.message);
          setAllRecords([]);
        }
        setIsLoading(false);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('[DASHBOARD] Fetch error:', error);
        setIsLoading(false);
      }
    }
  };

  const getFilterLabel = () => {
    if (!dateRange.preset) {
      // Generate label from actual date range
      const fromDate = format(dateRange.from, 'MMM dd');
      const toDate = format(dateRange.to, 'MMM dd, yyyy');
      return `${fromDate} - ${toDate}`;
    }
    const labels: Record<string, string> = {
      'today': 'Today',
      'yesterday': 'Yesterday',
      'thisWeek': 'This Week',
      'thisMonth': 'This Month',
      'thisYear': 'This Year',
      'lastYear': 'Last Year',
      'last7': 'Last 7 Days',
      'last30': 'Last 30 Days',
    };
    return labels[dateRange.preset] || format(dateRange.from, 'MMM dd') + ' - ' + format(dateRange.to, 'MMM dd, yyyy');
  };

  const filteredRecords = useMemo(() => {
    return allRecords.filter(record => {
      const recordDate = new Date(record.attendance_date);
      recordDate.setHours(0, 0, 0, 0);
      const fromDate = new Date(dateRange.from);
      fromDate.setHours(0, 0, 0, 0);
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      return recordDate >= fromDate && recordDate <= toDate;
    });
  }, [allRecords, dateRange]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const total = filteredRecords.length;
    if (total === 0) return null;

    const presentCount = filteredRecords.filter(r => r.status === 'present').length;
    const lateCount = filteredRecords.filter(r => r.status === 'late').length;
    const absentCount = filteredRecords.filter(r => r.status === 'absent').length;
    const leaveCount = filteredRecords.filter(r => r.status === 'leave' || r.status === 'excused').length;

    // Use actual duration if available, otherwise use scheduled duration (estimated)
    const totalWorkMinutes = filteredRecords.reduce((sum, r) => {
      const duration = r.work_duration_minutes || r.scheduled_duration_minutes || 0;
      return sum + duration;
    }, 0);
    const totalLateMinutes = filteredRecords.reduce((sum, r) => sum + (r.late_minutes || 0), 0);

    const attendanceRate = ((presentCount + lateCount) / total) * 100;
    const punctualityRate = presentCount > 0 ? (presentCount / (presentCount + lateCount)) * 100 : 0;
    const absenteeismRate = (absentCount / total) * 100;
    const avgWorkHours = totalWorkMinutes / total / 60;
    const avgLateMinutes = lateCount > 0 ? totalLateMinutes / lateCount : 0;

    const uniqueMembers = new Set(filteredRecords.map(r => r.member_name));

    return {
      total,
      presentCount,
      lateCount,
      absentCount,
      leaveCount,
      totalWorkHours: totalWorkMinutes / 60,
      attendanceRate,
      punctualityRate,
      absenteeismRate,
      avgWorkHours,
      avgLateMinutes,
      activeMembers: uniqueMembers.size,
    };
  }, [filteredRecords]);

  // Status distribution - always show all statuses
  const statusData = useMemo(() => {
    if (!metrics) {
      return [
        { name: 'Present', value: 0, color: COLORS.present },
        { name: 'Late', value: 0, color: COLORS.late },
        { name: 'Absent', value: 0, color: COLORS.absent },
        { name: 'Leave', value: 0, color: COLORS.leave },
      ];
    }
    return [
      { name: 'Present', value: metrics.presentCount, color: COLORS.present },
      { name: 'Late', value: metrics.lateCount, color: COLORS.late },
      { name: 'Absent', value: metrics.absentCount, color: COLORS.absent },
      { name: 'Leave', value: metrics.leaveCount, color: COLORS.leave },
    ];
  }, [metrics]);

  // Daily trend - supports both daily and monthly views
  const dailyTrend = useMemo(() => {
    const isYearView = dateRange.preset === 'thisYear' || dateRange.preset === 'lastYear';
    const dateMap: Record<string, { present: number; late: number; absent: number }> = {};

    filteredRecords.forEach(record => {
      // For year views, group by month; otherwise by day
      const dateKey = isYearView
        ? format(new Date(record.attendance_date), 'MMM')
        : format(new Date(record.attendance_date), 'MMM dd');

      if (!dateMap[dateKey]) {
        dateMap[dateKey] = { present: 0, late: 0, absent: 0 };
      }
      if (record.status === 'present') dateMap[dateKey].present++;
      else if (record.status === 'late') dateMap[dateKey].late++;
      else if (record.status === 'absent') dateMap[dateKey].absent++;
    });

    const sortedEntries = Object.entries(dateMap).sort(([a], [b]) => {
      if (isYearView) {
        // Sort by month order
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months.indexOf(a) - months.indexOf(b);
      }
      return new Date(a).getTime() - new Date(b).getTime();
    });

    // For daily view, show last 14 days; for year view, show all months
    const slicedEntries = isYearView ? sortedEntries : sortedEntries.slice(-14);

    return slicedEntries.map(([date, data]) => ({
      date,
      ...data,
      total: data.present + data.late + data.absent,
    }));
  }, [filteredRecords, dateRange.preset]);

  // Department performance (rate against total active members in the department)
  const departmentData = useMemo(() => {
    const depts: Record<string, { present: number; late: number; absent: number }> = {};

    filteredRecords.forEach(record => {
      const deptName = record.department_name || 'Unknown';
      if (!depts[deptName]) {
        depts[deptName] = { present: 0, late: 0, absent: 0 };
      }
      if (record.status === 'present') depts[deptName].present++;
      else if (record.status === 'late') depts[deptName].late++;
      else if (record.status === 'absent') depts[deptName].absent++;
    });

    return Object.entries(depts)
      .map(([name, data]) => {
        const members = deptMemberCounts[name] || 0;
        const attended = data.present + data.late; // attended = present + late
        const rate = members > 0 ? (attended / members) * 100 : 0;
        return {
          name,
          rate,
          present: data.present,
          late: data.late,
          absent: data.absent,
          attended,
          members,
          total: members,
        };
      })
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 5);
  }, [filteredRecords, deptMemberCounts]);

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Dashboard</h1>
        </div>
        <DateFilterBar dateRange={dateRange} onDateRangeChange={setDateRange} />
      </motion.div>

      {/* Filter Info */}
      <div className="flex items-center gap-2 text-sm">
        <Badge variant="outline">{getFilterLabel()}</Badge>
        <span className="text-muted-foreground">
          {filteredRecords.length} records from {format(dateRange.from, 'MMM dd')} to {format(dateRange.to, 'MMM dd, yyyy')}
        </span>
      </div>

      {/* SECTION 1: MASTER DATA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Organization Overview</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{masterData.totalMembers}</div>
                <Users className="w-8 h-8 text-blue-500 opacity-50" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Active members in organization</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Groups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{masterData.totalDepartments}</div>
                <Building2 className="w-8 h-8 text-purple-500 opacity-50" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Total organizational units</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Group Size</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{masterData.averageTeamSize.toFixed(0)}</div>
                <Target className="w-8 h-8 text-green-500 opacity-50" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Members per Groups</p>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* SECTION 2: KEY PERFORMANCE INDICATORS */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Key Performance Indicators</h2>
          <Badge variant="outline" className="ml-auto">{getFilterLabel()}</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Attendance Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{metrics?.attendanceRate.toFixed(1) || '0.0'}%</div>
              <div className="mt-2 h-2 bg-green-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-600" style={{ width: `${Math.min(100, metrics?.attendanceRate || 0)}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {metrics ? `${metrics.presentCount + metrics.lateCount} of ${metrics.total} attended` : 'No data available'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Timer className="w-4 h-4 text-blue-600" />
                Punctuality Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{metrics?.punctualityRate.toFixed(1) || '0.0'}%</div>
              <div className="mt-2 h-2 bg-blue-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600" style={{ width: `${Math.min(100, metrics?.punctualityRate || 0)}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {metrics ? `${metrics.presentCount} on-time arrivals` : 'No data available'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500 bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-background">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-600" />
                Avg Work Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{metrics?.avgWorkHours.toFixed(1) || '0.0'}h</div>
              <p className="text-xs text-muted-foreground mt-4">
                {metrics ? 'Per member per day average' : 'No data available'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500 bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-background">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-600" />
                Absenteeism Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{metrics?.absenteeismRate.toFixed(1) || '0.0'}%</div>
              <div className="mt-2 h-2 bg-red-200 rounded-full overflow-hidden">
                <div className="h-full bg-red-600" style={{ width: `${Math.min(100, metrics?.absenteeismRate || 0)}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {metrics ? `${metrics.absentCount} absences recorded` : 'No data available'}
              </p>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Attendance Trends</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Daily/Monthly Trend Chart */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">
                {dateRange.preset === 'thisYear' || dateRange.preset === 'lastYear'
                  ? 'Monthly Attendance Trend'
                  : 'Daily Attendance Trend'}
              </CardTitle>
              <CardDescription>
                {dateRange.preset === 'thisYear' || dateRange.preset === 'lastYear'
                  ? `Attendance pattern for ${getFilterLabel().toLowerCase()}`
                  : 'Last 14 days attendance pattern'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dailyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={dailyTrend}>
                    <defs>
                      <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.present} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={COLORS.present} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.late} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={COLORS.late} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Area type="monotone" dataKey="present" stroke={COLORS.present} fillOpacity={1} fill="url(#colorPresent)" />
                    <Area type="monotone" dataKey="late" stroke={COLORS.late} fillOpacity={1} fill="url(#colorLate)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center">
                  <EmptyState
                    icon={BarChart3}
                    title="No trend data"
                    description="Not enough data points to show trend"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">Status Distribution</CardTitle>
              <CardDescription>Breakdown by attendance status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <ResponsiveContainer width="100%" height={200}>
                  <RechartsDonutChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsDonutChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2">
                  {statusData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-muted-foreground">{item.name}:</span>
                      <span className="font-semibold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* SECTION 4: DEPARTMENT PERFORMANCE */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Award className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Groups Performance</h2>
        </div>
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">Top {departmentData.length} Groups by Attendance Rate</CardTitle>
            <CardDescription>Ranked by percentage of attendance</CardDescription>
          </CardHeader>
          <CardContent>
            {departmentData.length > 0 ? (
              <div className="space-y-4">
                {departmentData.map((dept, index) => {
                  const colorSets = [
                    { name: 'text-blue-700 dark:text-blue-300', badge: 'border-blue-500 text-blue-600', progress: 'bg-blue-500' },
                    { name: 'text-green-700 dark:text-green-300', badge: 'border-green-500 text-green-600', progress: 'bg-green-500' },
                    { name: 'text-yellow-700 dark:text-yellow-400', badge: 'border-yellow-500 text-yellow-600', progress: 'bg-yellow-500' },
                  ] as const;
                  const c = colorSets[index % colorSets.length] || colorSets[0];
                  const displayName = (!dept.name || dept.name === 'Unknown' || dept.name === 'N/A') ? 'no group' : dept.name;
                  return (
                    <div key={`${dept.name}-${index}`} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Link href="/group" className="flex items-center gap-2 group">
                          <Badge variant={'outline'} className={`w-6 h-6 flex items-center justify-center p-0 ${c.badge}`}>
                            {index + 1}
                          </Badge>
                          <span className={`font-medium group-hover:underline ${c.name}`}>{displayName}</span>
                        </Link>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-green-600 dark:text-green-400">{dept.attended}/{dept.members}✓</span>
                          <span className="font-bold min-w-[60px] text-right">{dept.rate.toFixed(1)}%</span>
                        </div>
                      </div>
                      <Progress value={dept.rate} className="h-2" indicatorClassName={c.progress} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={Building2}
                title="No groups data"
                description="No performance data available for groups"
              />
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
