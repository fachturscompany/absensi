'use client'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip
} from 'recharts'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { BarChart3 } from 'lucide-react'

// 🔥 IMPORT ChartDataItem dari hook
import type { ChartDataItem } from '@/hooks/use-dashboard-data.ts'
import type { DateFilterState } from '@/components/attendance/dashboard/date-filter-bar.tsx'

const COLORS = {
  success: '#10B981',
  warning: '#F59E0B',
} as const

// ✅ TOOLTIP TYPE Recharts
interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    color: string
    payload: ChartDataItem
  }>
  label?: string
}

// ✅ PROPS TYPE
interface Props {
  chartData: ChartDataItem[]
  dateRange: DateFilterState
  maxAttendance: number
  getFilterLabel: () => string
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-3 min-w-[140px]">
        <p className="font-semibold text-sm mb-3 text-foreground">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-xs mb-1 last:mb-0">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color || COLORS.success }}
            />
            <span className="text-muted-foreground capitalize">{entry.name}:</span>
            <span className="font-bold text-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function ChartsArea({
  chartData,
  dateRange,
  maxAttendance,
}: Props) {
  const isToday = dateRange.preset === 'today'

  return (
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
                {isToday ? 'Hourly Attendance' : 'Attendance Trend'}
              </CardTitle>
            </div>
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

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                opacity={0.1}
                vertical={false}
              />

              <XAxis
                dataKey="label"
                stroke="currentColor"
                opacity={0.5}
                fontSize={12}
                angle={isToday ? -45 : 0}
                textAnchor={isToday ? 'end' : 'middle'}
                height={isToday ? 60 : 30}
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                type="number"
                domain={[0, maxAttendance > 5 ? 'auto' : Math.max(maxAttendance, 1) + 1]}
                allowDecimals={false}
                stroke="currentColor"
                opacity={0.5}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />

              <RechartsTooltip content={<CustomTooltip />} />

              <Area
                type="monotone"
                dataKey="present"
                stroke={COLORS.success}
                fillOpacity={1}
                fill="url(#colorPresent)"
              />
              <Area
                type="monotone"
                dataKey="late"
                stroke={COLORS.warning}
                fillOpacity={1}
                fill="url(#colorLate)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  )
}
