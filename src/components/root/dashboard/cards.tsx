'use client'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'

export interface DashboardStats {
  totalPresent: number
  totalLate: number
  totalAbsent: number
  totalWorkHoursToday: number
  activeMembers: number
  onTimeRate: number
  avgWorkHours: number
}

interface Props {
  stats: DashboardStats
}

const EnhancedStatCard = ({
  title, value, delay = 0
}: {
  title: string
  value: string | number
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  trendLabel?: string
  color?: 'blue' | 'green' | 'orange' | 'purple'
  delay?: number
}) => {

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay, duration: 0.3 }} 
      className="h-full"
    >
      <Card className="h-full border-border bg-card hover:shadow-lg transition-shadow duration-200">
        <CardContent className="">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
              <h3 className="text-3xl font-bold text-foreground">{value}</h3>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function StatsCards({ stats }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <EnhancedStatCard
        title="Total Work Hours"
        value={`${(stats.totalWorkHoursToday || 0).toFixed(1)}h`}
        trend="up" 
        trendValue="+12%" 
        trendLabel="from last period"
        color="blue" 
        delay={0}
      />
      <EnhancedStatCard
        title="Active Members"
        value={stats.activeMembers || 0}
        trend="up" 
        trendValue="+5" 
        trendLabel="new this week"
        color="green" 
        delay={0.1}
      />
      <EnhancedStatCard
        title="On-Time Rate"
        value={`${(stats.onTimeRate || 0).toFixed(0)}%`}
        trend="up" 
        trendValue="+8%" 
        trendLabel="improvement"
        color="purple" 
        delay={0.2}
      />
      <EnhancedStatCard
        title="Avg Hours/Member"
        value={`${(stats.avgWorkHours || 0).toFixed(1)}h`}
        trend="neutral" 
        trendValue="0%" 
        trendLabel="no change"
        color="orange" 
        delay={0.3}
      />
    </div>
  )
}
