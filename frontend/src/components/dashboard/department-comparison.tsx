"use client"

import { memo } from "react"
import { Trophy, TrendingUp, Medal, Award } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface GroupStat {
  id: string
  name: string
  attendanceRate: number
  totalMembers: number
  presentToday: number
  rank: number
}

interface DepartmentComparisonProps {
  departments?: GroupStat[]
  isLoading?: boolean
  topN?: number
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-md animate-pulse bg-muted ${className}`} />
}

const rankConfig = {
  1: {
    icon: Trophy,
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-500/10 dark:bg-yellow-500/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    label: '🥇 1st Place'
  },
  2: {
    icon: Medal,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-500/10 dark:bg-gray-500/20',
    borderColor: 'border-gray-200 dark:border-gray-800',
    label: '🥈 2nd Place'
  },
  3: {
    icon: Award,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-500/10 dark:bg-orange-500/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
    label: '🥉 3rd Place'
  }
}

export const DepartmentComparison = memo(function DepartmentComparison({ 
  departments = [],
  isLoading = false,
  topN = 5
}: DepartmentComparisonProps) {
  const topGroups = departments
    .sort((a, b) => b.attendanceRate - a.attendanceRate)
    .slice(0, topN)

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 dark:bg-amber-500/20">
            <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <CardTitle>Group Leaderboard</CardTitle>
            <CardDescription>Top performing groups this month</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        ) : topGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No group data</p>
            <p className="text-xs text-muted-foreground mt-1">Data will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {topGroups.map((group, index) => {
              const rank = index + 1
              const config = rankConfig[rank as keyof typeof rankConfig]
              const RankIcon = config?.icon || TrendingUp
              const isTopThree = rank <= 3

              return (
                <div
                  key={group.id}
                  className={cn(
                    "space-y-2 p-4 rounded-xl transition-all",
                    isTopThree && "border-2",
                    config?.borderColor,
                    config?.bgColor,
                    "animate-in fade-in slide-in-from-left-4"
                  )}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg shrink-0",
                        config?.bgColor || "bg-muted"
                      )}>
                        <RankIcon className={cn("h-5 w-5", config?.color || "text-muted-foreground")} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm truncate">{group.name}</h4>
                          {isTopThree && (
                            <Badge variant="outline" className={cn("text-xs shrink-0 border-0", config.bgColor, config.color)}>
                              {config.label}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {group.presentToday} / {group.totalMembers} present today
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={cn(
                        "text-2xl font-bold tabular-nums",
                        group.attendanceRate >= 90 
                          ? "text-green-600 dark:text-green-400"
                          : group.attendanceRate >= 75 
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-amber-600 dark:text-amber-400"
                      )}>
                        {group.attendanceRate}%
                      </div>
                      <p className="text-xs text-muted-foreground">attendance</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <Progress 
                    value={group.attendanceRate} 
                    className={cn(
                      "h-2",
                      isTopThree && "bg-background/50"
                    )}
                  />
                </div>
              )
            })}
          </div>
        )}

        {/* Summary Footer */}
        {!isLoading && topGroups.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Showing top {topGroups.length} groups
              </span>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="font-medium text-green-600 dark:text-green-400">
                  {topGroups[0]?.name || 'N/A'} leads!
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
})
