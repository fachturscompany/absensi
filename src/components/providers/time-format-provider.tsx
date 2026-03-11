"use client"

import { useEffect } from "react"
import { useTimeFormat } from "@/store/time-format-store"
import { useOrganizationTimeFormat } from "@/hooks/use-organization-data"

export function TimeFormatProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { setFormat } = useTimeFormat()
  const { timeFormat, isSuccess } = useOrganizationTimeFormat()

  useEffect(() => {
    if (isSuccess && timeFormat) {
      setFormat(timeFormat)
    }
  }, [timeFormat, isSuccess, setFormat])

  return <>{children}</>
}
