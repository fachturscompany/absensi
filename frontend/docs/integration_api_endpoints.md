📚 Integration API Endpoints Documentation
Complete reference untuk semua API endpoints yang terkait dengan sistem integrasi (GitHub, Slack, dll).

📋 Table of Contents
Core Endpoints
GitHub Integration
Slack Integration
Helper Libraries
🔷 Core Endpoints
1. GET /api/integrations
Purpose: Fetch semua integrasi untuk organisasi yang sedang aktif

Authentication: Required (via Supabase session)

Request:

GET /api/integrations
Cookie: org_id=1
Response:

{
  "data": [
    {
      "id": "d0dd3c59-...",
      "provider": "github",
      "organization_id": 1,
      "connected": true,
      "status": "ACTIVE",
      "permissions": ["repo", "read:user"],
      "created_at": "2026-02-10T...",
      "updated_at": "2026-02-10T..."
    }
  ]
}
Features:

✅ Role-based access (Owner/Admin only)
✅ Auto-selects organization from cookie or user's highest role
✅ Returns both connected and available integrations
✅ Force-dynamic (no caching)
File: 
src/app/api/integrations/route.ts

2. DELETE /api/integrations/[id]
Purpose: Disconnect integration (soft delete - data tetap ada tapi status=DISCONNECTED)

Authentication: Required

Request:

DELETE /api/integrations/github
# atau
DELETE /api/integrations/d0dd3c59-1234-5678-90ab-cdef12345678
Flexible ID Support:

✅ Provider name: "github", "slack", dll
✅ UUID: "d0dd3c59-..."
Response:

{
  "success": true,
  "message": "Integration disconnected successfully"
}
What Gets Cleared:

connected → false
status → "DISCONNECTED"
access_token → null
refresh_token → null
webhook_secret → null
File: src/app/api/integrations/[id]/route.ts

3. PATCH /api/integrations/[id]
Purpose: Update konfigurasi integrasi (sync settings, custom config)

Authentication: Required

Request:

PATCH /api/integrations/github
Content-Type: application/json
{
  "config": {
    "auto_assign": true,
    "default_project_id": "123"
  },
  "syncEnabled": true,
  "syncFrequency": 3600
}
Response:

{
  "data": {
    "id": "d0dd3c59-...",
    "config": { "auto_assign": true },
    "sync_enabled": true,
    "sync_frequency": 3600,
    "updated_at": "2026-02-10T..."
  }
}
File: src/app/api/integrations/[id]/route.ts

🐙 GitHub Integration
4. POST /api/integrations/github/authorize
Purpose: Inisiasi OAuth flow untuk GitHub

Authentication: Required

Flow:

Cek user memiliki akses ke organization
Create/get integration record di database
Generate OAuth state (untuk CSRF protection)
Build authorization URL
Return redirect URL ke frontend
Request:

POST /api/integrations/github/authorize
Content-Type: application/json
Response:

{
  "redirectUrl": "https://github.com/login/oauth/authorize?client_id=...&state=..."
}
State Parameter:

Encrypted JSON: { provider: "github", organizationId: 1, timestamp: ... }
Digunakan untuk verify callback
File: 
src/app/api/integrations/github/authorize/route.ts

5. GET /api/auth/code/github
Purpose: Handle OAuth callback dari GitHub

Authentication: Not required (state verification instead)

Flow:

Verify state parameter (CSRF protection)
Exchange code untuk access token
Store encrypted tokens di database
Update status: connected=true, status=ACTIVE
Generate webhook secret
Redirect ke integrations page
Request (dari GitHub):

GET /api/auth/code/github?code=abc123&state=xyz789
Success Redirect:

http://localhost:3007/organization/integrations?success=github_connected
Error Redirect:

http://localhost:3007/organization/integrations?error=callback_failed
File: 
src/app/api/auth/code/github/route.ts

6. POST /api/integrations/github/webhook
Purpose: Receive webhook events dari GitHub

Authentication: Webhook signature verification (HMAC-SHA256)

Flow:

Verify x-hub-signature-256 header
Handle special events (ping)
Store event di webhook_events table
Process asynchronously (optional)
Request (dari GitHub):

POST /api/integrations/github/webhook
X-GitHub-Event: push
X-Hub-Signature-256: sha256=...
{
  "ref": "refs/heads/main",
  "commits": [...]
}
Supported Events:

ping - Webhook test
push - Code push
pull_request - PR events
issues - Issue events
Response:

{
  "success": true,
  "eventId": "evt_123..."
}
File: 
src/app/api/integrations/github/webhook/route.ts

💬 Slack Integration
7. POST /api/integrations/slack/authorize
Purpose: Inisiasi OAuth flow untuk Slack

Similar to GitHub authorize, tapi dengan Slack scopes:

channels:read
chat:write
users:read
File: 
src/app/api/integrations/slack/authorize/route.ts

8. GET /api/integrations/slack/callback
Purpose: Handle OAuth callback dari Slack

Flow sama seperti GitHub callback

File: 
src/app/api/integrations/slack/callback/route.ts

9. POST /api/integrations/slack/webhook
Purpose: Receive webhook events dari Slack

Includes:

Slack URL verification challenge
Event handling
Command handling (slash commands)
File: 
src/app/api/integrations/slack/webhook/route.ts

