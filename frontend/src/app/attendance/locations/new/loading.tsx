import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function NewLocationLoading() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-[220px]" />
          <Skeleton className="h-4 w-[300px]" />
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[200px]" />
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Location Name */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-[70px]" />
              <Skeleton className="h-24 w-full" />
            </div>

            {/* Coordinates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-[70px]" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>

            {/* Radius */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-[90px]" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* Map Preview */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-[300px] w-full rounded-lg" />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-4 border-t">
              <Skeleton className="h-10 w-[100px]" />
              <Skeleton className="h-10 w-[140px]" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
