# Projects Tasks Page

## Deskripsi
Halaman Tasks untuk manajemen tugas dalam proyek, dengan fitur filtering, pencarian, dan tampilan multi-view (List, Kanban, Timeline).

## URL
`/projects/tasks`

## Fitur

### 1. Header Section
- **Title**: "Tasks"
- **Integration Button**: Dropdown untuk menambahkan integrasi dengan aplikasi lain

### 2. View Tabs
Tiga mode tampilan yang dapat dipilih:
- **List**: Tampilan tabel (default)
- **Kanban**: Tampilan kanban board (coming soon)
- **Timeline**: Tampilan timeline (coming soon)

### 3. Filter Section
Grid 4 kolom dengan filter:

#### Project Filter
- Dropdown untuk memilih project
- Default: "Muhammad's Organization"
- Placeholder: "Select project"

#### Assignee Filter
- Dropdown untuk memilih assignee (person yang ditugaskan)
- Placeholder: "Select assignee"
- Opsi: List semua member dari organization

#### Action Buttons
- **Duplicate Project**: Button untuk menduplikasi project
- **Add**: Button biru untuk menambah task baru

### 4. Search & Toggle Section
- **Show Completed Tasks**: Checkbox untuk menampilkan/menyembunyikan tasks yang sudah selesai
- **Search Box**: Input field dengan icon search untuk mencari tasks

### 5. Table Display
Tabel dengan kolom:

| Kolom | Deskripsi |
|-------|-----------|
| Task | Judul/nama task |
| Assignee | Person yang ditugaskan (dengan avatar & nama) |
| Task type | Badge yang menunjukkan tipe (Task, Bug, Feature, dll) |
| Created | Tanggal & waktu pembuatan |
| Actions | Dropdown menu untuk aksi (Edit, Delete, Mark as completed) |

### 6. Footer
- Menampilkan jumlah tasks: "Showing X of Y tasks"

## Component Structure

```tsx
<div className="main-container">
  {/* Header */}
  <div className="header">
    <h1>Tasks</h1>
    <DropdownMenu>Add integration</DropdownMenu>
  </div>

  {/* Tabs */}
  <Tabs>List | Kanban | Timeline</Tabs>

  {/* Filters Grid */}
  <div className="filters-grid">
    <Select>Project</Select>
    <Select>Assignee</Select>
    <Button>Duplicate project</Button>
    <Button>Add</Button>
  </div>

  {/* Search & Toggle */}
  <div className="search-section">
    <Checkbox>Show completed</Checkbox>
    <Input>Search tasks</Input>
  </div>

  {/* Table */}
  <Table>
    <TableRow>
      {/* Data rows */}
    </TableRow>
  </Table>

  {/* Footer */}
  <div>Showing count</div>
</div>
```

## Styling Guidelines

### Colors
- **Primary Blue**: `bg-blue-500`, `hover:bg-blue-600` (Add button)
- **Muted Background**: `bg-muted/50` (Table header, tabs)
- **Avatar**: `bg-blue-500` dengan text putih

### Typography
- **Header**: `text-3xl font-normal`
- **Labels**: `text-sm font-medium text-muted-foreground uppercase tracking-wide`
- **Table Headers**: `font-semibold`

### Spacing
- Main container: `p-4 md:p-6`
- Section gaps: `gap-4` atau `gap-6`
- Grid columns: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`

## Data Structure

```typescript
interface Task {
  id: number
  title: string
  assignee: {
    name: string
    initials: string
  }
  type: string // "Task" | "Bug" | "Feature" | etc
  created: string // ISO date or formatted string
  completed?: boolean
}
```

## State Management

```typescript
const [view, setView] = useState("list")           // Current view mode
const [showCompleted, setShowCompleted] = useState(false)  // Toggle completed
const [searchQuery, setSearchQuery] = useState("")        // Search term
```

## Future Enhancements

### Kanban View
- Drag & drop functionality
- Column: To-do, In Progress, Done
- Card dengan assignee dan due date

### Timeline View
- Gantt chart style
- Timeline dengan tanggal
- Dependencies antar tasks

### Additional Features
1. **Bulk Actions**: Select multiple tasks dan action sekaligus
2. **Sorting**: Sort by created date, assignee, type
3. **Filtering**: Filter by status, priority, due date
4. **Labels/Tags**: Add color-coded labels
5. **Due Dates**: Set dan track due dates
6. **Comments**: Add comments/discussion per task
7. **Attachments**: Upload files ke task
8. **Subtasks**: Create checklist dalam task
9. **Export**: Export to CSV/Excel
10. **Activity Log**: Track perubahan pada task

## API Integration (Future)

### GET /api/projects/tasks
```typescript
// Request
GET /api/projects/tasks?projectId=1&assigneeId=2&search=query&showCompleted=false

// Response
{
  success: true,
  data: {
    tasks: Task[],
    total: number,
    page: number,
    limit: number
  }
}
```

### POST /api/projects/tasks
```typescript
// Create new task
{
  title: string
  projectId: number
  assigneeId?: number
  type: string
  dueDate?: string
}
```

### PATCH /api/projects/tasks/:id
```typescript
// Update task
{
  title?: string
  assigneeId?: number
  completed?: boolean
}
```

### DELETE /api/projects/tasks/:id
```typescript
// Delete task
```

## Testing Checklist

- [ ] Page loads successfully
- [ ] All tabs render (List, Kanban, Timeline)
- [ ] Project dropdown works
- [ ] Assignee dropdown works
- [ ] Search functionality works
- [ ] Show completed checkbox toggles
- [ ] Duplicate project button clickable
- [ ] Add button opens create modal/form
- [ ] Table displays data correctly
- [ ] Avatar displays with initials
- [ ] Actions dropdown works
- [ ] Footer shows correct count
- [ ] Responsive on mobile
- [ ] Keyboard navigation works
- [ ] Screen reader accessible

## Accessibility

- Proper ARIA labels untuk buttons dan inputs
- Keyboard navigation support
- Focus indicators
- Screen reader friendly table
- Color contrast compliance
- Form validation messages

## Dependencies

- `@/components/ui/button`
- `@/components/ui/input`
- `@/components/ui/tabs`
- `@/components/ui/table`
- `@/components/ui/badge`
- `@/components/ui/select`
- `@/components/ui/dropdown-menu`
- `@/components/ui/avatar`
- `lucide-react` icons

