'use client'

import { useCallback, useMemo, useState } from 'react'
import type { AttendanceListItem } from '@/action/attendance'

export function useAttendanceSelection(items: AttendanceListItem[]) {
  const [selectedIds, setSelectedIds] = useState(new Set<string>())

  const selectedCount = selectedIds.size
  const isAllSelected = selectedCount === items.length && items.length > 0
  const selectedRecords = useMemo(() => 
    items.filter(item => selectedIds.has(item.id)), 
    [items, selectedIds]
  )

  const toggleSelect = useCallback((id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (checked) {
        next.add(id)
      } else {
        next.delete(id)
      }
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(items.map(item => item.id)))
    }
  }, [items, isAllSelected])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  return {
    selectedIds,
    selectedCount,
    isAllSelected,
    selectedRecords,
    toggleSelect,
    toggleSelectAll,
    clearSelection
  }
}
