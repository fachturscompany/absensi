/**
 * app/applications/page.tsx
 *
 * Applications Page — Production-ready, SSR-safe, accessible.
 *
 * Architecture:
 *  - Outer shell is a React Server Component (no "use client").
 *    It fetches data server-side and passes it to the interactive client layer.
 *  - <ApplicationsClient> carries the "use client" boundary.
 *    All interactivity (search, connect/disconnect, loading states) lives here.
 *  - <ApplicationCard> is a pure presentational component inside the client boundary.
 *
 * Assumptions:
 *  - API routes exist at /api/applications (GET) and /api/applications/[id] (DELETE)
 *    and /api/applications/[provider]/authorize (POST/GET for OAuth).
 *    These match the routes documented in README.md.
 *  - Until the API is wired, the server component gracefully falls back to the
 *    static APPLICATIONS_CATALOG so the page is never blank.
 *  - OAuth-based applications redirect to the provider; simple toggle applications
 *    call the REST API directly.
 *  - The Supabase `applications` table stores connected applications per org.
 */

// ─── Server Component (no directive = RSC by default in App Router) ──────────

import { Suspense } from "react"
import { headers } from "next/headers"
import ApplicationsClient from "@/components/organization/ApplicationsClient"
import type { ApplicationSection } from "@/types/application.ts"

// ---------------------------------------------------------------------------
// Static catalog — source of truth for metadata (name, description, icon, etc.)
// Actual `connected` status is merged from the live API response below.
// ---------------------------------------------------------------------------
const APPLICATIONS_CATALOG: ApplicationSection[] = [
    {
        title: "Communication",
        items: [
            {
                id: "slack",
                name: "Slack",
                description:
                    "Receive attendance alerts, timesheet reminders, and project notifications directly in your Slack channels.",
                iconUrl:
                    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/slack/slack-original.svg",
                connected: false,
                status: "idle",
                category: "Communication",
                docsUrl: "https://slack.com/intl/en-id/help",
            },
            {
                id: "zoom",
                name: "Zoom",
                description:
                    "Automatically generate Zoom meeting links for scheduled team check-ins and stand-ups.",
                iconUrl:
                    "https://cdn.simpleicons.org/zoom/2D8CFF",
                connected: false,
                status: "idle",
                category: "Communication",
                docsUrl: "https://support.zoom.us/",
            },
            {
                id: "microsoft-teams",
                name: "Microsoft Teams",
                description:
                    "Push attendance summaries and timesheet approvals into Teams channels and chats.",
                iconUrl:
                    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/microsoft/microsoft-original.svg",
                connected: false,
                status: "idle",
                category: "Communication",
                docsUrl: "https://support.microsoft.com/en-us/teams",
            },
        ],
    },
    {
        title: "Development",
        items: [
            {
                id: "github",
                name: "GitHub",
                description:
                    "Sync issues, pull requests, and commits to Absensi projects for accurate time attribution.",
                iconUrl:
                    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg",
                connected: false,
                status: "idle",
                category: "Development",
                docsUrl: "https://docs.github.com/",
            },
            {
                id: "jira",
                name: "Jira",
                description:
                    "Connect Jira boards to automatically log time against epics, stories, and tasks.",
                iconUrl:
                    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jira/jira-original.svg",
                connected: false,
                status: "idle",
                category: "Development",
                docsUrl: "https://support.atlassian.com/jira-software-cloud/",
            },
            {
                id: "gitlab",
                name: "GitLab",
                description:
                    "Mirror GitLab merge requests and CI pipeline events into your Absensi activity feed.",
                iconUrl:
                    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/gitlab/gitlab-original.svg",
                connected: false,
                status: "idle",
                category: "Development",
                docsUrl: "https://docs.gitlab.com/",
            },
        ],
    },
    {
        title: "Project Management",
        items: [
            {
                id: "trello",
                name: "Trello",
                description:
                    "Sync Trello cards, boards, and activity to automatically track time and progress.",
                iconUrl:
                    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/trello/trello-plain.svg",
                connected: false,
                status: "idle",
                category: "Project Management",
                docsUrl: "https://trello.com/guide",
            },
        ],
    },
    {
        title: "Productivity",
        items: [
            {
                id: "google-calendar",
                name: "Google Calendar",
                description:
                    "Sync work schedules, time-off blocks, and meeting hours with Google Calendar in real time.",
                iconUrl:
                    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg",
                connected: false,
                status: "idle",
                category: "Productivity",
                docsUrl: "https://support.google.com/calendar/",
            },
            {
                id: "notion",
                name: "Notion",
                description:
                    "Sync project documentation, task notes, and attendance reports to your Notion workspace.",
                iconUrl:
                    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/notion/notion-original.svg",
                connected: false,
                status: "idle",
                category: "Productivity",
                docsUrl: "https://www.notion.so/help/",
            },
        ],
    },
]

