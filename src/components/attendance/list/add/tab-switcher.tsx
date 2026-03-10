// src/components/attendance/list/add/tab-switcher.tsx
import { TabsList, TabsTrigger } from "@/components/ui/tabs"

interface TabSwitcherProps {
  onTabChange: (tab: "single" | "batch") => void
}

export function TabSwitcher({ onTabChange }: TabSwitcherProps) {
  return (
    <TabsList className="grid w-full grid-cols-2">
      <TabsTrigger value="single" onClick={() => onTabChange("single")}>
        Single Entry
      </TabsTrigger>
      <TabsTrigger value="batch" onClick={() => onTabChange("batch")}>
        Batch Entry
      </TabsTrigger>
    </TabsList>
  )
}
