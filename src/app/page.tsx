'use client';

import { useOrgStore } from '@/store/org-store'
import { useHydration } from '@/hooks/useHydration'
import { useEffect, useState, useMemo } from 'react';
import type { ComponentType, SVGProps } from 'react';
import type { TooltipProps } from 'recharts';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrganizationName } from '@/hooks/use-organization-name';
import {
  Clock,
  Users,
  CheckCircle2,
  BarChart3,
  Activity,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { DateFilterBar, DateFilterState } from '@/components/analytics/date-filter-bar';
import { ActivityTimeline } from '@/components/dashboard/activity-timeline';
import { LiveAttendanceTable } from '@/components/dashboard/live-attendance-table';
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';

// Types
interface AttendanceRecord {
  id: number;
  member_name: string;
  department_name: string;
  status: string;
  actual_check_in: string | null;
  actual_check_out: string | null;
  work_duration_minutes: number | null;
  scheduled_duration_minutes?: number;
  attendance_date: string;
  profile_photo_url: string | null;
}

interface DashboardStats {
  totalPresent: number;
  totalLate: number;
  totalAbsent: number;
  onTimeRate: number;
  avgWorkHours: number;
  totalWorkHoursToday: number;
  activeMembers: number;
}


const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#06B6D4',
  purple: '#8B5CF6',
};

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-3">
        <p className="font-semibold text-sm mb-2">{label}</p>
        {payload?.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: (entry as any)?.color }} />
            <span className="text-muted-foreground">{entry?.name}:</span>
            <span className="font-bold">{entry?.value as number}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const EnhancedStatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  trendLabel,
  color = 'blue',
  delay = 0
}: {
  title: string;
  value: string | number;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  trendLabel?: string;
  color?: 'blue' | 'green' | 'orange' | 'purple';
  delay?: number;
}) => {
  const iconColorClasses = {
    blue: 'bg-black/10 text-slate-700 dark:bg-black/20 dark:text-blue-400',
    green: 'bg-slate-600/10 text-slate-700 dark:bg-slate-600/20 dark:text-green-400',
    orange: 'bg-slate-400/10 text-slate-500 dark:bg-slate-400/20 dark:text-orange-400',
    purple: 'bg-slate-500/10 text-slate-600 dark:bg-slate-500/20 dark:text-purple-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="h-full"
    >
      <Card className="h-full border-border bg-card hover:shadow-lg transition-shadow duration-200">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
              <h3 className="text-3xl font-bold text-foreground">{value}</h3>
            </div>
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", iconColorClasses[color])}>
              <Icon className="w-6 h-6" />
            </div>
          </div>

          {trend && (
            <div className="flex items-center gap-1.5 text-sm">
              {trend === 'up' && <ArrowUp className="w-4 h-4 text-slate-700 dark:text-green-400" />}
              {trend === 'down' && <ArrowDown className="w-4 h-4 text-red-600 dark:text-red-400" />}
              {trend === 'neutral' && <Minus className="w-4 h-4 text-muted-foreground" />}
              <span className={cn(
                "font-semibold",
                trend === 'up' && "text-slate-700 dark:text-green-400",
                trend === 'down' && "text-red-600 dark:text-red-400",
                trend === 'neutral' && "text-muted-foreground"
              )}>
                {trendValue}
              </span>
              {trendLabel && (
                <span className="text-muted-foreground text-xs ml-1">{trendLabel}</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function pageDashboard() {
  const orgStore = useOrgStore();
  const { organizationName, loading: orgLoading } = useOrganizationName();
  const queryClient = useQueryClient();
  const { isHydrated, organizationId: hydratedOrgId } = useHydration();
  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([]);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);

  // Date filter state
  const [dateRange, setDateRange] = useState<DateFilterState>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);
    return { from: today, to: endOfToday, preset: 'today' };
  });

  const [stats, setStats] = useState<DashboardStats>({
    totalPresent: 0,
    totalLate: 0,
    totalAbsent: 0,
    onTimeRate: 0,
    avgWorkHours: 0,
    totalWorkHoursToday: 0,
    activeMembers: 0,
  });

  // Clock - update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Monitor organization changes
  useEffect(() => {
    if (orgStore.organizationId) {
      console.log('[DASHBOARD] Organization changed to:', orgStore.organizationId, orgStore.organizationName);
    }
  }, [orgStore.organizationId, orgStore.organizationName]);

  // Hydration handled by useHydration()

  // Invalidate cache when organization changes
  useEffect(() => {
    if (orgStore.organizationId) {
      // Invalidate ALL organization-related queries
      queryClient.invalidateQueries({ queryKey: ['organization'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: ['members'] })
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      queryClient.invalidateQueries({ queryKey: ['leaves'] })
      queryClient.invalidateQueries({ queryKey: ['groups'] })
    }
  }, [orgStore.organizationId, queryClient])

  // Fetch data
  useEffect(() => {
    if (!isHydrated) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);

        const getPersistedOrgId = () => {
          try {
            const raw = localStorage.getItem('org-store');
            if (!raw) return null as number | null;
            const parsed = JSON.parse(raw);
            const val = parsed?.state?.organizationId ?? parsed?.state?.organization_id;
            const n = Number(val);
            return Number.isFinite(n) ? n : null;
          } catch {
            return null as number | null;
          }
        };

        const orgId = hydratedOrgId ?? orgStore.organizationId ?? getPersistedOrgId();

        if (!orgId) {
          // wait until hydration/store resolves organizationId
          return;
        }

        console.log('[DASHBOARD] Fetching data for organization:', orgId);

        // Kirim filter ke API home (real-time, no-cache di server)
        const toYMD = (d?: Date): string => (d ? d.toISOString().slice(0, 10) : '');
        const params = new URLSearchParams();
        params.set('organizationId', String(orgId));
        params.set('limit', '1000');
        params.set('page', '1');
        const fromStr: string | undefined = dateRange?.from ? toYMD(dateRange.from) : undefined;
        const toStr: string | undefined = dateRange?.to ? toYMD(dateRange.to) : undefined;
        if (fromStr !== undefined) params.set('dateFrom', fromStr);
        if (toStr !== undefined) params.set('dateTo', toStr);

        const response = await fetch(`/api/home?${params.toString()}`, {
          method: 'GET',
          credentials: 'same-origin',
        });
        const result = await response.json();

        if (result.success && Array.isArray(result.data)) {
          console.log('[DASHBOARD] Fetched', result.data.length, 'records for org', orgId);

          const toMinutes = (s?: string | null) => {
            const str = s ?? '';
            const hh = parseInt(str.match(/(\d+)h/)?.[1] ?? '0', 10);
            const mm = parseInt(str.match(/(\d+)m/)?.[1] ?? '0', 10);
            return hh * 60 + mm;
          };

          const mapped: AttendanceRecord[] = result.data.map((it: any) => ({
            id: Number(it.id),
            member_name: it?.member?.name ?? '',
            department_name: it?.member?.department ?? '',
            status: it?.status ?? '',
            actual_check_in: it?.checkIn ?? null,
            actual_check_out: it?.checkOut ?? null,
            work_duration_minutes: toMinutes(it?.workHours), // fallback 0 jika tidak ada
            scheduled_duration_minutes: 480, // opsional: default 8 jam agar metrik tidak 0 total
            attendance_date: it?.date,
            profile_photo_url: it?.member?.avatar ?? null,
          }));

          setAllRecords(mapped);
        } else {
          console.error('Failed to fetch attendance records:', result.message);
          setAllRecords([]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setAllRecords([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isHydrated, hydratedOrgId, orgStore.organizationId, dateRange]);

  // Filter records
  const fromDateStr = dateRange.from.toISOString().split('T')[0];
  const toDateStr = dateRange.to.toISOString().split('T')[0];

  const filteredRecords = useMemo(() => {
    if (allRecords.length === 0) return [];

    const fromDate = new Date(fromDateStr + 'T00:00:00');
    const toDate = new Date(toDateStr + 'T23:59:59.999');

    return allRecords.filter(record => {
      const recordDate = new Date(record.attendance_date + 'T00:00:00');
      return recordDate >= fromDate && recordDate <= toDate;
    });
  }, [allRecords, fromDateStr, toDateStr]);

  // Calculate stats
  useEffect(() => {
    const present = filteredRecords.filter(r => r.status === 'present' || r.status === 'late').length;
    const late = filteredRecords.filter(r => r.status === 'late').length;
    const absent = filteredRecords.filter(r => r.status === 'absent').length;

    // Use actual duration if available, otherwise use scheduled duration (estimated)
    const totalWorkMinutes = filteredRecords.reduce((sum, r) => {
      const duration = r.work_duration_minutes || r.scheduled_duration_minutes || 0;
      return sum + duration;
    }, 0);
    const totalWorkHours = totalWorkMinutes / 60;
    const avgHours = filteredRecords.length > 0 ? totalWorkMinutes / filteredRecords.length / 60 : 0;

    const uniqueMembers = new Set(
      filteredRecords.filter(r => r.actual_check_in).map(r => r.member_name)
    );

    setStats({
      totalPresent: present,
      totalLate: late,
      totalAbsent: absent,
      onTimeRate: present > 0 ? ((present - late) / present) * 100 : 0,
      avgWorkHours: avgHours,
      totalWorkHoursToday: totalWorkHours,
      activeMembers: uniqueMembers.size,
    });
  }, [filteredRecords]);

  // Get filter period label and chart data
  const getFilterLabel = () => {
    if (!dateRange.preset) return 'Custom Range';

    const labels: Record<string, string> = {
      'today': 'Today',
      'last7': 'Last 7 Days',
      'last30': 'Last 30 Days',
      'thisYear': 'This Year',
      'lastYear': 'Last Year',
    };

    return labels[dateRange.preset] || 'Custom Range';
  };

  // Dynamic chart data based on filter
  const chartData = useMemo(() => {
    const isToday = dateRange.preset === 'today';
    const isYearView = dateRange.preset === 'thisYear' || dateRange.preset === 'lastYear';

    if (isToday) {
      // Hourly data for today
      const hours = Array.from({ length: 24 }, (_, i) => i);
      const hourlyMap: Record<number, { present: number; late: number; absent: number }> = {};

      hours.forEach(hour => {
        hourlyMap[hour] = { present: 0, late: 0, absent: 0 };
      });

      filteredRecords.forEach(record => {
        if (record.actual_check_in) {
          const checkInDate = new Date(record.actual_check_in);
          const hour = checkInDate.getHours();

          if (hourlyMap[hour]) {
            if (record.status === 'present') hourlyMap[hour].present++;
            else if (record.status === 'late') hourlyMap[hour].late++;
            else if (record.status === 'absent') hourlyMap[hour].absent++;
          }
        }
      });

      return hours.map(hour => ({
        label: `${hour.toString().padStart(2, '0')}:00`,
        present: hourlyMap[hour]?.present || 0,
        late: hourlyMap[hour]?.late || 0,
        absent: hourlyMap[hour]?.absent || 0,
      }));
    } else if (isYearView) {
      // Monthly data for year views
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyMap: Record<string, { present: number; late: number; absent: number }> = {};

      months.forEach(month => {
        monthlyMap[month] = { present: 0, late: 0, absent: 0 };
      });

      filteredRecords.forEach(record => {
        const date = new Date(record.attendance_date);
        const monthName = months[date.getMonth()];

        if (monthName && monthlyMap[monthName]) {
          if (record.status === 'present') monthlyMap[monthName].present++;
          else if (record.status === 'late') monthlyMap[monthName].late++;
          else if (record.status === 'absent') monthlyMap[monthName].absent++;
        }
      });

      return months.map(month => ({
        label: month,
        present: monthlyMap[month]?.present || 0,
        late: monthlyMap[month]?.late || 0,
        absent: monthlyMap[month]?.absent || 0,
      }));
    } else {
      // Daily data for other periods
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const daysMap: Record<string, { present: number; late: number; absent: number }> = {};

      days.forEach(day => {
        daysMap[day] = { present: 0, late: 0, absent: 0 };
      });

      filteredRecords.forEach(record => {
        const date = new Date(record.attendance_date);
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayName = dayNames[date.getDay()];

        if (dayName && daysMap[dayName]) {
          if (record.status === 'present') daysMap[dayName].present++;
          else if (record.status === 'late') daysMap[dayName].late++;
          else if (record.status === 'absent') daysMap[dayName].absent++;
        }
      });

      return days.map(day => ({
        label: day,
        present: daysMap[day]?.present || 0,
        late: daysMap[day]?.late || 0,
        absent: daysMap[day]?.absent || 0,
      }));
    }
  }, [filteredRecords, dateRange.preset]);

  // Status distribution
  const statusData = useMemo(() => [
    { name: 'Present', value: stats.totalPresent, color: COLORS.success },
    { name: 'Late', value: stats.totalLate, color: COLORS.warning },
    { name: 'Absent', value: stats.totalAbsent, color: COLORS.danger },
  ].filter(item => item.value > 0), [stats]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="ml-5 mt-5 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center   md:justify-between gap-4">
        <div>
          {orgLoading ? (
            <Skeleton className="h-9 w-80 mb-2" />
          ) : (
            <h1 className="text-3xl font-bold tracking-tight">
              Dashboard{(organizationName || orgStore.organizationName) && ` — ${organizationName || orgStore.organizationName}`}
            </h1>
          )}
          <p className="text-muted-foreground text-sm mt-1">
            {format(currentTime, 'EEEE, MMMM dd, yyyy • HH:mm:ss')}
          </p>
        </div>

        <DateFilterBar
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <EnhancedStatCard
          title="Total Work Hours"
          value={`${stats.totalWorkHoursToday.toFixed(1)}h`}
          icon={Clock}
          trend="up"
          trendValue="+12%"
          trendLabel="from last period"
          color="blue"
          delay={0}
        />
        <EnhancedStatCard
          title="Active Members"
          value={stats.activeMembers}
          icon={Users}
          trend="up"
          trendValue="+5"
          trendLabel="new this week"
          color="green"
          delay={0.1}
        />
        <EnhancedStatCard
          title="On-Time Rate"
          value={`${stats.onTimeRate.toFixed(0)}%`}
          icon={CheckCircle2}
          trend="up"
          trendValue="+8%"
          trendLabel="improvement"
          color="purple"
          delay={0.2}
        />
        <EnhancedStatCard
          title="Avg Hours/Member"
          value={`${stats.avgWorkHours.toFixed(1)}h`}
          icon={Activity}
          trend="neutral"
          trendValue="0%"
          trendLabel="no change"
          color="orange"
          delay={0.3}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Weekly Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-4"
        >
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    {dateRange.preset === 'today'
                      ? 'Hourly Attendance'
                      : (dateRange.preset === 'thisYear' || dateRange.preset === 'lastYear')
                        ? 'Monthly Attendance'
                        : 'Attendance Trend'
                    }
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {dateRange.preset === 'today'
                      ? 'Check-in patterns throughout the day'
                      : (dateRange.preset === 'thisYear' || dateRange.preset === 'lastYear')
                        ? `Monthly attendance patterns for ${getFilterLabel().toLowerCase()}`
                        : `Attendance patterns for ${getFilterLabel().toLowerCase()}`
                    }
                  </CardDescription>
                </div>
                <Badge variant="outline">{getFilterLabel()}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.success} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.warning} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.warning} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                  <XAxis
                    dataKey="label"
                    stroke="currentColor"
                    opacity={0.5}
                    fontSize={12}
                    angle={dateRange.preset === 'today' ? -45 : 0}
                    textAnchor={dateRange.preset === 'today' ? 'end' : 'middle'}
                    height={dateRange.preset === 'today' ? 60 : 30}
                  />
                  <YAxis
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    stroke="currentColor"
                    opacity={0.5}
                    fontSize={12}
                    tickFormatter={(value) => Math.floor(value).toString()}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={0}
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="present" stroke={COLORS.success} fillOpacity={1} fill="url(#colorPresent)" />
                  <Area type="monotone" dataKey="late" stroke={COLORS.warning} fillOpacity={1} fill="url(#colorLate)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Status Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-3"
        >
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">Status Distribution</CardTitle>
              <CardDescription className="text-muted-foreground">Breakdown by status</CardDescription>
            </CardHeader>
            <CardContent>
              {statusData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
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
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {statusData.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-foreground">{item.name}</span>
                        </div>
                        <span className="font-semibold text-foreground">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Activity Timeline & Live Attendance Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <ActivityTimeline limit={10} autoRefresh={true} />
        </motion.div>

        {/* Live Attendance Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="lg:col-span-1"
        >
          <LiveAttendanceTable
            autoRefresh={true}
            refreshInterval={60000}
            pageSize={5}
          />
        </motion.div>
      </div>
    </div>
  );
}
