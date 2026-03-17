🔌 Integration System - Developer Documentation
Complete guide untuk development, configuration, dan troubleshooting Integration System (GitHub, Slack, dll).

📋 Table of Contents
Overview
Quick Start
Architecture
Setup & Configuration
Development Guide
Testing
Troubleshooting
Security
🌟 Overview
Integration System memungkinkan Presensi app untuk connect dengan external services seperti:

GitHub - Track commits, issues, PRs untuk time attribution
Slack - Team notifications & slash commands
Jira - Sync tasks & time logging
Zoom - Meeting attendance tracking
Google Calendar - Schedule integration
Key Features
✅ OAuth 2.0 Flow - Secure authorization dengan state verification
✅ Webhook Support - Real-time events dari external services
✅ Token Management - Auto-refresh expired tokens
✅ Encrypted Storage - Tokens encrypted at rest
✅ Flexible Queries - Support UUID atau provider name
✅ Role-Based Access - Owner/Admin only

🚀 Quick Start
Prerequisites
Node.js 18+
Supabase account
GitHub OAuth App (untuk GitHub integration)
Slack App (untuk Slack integration)
Installation
Clone repository

git clone <repo-url>
cd presensi-new
npm install
Setup environment variables

cp .env.example .env
Configure 
.env

NEXT_PUBLIC_APP_URL=http://localhost:3007
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
# Encryption (generate: openssl rand -hex 32)
INTEGRATION_ENCRYPTION_KEY=e03341cecede70c14126...
# GitHub OAuth
GITHUB_CLIENT_ID=Ov23lilvy2j6lEbEukXk
GITHUB_CLIENT_SECRET=f2f0c1697aa67a...
Run database migrations

npx supabase db push
Start dev server

npm run dev
Navigate to integrations page

http://localhost:3007/organization/integrations
🏗️ Architecture
Directory Structure
src/
├── app/
│   ├── api/
│   │   ├── integrations/
│   │   │   ├── route.ts                    # GET /api/integrations
│   │   │   ├── [id]/route.ts               # DELETE, PATCH /api/integrations/[id]
│   │   │   ├── github/
│   │   │   │   ├── authorize/route.ts      # POST GitHub OAuth start
│   │   │   │   └── webhook/route.ts        # POST GitHub webhooks
│   │   │   └── slack/
│   │   │       ├── authorize/route.ts      # POST Slack OAuth start
│   │   │       ├── callback/route.ts       # GET Slack OAuth callback
│   │   │       └── webhook/route.ts        # POST Slack webhooks
│   │   └── auth/
│   │       └── code/
│   │           └── github/route.ts         # GET GitHub OAuth callback
│   └── organization/integrations/page.tsx  # UI page
├── components/organization/
│   └── IntegrationsClient.tsx              # Client component
└── lib/integrations/
    ├── oauth-helpers.ts                    # OAuth utilities
    └── webhook-helpers.ts                  # Webhook utilities
Data Flow
User
IntegrationsClient.tsx
API Routes
OAuth Helpers
Webhook Helpers
External Provider
Supabase DB
Database Schema
integrations table:

Primary key: 
id
 (UUID)
Foreign key: organization_id → organizations.id
Key fields: provider, connected, status, access_token (encrypted)
webhook_events table:

Primary key: 
id
 (UUID)
Foreign key: integration_id → integrations.id
Key fields: event_type, payload, processed
⚙️ Setup & Configuration
1. Create GitHub OAuth App
Go to https://github.com/settings/developers
Click New OAuth App
Fill in:
Application name: Presensi Integration
Homepage URL: http://localhost:3007
Authorization callback URL: http://localhost:3007/api/auth/code/github
Save Client ID dan Client Secret
2. Create Slack App
Go to https://api.slack.com/apps
Click Create New App → From scratch
Configure OAuth & Permissions:
Add redirect URL: http://localhost:3007/api/integrations/slack/callback
Add scopes: channels:read, chat:write, users:read
Save Client ID dan Client Secret
3. Generate Encryption Key
openssl rand -hex 32
Copy hasil ke 
.env
 sebagai INTEGRATION_ENCRYPTION_KEY

4. Database Migration
Run migration file:

supabase/migrations/20260210_create_integrations_tables.sql
Atau via CLI:

