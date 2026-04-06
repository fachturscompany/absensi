import { LucideIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, TrendingDown } from "lucide-react"

interface StatsCardProps {
  title: string
  value: number
  loading?: boolean
  icon: LucideIcon
  trend?: "up" | "down" | "neutral"
  color?: string
}

export function StatsCard({ title, value, loading, icon: Icon, trend, color = "bg-muted/50" }: StatsCardProps) {
  return (
    <div className="hover:shadow-lg border border-border rounded-sm p-6 transition-all">
      <div className="pb-2">
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-2`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
      </div>
      <div>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-2xl font-bold">
            {value.toLocaleString()}
            {trend && (
              <span className={`ml-2 text-sm ${trend === "up" ? "text-slate-700" : "text-red-600"}`}>
                {trend === "up" ? <TrendingUp className="w-4 h-4 inline" /> : <TrendingDown className="w-4 h-4 inline" />}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
