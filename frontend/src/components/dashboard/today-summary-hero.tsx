"use client"

import { memo } from "react"
import { Calendar, Sun, Cloud, Users, UserCheck, Clock, AlertTriangle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

interface TodaySummaryData {
  totalMembers: number
  checkedIn: number
  onTime: number
  late: number
  absent: number
  attendanceRate: number
}

interface TodaySummaryHeroProps {
  data?: TodaySummaryData
  isLoading?: boolean
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-md animate-pulse bg-muted ${className}`} />
}

export const TodaySummaryHero = memo(function TodaySummaryHero({ 
  data,
  isLoading = false 
}: TodaySummaryHeroProps) {
  const today = new Date()
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' })
  const monthName = today.toLocaleDateString('en-US', { month: 'long' })
  const date = today.getDate()
  const year = today.getFullYear()
  
  // Simple weather simulation (you can integrate real weather API later)
  const hour = today.getHours()
  const weather = hour < 6 || hour > 18 ? 'Night' : hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening'
  const temp = '28°C'
  
  const WeatherIcon = hour < 6 || hour > 18 ? Cloud : hour >= 12 && hour < 15 ? Sun : Cloud

  // Default data
  const summaryData = data || {
    totalMembers: 0,
    checkedIn: 0,
    onTime: 0,
    late: 0,
    absent: 0,
    attendanceRate: 0
  }

  const attendanceProgress = summaryData.totalMembers > 0 
    ? Math.round((summaryData.checkedIn / summaryData.totalMembers) * 100)
    : 0

  return (
    <Card className="overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white">
      <CardContent className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Left: Date & Weather */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-bold">
                  {dayName}
                </h2>
                <p className="text-white/90 text-sm md:text-base">
                  {monthName} {date}, {year}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-white/90">
              <WeatherIcon className="h-5 w-5" />
              <span className="text-sm md:text-base">{weather}, {temp}</span>
            </div>
          </div>

          {/* Center: Today's Stats */}
          <div className="flex-1">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-64" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl md:text-6xl font-bold tabular-nums">
                    {summaryData.checkedIn}
                  </span>
                  <span className="text-xl md:text-2xl text-white/80">
                    / {summaryData.totalMembers}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/90">Total Check-ins Today</span>
                    <span className="font-semibold">{attendanceProgress}%</span>
                  </div>
                  <Progress 
                    value={attendanceProgress} 
                    className="h-3 bg-white/20"
                  />
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge variant="secondary" className="bg-green-500/80 text-white hover:bg-green-500 border-0">
                    <UserCheck className="h-3 w-3 mr-1" />
                    On-time: {summaryData.onTime}
                  </Badge>
                  <Badge variant="secondary" className="bg-amber-500/80 text-white hover:bg-amber-500 border-0">
                    <Clock className="h-3 w-3 mr-1" />
                    Late: {summaryData.late}
                  </Badge>
                  <Badge variant="secondary" className="bg-red-500/80 text-white hover:bg-red-500 border-0">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Absent: {summaryData.absent}
                  </Badge>
                </div>
              </div>
            )}
          </div>

          {/* Right: Quick Insight */}
          <div className="flex-1 md:text-right">
            <div className="inline-flex flex-col items-start md:items-end gap-2 bg-white/10 backdrop-blur-sm rounded-2xl p-4 md:p-6">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span className="text-sm font-medium">Attendance Rate</span>
              </div>
              <div className="text-4xl md:text-5xl font-bold tabular-nums">
                {isLoading ? <Skeleton className="h-12 w-20" /> : `${attendanceProgress}%`}
              </div>
              <p className="text-xs md:text-sm text-white/80">
                {attendanceProgress >= 90 
                  ? '🎉 Excellent attendance!' 
                  : attendanceProgress >= 75 
                  ? '👍 Good attendance' 
                  : '⚠️ Below target'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})
