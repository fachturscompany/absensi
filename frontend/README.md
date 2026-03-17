# 🕒 Presensi - Smart Attendance & Time Tracking System

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-15.5.9-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19.2.3-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=for-the-badge&logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase)

**A modern, full-featured attendance and time tracking platform built with Next.js**

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Tech Stack](#-tech-stack) • [Contributing](#-contributing)

</div>

---

## 📋 Overview

**Presensi** is a comprehensive attendance and time tracking system designed for modern organizations. It combines employee attendance management, project-based time tracking, activity monitoring, and powerful analytics into a single, unified platform.

### ✨ Key Highlights

- 🎯 **Multi-method Attendance** - Support for manual, fingerprint, GPS, and device-based check-ins
- ⏱️ **Real-time Time Tracking** - Project and task-based time entries with screenshot capture
- 📊 **Advanced Analytics** - Comprehensive insights, performance metrics, and unusual activity detection
- 🔄 **Workflow Automation** - Timesheet approval system with multi-level authorization
- 🌍 **Multi-organization** - Support for multiple organizations with isolated data
- 🔗 **Integrations** - Connect with Slack, GitHub, Jira, Google Calendar, and more
- 📱 **Progressive Web App** - Mobile-responsive with PWA support
- 🌓 **Dark Mode** - Beautiful UI with light/dark theme support

---

## 🚀 Features

### 🎯 Attendance Management
- ✅ Multiple check-in methods (Manual, Fingerprint, Device, GPS)
- 📍 Location tracking with map visualization
- 📅 Daily, weekly, and monthly attendance reports
- 🔔 Late arrival and early departure notifications
- 📊 Attendance dashboard with statistics
- 🔌 Hardware device integration support

### ⏱️ Time Tracking & Timesheets
- 🎬 Project and task-based time entries
- ✏️ Manual time entry with edit and split capabilities
- 📸 Automatic screenshot capture (10-minute intervals)
- 📈 Activity percentage monitoring
- 🚫 Idle time detection and reporting
- 💻 Apps and URLs tracking
- 📋 Weekly/bi-weekly timesheet approval workflow
- 💰 Payment status tracking

### 📊 Activity Monitoring
- 🖼️ Screenshot visualization and gallery
- 📱 Application usage statistics
- 🌐 Website visit tracking
- 📈 Real-time activity percentage
- 🔍 Unusual activity detection
- 📊 Productivity insights

### 📈 Analytics & Reporting
- 📊 Performance dashboards
- 🎯 Team and individual insights
- 📅 Timeline and highlight views
- 🔔 Smart notifications
- 📑 Customizable reports
- 📥 Export to CSV, Excel, and PDF
- 📊 Multiple report types:
  - Time & Activity Report
  - Daily Totals Report
  - Manual Time Edits Log
  - Timesheet Approvals Report
  - Project Budgets Report
  - Time Off Transactions

### 🏢 Project Management
- 📁 Project creation and tracking
- 👥 Client management
- ✅ Task assignments
- 💵 Budget monitoring
- 🕐 Time allocation
- 💰 Billable/non-billable tracking

### 🔗 Integrations
- **Slack** - Notifications and team updates
- **GitHub** - Issue and PR synchronization
- **Jira** - Task management sync
- **Google Calendar** - Schedule synchronization
- **Zoom** - Meeting link generation
- **Microsoft Teams** - Team collaboration
- **Notion** - Documentation sync
- **GitLab** - Repository integration

### 👥 Organization Management
- 🏢 Multi-organization support
- 🔄 Organization switcher
- ⚙️ Comprehensive settings
- 👤 Member and group management
- 💼 Position and role management
- 👆 Fingerprint enrollment
- 📧 Invitation system

---

## 🛠️ Tech Stack

### Frontend
- **[Next.js 15.5.9](https://nextjs.org/)** - React framework with App Router
- **[React 19.2.3](https://react.dev/)** - UI library
- **[TypeScript 5](https://www.typescriptlang.org/)** - Type-safe development
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS
- **[shadcn/ui](https://ui.shadcn.com/)** - Component library
- **[Radix UI](https://www.radix-ui.com/)** - Headless UI primitives
- **[Lucide React](https://lucide.dev/)** - Icon library
- **[Framer Motion](https://www.framer.com/motion/)** - Animation library

### Backend & Database
- **[Supabase](https://supabase.com/)** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication
  - Storage
  - Real-time subscriptions
- **[Prisma](https://www.prisma.io/)** - ORM (optional)

### State Management
- **[Zustand](https://github.com/pmndrs/zustand)** - Lightweight state management
- **[TanStack Query](https://tanstack.com/query)** - Server state management
- **[Immer](https://immerjs.github.io/immer/)** - Immutable state updates

### Data Visualization
- **[Recharts](https://recharts.org/)** - Chart components
- **[@react-three/fiber](https://docs.pmnd.rs/react-three-fiber)** - 3D visualizations

### Maps & Location
- **[Leaflet](https://leafletjs.com/)** - Interactive maps
- **[React Leaflet](https://react-leaflet.js.org/)** - React wrapper for Leaflet
- **[Pigeon Maps](https://pigeon-maps.js.org/)** - Lightweight map alternative

### Utilities
- **[React Hook Form](https://react-hook-form.com/)** - Form management
- **[Zod](https://zod.dev/)** - Schema validation
- **[date-fns](https://date-fns.org/)** - Date manipulation
- **[jsPDF](https://github.com/parallax/jsPDF)** - PDF generation
- **[XLSX](https://sheetjs.com/)** - Excel file handling
- **[Sharp](https://sharp.pixelplumbing.com/)** - Image optimization

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **npm** 9.x or higher (comes with Node.js)
- **Supabase Account** ([Sign up](https://supabase.com/))
- **Git** ([Download](https://git-scm.com/))

---

## 🚀 Quick Start

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-org/presensi.git
cd presensi
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Environment Setup

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database (if using Prisma)
DATABASE_URL=your_postgres_connection_string

# Integration OAuth Credentials (Optional)
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
JIRA_CLIENT_ID=your_jira_client_id
JIRA_CLIENT_SECRET=your_jira_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
```

### 4️⃣ Set Up Supabase

1. Create a new Supabase project
2. Copy your project URL and anon key to `.env.local`
3. Run the database migrations (schema in `src/db-schema.ts`)
4. Set up Row Level Security (RLS) policies
5. Configure storage buckets for logos and screenshots

### 5️⃣ Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6️⃣ Build for Production

```bash
npm run build
npm run start
```

---

## 📁 Project Structure

```
presensi/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── attendance/         # Attendance module
│   │   ├── timesheets/         # Timesheet module
│   │   ├── activity/           # Activity tracking
│   │   ├── insight/            # Analytics & insights
│   │   ├── reports/            # Reporting
│   │   ├── projects/           # Project management
│   │   ├── organization/       # Organization settings
│   │   └── ...
│   │
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── layout/             # Layout components
│   │   ├── timesheets/         # Timesheet components
│   │   └── ...
│   │
│   ├── lib/                    # Utilities & helpers
│   │   ├── data/               # Mock data & constants
│   │   ├── constants/          # App constants
│   │   └── utils.ts            # Utility functions
│   │
│   ├── action/                 # Server actions (34 files)
│   ├── store/                  # Zustand stores
│   ├── hooks/                  # Custom React hooks (37 files)
│   ├── types/                  # TypeScript types
│   ├── utils/                  # Supabase & utilities
│   │
│   ├── middleware.ts           # Next.js middleware
│   ├── db-schema.ts            # Database schema
│   └── integration-helpers.ts  # Integration utilities
│
├── public/                     # Static assets
├── scripts/                    # Build scripts
├── prisma/                     # Prisma schema (optional)
│
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

---

## 🔐 Authentication & Authorization

### Role-Based Access Control (RBAC)

The system implements granular role-based permissions:

| Role Code | Name | Description |
|-----------|------|-------------|
| `SA001` | Super Admin | Full system access |
| `A001` | Organization Admin | Organization-level management |
| `M001` | Manager | Team management and approvals |
| `U001` | Regular User | Standard user access |

### Permission System

Check permissions in components:

```typescript
import { useUserStore } from '@/store/user-store'

const { role, permissions } = useUserStore()
const canApprove = permissions?.includes('timesheets:approve')
```

---

## 🗄️ Database Schema

The application uses PostgreSQL via Supabase with the following main tables:

- **organizations** - Organization data
- **members** - Users and team members
- **attendance** - Daily attendance records
- **timesheets** - Time tracking entries
- **timesheet_approvals** - Approval workflow
- **projects** - Client projects
- **screenshots** - Activity screenshots
- **integrations** - Third-party integrations
- **sync_logs** - Integration sync history
- **webhook_events** - Incoming webhooks

See [PROJECT_SCHEMA.md](./PROJECT_SCHEMA.md) for detailed schema documentation.

---

## 🔄 API Routes

### Integrations API

```
GET    /api/integrations                    # List all integrations
POST   /api/integrations                    # Create integration
GET    /api/integrations/[provider]/authorize  # OAuth authorization
GET    /api/integrations/[provider]/callback   # OAuth callback
POST   /api/integrations/[provider]/webhook    # Webhook receiver
DELETE /api/integrations/[id]               # Disconnect integration
```

### Server Actions

Located in `src/action/`:
- `attendance.ts` - Attendance CRUD operations
- `organization-settings.ts` - Organization management
- And 32 more action files...

---

## 🎨 UI Components

### Custom Components

All UI components are built with **shadcn/ui** and **Radix UI**, fully customizable:

```typescript
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
```

### Theme Customization

Modify `tailwind.config.ts` to customize the design system:

```typescript
theme: {
  extend: {
    colors: {
      primary: { /* your colors */ },
      secondary: { /* your colors */ },
    }
  }
}
```

---

## 📱 Progressive Web App (PWA)

The application is a fully functional PWA:

- ✅ Offline support
- ✅ Installable on mobile/desktop
- ✅ Push notifications ready
- ✅ App-like experience

Configuration in `next.config.js` using `@ducanh2912/next-pwa`.

---

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch
```

Testing framework: **Vitest**

---

## 📊 Performance Optimization

### Image Optimization
- Client-side compression via `browser-image-compression`
- Server-side optimization via `sharp`
- Automatic WebP conversion
- Lazy loading for screenshots

### Code Splitting
- Automatic route-based splitting
- Dynamic imports for heavy components
- Next.js optimizations

### Caching Strategy
- TanStack Query for server state
- localStorage for preferences
- Supabase edge caching

---

## 🌍 Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Docker

```bash
# Build Docker image
docker build -t presensi .

# Run container
docker run -p 3000:3000 presensi
```

### Traditional Hosting

```bash
npm run build
npm run start
```

Serve on port 3000 with process manager (PM2, systemd, etc.)

---

## 🔧 Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests |
| `npm run geo:generate` | Generate geographic data |
| `npm run members:template` | Generate member templates |

---

## 🐛 Troubleshooting

### Common Issues

**Q: Supabase connection fails**
- A: Check your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Ensure Supabase project is active

**Q: Images not loading**
- A: Verify Supabase Storage bucket is public
- Check CORS settings in Supabase dashboard

**Q: OAuth integrations not working**
- A: Verify redirect URLs in OAuth provider settings
- Check callback URL: `http://localhost:3000/api/integrations/[provider]/callback`

**Q: Build fails with memory error**
- A: Increase Node.js memory: `NODE_OPTIONS=--max_old_space_size=4096 npm run build`

---

## 📚 Documentation

- [Project Schema](./PROJECT_SCHEMA.md) - Detailed database and architecture
- [Integration Docs](./src/INTEGRATION_DOCS.md) - Integration setup guide
- [API Documentation](#-api-routes) - API endpoints reference

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Use TypeScript for all new code
- Follow the existing code structure
- Write meaningful commit messages
- Add tests for new features

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

- **Development Team** - [Your Organization](https://github.com/fachturrpl1)
- **Maintainers** - Active development and support

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [Supabase](https://supabase.com/) - Open Source Firebase Alternative
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI Components
- [Vercel](https://vercel.com/) - Deployment Platform

---

## 📞 Support

- 📧 Email: support@presensi.app
- 💬 Slack: [Join our Slack](https://slack.presensi.app)
- 🐛 Issues: [GitHub Issues](https://github.com/your-org/presensi/issues)
- 📖 Docs: [Documentation](https://docs.presensi.app)

---

<div align="center">

**Made with ❤️ by the Presensi Team**

⭐ Star us on GitHub if you find this project useful!

</div>
