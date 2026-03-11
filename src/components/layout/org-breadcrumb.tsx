'use client'

import { useEffect, useState } from 'react'
import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useOrgStore } from '@/store/org-store'
import { ChevronRight } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

interface BreadcrumbItem {
  label: string
  href?: string
}

export function OrgBreadcrumb() {
  const pathname = usePathname()
  const { organizationName } = useOrgStore()
  const [isHydrated, setIsHydrated] = useState(false)
  // Init to null to keep SSR and initial client render identical
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [scheduleName, setScheduleName] = useState<string | null>(null)

  useEffect(() => {
    // Set hydrated flag
    setIsHydrated(true)

    // Try to get organizationName from localStorage as fallback
    // This handles the case where Zustand hasn't hydrated yet
    if (!organizationName && !displayName) {
      try {
        const storedState = localStorage.getItem('org-store')
        if (storedState) {
          const parsed = JSON.parse(storedState)
          const state = (parsed?.state ?? parsed) as {
            organizationName?: string | null
            organizationId?: number | null
            organizations?: Array<{ id?: number; name?: string }>
          }
          if (state?.organizationName) {
            setDisplayName(state.organizationName)
          } else if (state?.organizationId && Array.isArray(state?.organizations)) {
            const found = state.organizations.find((o) => Number(o?.id) === Number(state.organizationId))
            if (found?.name) setDisplayName(found.name)
          }
        }
      } catch (error) {
        console.error('Error reading from localStorage:', error)
      }
    }
  }, [])

  // Update displayName when organizationName changes (after Zustand hydration)
  useEffect(() => {
    if (organizationName) {
      setDisplayName(organizationName)
    }
  }, [organizationName])

  useEffect(() => {
    const parts = pathname.split('/').filter(Boolean)
    const isScheduleDetail = parts[0] === 'schedule' && parts.length === 2
    if (!isScheduleDetail) {
      setScheduleName(null)
      return
    }
    const id = parts[1]
    const supabase = createClient()
    let aborted = false
      ; (async () => {
        try {
          type WorkScheduleRow = { name: string | null }
          const { data } = await supabase
            .from('work_schedules')
            .select('name')
            .eq('id', id)
            .maybeSingle()
          const row = data as WorkScheduleRow | null
          if (!aborted) setScheduleName(row?.name ?? null)
        } catch {
          if (!aborted) setScheduleName(null)
        }
      })()
    return () => { aborted = true }
  }, [pathname])

  // Mapping pathname ke breadcrumb labels
  const pathMapping: Record<string, string> = {

    // Attendance
    '/attendance': 'Attendance',
    '/attendance/list': 'List',
    '/attendance/add': 'Add',
    '/attendance/locations': 'Locations',
    '/attendance/devices': 'Devices',
    '/analytics': 'Analytics',

    // Schedules
    '/schedule': 'Schedules',
    '/schedule/member': 'Member Schedules',

    // Organization
    '/members': 'Members',
    '/group': 'Groups',
    '/group/move': 'Move',
    '/position': 'Positions',
    '/organization/new': 'New',
    '/organization/settings': 'Settings',
    '/organization/finger': 'Fingerprint',

    // Fingerprint
    '/finger': 'Fingerprint',

    // Home
    '/': 'Home',

    // Settings
    '/settings': 'Settings',
  }

  // Parent mapping untuk nested pages
  const parentMapping: Record<string, string> = {
    '/attendance/list': '/attendance',
    '/attendance/add': '/attendance',
    '/attendance/locations': '/attendance',
    '/attendance/devices': '/attendance',
    '/analytics': '/attendance',
    '/group/move': '/group',
    '/schedule/member': '/schedule',
  }

  const buildBreadcrumbs = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = []

    const nameToDisplay = displayName || organizationName

    // Jika di halaman /organization, tampilkan hanya nama organisasi
    if (pathname === '/organization') {
      if (nameToDisplay) {
        items.push({
          label: 'Organization',
          href: '/organization',
        })
      }
      return items
    }

    // Tambahkan nama organisasi jika ada (selalu tampil pertama)
    if (nameToDisplay) {
      items.push({
        label: nameToDisplay,
        href: '/organization',
      })
    }

    // Tambahkan seluruh parent chain (skip untuk /organization/* pages)
    if (!pathname.startsWith('/organization/')) {
      const parents: string[] = []
      let current: string | undefined = pathname
      while (current) {
        const p: string | undefined = parentMapping[current]
        if (!p) break
        parents.unshift(p)
        current = p
      }
      for (const p of parents) {
        const parentLabel = pathMapping[p]
        if (parentLabel) {
          items.push({ label: parentLabel, href: p })
        }
      }
    }

    const parts = pathname.split('/').filter(Boolean)
    const isScheduleDetail = parts[0] === 'schedule' && parts.length === 2
    if (isScheduleDetail) {
      items.push({ label: 'Schedule', href: '/schedule' })
      items.push({ label: scheduleName ?? parts[1] ?? 'Schedule', href: pathname })
      return items
    }

    const currentLabel = pathMapping[pathname]
    if (currentLabel && currentLabel !== nameToDisplay) {
      items.push({ label: currentLabel, href: pathname })
    }

    return items
  }

  const breadcrumbs = buildBreadcrumbs()

  // Debug logging (declare hooks before any conditional return)
  React.useEffect(() => {
    console.log('[BREADCRUMB] Render state:', {
      pathname,
      organizationName,
      displayName,
      isHydrated,
      breadcrumbsCount: breadcrumbs.length,
      breadcrumbs: breadcrumbs.map(b => b.label),
    })
  }, [pathname, organizationName, displayName, isHydrated, breadcrumbs])

  // Render guard to keep SSR and first client render identical
  if (!isHydrated && !displayName && !organizationName) {
    return null
  }

  // Jika tidak ada breadcrumb, jangan render
  if (breadcrumbs.length === 0) {
    return null
  }

  // Jangan render sampai client-side hydration selesai
  // Tapi jika ada displayName dari localStorage atau organizationName dari store, boleh render
  // Removed hydration guard to avoid hiding breadcrumb on '/'


  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground" suppressHydrationWarning>
      {breadcrumbs.map((item, index) => (
        <div key={index} className="flex items-center gap-2" suppressHydrationWarning>
          {index > 0 && <ChevronRight className="h-4 w-4" />}
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-foreground transition-colors cursor-pointer"
            >
              {item.label}
            </Link>
          ) : (
            <span
              className={`${index === breadcrumbs.length - 1 ? 'text-foreground font-medium' : ''
                }`}
            >
              {item.label}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
