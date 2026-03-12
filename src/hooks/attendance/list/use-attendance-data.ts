'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useOrgStore } from '@/store/org-store'
import { createClient } from '@/utils/supabase/client'
import type { GetAttendanceResult, AttendanceListItem } from '@/action/attendance'
import type { QueryParams } from '@/types/attendance/list'

export function useAttendanceData(params: QueryParams) {
  const orgStore = useOrgStore()
  const [data, setData] = useState({ items: [] as AttendanceListItem[], total: 0 })
  const [loading, setLoading] = useState(true)
  const [departments, setDepartments] = useState<string[]>([])
  const [userTimezone, setUserTimezone] = useState('UTC')
  
  const abortControllerRef = useRef<AbortController | null>(null)
  const orgIdRef = useRef<number | null>(null)

  // Core fetch function
  const fetchData = useCallback(async (queryParams: QueryParams) => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()
    
    const orgId = queryParams.orgId || orgStore.organizationId
    orgIdRef.current = orgId
    if (!orgId) {
      setLoading(false)
      return
    }

    setLoading(true)

    const urlParams = new URLSearchParams({
      page: queryParams.page.toString(),
      limit: queryParams.limit.toString(),
      dateFrom: queryParams.dateFrom,
      dateTo: queryParams.dateTo,
      organizationId: orgId.toString(),
      _cb: Date.now().toString(),
      ...(queryParams.status !== 'all' && { status: queryParams.status }),
      ...(queryParams.department !== 'all' && { department: queryParams.department }),
      ...(queryParams.search?.trim().length >= 2 && { search: queryParams.search.trim() }),
    })

    try {
      const res = await fetch(`/api/attendance-records?${urlParams}`, {
        cache: 'no-store',
        signal: abortControllerRef.current!.signal,
      })

      const result = await res.json() as GetAttendanceResult
      
      if (result.success) {
        const items = result.data || []
        setData({ items, total: result.meta?.total || items.length })

        // Extract timezone from first record
        if (items[0]?.timezone && items[0].timezone !== userTimezone) {
          setUserTimezone(items[0].timezone)
        }

        // Extract unique departments
        const uniqueDepts = Array.from(new Set(
          items
            .map(r => r.member?.department)
            .filter((d): d is string => Boolean(d && d !== 'No Department'))
        )).sort()

        setDepartments(prev => {
          // Avoid unnecessary re-render if same
          return prev.length === uniqueDepts.length && 
                 prev.every((d, i) => d === uniqueDepts[i])
            ? prev 
            : uniqueDepts
        })
      } else {
        setData({ items: [], total: 0 })
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Fetch error:', error)
        setData({ items: [], total: 0 })
      }
    } finally {
      setLoading(false)
    }
  }, [orgStore.organizationId, userTimezone])

  // Realtime subscription
  useEffect(() => {
    const orgId = params.orgId || orgStore.organizationId
    if (!orgId) return

    const supabase = createClient()
    const channel = supabase.channel('attendance-realtime')

    channel
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'attendance_records',
        filter: `organizationId=eq.${orgId}`
      }, () => fetchData(params))
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [params.orgId, orgStore.organizationId, fetchData])

  // Initial fetch + query changes
  useEffect(() => {
    fetchData(params)
  }, [
    params.page, params.limit, params.dateFrom, params.dateTo, 
    params.status, params.department, params.search
  ])

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  return {
    data,
    loading,
    departments,
    userTimezone,
    refetch: () => fetchData(params)
  }
}
