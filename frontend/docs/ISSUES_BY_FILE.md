# 📋 Daftar Issues per File

**Tanggal Evaluasi**: 2025-01-XX  
**Total Files dengan Issues**: 50+ files

---

## 🔴 **CRITICAL ISSUES** (High Priority)

### 1. **Testing Infrastructure** ❌
**Status**: Tidak ada sama sekali

**Files yang perlu dibuat**:
- ❌ `src/__tests__/` (folder belum ada)
- ❌ `src/__tests__/unit/` - Unit tests
- ❌ `src/__tests__/integration/` - Integration tests
- ❌ `src/__tests__/e2e/` - E2E tests
- ❌ `src/__tests__/components/` - Component tests
- ❌ `vitest.config.ts` - Sudah ada tapi belum digunakan
- ❌ `playwright.config.ts` - Belum ada
- ❌ `cypress.config.ts` - Belum ada

**Rekomendasi**: Setup testing infrastructure dari awal

---

### 2. **Rate Limiting** ❌
**Status**: Belum diimplementasi di API routes

**Files yang perlu diperbaiki** (29 API routes):
- ❌ `src/app/api/members/route.ts`
- ❌ `src/app/api/members/create/route.ts`
- ❌ `src/app/api/members/update/route.ts`
- ❌ `src/app/api/members/export/route.ts`
- ❌ `src/app/api/members/export/rows/route.ts`
- ❌ `src/app/api/members/export/count/route.ts`
- ❌ `src/app/api/members/export/preview/route.ts`
- ❌ `src/app/api/members/export/filter-options/route.ts`
- ❌ `src/app/api/members/import/process/route.ts`
- ❌ `src/app/api/members/import/headers/route.ts`
- ❌ `src/app/api/attendance-records/route.ts`
- ❌ `src/app/api/attendance/today/route.ts`
- ❌ `src/app/api/dashboard/stats/route.ts`
- ❌ `src/app/api/dashboard/active-members/route.ts`
- ❌ `src/app/api/dashboard/active-rfid/route.ts`
- ❌ `src/app/api/dashboard/monthly/route.ts`
- ❌ `src/app/api/dashboard/monthly-trend/route.ts`
- ❌ `src/app/api/dashboard/monthly-late/route.ts`
- ❌ `src/app/api/dashboard/member-distribution/route.ts`
- ❌ `src/app/api/dashboard/total-attendance/route.ts`
- ❌ `src/app/api/dashboard/today-summary/route.ts`
- ❌ `src/app/api/dashboard/recent-activity/route.ts`
- ❌ `src/app/api/group/import/process/route.ts`
- ❌ `src/app/api/group/import/headers/route.ts`
- ❌ `src/app/api/finger/import/process/route.ts`
- ❌ `src/app/api/position/import/process/route.ts`
- ❌ `src/app/api/position/import/headers/route.ts`
- ❌ `src/app/api/batch/route.ts`
- ❌ `src/app/api/log-client-error/route.ts`

**Note**: File `src/lib/rate-limit.ts` sudah ada tapi belum digunakan di API routes

---

### 3. **Input Validation dengan Zod** ⚠️
**Status**: Beberapa API routes menggunakan `any` type

