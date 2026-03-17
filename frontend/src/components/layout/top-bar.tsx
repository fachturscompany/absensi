"use client"

import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import Link from "next/link"

export default function TopBar() {
  const pathname = usePathname()
  const paths = pathname.split("/").filter(Boolean)

  // fungsi bantu buat cek id
  const isId = (segment: string) => {
    return /^\d+$/.test(segment) || /^[0-9a-fA-F-]{36}$/.test(segment) // angka atau UUID
  }

  // mapping untuk mengubah nama segment
  const getSegmentLabel = (segment: string) => {
    const segmentMappings: { [key: string]: string } = {
      'department': 'Groups',
      'departments': 'Groups',
      'members': 'Members',
      'users': 'Users',
      'position': 'Positions',
      'role': 'Roles',
      'permission': 'Permissions',
      'schedule': 'Schedules',
      'attendance': 'Attendance',
      'organization': 'Organization',
      'settings': 'Settings',
      'add': 'Add',
      'edit': 'Edit'
    }
    
    return segmentMappings[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
  }

  return (
    <div>
      <Breadcrumb>
        <BreadcrumbList>
          {paths.length === 0 ? (
            <BreadcrumbItem>
              <BreadcrumbPage>Home</BreadcrumbPage>
            </BreadcrumbItem>
          ) : (
            <>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link href="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {paths.map((segment, index) => {
                // skip kalau ID
                if (isId(segment)) return null

                const href = "/" + paths.slice(0, index + 1).join("/")
                const isLast = index === paths.length - 1

                return (
                  <div key={href} className="flex items-center gap-2">
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      {isLast ? (
                        <BreadcrumbPage>
                          {getSegmentLabel(segment)}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link href={href}>
                            {getSegmentLabel(segment)}
                          </Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </div>
                )
              })}
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  )
}
