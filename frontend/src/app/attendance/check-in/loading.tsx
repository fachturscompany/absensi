import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function CheckInLoading() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      <div className="w-full max-w-2xl mx-auto space-y-6 p-4">
        {/* Header */}
        <div className="text-center space-y-2">
          <Skeleton className="h-10 w-[200px] mx-auto" />
          <Skeleton className="h-4 w-[300px] mx-auto" />
        </div>

        {/* Main Card */}
        <Card>
          <CardHeader className="text-center">
            <Skeleton className="h-7 w-[180px] mx-auto" />
            <Skeleton className="h-4 w-[250px] mx-auto" />
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Clock Display */}
            <div className="text-center space-y-2">
              <Skeleton className="h-16 w-[280px] mx-auto" />
              <Skeleton className="h-5 w-[200px] mx-auto" />
            </div>

            {/* Location Display */}
            <div className="space-y-3 p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-6 w-[80px]" />
              </div>
              <Skeleton className="h-4 w-full" />
            </div>

            {/* Camera Preview */}
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              <Skeleton className="w-full h-full rounded-lg" />
            </div>

            {/* Check-in Button */}
            <Skeleton className="h-12 w-full" />

            {/* Status Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton className="h-6 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-[90px]" />
                <Skeleton className="h-6 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
