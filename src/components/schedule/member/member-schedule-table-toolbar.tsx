import { Search, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface MemberScheduleTableToolbarProps {
    searchQuery: string
    onSearchChange: (value: string) => void
}

export default function MemberScheduleTableToolbar({
    searchQuery,
    onSearchChange,
}: MemberScheduleTableToolbarProps) {
    const router = useRouter()

    const handleAssign = () => {
        router.push("/schedule/member/assign")
    }

    return (
        <div className="flex flex-col gap-3 w-full md:flex-row md:items-center md:justify-between mb-4">
            <div className="flex flex-col gap-2 w-full sm:flex-row sm:items-center md:flex-1 md:gap-4">
                <div className="relative w-full md:min-w-[320px] w-1/2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search member schedules..."
                        className="pl-9"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2 w-full justify-end md:w-auto">
                <Button onClick={handleAssign} className="gap-2 whitespace-nowrap">
                    <Plus className="h-4 w-4" />
                    Assign
                </Button>
            </div>
        </div>
    )
}
