/**
 * app/application/types.ts
 *
 */
export type ApplicationStatus =
  | "idle"       // default — no pending action
  | "connecting" // OAuth or API call in-flight to connect
  | "disconnecting" // API call in-flight to disconnect
  | "error"      // last action failed; message available

export type ApplicationCategory =
  | "Communication"
  | "Development"
  | "Productivity"
  | "HR"
  | "Project Management"

export type Application = {
  id: string
  name: string
  description: string
  iconUrl: string
  connected: boolean
  status: ApplicationStatus
  errorMessage?: string
  category: ApplicationCategory
  docsUrl: string
  connectedAt?: string
  lastSyncAt?: string
}

export type ApplicationSection = {
  title: string
  items: Application[]
}