npx supabase migration up
💻 Development Guide
Adding New Integration Provider
Example: Adding Jira Integration

Step 1: Create authorize route
// src/app/api/integrations/jira/authorize/route.ts
import { NextRequest, NextResponse } from "next/server"
import { generateOAuthState, buildAuthorizationUrl } from "@/lib/integrations/oauth-helpers"
export async function POST(_req: NextRequest) {
  const supabase = await createClient()
  
  // Get user & organization
  const { data: { user } } = await supabase.auth.getUser()
  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()
  
  // Create/get integration record
  const { data: integration } = await supabase
    .from('integrations')
    .upsert({
      organization_id: member.organization_id,
      provider: 'jira',
      connected: false
    })
    .select('id')
    .limit(1)
    .maybeSingle()
  
  // Generate OAuth state
  const state = generateOAuthState('jira', member.organization_id)
  
  // Build authorization URL
  const authUrl = buildAuthorizationUrl({
    clientId: process.env.JIRA_CLIENT_ID!,
    authorizationUrl: 'https://auth.atlassian.com/authorize',
    scopes: ['read:jira-work', 'write:jira-work']
  }, state)
  
  return NextResponse.json({ redirectUrl: authUrl })
}
Step 2: Create callback route
// src/app/api/integrations/jira/callback/route.ts
import { NextRequest, NextResponse } from "next/server"
import { verifyOAuthState, exchangeCodeForToken, storeOAuthTokens } from "@/lib/integrations/oauth-helpers"
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const state = req.nextUrl.searchParams.get('state')
  
  // Verify state
  const stateData = verifyOAuthState(state)
  
  // Exchange code for token
  const tokens = await exchangeCodeForToken({
    clientId: process.env.JIRA_CLIENT_ID!,
    clientSecret: process.env.JIRA_CLIENT_SECRET!,
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/jira/callback`,
    tokenUrl: 'https://auth.atlassian.com/oauth/token'
  }, code)
  
  // Get integration
  const supabase = await createClient()
  const { data: integration } = await supabase
    .from('integrations')
    .select('id')
    .eq('organization_id', stateData.organizationId)
    .eq('provider', 'jira')
    .limit(1)
    .maybeSingle()
  
  // Store tokens
  await storeOAuthTokens(integration.id, tokens)
  
  // Redirect
  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL}/organization/integrations?success=jira_connected`
  )
}
Step 3: Add to catalog
// src/app/organization/integrations/page.tsx
const INTEGRATIONS_CATALOG = [
  {
    title: "Project Management",
    items: [
      {
        id: "jira",
        name: "Jira",
        description: "Connect Jira boards to automatically log time",
        iconUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jira/jira-original.svg",
        connected: false,
        status: "idle",
        category: "Project Management"
      }
    ]
  }
]
🧪 Testing
Manual Testing Flow
Test GitHub OAuth
Navigate to /organization/integrations
Click Connect on GitHub card
You should redirect to GitHub OAuth page
Authorize the app
You should redirect back to integrations page
Verify status changed to "Connected"
Test Disconnect
Click Disconnect on connected integration
Verify status changed to "Disconnected"
Check database:
SELECT connected, status, access_token 
FROM integrations 
WHERE provider = 'github';
Should show: connected=false, status='DISCONNECTED', access_token=null
Testing Webhooks Locally
Use ngrok untuk expose localhost:

# Install ngrok
npm install -g ngrok
# Start tunnel
ngrok http 3007
# Use ngrok URL di GitHub webhook settings
# Example: https://abc123.ngrok.io/api/integrations/github/webhook
Automated Tests
// Example test for authorize endpoint
describe('POST /api/integrations/github/authorize', () => {
  it('should return redirect URL', async () => {
    const res = await fetch('http://localhost:3007/api/integrations/github/authorize', {
      method: 'POST',
      headers: { 'Cookie': 'sb-auth-token=...; org_id=1' }
    })
    
    const data = await res.json()
    expect(data).toHaveProperty('redirectUrl')
    expect(data.redirectUrl).toContain('github.com/login/oauth/authorize')
  })
})
🔧 Troubleshooting
Issue: 405 Method Not Allowed
Symptom: Frontend shows POST /api/integrations/github/authorize 405

Solution:

Verify route exports 
POST
 function:
