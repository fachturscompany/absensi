// USAGE EXAMPLE #1: Members Page

// app/members/page.tsx
"use client"

import { SearchBar } from '@/components/ui/search-bar'
import { createClient } from '@/utils/supabase/client'
import { useState, useCallback, useEffect } from 'react'
import type { Member } from '@/types/member' // Your existing type

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)

  const handleSearch = useCallback(async (query: string) => {
    setLoading(true)
    const supabase = createClient()
    
    if (!query.trim()) {
      setMembers([])
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('members')
      .select('*')
      .ilike('name', `%${query}%`)
      .limit(20)
    
    if (error) {
      console.error('Search error:', error)
    } else {
      setMembers(data || [])
    }
    setLoading(false)
  }, [])

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Members</h1>
      
      <SearchBar 
        onSearch={handleSearch}
        placeholder="Cari nama member atau email..."
        debounceDelay={500}
        className="max-w-lg"
        disabled={loading}
      />
      
      <div className="grid gap-4">
        {members.map((member) => (
          <div key={member.id} className="p-4 border rounded-lg">
            {member.name} - {member.email}
          </div>
        ))}
      </div>
    </div>
  )
}

// USAGE EXAMPLE #2: Attendance History

// app/attendance/history/page.tsx
"use client"

import { SearchBar } from '@/components/ui/search-bar'
import { createClient } from '@/utils/supabase/client'
import { useState, useCallback } from 'react'
import type { AttendanceRecord } from '@/types/attendance'

export default function AttendanceHistory() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])

  const handleSearch = useCallback(async (query: string) => {
    const supabase = createClient()
    
    if (!query.trim()) {
      setRecords([])
      return
    }

    const { data } = await supabase
      .from('attendance_records')
      .select('*, members(name)')
      .ilike('members.name', `%${query}%`)
      .or(`notes.ilike.%${query}%,fingerprint_id.ilike.%${query}%`)
      .order('check_in_time', { ascending: false })
      .limit(50)
    
    setRecords(data || [])
  }, [])

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Attendance History</h1>
      
      <SearchBar 
        onSearch={handleSearch}
        placeholder="Cari karyawan, fingerprint ID, atau catatan..."
        debounceDelay={500}
        className="max-w-xl"
      />
      
      <div className="space-y-2">
        {records.map((record) => (
          <div key={record.id} className="flex justify-between p-3 border rounded">
            <span>{record.members?.name || 'Unknown'}</span>
            <span>{new Date(record.check_in_time).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
