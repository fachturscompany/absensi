import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function AnalyticsLoading() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 animate-pulse">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-[250px]" /> {/* Title */}
          <Skeleton className="h-4 w-[350px]" /> {/* Description */}
        </div>
        <Skeleton className="h-10 w-[280px]" /> {/* Date filter */}
      </div>

      {/* Filter Info Badge */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-[100px] rounded-full" />
        <Skeleton className="h-4 w-[280px]" />
      </div>

      {/* SECTION 1: Organization Overview */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-6 w-[200px]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="border-border">
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-[110px]" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-9 w-[80px]" />
                  <Skeleton className="w-8 h-8 rounded" />
                </div>
                <Skeleton className="h-3 w-[180px] mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* SECTION 2: Key Performance Indicators */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-6 w-[240px]" />
          <Skeleton className="h-6 w-[100px] rounded-full ml-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className={`border-l-4 ${i === 0 ? 'border-l-green-500' : i === 1 ? 'border-l-blue-500' : i === 2 ? 'border-l-orange-500' : 'border-l-red-500'}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 w-[120px]" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-9 w-[90px] mb-2" />
                <Skeleton className="h-2 w-full rounded-full mb-2" />
                <Skeleton className="h-3 w-[150px]" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* SECTION 3: Attendance Trends */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-6 w-[180px]" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Daily Trend Chart */}
          <Card className="border-border">
            <CardHeader>
              <Skeleton className="h-5 w-[200px]" />
              <Skeleton className="h-4 w-[220px]" />
            </CardHeader>
            <CardContent>
              <div className="h-[300px] relative">
                {/* Grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between py-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-px w-full" />
                  ))}
                </div>
                {/* Area chart simulation */}
                <div className="absolute bottom-0 left-0 right-0 h-[200px] flex items-end justify-around px-4 gap-1">
                  {[...Array(14)].map((_, i) => (
                    <Skeleton 
                      key={i} 
                      className="flex-1" 
                      style={{ height: `${Math.random() * 70 + 30}%` }}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Pie Chart */}
          <Card className="border-border">
            <CardHeader>
              <Skeleton className="h-5 w-[180px]" />
              <Skeleton className="h-4 w-[200px]" />
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-center">
                  <Skeleton className="h-[200px] w-[200px] rounded-full" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Skeleton className="w-3 h-3 rounded-full" />
                      <Skeleton className="h-4 w-[60px]" />
                      <Skeleton className="h-4 w-[35px]" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SECTION 4: Department Performance */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-6 w-[220px]" />
        </div>
        <Card className="border-border">
          <CardHeader>
            <Skeleton className="h-5 w-[280px]" />
            <Skeleton className="h-4 w-[240px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-6 h-6 rounded" />
                      <Skeleton className="h-4 w-[180px]" />
                    </div>
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-4 w-8" />
                      <Skeleton className="h-4 w-8" />
                      <Skeleton className="h-4 w-8" />
                      <Skeleton className="h-5 w-[60px]" />
                    </div>
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