export async function POST(req: NextRequest) { ... }
Restart dev server
Clear .next folder: Remove-Item -Recurse -Force .next
Issue: 404 Not Found on Callback
Symptom: OAuth redirect fails with 404

Solutions:

Check callback URL in provider settings

GitHub: Must match http://localhost:3007/api/auth/code/github
Slack: Must match http://localhost:3007/api/integrations/slack/callback
Verify route file exists

src/app/api/auth/code/github/route.ts
Check redirectUri in code matches provider settings

Issue: UI Shows "Connect" Despite DB showing connected=true
Symptom: Database has connected: true but UI still shows Connect button

Solutions:

Clear Next.js cache

Hard refresh: Ctrl+Shift+R
Delete .next folder
Verify API returns correct data

Open DevTools → Network tab
Check /api/integrations response
Verify connected: true in response
Check for caching

Ensure API route has: export const dynamic = 'force-dynamic'
Ensure page fetch uses: cache: 'no-store'
Issue: Double JSON Read Error
Symptom: TypeError: body stream already read

Solution:

// ❌ Wrong - reads JSON twice
const body = await res.json()
const data = await res.json()
// ✅ Correct - read once, reuse
const data = await res.json()
if (!res.ok) throw new Error(data.error)
if (data.redirectUrl) window.location.href = data.redirectUrl
Issue: Integration Not Found (404)
Symptom: DELETE /api/integrations/github returns 404

Cause: Frontend sends provider name but backend expects UUID

Solution: Already implemented - backend uses UUID detection:

const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-...$/i.test(id)
if (isUUID) {
  query.eq('id', id)
} else {
  query.eq('provider', id)  // ✅ Supports "github"
}
Issue: Webhook Signature Verification Failed
Symptom: Webhooks rejected with 401

Solutions:

Check webhook secret in database

SELECT webhook_secret FROM integrations WHERE provider = 'github';
Verify GitHub webhook settings

Secret must match encrypted value in DB
Content type must be application/json
Test signature locally

const { valid } = await verifyWebhookSignature(
  integrationId,
  requestBody,
  signature,
  'sha256'
)
console.log('Signature valid:', valid)
🔒 Security
Token Encryption
All OAuth tokens are encrypted before storage:

// Encrypt
const encrypted = encrypt(token)
// Decrypt
const decrypted = decrypt(encrypted)
Uses AES-256-GCM with key from INTEGRATION_ENCRYPTION_KEY.

State Verification (CSRF Protection)
OAuth state parameter is encrypted JWT containing:

{
  "provider": "github",
  "organizationId": 1,
  "timestamp": 1707561234000
}
Verified during callback to prevent CSRF attacks.

Webhook Signature Verification
GitHub webhooks verified using HMAC-SHA256:

const signature = req.headers.get('x-hub-signature-256')
const { valid } = await verifyWebhookSignature(
  integrationId,
  requestBody,
  signature,
  'sha256'
)
Role-Based Access Control
Only Owner and Admin roles can manage integrations:

if (!['owner', 'admin'].includes(role.code)) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 })
}
Environment Variables Security
Never commit 
.env
 to git!

Add to .gitignore:

.env
.env.local
.env*.local
Production secrets should be stored in:

Vercel: Environment Variables
Railway: Environment Variables
AWS: Secrets Manager
📝 Best Practices
1. Always Use .maybeSingle() Instead of .single()
// ❌ Bad - throws error if 0 or 2+ results
.single()
// ✅ Good - returns null if not found
.maybeSingle()
2. Add .limit(1) Before .maybeSingle()
// ✅ Optimal query
.eq('provider', 'github')
.limit(1)
.maybeSingle()
3. Use UUID Detection for Flexible IDs
const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
4. Always Verify OAuth State
const stateData = verifyOAuthState(state)
if (!stateData) {
  return NextResponse.redirect(`${APP_URL}/integrations?error=invalid_state`)
}
5. Handle Token Refresh
const token = await getValidAccessToken(integrationId)
// Auto-refreshes if expired
📚 Additional Resources
API Endpoints Documentation
GitHub OAuth Guide
Slack API Documentation
Supabase Auth Guide
🤝 Contributing
Create feature branch: git checkout -b feature/new-integration
Make changes
Test thoroughly (manual + automated)
Update documentation
Submit PR with detailed description
Last Updated: February 11, 2026
Maintainer: Development Team
Version: 1.0