**Files dengan `any` type issues** (29 files):
- ⚠️ `src/app/api/members/route.ts` - 10 instances
- ⚠️ `src/app/api/members/export/route.ts` - 12 instances
- ⚠️ `src/app/api/members/export/rows/route.ts` - 7 instances
- ⚠️ `src/app/api/members/export/count/route.ts` - 6 instances
- ⚠️ `src/app/api/members/export/preview/route.ts` - 8 instances
- ⚠️ `src/app/api/members/export/filter-options/route.ts` - 2 instances
- ⚠️ `src/app/api/members/import/process/route.ts` - 49 instances
- ⚠️ `src/app/api/members/import/headers/route.ts` - 12 instances
- ⚠️ `src/app/api/group/import/process/route.ts` - 8 instances
- ⚠️ `src/app/api/group/import/headers/route.ts` - 3 instances
- ⚠️ `src/app/api/finger/import/process/route.ts` - 12 instances
- ⚠️ `src/app/api/position/import/process/route.ts` - 7 instances
- ⚠️ `src/app/api/position/import/headers/route.ts` - 2 instances
- ⚠️ `src/app/api/dashboard/monthly/route.ts` - 6 instances
- ⚠️ `src/app/api/dashboard/recent-activity/route.ts` - 1 instance
- ⚠️ `src/app/api/dashboard/today-summary/route.ts` - 1 instance
- ⚠️ `src/app/api/dashboard/active-members/route.ts` - 2 instances
- ⚠️ `src/app/api/dashboard/active-rfid/route.ts` - 3 instances
- ⚠️ `src/app/api/dashboard/member-distribution/route.ts` - 2 instances
- ⚠️ `src/app/api/dashboard/monthly-late/route.ts` - 2 instances
- ⚠️ `src/app/api/dashboard/monthly-trend/route.ts` - 1 instance
- ⚠️ `src/app/api/dashboard/total-attendance/route.ts` - 2 instances
- ⚠️ `src/app/api/attendance-records/route.ts` - 1 instance
- ⚠️ `src/app/api/attendance/today/route.ts` - 4 instances
- ⚠️ `src/app/api/batch/route.ts` - 8 instances
- ⚠️ `src/app/api/organization/info/route.ts` - 1 instance
- ⚠️ `src/app/api/members/update/route.ts` - 1 instance
- ⚠️ `src/app/api/log-client-error/route.ts` - 1 instance

**Total**: 177 instances of `any` type

---

### 4. **Accessibility (ARIA Labels)** ❌
**Status**: Banyak komponen belum memiliki ARIA labels

**Files yang perlu diperbaiki**:
- ❌ `src/components/members-table.tsx` - Table tanpa ARIA labels
- ❌ `src/components/data-table.tsx` - Table tanpa ARIA labels
- ❌ `src/components/form/members-form.tsx` - Form inputs tanpa labels
- ❌ `src/components/form/attendance-form.tsx` - Form inputs tanpa labels
- ❌ `src/components/form/attendance-form-batch.tsx` - Form inputs tanpa labels
- ❌ `src/components/ui/button.tsx` - Buttons tanpa aria-label
- ❌ `src/components/ui/dialog.tsx` - Dialogs tanpa ARIA attributes
- ❌ `src/components/ui/select.tsx` - Select tanpa ARIA labels
- ❌ `src/components/ui/checkbox.tsx` - Checkboxes tanpa labels
- ❌ `src/components/ui/radio-group.tsx` - Radio buttons tanpa labels
- ❌ `src/components/dashboard/live-attendance-table.tsx` - Table tanpa ARIA
- ❌ `src/app/members/export/page.tsx` - Export wizard tanpa ARIA
- ❌ `src/components/layout-new/navbar-new.tsx` - Navigation tanpa ARIA
- ❌ `src/components/layout-new/app-sidebar-new.tsx` - Sidebar tanpa ARIA
- ❌ `src/components/notifications/notification-dropdown.tsx` - Dropdown tanpa ARIA

**Rekomendasi**: Audit semua interactive components

---

### 5. **Error Monitoring Service** ❌
**Status**: Tidak ada integration dengan Sentry/LogRocket

**Files yang perlu diperbaiki**:
- ❌ `src/lib/logger.ts` - Perlu integration dengan Sentry
- ❌ `src/app/global-error.tsx` - Perlu send errors ke Sentry
- ❌ `src/components/error-boundary.tsx` - Perlu send errors ke Sentry
- ❌ `src/hooks/use-monitoring.ts` - Perlu integration dengan Sentry

**Files yang perlu dibuat**:
- ❌ `src/lib/sentry.ts` - Sentry configuration
- ❌ `src/instrumentation.ts` - Next.js instrumentation untuk Sentry

---

## 🟡 **MEDIUM PRIORITY ISSUES**

### 6. **SEO - Structured Data (JSON-LD)** ❌
**Status**: Tidak ada structured data

**Files yang perlu diperbaiki**:
- ❌ `src/app/layout.tsx` - Perlu tambahkan JSON-LD
- ❌ `src/app/(dashboard)/page.tsx` - Perlu JSON-LD untuk Dashboard
- ❌ `src/app/members/page.tsx` - Perlu JSON-LD untuk Members page
- ❌ `src/app/attendance/page.tsx` - Perlu JSON-LD untuk Attendance page

