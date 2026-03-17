# 🔧 Perbaikan Accessibility untuk Export Wizard

## Masalah yang Ditemukan di `src/app/members/export/page.tsx`

### 1. **Buttons Tanpa ARIA Labels**

**Masalah**: Buttons tidak memiliki `aria-label` yang jelas untuk screen readers.

**Contoh Masalah**:
```tsx
<Button onClick={toggleSelectAll}>
  {selectedRows.size === memberRows.length ? "Hapus Semua" : "Pilih Semua"}
</Button>
```

**Perbaikan**:
```tsx
<Button 
  onClick={toggleSelectAll}
  aria-label={selectedRows.size === memberRows.length 
    ? "Hapus semua pilihan baris di tabel" 
    : "Pilih semua baris di tabel"}
>
  {selectedRows.size === memberRows.length ? "Hapus Semua" : "Pilih Semua"}
</Button>
```

---

### 2. **Table Tanpa ARIA Attributes**

**Masalah**: Table tidak memiliki ARIA attributes untuk menjelaskan struktur dan purpose.

**Contoh Masalah**:
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>NIK</TableHead>
      ...
    </TableRow>
  </TableHeader>
  <TableBody>
    {memberRows.map((row, idx) => (
      <TableRow key={idx}>
        <TableCell>
          <Checkbox checked={selectedRows.has(idx)} />
        </TableCell>
        ...
      </TableRow>
    ))}
  </TableBody>
</Table>
```

**Perbaikan**:
```tsx
<Table
  role="table"
  aria-label="Tabel data member untuk export"
  aria-rowcount={memberRows.length}
  aria-colcount={17}