// ---------------------------------------------------------------------------
// Server-side data fetch
// Merges live `connected` status from the API onto the static catalog.
// Falls back silently to the catalog if the fetch fails (resilience requirement).
// ---------------------------------------------------------------------------
async function getApplications(): Promise<ApplicationSection[]> {
    try {
        const baseUrl =
            process.env.NEXT_PUBLIC_APP_URL ?? "https://absensi-ubig.vercel.app"

        const classes = await headers()
        const cookie = classes.get("cookie")

        const res = await fetch(`${baseUrl}/api/applications`, {
            // No caching - always fetch fresh data
            cache: 'no-store',
            headers: {
                "Content-Type": "application/json",
                Cookie: cookie ?? "",
            },
        })

        if (!res.ok) {
            const errorBody = await res.text()
            console.error(
                `[applications] API responded ${res.status} — falling back to catalog defaults.`,
                errorBody
            )
            return APPLICATIONS_CATALOG
        }

        // Expected shape: { data: Array<{ provider: string; connected: boolean; connectedAt?: string }> }
        const json = await res.json()
        const liveMap = new Map<string, { connected: boolean; connectedAt?: string }>(
            (json.data ?? []).map((i: any) => [
                i.provider,
                { connected: i.connected, connectedAt: i.connectedAt },
            ])
        )

        // Merge live status into the static catalog without mutating the original.
        return APPLICATIONS_CATALOG.map((section) => ({
            ...section,
            items: section.items.map((item) => {
                const liveData = liveMap.get(item.id)
                return {
                    ...item,
                    connected: liveData ? liveData.connected : item.connected,
                    connectedAt: liveData?.connectedAt,
                }
            }),
        }))
    } catch {
        // Network error, cold-start, etc. — degrade gracefully.
        return APPLICATIONS_CATALOG
    }
}

// ---------------------------------------------------------------------------
// RSC Page — thin shell, passes hydrated data down to client boundary
// ---------------------------------------------------------------------------
export default async function ApplicationsPage() {
    const sections = await getApplications()

    return (
        <Suspense fallback={<ApplicationsPageSkeleton />}>
            <ApplicationsClient initialSections={sections} />
        </Suspense>
    )
}

// ---------------------------------------------------------------------------
// Loading skeleton — shown by Suspense on slow connections / cold starts
// ---------------------------------------------------------------------------
function ApplicationsPageSkeleton() {
    return (
        <div
            className="w-full flex flex-1 flex-col gap-10 p-6 pt-2 max-w-[1600px] mx-auto"
            aria-label="Loading applications"
            aria-busy="true"
        >
            {/* Header skeleton */}
            <div className="w-full flex items-center justify-between">
                <div className="space-y-2">
                    <div className="h-7 w-40 rounded-md bg-gray-200 animate-pulse" />
                    <div className="h-4 w-72 rounded-md bg-gray-100 animate-pulse" />
                </div>
                <div className="flex items-center gap-4">
                    <div className="h-9 w-[300px] rounded-full bg-gray-100 animate-pulse" />
                    <div className="h-9 w-44 rounded-full bg-gray-200 animate-pulse" />
                </div>
            </div>

            {/* Card grid skeletons */}
            {[0, 1].map((sIdx) => (
                <div key={sIdx} className="space-y-6">
                    <div className="h-4 w-32 rounded bg-gray-100 animate-pulse" />
                    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {[0, 1, 2].map((cIdx) => (
                            <div
                                key={cIdx}
                                className="h-52 rounded-xl border border-gray-100 bg-gray-50 animate-pulse"
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}