🛠️ Helper Libraries
OAuth Helpers (
src/lib/integrations/oauth-helpers.ts
)
Functions:

generateOAuthState(provider, organizationId)
const state = generateOAuthState('github', 1)
// Returns: encrypted JWT string
verifyOAuthState(state)
const data = verifyOAuthState(state)
// Returns: { provider, organizationId, timestamp }
buildAuthorizationUrl(config, state)
const url = buildAuthorizationUrl({
  clientId: process.env.GITHUB_CLIENT_ID,
  authorizationUrl: 'https://github.com/login/oauth/authorize',
  scopes: ['repo', 'read:user']
}, state)
exchangeCodeForToken(config, code)
const tokens = await exchangeCodeForToken(config, code)
// Returns: { access_token, refresh_token?, expires_in?, scope? }
storeOAuthTokens(integrationId, tokens)
await storeOAuthTokens(integration.id, tokens)
// Stores encrypted tokens + sets connected=true
getValidAccessToken(integrationId)
const token = await getValidAccessToken(integrationId)
// Auto-refreshes if expired
Webhook Helpers (
src/lib/integrations/webhook-helpers.ts
)
Functions:

verifyWebhookSignature(integrationId, body, signature, algorithm)
const { valid } = await verifyWebhookSignature(
  integrationId,
  requestBody,
  req.headers.get('x-hub-signature-256'),
  'sha256'
)
storeWebhookEvent(integrationId, eventType, payload, headers)
const eventId = await storeWebhookEvent(
  integration.id,
  'push',
  payload,
  { 'x-github-event': 'push' }
)
markWebhookProcessed(eventId)
await markWebhookProcessed(eventId)
recordWebhookError(eventId, error)
await recordWebhookError(eventId, new Error('Processing failed'))
🔐 Environment Variables
Required untuk integrasi berfungsi:

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3007
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
# Encryption
INTEGRATION_ENCRYPTION_KEY=e03341cece...
# GitHub OAuth
GITHUB_CLIENT_ID=Ov23lilvy2j6lEbEukXk
GITHUB_CLIENT_SECRET=f2f0c1697aa67a...
# Slack OAuth
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
SLACK_SIGNING_SECRET=
📊 Database Schema
integrations Table
CREATE TABLE integrations (
  id UUID PRIMARY KEY,
  organization_id BIGINT REFERENCES organizations(id),
  provider TEXT NOT NULL,  -- 'github', 'slack', etc
  
  -- Connection Status
  connected BOOLEAN DEFAULT false,
  status TEXT,  -- 'ACTIVE', 'DISCONNECTED', 'ERROR'
  
  -- OAuth Tokens (encrypted)
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  
  -- Webhook
  webhook_secret TEXT,
  
  -- Config
  config JSONB DEFAULT '{}',
  permissions TEXT[],
  sync_enabled BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
webhook_events Table
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY,
  integration_id UUID REFERENCES integrations(id),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  headers JSONB,
  processed BOOLEAN DEFAULT false,
  retry_count INTEGER DEFAULT 0,
  received_at TIMESTAMPTZ DEFAULT NOW()
);
🔄 Complete OAuth Flow Diagram
Database
API (callback)
GitHub
API (authorize)
Frontend
User
Database
API (callback)
GitHub
API (authorize)
Frontend
User
Click "Connect GitHub"
POST /api/integrations/github/authorize
Create/Get integration record
Generate state (CSRF token)
{ redirectUrl: "github.com/..." }
Redirect to GitHub OAuth
Show authorization screen
Approve
GET /api/auth/code/github?code=...&state=...
Verify state
Exchange code for token
{ access_token, ... }
Store encrypted tokens
Update connected=true
Redirect to /integrations?success=...
Show "Connected" status
🎯 Frontend Integration
Usage in 
IntegrationsClient.tsx
// Connect Integration
const res = await fetch(`/api/integrations/${item.id}/authorize`, {
  method: "POST",
  headers: { "Content-Type": "application/json" }
})
const data = await res.json()
if (data.redirectUrl) {
  window.location.href = data.redirectUrl  // Start OAuth
}
// Disconnect Integration
const res = await fetch(`/api/integrations/${item.id}`, {
  method: "DELETE"
})
const data = await res.json()
if (data.success) {
  // Refresh UI
}
⚠️ Important Notes
UUID Detection Logic
Endpoints support kedua UUID dan provider name:

const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
if (isUUID) {
  query.eq('id', id)  // Search by UUID
} else {
  query.eq('provider', id)  // Search by provider name
}
Security Measures
✅ OAuth state untuk CSRF protection
✅ Webhook signature verification
✅ Token encryption menggunakan INTEGRATION_ENCRYPTION_KEY
✅ Role-based access control (Owner/Admin only)
Caching
✅ API routes: export const dynamic = 'force-dynamic'
✅ Page fetch: cache: 'no-store'
✅ Ensures UI always shows fresh data
📞 Error Handling
All endpoints return consistent error format:

{
  "error": "Error message",
  "details": "Additional context (optional)"
}
Common status codes:

401 - Unauthorized (not logged in)
403 - Forbidden (insufficient permissions)
404 - Not found (integration doesn't exist)
500 - Internal server error
Last Updated: February 11, 2026
Version: 1.0