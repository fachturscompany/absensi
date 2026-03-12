'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { updateAttendanceRecord } from '@/action/attendance'
import type { AttendanceListItem } from '@/action/attendance'

export interface EditDialogProps {
  open: boolean
  record: AttendanceListItem | null
  onClose: () => void
  onSuccess: () => void
  onError: (message: string) => void
}

export const EditAttendanceDialog: React.FC<EditDialogProps> = ({
  open,
  record,
  onClose,
  onSuccess,
  onError
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    checkIn: '',
    checkOut: '',
    remarks: ''
  })

  // Reset form saat record berubah
  useEffect(() => {
    if (record) {
      setFormData({
        checkIn: record.checkIn ?? '',
        checkOut: record.checkOut ?? '',
        remarks: record.notes ?? ''
      })
    }
  }, [record])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!record) return

    try {
      setIsSubmitting(true)
      
      const result = await updateAttendanceRecord({
        id: record.id,
        actual_check_in: formData.checkIn.trim() || null,
        actual_check_out: formData.checkOut.trim() || null,
        remarks: formData.remarks.trim() || null
      })

      if (result.success) {
        toast.success('Attendance record updated')
        onSuccess()
        onClose()
      } else {
        toast.error(result.message || 'Failed to update record')
        onError(result.message || 'Failed to update record')
      }
    } catch (error) {
      toast.error('Failed to update record')
      onError('Failed to update record')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
    }
  }

  if (!record) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Attendance Record</DialogTitle>
          <DialogDescription>
            Update check-in/out times and remarks. Leave empty to clear values.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="checkIn">Check In (ISO format)</Label>
            <Input
              id="checkIn"
              value={formData.checkIn}
              onChange={(e) => setFormData(prev => ({ ...prev, checkIn: e.target.value }))}
              placeholder="2026-03-11T08:30:00+07:00"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="checkOut">Check Out (ISO format)</Label>
            <Input
              id="checkOut"
              value={formData.checkOut}
              onChange={(e) => setFormData(prev => ({ ...prev, checkOut: e.target.value }))}
              placeholder="2026-03-11T17:00:00+07:00"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Input
              id="remarks"
              value={formData.remarks}
              onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
              placeholder="Optional notes..."
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
