"use client"

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { AlertTriangle, ArrowLeft, Phone } from 'lucide-react'

export default function AcceptInvitePage() {
  const router = useRouter()

  React.useEffect(() => {
    const sidebar = document.querySelector('[data-sidebar]') || document.querySelector('aside')
    const navbar = document.querySelector('[data-navbar]') || document.querySelector('nav')
    if (sidebar instanceof HTMLElement) sidebar.style.display = 'none'
    if (navbar instanceof HTMLElement) navbar.style.display = 'none'
    document.body.style.marginLeft = '0'
    return () => {
      if (sidebar instanceof HTMLElement) sidebar.style.display = ''
      if (navbar instanceof HTMLElement) navbar.style.display = ''
      document.body.style.marginLeft = ''
    }
  }, [])

  return (
    <div className="fixed inset-0 min-h-screen bg-background flex items-center justify-center px-4 z-50">
      <div className="max-w-lg w-full text-center space-y-6 animate-fade-in">
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-full w-40 h-40 mx-auto flex items-center justify-center">
          <AlertTriangle className="w-20 h-20 text-red-600" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">Invite Flow Disabled</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            The invite acceptance feature has been permanently disabled for this installation. Invitations can no longer be accepted via email links.
            If you were invited, please ask your administrator to add you manually or provide another access method.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            onClick={() => router.back()} 
            variant="outline" 
            className="flex items-center gap-2 hover:scale-105 transition-transform duration-200 w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>

          <Link href="/support">
            <Button className="flex items-center gap-2 w-full sm:w-auto hover:scale-105 transition-transform duration-200 bg-primary hover:bg-primary/90">
              <Phone className="w-4 h-4" />
              Contact Support
            </Button>
          </Link>
        </div>

        <div className="pt-6 border-t border-border text-xs text-muted-foreground">
          This resource is intentionally removed. Error Code: 410 - Gone
        </div>
      </div>
    </div>
  )
}
