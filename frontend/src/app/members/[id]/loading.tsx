import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function MemberProfileLoading() {
  return (
    <div className="mx-auto w-full max-w-screen-2xl px-3 pb-4 sm:px-4 lg:px-6">
      {/* Header Card */}
      <Card className="border-muted-foreground/20 bg-gradient-to-br from-primary/10 via-background to-background">
        <CardContent className="flex flex-col gap-4 p-4 sm:px-5 sm:py-5 lg:flex-row lg:flex-nowrap lg:items-start lg:justify-between lg:gap-8">
          <div className="flex min-w-0 flex-1 flex-col items-center gap-4 text-center lg:flex-row lg:items-center lg:text-left">
            <div className="relative">
              <Skeleton className="h-16 w-16 rounded-full sm:h-20 sm:w-20" />
              <Skeleton className="absolute bottom-1 right-1 h-5 w-5 rounded-full border-4 border-background" />
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <Skeleton className="h-7 w-[200px] sm:h-8 sm:w-[250px]" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-[180px] sm:h-4 sm:w-[220px]" />
              <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
                <Skeleton className="h-5 w-20 rounded-md" />
                <Skeleton className="h-5 w-24 rounded-md" />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex w-full flex-col gap-2 lg:w-auto lg:min-w-[260px]">
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-11 w-full rounded-xl" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
            <Skeleton className="h-11 w-full rounded-xl" />
            <div className="flex justify-end">
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 space-y-4">
        {/* Grid Layout for Top Cards */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Contact & Information */}
          <Card className="border-muted-foreground/20">
            <CardHeader className="flex flex-col gap-0.5 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base font-semibold">
                    <Skeleton className="h-5 w-[180px]" />
                  </CardTitle>
                  <CardDescription>
                    <Skeleton className="h-4 w-[200px] mt-1" />
                  </CardDescription>
                </div>
                <Skeleton className="h-8 w-[200px] rounded-md" />
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="flex items-center gap-2.5 py-1">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-0.5">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-[140px]" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Schedule Information and Recent Attendance */}
          <div className="space-y-4">
            {/* Work Schedule */}
            <Card className="border-muted-foreground/20">
              <CardHeader className="flex flex-col gap-0.5 pb-3">
                <CardTitle className="text-base font-semibold">
                  <Skeleton className="h-5 w-[140px]" />
                </CardTitle>
                <CardDescription>
                  <Skeleton className="h-4 w-[180px] mt-1" />
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border bg-card/60 p-3">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-md" />
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="flex items-center gap-2.5 rounded-lg border bg-card/60 px-3 py-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-0">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-24 mt-0.5" />
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 rounded-lg border bg-card/60 px-3 py-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-0">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-32 mt-0.5" />
                    </div>
                  </div>
                </div>

                <Skeleton className="h-9 w-full rounded-md" />
              </CardContent>
            </Card>

            {/* Recent Attendance */}
            <Card className="border-muted-foreground/20">
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base font-semibold">
                        <Skeleton className="h-5 w-[160px]" />
                      </CardTitle>
                      <CardDescription>
                        <Skeleton className="h-4 w-[200px] mt-1" />
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Skeleton className="h-8 w-[110px] rounded-md" />
                    <Skeleton className="h-8 w-[130px] rounded-md" />
                    <Skeleton className="h-8 w-20 rounded-md" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="min-h-[200px]">
                <div className="max-h-64 space-y-2.5">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg border bg-card/60 p-3">
                      <Skeleton className="h-9 w-9 rounded-full" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-5 w-16 rounded-md" />
                        </div>
                        <div className="mt-1 flex items-center gap-3">
                          <Skeleton className="h-3 w-16" />
                          <Skeleton className="h-3 w-16" />
                          <Skeleton className="h-3 w-12" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Performance Highlights */}
        <Card className="border-muted-foreground/20">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <CardTitle className="text-base font-semibold">
                  <Skeleton className="h-5 w-[180px]" />
                </CardTitle>
                <CardDescription>
                  <Skeleton className="h-4 w-[200px] mt-1" />
                </CardDescription>
              </div>
              <Skeleton className="h-16 w-32 rounded-xl" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="mx-auto w-full max-w-[240px] md:max-w-[320px]">
              <Skeleton className="h-64 w-full rounded-full" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-3 rounded-2xl border border-muted-foreground/10 bg-card/70 px-5 py-4">
                  <div className="space-y-1.5">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-7 w-12" />
                  </div>
                  <Skeleton className="h-12 w-12 rounded-full" />
                </div>
              ))}
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-3 rounded-xl border border-muted-foreground/10 bg-muted/40 px-4 py-3">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