>
  <TableHeader>
    <TableRow role="row">
      <TableHead role="columnheader" scope="col">
        <span className="sr-only">Pilih baris</span>
        <Checkbox
          aria-label="Pilih semua baris"
          checked={selectedRows.size === memberRows.length && memberRows.length > 0}
          onCheckedChange={toggleSelectAll}
        />
      </TableHead>
      <TableHead role="columnheader" scope="col">NIK</TableHead>
      ...
    </TableRow>
  </TableHeader>
  <TableBody>
    {memberRows.map((row, idx) => (
      <TableRow key={idx} role="row" aria-rowindex={idx + 1}>
        <TableCell role="gridcell">
          <Checkbox
            checked={selectedRows.has(idx)}
            onCheckedChange={() => toggleRowSelection(idx)}
            aria-label={`Pilih baris ${idx + 1}, NIK: ${row.nik || 'tidak ada'}, Nama: ${row.nama || 'tidak ada'}`}
          />
        </TableCell>
        <TableCell role="gridcell">{row.nik || "-"}</TableCell>
        ...
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

### 3. **Checkboxes Tanpa Labels**

**Masalah**: Checkboxes di table tidak memiliki label yang menjelaskan baris mana yang dipilih.

**Contoh Masalah**:
```tsx
<Checkbox
  checked={selectedRows.has(idx)}
  onCheckedChange={() => toggleRowSelection(idx)}
/>
```

**Perbaikan**:
```tsx
<Checkbox
  checked={selectedRows.has(idx)}
  onCheckedChange={() => toggleRowSelection(idx)}
  aria-label={`Pilih ${row.nama || 'member'} dengan NIK ${row.nik || 'tidak ada'}`}
/>
```

---

### 4. **Wizard Steps Tanpa ARIA**

**Masalah**: Wizard component tidak memiliki ARIA untuk menjelaskan progress dan current step.

**Contoh Masalah**:
```tsx
<Wizard
  steps={WIZARD_STEPS}
  currentStep={currentStep}
/>
```

**Perbaikan** (di Wizard component):
```tsx
<nav aria-label="Export wizard steps">
  <ol role="list" className="flex items-center">
    {WIZARD_STEPS.map((step, index) => (
      <li key={step.number} role="listitem">
        <div
          aria-current={currentStep === step.number ? "step" : undefined}
          aria-label={`Step ${step.number}: ${step.title}`}
        >
          {step.title}
        </div>
      </li>
    ))}
  </ol>
</nav>
```

---

### 5. **Popover/Command Tanpa ARIA**

**Masalah**: Filter popover tidak memiliki ARIA untuk menjelaskan state dan purpose.

**Contoh Masalah**:
```tsx
<Popover open={showAddFilterPopover}>
  <PopoverTrigger>
    <Button>Add filter</Button>
  </PopoverTrigger>
  <PopoverContent>
    <Command>
      <CommandItem>...</CommandItem>
    </Command>
  </PopoverContent>
</Popover>
```

**Perbaikan**:
```tsx
<Popover 
  open={showAddFilterPopover}
  onOpenChange={setShowAddFilterPopover}
>
  <PopoverTrigger asChild>
    <Button
      aria-label="Tambahkan filter baru"
      aria-expanded={showAddFilterPopover}
      aria-haspopup="dialog"
    >
      <Filter className="mr-2 h-4 w-4" />
      {filters.length === 0 ? "Pick a column to filter by" : "Add filter"}
    </Button>
  </PopoverTrigger>
  <PopoverContent 
    role="dialog"
    aria-label="Dialog pilih filter"
    aria-describedby="filter-description"
  >
    <div id="filter-description" className="sr-only">
      Pilih kolom untuk difilter, kemudian pilih nilai yang diinginkan
    </div>
    <Command role="combobox" aria-label="Pilih kolom filter">
      ...
    </Command>
  </PopoverContent>
</Popover>
```

---

### 6. **Loading States Tanpa ARIA**

**Masalah**: Loading spinners tidak memiliki ARIA untuk memberitahu screen readers.

**Contoh Masalah**:
```tsx
{loadingMembers && (
  <Loader2 className="h-6 w-6 animate-spin" />
)}
```

**Perbaikan**:
```tsx
{loadingMembers && (
  <div role="status" aria-live="polite" aria-busy="true">
    <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
    <span className="sr-only">Memuat data member...</span>
  </div>
)}
```

---

### 7. **Error Messages Tanpa ARIA**

**Masalah**: Toast errors tidak menggunakan `aria-live` regions.

**Contoh Masalah**:
```tsx
toast.error("Pilih minimal satu data member terlebih dahulu")
```

**Perbaikan** (di layout atau component):
```tsx
<div 
  id="error-messages" 
  role="alert" 
  aria-live="assertive" 
  aria-atomic="true"
  className="sr-only"
>
  {/* Toast akan otomatis update region ini */}
</div>
```

---

### 8. **Pagination Buttons Tanpa ARIA**

**Masalah**: Pagination buttons tidak memiliki ARIA untuk menjelaskan action.

**Contoh Masalah**:
```tsx
<Button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}>
  Sebelumnya
</Button>
```

**Perbaikan**:
```tsx
<Button 
  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
  disabled={currentPage === 1 || loadingMembers}
  aria-label={`Ke halaman ${currentPage - 1}`}
  aria-disabled={currentPage === 1 || loadingMembers}
>
  Sebelumnya
</Button>
```

---

### 9. **Search Input Tanpa Label**

**Masalah**: Search input mungkin tidak memiliki associated label.

**Perbaikan**:
```tsx
<div className="space-y-2">
  <Label htmlFor="search-member">Search Member</Label>
  <Input
    id="search-member"
    placeholder="Cari nama, NIK, email..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    aria-label="Cari member berdasarkan nama, NIK, atau email"
  />
</div>
```

---

### 10. **Badge Tanpa ARIA**

**Masalah**: Badge yang menampilkan jumlah pilihan tidak accessible.

**Contoh Masalah**:
```tsx
<Badge variant="secondary">
  {selectedRows.size} dipilih
</Badge>
```

**Perbaikan**:
```tsx
<Badge 
  variant="secondary"
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  {selectedRows.size} dipilih
</Badge>
```

---

## 📋 Checklist Perbaikan

- [ ] Tambahkan `aria-label` ke semua buttons
- [ ] Tambahkan ARIA attributes ke Table (role, aria-label, aria-rowcount, aria-colcount)
- [ ] Tambahkan `aria-label` ke semua checkboxes
- [ ] Tambahkan ARIA ke Wizard steps (aria-current, aria-label)
- [ ] Tambahkan ARIA ke Popover/Command (aria-expanded, aria-haspopup, role="dialog")
- [ ] Tambahkan ARIA ke loading states (aria-live, aria-busy, role="status")
- [ ] Tambahkan ARIA ke error messages (aria-live="assertive", role="alert")
- [ ] Tambahkan `aria-label` ke pagination buttons
- [ ] Pastikan semua inputs memiliki associated labels
- [ ] Tambahkan ARIA ke badges dan status indicators

---

## 🎯 Impact

Dengan perbaikan ini:
- ✅ Screen readers dapat menjelaskan semua interactive elements
- ✅ Keyboard navigation lebih jelas
- ✅ Users dengan disabilities dapat menggunakan export wizard
- ✅ Compliance dengan WCAG 2.1 Level AA
- ✅ Better UX untuk semua users

---

## 📚 Referensi

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Next.js Accessibility](https://nextjs.org/docs/app/building-your-application/optimizing/accessibility)

