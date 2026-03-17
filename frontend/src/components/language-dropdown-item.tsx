"use client"

import { Languages } from "lucide-react"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"

import { logger } from '@/lib/logger';
export function LanguageDropdownItem() {
  const handleLanguageClick = () => {
    // Language switching logic can be implemented here
    // For now, this is a placeholder
    logger.debug("Language selection clicked")
  }

  return (
    <DropdownMenuItem 
      className="hover:cursor-pointer" 
      onClick={handleLanguageClick}
    >
      <Languages className="w-4 h-4 mr-3 text-muted-foreground" />
      Language
    </DropdownMenuItem>
  )
}
