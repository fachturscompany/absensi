import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { SearchBar } from "@/components/customs/search-bar"

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
                    <SearchBar
                        initialQuery={searchQuery}
                        onSearch={onSearchChange}
                        placeholder="Search member schedules..."
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
