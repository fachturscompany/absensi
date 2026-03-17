"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useOrgStore } from "@/store/org-store"
import { useAuthStore } from "@/store/user-store"
import { Organization } from "@/lib/types/organization"
import { getUserOrganizations } from "@/action/auth-multi-org"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertCircle,
  Plus,
  Grid3x3,
  List,
  Search
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { OrganizationCard } from "@/components/organization/organization-card"
import { OrganizationCardSkeleton } from "@/components/organization/organization-card-skeleton"

export default function OrganizationPage() {
  const router = useRouter()
  const orgStore = useOrgStore()
  const authStore = useAuthStore()

  // State untuk data dan UI
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  // Load organizations
  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await getUserOrganizations()

        console.log("[ORG-PAGE] getUserOrganizations result:", result)

        if (result.success && result.organizations && result.organizations.length > 0) {
          orgStore.setOrganizations(result.organizations)
          setOrganizations(result.organizations)

          // Auto-select jika hanya ada 1 organisasi
          if (result.organizations.length === 1) {
            const singleOrg = result.organizations[0]
            if (singleOrg) {
              console.log("[ORG-PAGE] Only 1 org found, auto-selecting:", singleOrg)
              await handleSelectOrganization(singleOrg)
              return
            }
          }
        } else {
          console.warn("[ORG-PAGE] No organizations found, redirecting to onboarding. Result:", result)
          // New user with no organizations — send them to the onboarding wizard
          router.replace("/onboarding/setup")
          return
        }
      } catch (err) {
        console.error("Error loading organizations:", err)
        setError("Failed to load organizations")
      } finally {
        setLoading(false)
      }
    }

    if (isHydrated) {
      loadOrganizations()
    }
  }, [isHydrated])

  // Track hydration
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Filter organizations berdasarkan search query
  const filteredOrganizations = organizations.filter(org =>
    searchQuery ? (
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.code.toLowerCase().includes(searchQuery.toLowerCase())
    ) : true
  )

  // Handle organization selection
  const handleSelectOrganization = async (org: Organization) => {
    try {
      console.log("[ORG-PAGE] Selecting organization:", org)

      // Set organization in store
      console.log("[ORG-PAGE] Setting org ID:", org.id, org.name)
      orgStore.setOrganizationId(org.id, org.name)

      console.log("[ORG-PAGE] Setting timezone:", org.timezone)
      orgStore.setTimezone(org.timezone)

      // Set user role
      console.log("[ORG-PAGE] Setting role")
      authStore.setRole("admin", 1)

      // Set cookie via API route (server-side) to ensure middleware can read it
      console.log("[ORG-PAGE] Setting cookie via API...")
      const cookieResponse = await fetch("/api/organization/select", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ organizationId: org.id }),
      })

      if (!cookieResponse.ok) {
        throw new Error("Failed to set organization cookie")
      }

      const cookieData = await cookieResponse.json()
      console.log("[ORG-PAGE] Cookie set via API:", cookieData)

      console.log("[ORG-PAGE] Organization selected, navigating to home...")

      // Add small delay to ensure cookie is properly set before navigation
      await new Promise(resolve => setTimeout(resolve, 300))

      console.log("[ORG-PAGE] Attempting to navigate to /")

      // Use window.location.href for hard redirect to ensure middleware processes new request with cookie
      // This is more reliable than router.push() for cookie-dependent redirects
      window.location.href = "/"
      console.log("[ORG-PAGE] Hard redirect initiated")
    } catch (error) {
      console.error("[ORG-PAGE] Error selecting organization:", error)
      console.error("[ORG-PAGE] Error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
    }
  }

  if (!isHydrated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <Skeleton className="h-8 w-32 mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col">
      <div className="flex items-center justify-between mb-4 px-4 md:px-6 pt-4 md:pt-6">
        <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
        <Button onClick={() => router.push('/organization/new')} className="gap-2">
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      <div className="flex items-center gap-2 mb-6 px-4 md:px-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search organizations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-10 pl-10"
          />
        </div>
        <div className="flex items-center gap-1 border rounded-md p-1">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="gap-2"
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="gap-2"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-6 px-4 md:px-6 pb-6">
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <OrganizationCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : filteredOrganizations.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {searchQuery ? "No organizations match your search." : "No organizations found."}
            </AlertDescription>
          </Alert>
        ) : viewMode === "grid" ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredOrganizations.map((org) => (
              <OrganizationCard
                key={org.id}
                organization={org}
                onSelect={handleSelectOrganization}
              />
            ))}
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-6 py-3 text-left text-sm font-semibold">ORGANIZATION</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">CODE</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">REGION</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">TIMEZONE</th>
                  </tr>
                </thead>
                <tbody className="[&>tr:nth-child(even)]:bg-muted/50">
                  {filteredOrganizations.map((org) => (
                    <tr
                      key={org.id}
                      className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => handleSelectOrganization(org)}
                    >
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="font-medium">{org.name}</p>
                          <p className="text-xs text-muted-foreground">ID: {org.id}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">{org.code}</td>
                      <td className="px-6 py-4 text-sm">
                        <Badge variant="outline">{org.country_code}</Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {org.timezone}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
        }
      </div>
    </div>
  )
}
