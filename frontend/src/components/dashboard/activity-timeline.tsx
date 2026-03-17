'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, AlertCircle, XCircle, Activity } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ActivityItem {
  id: string;
  memberName: string;
  status: string;
  checkInTime: string;
  lateMinutes: number | null;
  department: string | null;
}

interface ActivityTimelineProps {
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const statusConfig = {
  present: {
    label: 'Hadir',
    color: 'bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400',
    icon: CheckCircle2,
    iconColor: 'text-green-600 dark:text-green-400',
  },
  on_time: {
    label: 'Hadir',
    color: 'bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400',
    icon: CheckCircle2,
    iconColor: 'text-green-600 dark:text-green-400',
  },
  late: {
    label: 'Terlambat',
    color: 'bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400',
    icon: AlertCircle,
    iconColor: 'text-orange-600 dark:text-orange-400',
  },
  early_leave: {
    label: 'Pulang Awal',
    color: 'bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400',
    icon: AlertCircle,
    iconColor: 'text-orange-600 dark:text-orange-400',
  },
  late_and_early: {
    label: 'Telat & Pulang Awal',
    color: 'bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400',
    icon: AlertCircle,
    iconColor: 'text-orange-600 dark:text-orange-400',
  },
  excused_absence: {
    label: 'Izin/Cuti',
    color: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
    icon: Clock,
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  absent: {
    label: 'Tidak Hadir',
    color: 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400',
    icon: XCircle,
    iconColor: 'text-red-600 dark:text-red-400',
  },
} as const;

// Simple cache to prevent duplicate requests
const activityCache: {
  data: ActivityItem[] | null;
  timestamp: number;
  isLoading: boolean;
} = {
  data: null,
  timestamp: 0,
  isLoading: false,
};

const CACHE_DURATION = 60000; // 60 seconds cache (increased from 5s)

export function ActivityTimeline({ 
  limit = 10, 
  autoRefresh = true,
  refreshInterval = 120000 // 2 minutes (increased from 30s)
}: ActivityTimelineProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchActivities = async (force = false) => {
    const now = Date.now();
    
    // Check cache first (prevent duplicate requests)
    if (!force && activityCache.data && (now - activityCache.timestamp) < CACHE_DURATION) {
      setActivities(activityCache.data);
      setLastUpdate(new Date(activityCache.timestamp));
      setLoading(false);
      return;
    }

    // Prevent concurrent requests (CRITICAL: blocks duplicates)
    if (activityCache.isLoading) {
      console.log('[ActivityTimeline] Request already in progress, skipping duplicate');
      return;
    }

    activityCache.isLoading = true;

    try {
      const response = await fetch(`/api/dashboard/recent-activity?limit=${limit}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        activityCache.data = result.data;
        activityCache.timestamp = Date.now();
        setActivities(result.data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
      activityCache.isLoading = false;
    }
  };

  useEffect(() => {
    fetchActivities();

    if (autoRefresh) {
      const interval = setInterval(() => fetchActivities(true), refreshInterval);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [limit, autoRefresh, refreshInterval]);

  if (loading) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-foreground">
            <Activity className="w-5 h-5 text-primary animate-pulse" />
            Recent Activity
          </CardTitle>
          <CardDescription className="text-muted-foreground">Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-10 h-10 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-foreground">
            <Activity className="w-5 h-5 text-primary" />
            Recent Activity
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Last updated: {format(lastUpdate, 'HH:mm:ss', { locale: idLocale })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Activity className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No activity today</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
              <Activity className="w-5 h-5 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Last updated: {format(lastUpdate, 'HH:mm:ss', { locale: idLocale })}
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            {activities.length} activities
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/50 via-primary/20 to-transparent" />
          
          <div className="space-y-4">
            {activities.map((activity, index) => {
              const config = statusConfig[activity.status as keyof typeof statusConfig] || statusConfig.absent;
              const Icon = config.icon;
              const checkInDate = new Date(activity.checkInTime);

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative flex items-start gap-4 pb-4"
                >
                  {/* Timeline Dot */}
                  <div className="relative z-10 flex-shrink-0">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2 border-border bg-card",
                      "shadow-sm"
                    )}>
                      <Icon className={cn("w-5 h-5", config.iconColor)} />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">
                          {activity.memberName}
                        </p>
                        {activity.department && (
                          <p className="text-xs text-muted-foreground truncate">
                            {activity.department}
                          </p>
                        )}
                      </div>
                      <Badge 
                        variant="outline" 
                        className={cn("flex-shrink-0 text-xs", config.color)}
                      >
                        {config.label}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>
                        {format(checkInDate, 'HH:mm', { locale: idLocale })}
                      </span>
                      <span>•</span>
                      <span>
                        {formatDistanceToNow(checkInDate, { 
                          addSuffix: true, 
                          locale: idLocale 
                        })}
                      </span>
                    </div>

                    {activity.lateMinutes && activity.lateMinutes > 0 && (
                      <div className="mt-1 text-xs text-orange-600 dark:text-orange-400">
                        Late by {activity.lateMinutes} minutes
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