**Files yang perlu dibuat**:
- ❌ `src/lib/seo.ts` - Helper functions untuk JSON-LD

---

### 7. **SEO - Sitemap.xml** ❌
**Status**: Belum dibuat

**Files yang perlu dibuat**:
- ❌ `src/app/sitemap.ts` - Dynamic sitemap generator

---

### 8. **SEO - Meta Tags per Page** ⚠️
**Status**: Beberapa halaman belum memiliki unique metadata

**Files yang perlu diperbaiki**:
- ⚠️ `src/app/(dashboard)/page.tsx` - Perlu `generateMetadata`
- ⚠️ `src/app/members/page.tsx` - Perlu `generateMetadata`
- ⚠️ `src/app/attendance/page.tsx` - Perlu `generateMetadata`
- ⚠️ `src/app/schedule/page.tsx` - Perlu `generateMetadata`
- ⚠️ `src/app/analytics/page.tsx` - Perlu `generateMetadata`
- ⚠️ `src/app/leaves/page.tsx` - Perlu `generateMetadata`
- ⚠️ `src/app/members/export/page.tsx` - Perlu `generateMetadata`

**Note**: `src/lib/metadata.ts` sudah ada tapi belum digunakan di semua pages

---

### 9. **Performance Monitoring** ⚠️
**Status**: Web Vitals tracking belum lengkap

**Files yang perlu diperbaiki**:
- ⚠️ `src/hooks/use-monitoring.ts` - Perlu lengkapi Web Vitals tracking
- ⚠️ `src/app/layout.tsx` - Perlu tambahkan Vercel Analytics atau GA4

**Files yang perlu dibuat**:
- ❌ `src/lib/analytics.ts` - Analytics helper functions

---

### 10. **Environment Variables Validation** ⚠️
**Status**: Belum ada validasi di startup

**Files yang perlu diperbaiki**:
- ⚠️ `src/lib/env.ts` - Perlu validasi dengan Zod
- ⚠️ `next.config.mjs` - Perlu validasi env vars

**Files yang perlu dibuat**:
- ❌ `src/lib/env-schema.ts` - Zod schema untuk env validation

---

### 11. **Code Quality - Unused Code** ⚠️
**Status**: Banyak unused variables dan imports

**Files dengan unused code** (dari ESLint warnings):
- ⚠️ `src/app/members/export/page.tsx` - Unused imports: `Download`, `FileDown`, `useOrgStore`
- ⚠️ `src/app/members/export/page.tsx` - Unused state: `memberData`, `setMemberData`, `loadingGroups`
- ⚠️ `src/action/attendance.ts` - Unused variables: `_` (multiple)
- ⚠️ `src/action/dashboard.ts` - Unused variables: `error` (multiple)
- ⚠️ `src/app/account-inactive/page.tsx` - Unused variable: `error`
- ⚠️ `src/components/change-foto.tsx` - Unused variable: `err`
- ⚠️ `src/components/form/account-form.tsx` - Unused variable: `error` (multiple)
- ⚠️ `src/components/photo-upload-dialog.tsx` - Unused variable: `error`
- ⚠️ `src/lib/metadata.ts` - Unused variable: `error`
- ⚠️ `src/utils/image-utils.ts` - Unused variable: `error`
- ⚠️ `src/app/api/organization/clear/route.ts` - Unused variable: `error`
- ⚠️ `src/app/attendance-devices/activate/page.tsx` - Unused variable: `error`
- ⚠️ `src/app/attendance/locations/_components/location-form.tsx` - Unused variable: `error`
- ⚠️ `src/components/leave/leave-request-list.tsx` - Unused variable: `error`
- ⚠️ `src/components/leave/leave-type-manager.tsx` - Unused variable: `error` (multiple)

---

### 12. **Code Quality - ESLint Warnings** ⚠️
**Status**: 560 warnings total

