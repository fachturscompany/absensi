import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, User, Calendar, Check, AlertCircle } from "@/components/icons/lucide-exports"
import { formatDistanceToNow } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"

type Activity = {
  id: string
  memberName: string
  status: string
  checkInTime: string
  lateMinutes?: number
  department?: string
}

interface RecentActivityFeedProps {
  activities?: Activity[]
  isLoading?: boolean
  limit?: number
}

const getStatusIcon = (status?: string) => {
  switch (status?.toLowerCase()) {
    case 'present':
      return <Check className="h-4 w-4 text-green-600" />
    case 'late':
      return <AlertCircle className="h-4 w-4 text-amber-600" />
    case 'absent':
      return <AlertCircle className="h-4 w-4 text-red-600" />
    case 'excused':
      return <Clock className="h-4 w-4 text-blue-600" />
    default:
      return <Clock className="h-4 w-4 text-gray-400" />
  }
}

const getStatusColor = (status?: string) => {
  switch (status?.toLowerCase()) {
    case 'present':
      return 'bg-green-50 text-green-700 border-green-200'
    case 'late':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'absent':
      return 'bg-red-50 text-red-700 border-red-200'
    case 'excused':
      return 'bg-blue-50 text-blue-700 border-blue-200'
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200'
  }
}

const formatTimestamp = (timestamp: string) => {
  try {
    const date = new Date(timestamp)
    if (isNaN(date.getTime())) return 'Just now'
    return formatDistanceToNow(date, { addSuffix: true })
  } catch {
    return 'Just now'
  }
}

export function RecentActivityFeed({ 
  activities = [], 
  isLoading = false,
  limit = 10 
}: RecentActivityFeedProps) {
  // Show loading skeleton
  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest check-ins and updates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 pb-4 border-b last:border-0">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  // Limit activities to display
  const displayActivities = activities.slice(0, limit)

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>
          {activities.length > 0 
            ? `Latest check-ins and updates (${activities.length} total)` 
            : 'No recent activity'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {displayActivities.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-1">No Recent Activity</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Check-ins and member activities will appear here. Start recording attendance to see recent updates.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayActivities.map((activity, index) => (
              <div 
                key={activity.id || index} 
                className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0"
              >
                {/* Avatar/Icon */}
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary">
                    {activity.status ? (
                      getStatusIcon(activity.status)
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Member name and action */}
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {activity.memberName}
                      </p>
                      {activity.department && (
                        <p className="text-sm text-muted-foreground">
                          {activity.department}
                        </p>
                      )}
                    </div>
                    
                    {/* Status badge */}
                    {activity.status && (
                      <Badge 
                        variant="outline" 
                        className={`text-xs flex-shrink-0 ${getStatusColor(activity.status)}`}
                      >
                        {activity.status}
                      </Badge>
                    )}
                  </div>

                  {/* Check-in time */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    {activity.checkInTime && (
                      <>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(activity.checkInTime).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <span>•</span>
                        <span>{formatTimestamp(activity.checkInTime)}</span>
                      </>
                    )}
                    {activity.lateMinutes && activity.lateMinutes > 0 && (
                      <span className="text-amber-600">+{activity.lateMinutes}m late</span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Show more indicator */}
            {activities.length > limit && (
              <div className="pt-2 text-center">
                <p className="text-xs text-muted-foreground">
                  Showing {limit} of {activities.length} activities
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
