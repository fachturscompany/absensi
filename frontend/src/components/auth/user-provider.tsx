"use client"

import { useEffect } from "react"
import { IUser } from "@/interface"
import { useAuthStore } from "@/store/user-store"

export function UserProvider({ user }: { user: Partial<IUser> | null | undefined }) {
  const setUser = useAuthStore((state) => state.setUser)

  useEffect(() => {
    setUser((current) => {
      if (!user) {
        return null
      }

      const merged = {
        ...current,
        ...user,
      }

      const nextId = merged.id ?? current?.id
      if (!nextId) {
        return current
      }

      const resolvedDisplayName =
        typeof merged.display_name === "string" && merged.display_name.trim() !== ""
          ? merged.display_name
          : current?.display_name && current.display_name.trim() !== ""
            ? current.display_name
            : user.display_name ?? current?.display_name ?? null

      return {
        ...merged,
        id: nextId,
        display_name: resolvedDisplayName,
      } as IUser
    })
  }, [user, setUser])

  return null
}
