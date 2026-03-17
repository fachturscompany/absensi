# Hydration Error - Analisis & Solusi

## 🔴 Penyebab Hydration Error

Hydration error terjadi ketika HTML yang di-render di server **tidak cocok** dengan HTML yang di-render di client. Ada beberapa penyebab utama:

### 1. **Responsive Classes Mismatch** ⚠️
```tsx
// ❌ SALAH - Menyebabkan hydration error
<div className="flex flex-1 flex-col gap-4 p-3 sm:p-4 md:p-6">
  {children}
</div>
```

**Masalah:** Responsive classes (`sm:p-4 md:p-6`) di-render berbeda antara server dan client karena:
- Server tidak tahu viewport width
- Client menghitung responsive classes berdasarkan viewport
- Hasil render berbeda → hydration mismatch

### 2. **Dynamic Values di Render Time**
```tsx
// ❌ SALAH - Menyebabkan hydration error
const now = new Date();
const currentDate = format(now, 'yyyy-MM-dd');
const currentTime = format(now, 'HH:mm');

// Nilai berubah setiap kali dipanggil → server vs client berbeda
```

### 3. **State Initialization Tidak Konsisten**
```tsx
// ❌ SALAH
const [pagination, setPagination] = useState({ 
  pageSize: parseInt(pageSize)  // pageSize belum terdefinisi!
})
```

---

## ✅ Solusi yang Diterapkan

### 1. **ResponsiveWrapper Component**
```tsx
// ✅ BENAR - Responsive classes hanya diterapkan setelah hydration
import { ResponsiveWrapper } from "@/components/responsive-wrapper"

export default function AddAttendancePage() {
  return (
    <ResponsiveWrapper>
      <div className="w-full max-w-5xl mx-auto space-y-6">
        {/* Content */}
      </div>
    </ResponsiveWrapper>
  )
}
```

**Cara kerja:**
- Base classes (`flex flex-1 flex-col gap-4`) di-render di server
- Responsive classes (`sm:p-4 md:p-6`) hanya diterapkan setelah client hydration
- Tidak ada mismatch → tidak ada hydration error

### 2. **useIsClient Hook**
```tsx
import { useIsClient } from "@/lib/hydration-safe"

export function MyComponent() {
  const isClient = useIsClient()
  
  return (
    <div className={isClient ? "p-3 sm:p-4 md:p-6" : "p-3"}>
      {/* Content */}
    </div>
  )
}
```

### 3. **Dynamic Values dalam useEffect**
```tsx
// ✅ BENAR - Dynamic values di-generate setelah hydration
export function AttendanceFormBatch() {
  const [currentDate, setCurrentDate] = useState<string>("")
  const [currentTime, setCurrentTime] = useState<string>("")

  useEffect(() => {
    const now = new Date();
    setCurrentDate(format(now, 'yyyy-MM-dd'));
    setCurrentTime(format(now, 'HH:mm'));
  }, [])

  return (
    <form>
      <input type="date" value={currentDate} />
      <input type="time" value={currentTime} />
    </form>
  )
}
```

### 4. **State Initialization Konsisten**
```tsx
// ✅ BENAR - Initialize dengan nilai stabil
const [pagination, setPagination] = useState({ 
  pageIndex: 0, 
  pageSize: 10  // Nilai stabil, bukan parseInt
})

// Sync pageSize dalam useEffect
useEffect(() => {
  const newPageSize = parseInt(pageSize, 10) || 10
  setPagination((prev) => ({ ...prev, pageSize: newPageSize }))
}, [pageSize])
```

---

## 📋 Checklist untuk Mencegah Hydration Error

- [ ] Tidak ada responsive classes di render time
- [ ] Gunakan `ResponsiveWrapper` untuk layout dengan responsive padding/margin
- [ ] Gunakan `useIsClient` untuk conditional rendering responsive classes
- [ ] Semua dynamic values (`Date.now()`, `Math.random()`, dll) di dalam `useEffect`
- [ ] State initialization dengan nilai stabil, bukan dynamic values
- [ ] Tidak ada `typeof window !== 'undefined'` di render time (gunakan `useIsClient` hook)
- [ ] Tidak ada browser-specific code di server render

---

## 🔧 Implementasi di File Baru

### `src/lib/hydration-safe.ts`
Utility functions untuk menangani hydration-safe rendering

### `src/components/responsive-wrapper.tsx`
Wrapper component untuk responsive classes

### `src/app/attendance/add/page.tsx`
Contoh penggunaan ResponsiveWrapper

---

## 📚 Referensi
- [Next.js Hydration Error Documentation](https://nextjs.org/docs/messages/react-hydration-error)
- [React Hydration Mismatch](https://react.dev/reference/react-dom/hydrateRoot)
