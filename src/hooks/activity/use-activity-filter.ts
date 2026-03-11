import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useOrgStore } from "@/store/org-store"
import { getMembersForScreenshot, type ISimpleMember } from "@/action/activity/screenshot"
import { getAllProjects, type IProject } from "@/action/projects"
import type { DateRange, SelectedFilter } from "@/components/insights/types"

interface UseActivityFilterProps {
    storageKey: string
}

export function useActivityFilter({ storageKey }: UseActivityFilterProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const memberIdFromUrl = searchParams.get("memberId")
    const { organizationId } = useOrgStore()

    const [realMembers, setRealMembers] = useState<ISimpleMember[]>([])
    const [realProjects, setRealProjects] = useState<IProject[]>([])

    // State untuk filter
    const [dateRange, setDateRange] = useState<DateRange>(() => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const end = new Date()
        end.setHours(23, 59, 59, 999)
        return { startDate: today, endDate: end }
    })
    const [selectedProject, setSelectedProject] = useState<string>("all")

    // Fetch data awal: members & projects
    useEffect(() => {
        if (!organizationId) return

        getMembersForScreenshot(String(organizationId)).then(res => {
            if (res.success && res.data && res.data.length > 0) {
                setRealMembers(res.data)
            }
        })

        getAllProjects(String(organizationId)).then(res => {
            if (res.success && res.data) {
                setRealProjects(res.data)
            }
        })
    }, [organizationId])

    const demoMembers = useMemo(() => realMembers.map(m => ({
        id: String(m.id),
        name: m.name,
        email: "",
        avatar: m.avatarUrl ?? undefined,
        activityScore: 0,
    })), [realMembers])

    // Hitung initial member (URL -> SessionStorage -> Default index 0)
    const getInitialMemberId = (): string => {
        if (typeof window !== "undefined") {
            const urlParams = new URLSearchParams(window.location.search)
            const memberIdFromLocation = urlParams.get("memberId")
            if (memberIdFromLocation) return memberIdFromLocation
        }
        if (memberIdFromUrl) return memberIdFromUrl
        if (typeof window !== "undefined") {
            const savedMemberId = sessionStorage.getItem(storageKey)
            if (savedMemberId) return savedMemberId
        }
        return realMembers[0]?.id ?? ""
    }

    const [selectedFilter, setSelectedFilter] = useState<SelectedFilter>({
        type: "members",
        all: false,
        id: getInitialMemberId(),
    })

    // Sinkronisasi ketika memberId dari URL berubah asinkron
    useEffect(() => {
        if (memberIdFromUrl && memberIdFromUrl !== selectedFilter.id) {
            setSelectedFilter({ type: "members", all: false, id: memberIdFromUrl })
            if (typeof window !== "undefined") {
                sessionStorage.setItem(storageKey, memberIdFromUrl)
            }
        } else if (!memberIdFromUrl && typeof window !== "undefined") {
            const savedMemberId = sessionStorage.getItem(storageKey)
            if (savedMemberId && savedMemberId !== selectedFilter.id) {
                setSelectedFilter({ type: "members", all: false, id: savedMemberId })
            }
        }
    }, [memberIdFromUrl, selectedFilter.id, storageKey])

    // Set default filter member pertama jika filter masih kosong saat data turun
    useEffect(() => {
        if (realMembers.length > 0 && !selectedFilter.id) {
            setSelectedFilter(prev => ({ ...prev, id: realMembers[0]?.id ?? "" }))
        }
    }, [realMembers, selectedFilter.id])

    // Callback update saat memilih filter dari InsightsHeader
    const handleFilterChange = (filter: SelectedFilter) => {
        if (filter.all) {
            const firstMemberId = realMembers[0]?.id ?? ""
            const newFilter: SelectedFilter = { type: "members", all: false, id: firstMemberId }
            setSelectedFilter(newFilter)
            if (typeof window !== "undefined") {
                sessionStorage.setItem(storageKey, firstMemberId)
                const params = new URLSearchParams(searchParams.toString())
                params.set("memberId", firstMemberId)
                router.push(`?${params.toString()}`)
            }
            return
        }

        setSelectedFilter(filter)
        if (!filter.all && filter.id && typeof window !== "undefined") {
            sessionStorage.setItem(storageKey, filter.id)
            const params = new URLSearchParams(searchParams.toString())
            params.set("memberId", filter.id)
            router.push(`?${params.toString()}`)
        }
    }

    const selectedMemberId = selectedFilter.all ? null : (selectedFilter.id ?? null)

    return {
        realMembers,
        realProjects,
        demoMembers,
        selectedFilter,
        selectedMemberId,
        handleFilterChange,
        dateRange,
        setDateRange,
        selectedProject,
        setSelectedProject,
    }
}
