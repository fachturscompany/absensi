# Error Fixes Required - Frontend Testing

## 📋 Daftar Error yang Ditemukan

### 1. ❌ role-selector/page.tsx - Missing Hydration Check

**File:** `src/app/role-selector/page.tsx`

**Error:**
- Line 6: Import `useUserStore` dari `@/store/user-store` tapi file tersebut masih menggunakan old version
- Line 73: `userStore.setRole(role.code, role.id)` - parameter tidak sesuai dengan updated signature
- Missing hydration check yang bisa menyebabkan hydration error

**Penyebab:**
- `user-store.ts` belum di-update dengan versi baru (`user-store-updated.ts`)
- `setRole()` method signature berbeda

**Solusi:**
1. Merge `user-store-updated.ts` ke `user-store.ts`
2. Update `setRole()` call dengan parameter yang benar
3. Tambahkan hydration check

---

### 2. ❌ setup-wizard/page.tsx - Missing Hydration & Error Display

**File:** `src/app/setup-wizard/page.tsx`

**Error:**
- Line 7: Import `useUserStore` dari `@/store/user-store` (old version)
- Line 29: `useUserStore()` tidak digunakan tapi di-import
- Missing proper error display di submitting state
- Line 42: `window.scrollTo()` bisa error di SSR

**Penyebab:**
- Unused import
- Missing window check untuk SSR
- Error tidak ditampilkan saat submitting

**Solusi:**
1. Remove unused `useUserStore` import
2. Add window check sebelum `scrollTo()`
3. Add error display di submitting overlay
4. Add hydration check untuk components

---

### 3. ❌ user-store-updated.ts - Not Merged to user-store.ts

**File:** `src/store/user-store-updated.ts` (belum di-merge)

**Error:**
- File ini adalah versi updated tapi belum menggantikan `user-store.ts`
- Semua import masih menggunakan old version
- Akan menyebabkan type mismatch

**Penyebab:**
- File baru dibuat tapi belum di-merge

**Solusi:**
1. Merge `user-store-updated.ts` ke `user-store.ts`
2. Update semua import di file yang menggunakan `user-store`
3. Delete `user-store-updated.ts`

---

## 🔧 Perbaikan yang Akan Dilakukan

### Step 1: Merge user-store-updated.ts → user-store.ts
```
Backup user-store.ts
Copy content dari user-store-updated.ts
Paste ke user-store.ts
Delete user-store-updated.ts
```

### Step 2: Fix role-selector/page.tsx
```
✅ Add hydration check
✅ Fix setRole() call
✅ Add error handling
✅ Add window check
```

### Step 3: Fix setup-wizard/page.tsx
```
✅ Remove unused imports
✅ Add window check untuk scrollTo()
✅ Add error display di submitting state
✅ Add hydration check
```

### Step 4: Fix setup wizard steps
```
✅ Add hydration check di semua steps
✅ Fix window reference
```

---

## 📊 Error Severity

| File | Error | Severity | Impact |
|------|-------|----------|--------|
| role-selector | Type mismatch | HIGH | App crash |
| setup-wizard | SSR error | HIGH | App crash |
| user-store | Not merged | HIGH | Type error |
| setup steps | Missing hydration | MEDIUM | Hydration error |

---

## ✅ Checklist Perbaikan

- [ ] Merge user-store-updated.ts ke user-store.ts
- [ ] Fix role-selector/page.tsx
- [ ] Fix setup-wizard/page.tsx
- [ ] Fix all setup wizard steps
- [ ] Test di frontend
- [ ] Verify no console errors
- [ ] Verify no hydration errors

---

**Siap untuk perbaikan!**
