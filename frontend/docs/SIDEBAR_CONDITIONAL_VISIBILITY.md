# Conditional Sidebar Menu Visibility

## Implementasi

Sistem conditional menu visibility telah ditambahkan ke AppSidebarNew untuk menyembunyikan/menampilkan menu berdasarkan halaman yang aktif.

### Helper Function

```typescript
// Helper function untuk determine menu visibility berdasarkan pathname
const shouldShowMenuItem = (pathname: string, itemTitle: string): boolean => {
  // Di halaman /organization, hanya tampilkan menu khusus organization
  if (pathname.startsWith('/organization')) {
    // Hanya tampilkan menu yang relevan dengan organization
    const organizationMenus = ['Settings']
    return organizationMenus.includes(itemTitle)
  }
  
  // Di halaman lain, tampilkan semua menu kecuali yang di-hide
  return true
}
```

### Penggunaan di NavMain

```typescript
{items.map((item) => {
  // Check if menu should be shown based on current pathname
  if (!shouldShowMenuItem(pathname, item.title)) {
    return null
  }
  
  // ... render menu item
})}
```

## Behavior

### Di halaman `/organization` dan subpage-nya:
- ✅ Tampilkan: "Settings" menu
- ❌ Sembunyikan: "Home", "Attendance", "Schedules", "Leaves", "Organization" (menu dengan subItems)

### Di halaman lain (/, /attendance, /leaves, dll):
- ✅ Tampilkan: Semua menu

## Struktur Menu Organization

Saat ini ada 2 menu terpisah:
1. **Organization** (dengan subItems: Members, Groups, Positions)
2. **Settings** (link ke /organization/settings)

### TODO: Tambahkan "All Organizations"

Untuk menampilkan "All Organizations" di halaman `/organization`, perlu menambahkan:

```typescript
{
  title: 'All Organizations',
  url: '/organization',
  icon: Building2,
}
```

Dan update shouldShowMenuItem untuk:
```typescript
const organizationMenus = ['All Organizations', 'Settings']
```

## Keuntungan

- ✅ Hanya 1 AppSidebar yang digunakan
- ✅ Menu disembunyikan/ditampilkan secara dinamis
- ✅ Tidak ada duplikasi sidebar
- ✅ Clean dan maintainable
- ✅ Mudah untuk menambah/mengubah visibility rules

## File yang Dimodifikasi

- `src/components/layout-new/app-sidebar-new.tsx`
  - Tambahkan `hideOn` property ke interfaces
  - Tambahkan `shouldShowMenuItem` helper function
  - Update NavMain untuk menggunakan conditional visibility
