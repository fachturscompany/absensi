'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Skeleton } from "@/components/ui/skeleton"
import { Search, RotateCcw, Download, Plus } from 'lucide-react'
import Link from 'next/link'
import { DateFilterBar } from '@/components/analytics/date-filter-bar'
import { cn } from '@/lib/utils'
import type { QueryParams } from '@/types/attendance/list'

interface ToolbarProps {
  queryParams: Pick<QueryParams, 'search' | 'status' | 'department'>
  departments: string[]
  dateRange: { from: Date; to: Date }
  onUpdateQuery: (updates: Partial<QueryParams>) => void
  loading: boolean
  isMounted?: boolean
}

export const Toolbar: React.FC<ToolbarProps> = ({
  queryParams,
  departments,
  dateRange,
  onUpdateQuery,
  loading,
  isMounted = true
}) => {
  const handleSearchChange = (value: string) => {
    onUpdateQuery({ search: value })
  }

  const handleStatusChange = (value: string) => {
    onUpdateQuery({ status: value })
  }

  const handleDepartmentChange = (value: string) => {
    onUpdateQuery({ department: value })
  }

  const handleDateChange = (range: { from: Date; to: Date }) => {
    onUpdateQuery({
      dateFrom: range.from.toISOString().slice(0, 10),
      dateTo: range.to.toISOString().slice(0, 10)
    })
  }

  const handleRefresh = () => {
    onUpdateQuery({})
  }

  return (
    <div className="space-y-4">
      {/* Title + Main Toolbar */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Attendance List</h1>
      </div>

      {/* Filters + Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-2 flex-wrap">
        {/* Search */}
        <SearchInput
          value={queryParams.search}
          onChange={handleSearchChange}
        />

        {/* Date Filter */}
        <DateFilterBar
          dateRange={dateRange}
          onDateRangeChange={handleDateChange}
          className="w-full lg:w-auto shrink-0"
        />

        {/* Filter Selects */}
        <div className="flex w-full lg:w-auto gap-2 shrink-0">
          <StatusFilter
            value={queryParams.status}
            onChange={handleStatusChange}
            isMounted={isMounted}
          />
          <DepartmentFilter
            value={queryParams.department}
            departments={departments}
            onChange={handleDepartmentChange}
            isMounted={isMounted}
          />
        </div>

        {/* Actions */}
        <div className="flex w-full lg:w-auto gap-2 shrink-0">
          <RefreshButton
            onClick={handleRefresh}
            loading={loading}
          />
          <Link href="/attendance/list/import" className="flex-1 lg:flex-none">
            <Button variant="outline" className="w-full lg:w-auto whitespace-nowrap">
              <Download className="mr-2 h-4 w-4" />
              Import
            </Button>
          </Link>
          <Link href="/attendance/add" className="flex-1 lg:flex-none">
            <Button className="w-full lg:w-auto whitespace-nowrap bg-primary">
              <Plus className="mr-2 h-4 w-4" />
              Entry
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

const SearchInput: React.FC<{ value: string; onChange: (value: string) => void }> = ({
  value,
  onChange
}) => (
  <div className="w-full lg:flex-1 lg:min-w-[200px] relative">
    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    <Input
      placeholder="Search members, email..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="pl-10 bg-background w-full h-10"
      disabled={false} // from props
    />
  </div>
)

const StatusFilter: React.FC<{
  value: string
  onChange: (value: string) => void
  isMounted: boolean
}> = ({ value, onChange, isMounted }) => {
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'present', label: 'Present' },
    { value: 'late', label: 'Late' },
    { value: 'absent', label: 'Absent' },
    { value: 'leave', label: 'Leave' },
    { value: 'excused', label: 'Excused' }
  ]

  if (!isMounted) {
    return <Skeleton className="w-full lg:w-[140px] h-10" />
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full lg:w-[140px] h-10 bg-background">
        <SelectValue placeholder="Status" />
      </SelectTrigger>
      <SelectContent>
        {statusOptions.map(({ value, label }) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

const DepartmentFilter: React.FC<{
  value: string
  departments: string[]
  onChange: (value: string) => void
  isMounted: boolean
}> = ({ value, departments, onChange, isMounted }) => {
  if (!isMounted) {
    return <Skeleton className="w-full lg:w-40 h-10" />
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full lg:w-40 h-10 bg-background">
        <SelectValue placeholder="Groups" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Groups</SelectItem>
        {departments.map(dept => (
          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

const RefreshButton: React.FC<{ onClick: () => void; loading: boolean }> = ({
  onClick,
  loading
}) => (
  <Button
    onClick={onClick}
    variant="ghost"
    size="sm"
    className="h-10 w-10 p-0 shrink-0"
    disabled={loading}
    title="Refresh data"
  >
    <RotateCcw className={cn('h-4 w-4', loading && 'animate-spin')} />
  </Button>
)
