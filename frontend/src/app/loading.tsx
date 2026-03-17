import { PageSkeleton } from "@/components/ui/loading-skeleton"

export default function AppLoading() {
  return (
    <div className="p-4 md:p-6">
      <PageSkeleton />
    </div>
  )
}
