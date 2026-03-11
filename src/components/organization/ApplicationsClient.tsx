"use client"

/**
 * app/applications/applications-client.tsx
 *
 */

import React, { useState, useCallback, useTransition, useId } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Search,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Unplug,
  Plug,
  MoreHorizontal,
  Calendar,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Application, ApplicationSection, ApplicationStatus } from "@/types/application.ts"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface ApplicationsClientProps {
  initialSections: ApplicationSection[]
}

// ---------------------------------------------------------------------------
// Main client component
// ---------------------------------------------------------------------------
export default function ApplicationsClient({ initialSections }: ApplicationsClientProps) {
  const searchId = useId()
  const [searchTerm, setSearchTerm] = useState("")
  const [loadingState, setLoadingState] = useState<{ provider: string; message: string } | null>(null)
  const [sections, setSections] = useState<ApplicationSection[]>(initialSections)
  const [, startTransition] = useTransition()

  // ---------------------------------------------------------------------------
  // Derived state — filter without mutating sections
  // ---------------------------------------------------------------------------
  const filteredSections = React.useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return sections

    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            item.name.toLowerCase().includes(term) ||
            item.description.toLowerCase().includes(term) ||
            item.category.toLowerCase().includes(term)
        ),
      }))
      .filter((section) => section.items.length > 0)
  }, [searchTerm, sections])

  // Split filtered sections into Active (Flat list) and Available (Grouped sections)
  const activeApplications = React.useMemo(() => {
    return filteredSections.flatMap((s) => s.items).filter((i) => i.connected)
  }, [filteredSections])

  const availableSections = React.useMemo(() => {
    return filteredSections
      .map((s) => ({
        ...s,
        items: s.items.filter((i) => !i.connected),
      }))
      .filter((s) => s.items.length > 0)
  }, [filteredSections])

  // ---------------------------------------------------------------------------
  // Per-card status updater — immutable, returns new sections array
  // ---------------------------------------------------------------------------
  const updateItemStatus = useCallback(
    (
      id: string,
      patch: Partial<Pick<Application, "connected" | "status" | "errorMessage">>
    ) => {
      setSections((prev) =>
        prev.map((section) => ({
          ...section,
          items: section.items.map((item) =>
            item.id === id ? { ...item, ...patch } : item
          ),
        }))
      )
    },
    []
  )

  // ---------------------------------------------------------------------------
  // Connect / Disconnect handler
  //
  // Design decisions:
  //  1. Sets `status` to "connecting"/"disconnecting" immediately (optimistic UX).
  //  2. Calls the REST API — matches routes from README.md.
  //  3. On success, flips `connected` and resets `status` to "idle".
  //  4. On failure, sets `status` to "error" with a message; does NOT flip state.
  //  5. The in-flight status on each card acts as a per-item mutex — the button
  //     is disabled while the request is pending, preventing duplicate requests.
  // ---------------------------------------------------------------------------
  const handleToggle = useCallback(
    async (item: Application) => {
      // Guard: if already processing, do nothing (prevents race conditions)
      if (item.status === "connecting" || item.status === "disconnecting") return

      const nextStatus: ApplicationStatus = item.connected
        ? "disconnecting"
        : "connecting"

      // Immediate feedback — card shows spinner
      updateItemStatus(item.id, { status: nextStatus, errorMessage: undefined })

      try {
        let res: Response

        if (item.connected) {
          // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          // DISCONNECT FLOW
          // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          res = await fetch(`/api/applications/${item.id}`, {
            method: "DELETE",
          })

          const data = await res.json().catch(() => ({}))

          if (!res.ok) {
            throw new Error(data?.error || data?.message || `Disconnect failed (${res.status})`)
          }

          // Disconnect successful - update UI immediately
          startTransition(() => {
            updateItemStatus(item.id, {
              connected: false,
              status: "idle",
              errorMessage: undefined,
            })
          })

          console.log('[applications-ui] Disconnect successful:', item.id)

        } else {
          // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          // CONNECT FLOW
          // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

          // Zoom now uses standard OAuth flow (User OAuth)
          // Fall through to generic OAuth handler below


          // GitHub/Slack: OAuth flow with user authorization
          res = await fetch(`/api/applications/${item.id}/authorize`, {
            method: "POST",
            headers: { "Content-Type": "application/json" }
          })

          const data = await res.json().catch(() => ({}))

          if (!res.ok) {
            throw new Error(data?.error || data?.message || `Connection failed (${res.status})`)
          }

          // OAuth applications return a redirect URL
          if (data?.redirectUrl) {
            console.log('[applications-ui] Redirecting to OAuth provider:', item.id)

            // Show full-screen loading overlay
            setLoadingState({
              provider: item.name,
              message: `Please wait while we redirect you to ${item.name}`
            })

            // Small delay to ensure render updates and provide visual feedback
            await new Promise(resolve => setTimeout(resolve, 800))

            // Redirect to OAuth provider in same window
            window.location.href = data.redirectUrl
            return
          }

          // Direct toggle (non-OAuth applications)
          startTransition(() => {
            updateItemStatus(item.id, {
              connected: true,
              status: "idle",
              errorMessage: undefined,
            })
          })
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong. Try again."

        updateItemStatus(item.id, {
          status: "error",
          errorMessage: message,
          // connected state is NOT changed on error
        })
      }
    },
    [updateItemStatus, startTransition]
  )

  // ---------------------------------------------------------------------------
  // Dismiss error on a specific card
  // ---------------------------------------------------------------------------
  const handleDismissError = useCallback(
    (id: string) => {
      updateItemStatus(id, { status: "idle", errorMessage: undefined })
    },
    [updateItemStatus]
  )

  // ---------------------------------------------------------------------------
  // Counts for accessible status summary
  // ---------------------------------------------------------------------------
  const connectedCount = React.useMemo(
    () => sections.flatMap((s) => s.items).filter((i) => i.connected).length,
    [sections]
  )

  const totalCount = React.useMemo(
    () => sections.flatMap((s) => s.items).length,
    [sections]
  )

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="w-full flex flex-1 flex-col gap-10 p-6 pt-2 max-w-[1600px] mx-auto">
      {/* Full-screen Loading Overlay for Redirects/Connections */}
      {loadingState && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background animate-in fade-in duration-300">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-6" />
          <h2 className="text-xl font-medium text-foreground mb-2">
            {loadingState.message}
          </h2>
          <p className="text-muted-foreground">It should only take a few moments.</p>
        </div>
      )}

      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <header className="w-full flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Applications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your organisation&apos;s connections with third-party services.{" "}
            <span
              className="font-medium text-gray-600"
              aria-live="polite"
              aria-atomic="true"
            >
              {connectedCount} of {totalCount} connected.
            </span>
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative w-full sm:w-[300px]">
            <label htmlFor={searchId} className="sr-only">
              Search applications
            </label>
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none"
              aria-hidden="true"
            />
            <Input
              id={searchId}
              placeholder="Search applications…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 border-gray-300 rounded-full bg-white shadow-sm focus-visible:ring-2 focus-visible:ring-offset-1"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        </div>
      </header>

      <main className="space-y-16 pb-16">

        {activeApplications.length > 0 && (
          <section className="space-y-6" aria-labelledby="section-active">
            <h2
              id="section-active"
              className="text-xs font-semibold text-gray-500 uppercase tracking-widest"
            >
              Active Applications
            </h2>
            <ActiveApplicationsTable
              items={activeApplications}
              onDisconnect={(item) => handleToggle(item)}
            />
          </section>
        )}

        {activeApplications.length === 0 && availableSections.length === 0 ? (
          <EmptyState searchTerm={searchTerm} />
        ) : (
          availableSections.map((section) => (
            <section
              key={section.title}
              className="space-y-6"
              aria-labelledby={`section-${section.title.toLowerCase()}`}
            >
              <h2
                id={`section-${section.title.toLowerCase()}`}
                className="text-xs font-semibold text-gray-500 uppercase tracking-widest"
              >
                {section.title}
              </h2>

              <ul
                className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 list-none p-0 m-0"
                aria-label={`${section.title} application`}
              >
                {section.items.map((item) => (
                  <li key={item.id}>
                    <ApplicationCard
                      item={item}
                      onToggle={() => handleToggle(item)}
                      onDismissError={() => handleDismissError(item.id)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </main>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ApplicationCard
// ---------------------------------------------------------------------------
interface ApplicationCardProps {
  item: Application
  onToggle: () => void
  onDismissError: () => void
}

function ApplicationCard({ item, onToggle, onDismissError }: ApplicationCardProps) {
  const [imgError, setImgError] = useState(false)

  const isLoading =
    item.status === "connecting" || item.status === "disconnecting"
  const isError = item.status === "error"

  const actionLabel = isLoading
    ? item.status === "connecting"
      ? "Connecting…"
      : "Disconnecting…"
    : item.connected
      ? "Disconnect"
      : "Connect"

  const ariaLabel = isLoading
    ? `${actionLabel} ${item.name}`
    : item.connected
      ? `Disconnect ${item.name}`
      : `Connect ${item.name}`

  return (
    <article
      className={cn(
        "group relative flex flex-col justify-between p-5 bg-white border rounded-xl transition-all duration-200",
        "focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-gray-400",
        isError
          ? "border-red-200 shadow-sm shadow-red-50"
          : "border-gray-200 hover:shadow-md hover:border-gray-300"
      )}
      aria-label={`${item.name} application — ${item.connected ? "Connected" : "Not connected"}`}
    >
      {/* ── Card Header ── */}
      <div>
        <div className="flex items-start justify-between mb-4">
          <div
            className="h-11 w-11 flex items-center justify-center rounded-lg bg-gray-50 border border-gray-100 p-2 shrink-0"
            aria-hidden="true"
          >
            {imgError ? (
              <InitialsAvatar name={item.name} />
            ) : (
               
              <img
                src={item.iconUrl}
                alt=""
                aria-hidden="true"
                className="h-full w-full object-contain"
                onError={() => setImgError(true)}
                loading="lazy"
                decoding="async"
              />
            )}
          </div>

          {/* Status badge */}
          <div aria-live="polite" aria-atomic="true" className="flex flex-col items-end gap-1.5">
            {item.connected && !isLoading && !isError && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                Connected
              </span>
            )}
            {isLoading && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                {item.status === "connecting" ? "Connecting" : "Disconnecting"}
              </span>
            )}
            {isError && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                <XCircle className="h-3 w-3" aria-hidden="true" />
                Failed
              </span>
            )}
          </div>
        </div>

        <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors leading-snug">
          {item.name}
        </h3>
        <p className="text-sm text-gray-500 mt-1.5 leading-relaxed line-clamp-2">
          {item.description}
        </p>

        {/* Error message banner */}
        {isError && item.errorMessage && (
          <div
            role="alert"
            className="mt-3 flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2"
          >
            <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" aria-hidden="true" />
            <span className="flex-1">{item.errorMessage}</span>
            <button
              onClick={onDismissError}
              className="shrink-0 text-red-500 hover:text-red-700 focus:outline-none focus:underline"
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* ── Card Footer ── */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <a
          href={item.docsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-muted-foreground hover:text-primary inline-flex items-center gap-1 transition-colors focus:outline-none focus:underline"
          aria-label={`Learn more about ${item.name} (opens in new tab)`}
        >
          Learn more
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>

        <Button
          variant={item.connected ? "outline" : "default"}
          size="sm"
          className={cn(
            "h-8 px-4 text-xs font-medium transition-all min-w-[90px]",
            item.connected && !isLoading
              ? "hover:bg-red-50 hover:text-red-600 hover:border-red-200"
              : !item.connected && !isLoading
                ? "bg-black text-white hover:bg-gray-800 shadow-sm"
                : "" // loading state — neutral styling
          )}
          onClick={onToggle}
          disabled={isLoading}
          aria-label={ariaLabel}
          aria-busy={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3 w-3 mr-1.5 animate-spin" aria-hidden="true" />
              {item.status === "connecting" ? "Connecting" : "Disconnecting"}
            </>
          ) : item.connected ? (
            <>
              <Unplug className="h-3 w-3 mr-1.5" aria-hidden="true" />
              Disconnect
            </>
          ) : (
            <>
              <Plug className="h-3 w-3 mr-1.5" aria-hidden="true" />
              Connect
            </>
          )}
        </Button>
      </div>
    </article>
  )
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------
function EmptyState({ searchTerm }: { searchTerm: string }) {
  return (
    <div
      className="text-center py-24"
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center">
        <Search className="h-6 w-6 text-gray-400" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-gray-900">
        No applications found
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        {searchTerm
          ? `No results for "${searchTerm}". Try a different search term.`
          : "No applications are available right now."}
      </p>
    </div>
  )
}

function InitialsAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")

  return (
    <span
      className="text-xs font-bold text-gray-500 select-none"
      aria-hidden="true"
    >
      {initials}
    </span>
  )
}

function ActiveApplicationsTable({
  items,
  onDisconnect,
}: {
  items: Application[]
  onDisconnect: (item: Application) => void
}) {
  return (
    <div className="rounded-md border border-gray-200 bg-white overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-gray-50/50">
          <TableRow>
            <TableHead className="w-[300px]">Application</TableHead>
            <TableHead>Last Sync</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} className="group hover:bg-gray-50/50 transition-colors">
              <TableCell className="font-medium">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 flex items-center justify-center rounded-md bg-gray-100 border border-gray-200 p-1">
                    { }
                    <img
                      src={item.iconUrl}
                      alt=""
                      className="h-full w-full object-contain"
                      loading="lazy"
                    />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.category}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-gray-500">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {item.lastSyncAt
                      ? new Date(item.lastSyncAt).toLocaleString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                        timeZoneName: "short"
                      })
                      : "Not synced yet"}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {item.status === "disconnecting" ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Disconnecting
                  </span>
                ) : item.status === "error" ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Error
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900"
                      disabled={item.status === "disconnecting"}
                    >
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[160px]">
                    <DropdownMenuItem disabled>
                      Sync Now
                      <span className="ml-auto text-xs text-muted-foreground">Soon</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled>
                      Configure
                      <span className="ml-auto text-xs text-muted-foreground">Soon</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600 focus:bg-red-50"
                      onClick={() => onDisconnect(item)}
                    >
                      Disconnect
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
