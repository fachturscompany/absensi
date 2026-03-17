"use client"

import Link from "next/link"
import { LayoutGrid, User } from "lucide-react"
import React from "react"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/profile&image/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { useAuthStore } from "@/store/user-store"
import { useProfilePhotoUrl } from "@/hooks/use-profile"
import { safeAvatarSrc, getUserInitials } from "@/lib/avatar-utils"
import LogoutButton from "@/components/auth/logout"

import { logger } from '@/lib/logger';
export function UserNav() {
  const user = useAuthStore((state) => state.user)
  const profilePhotoUrl = useProfilePhotoUrl(user?.profile_photo_url ?? undefined)

  if (!user) return null

  // Get full name from user data
  const getFullName = () => {
    const nameParts = [user.first_name, user.last_name]
      .filter((part): part is string => Boolean(part && part.trim()))

    if (user.display_name && user.display_name.trim() !== '') {
      return user.display_name
    }

    if (user.display_name && user.display_name.trim() !== '') {
      return user.display_name
    }

    if (nameParts.length > 0) {
      return nameParts.join(' ')
    }

    return user.email || 'User'
  }

  const fullName = getFullName()

  return (
    <DropdownMenu>
      <TooltipProvider disableHoverableContent>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="relative h-8 w-8 rounded-full"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={safeAvatarSrc(profilePhotoUrl) || undefined}
                    alt={fullName}
                    className="object-cover"
                    onError={(e) => {
                      if (process.env.NODE_ENV === 'development') {
                        logger.debug('Avatar image load failed:', profilePhotoUrl)
                      }
                      // Hide image if it fails to load
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-xs">
                    {getUserInitials(
                      user.first_name,
                      user.last_name,
                      user.display_name ?? undefined,
                      user.email
                    )}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">Profile</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{fullName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            {user.employee_code && (
              <p className="text-xs leading-none text-muted-foreground">
                ID: {user.employee_code}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className="hover:cursor-pointer" asChild>
            <Link href="/" className="flex items-center">
              <LayoutGrid className="w-4 h-4 mr-3 text-muted-foreground" />
              Dashboard
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="hover:cursor-pointer" asChild>
            <Link href="/account" className="flex items-center">
              <User className="w-4 h-4 mr-3 text-muted-foreground" />
              Account Settings
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="hover:cursor-pointer" onClick={() => { }}>
          <LogoutButton />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
