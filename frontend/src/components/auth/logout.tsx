"use client"

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { cn } from "@/lib/utils"

export default function LogoutButton({ className, compact }: { className?: string; compact?: boolean }) {
  const handleLogout = async () => {
    // Use complete logout handler to clear all caches and state
    const { handleCompleteLogout } = await import('@/utils/logout-handler')
    await handleCompleteLogout()
  }

  if (compact) {
    return (
      <Button
        variant="ghost"
        className={cn("h-10 w-10 p-0 justify-center", className)}
        onClick={handleLogout}
        aria-label="Log out"
      >
        <LogOut />
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      className={cn("w-full justify-start", className)}
      onClick={handleLogout}
    >
      <LogOut className="mr-2" />
      Log out
    </Button>
  )
}