**Kategori warnings**:
- ⚠️ `@typescript-eslint/no-explicit-any` - 400+ warnings (penggunaan `any`)
- ⚠️ `@typescript-eslint/no-unused-vars` - 50+ warnings (unused variables)
- ⚠️ `react-hooks/exhaustive-deps` - 30+ warnings (missing dependencies)
- ⚠️ `react/no-unescaped-entities` - 20+ warnings (unescaped quotes)
- ⚠️ `@typescript-eslint/ban-ts-comment` - 10+ warnings (ts-ignore tanpa description)

---

### 13. **API Error Response Format** ⚠️
**Status**: Tidak konsisten

**Files yang perlu diperbaiki** (semua API routes):
- ⚠️ Semua files di `src/app/api/**/route.ts` - Perlu standardize error format

**Files yang perlu dibuat**:
- ❌ `src/lib/api-response.ts` - Standard API response helpers

---

### 14. **Image Alt Text** ⚠️
**Status**: Perlu audit semua images

**Files yang perlu diperbaiki**:
- ⚠️ Semua files yang menggunakan `<Image>` atau `<img>` - Perlu pastikan ada alt text

**Rekomendasi**: Run audit dengan script atau tool

---

## 🟢 **LOW PRIORITY ISSUES**

### 15. **Internationalization (i18n)** ❌
**Status**: Hanya Bahasa Indonesia

**Files yang perlu diperbaiki**:
- ❌ Semua component files - Perlu wrap dengan i18n
- ❌ Semua page files - Perlu i18n support

**Files yang perlu dibuat**:
- ❌ `src/i18n/` - i18n configuration
- ❌ `src/messages/id.json` - Indonesian translations
- ❌ `src/messages/en.json` - English translations

---

### 16. **PWA - Background Sync** ❌
**Status**: Belum diimplementasi

**Files yang perlu diperbaiki**:
- ❌ `public/sw.js` - Perlu tambahkan background sync
- ❌ `next.config.mjs` - Perlu enable PWA di production

---

### 17. **API Documentation** ❌
**Status**: Belum lengkap

**Files yang perlu dibuat**:
- ❌ `docs/API_REFERENCE.md` - Perlu update dengan semua endpoints
- ❌ `docs/API_EXAMPLES.md` - Contoh penggunaan API

**Note**: `docs/API_REFERENCE.md` sudah ada tapi belum lengkap

---

## 📊 **Summary per Kategori**

### Security Issues
- **Rate Limiting**: 29 files
- **Input Validation**: 29 files dengan `any` type
- **Env Validation**: 2 files

### Accessibility Issues
- **ARIA Labels**: 15+ component files
- **Form Labels**: 5+ form files
- **Focus Indicators**: Semua interactive components

### SEO Issues
- **Structured Data**: 4 page files
- **Sitemap**: 1 file perlu dibuat
- **Meta Tags**: 7 page files
- **Image Alt Text**: Semua image components

### Code Quality Issues
- **Type Safety**: 29 files dengan `any` type (177 instances)
- **Unused Code**: 15+ files
- **ESLint Warnings**: 560 warnings total

### Testing Issues
- **Unit Tests**: 0 files (perlu dibuat)
- **Integration Tests**: 0 files (perlu dibuat)
- **E2E Tests**: 0 files (perlu dibuat)

### Performance Issues
- **Monitoring**: 2 files perlu diperbaiki
- **Lazy Loading**: Beberapa component files

### Error Handling Issues
- **Error Monitoring**: 4 files perlu integration
- **Error Recovery**: Semua API routes

---

## 🎯 **Prioritas Perbaikan**

### Week 1 (Critical)
1. Setup testing infrastructure
2. Implement rate limiting di semua API routes
3. Fix accessibility issues (ARIA labels)

### Week 2-3 (High Priority)
4. Setup error monitoring (Sentry)
5. Replace `any` types dengan proper types
6. Implement input validation dengan Zod

### Week 4-6 (Medium Priority)
7. SEO improvements (JSON-LD, sitemap, meta tags)
8. Performance monitoring
9. Code cleanup (unused code, ESLint warnings)

### Month 2+ (Low Priority)
10. Internationalization
11. Advanced PWA features
12. API documentation

---

**Total Files dengan Issues**: 50+ files  
**Total Issues**: 25+ categories  
**Critical Issues**: 5 categories  
**High Priority**: 8 categories  
**Medium Priority**: 7 categories  
**Low Priority**: 5 categories

