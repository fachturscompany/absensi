'use client'

import React from 'react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { toast } from 'sonner'
import { 
  deleteAttendanceRecord, 
  deleteMultipleAttendanceRecords 
} from '@/action/attendance'
import type { AttendanceListItem } from '@/action/attendance'

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedIds: Set<string>
  items: AttendanceListItem[]
  onSuccess: () => void
  onError: (message: string) => void
}

export const ConfirmAttendanceDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  selectedIds,
  items,
  onSuccess,
  onError
}) => {
  const isBulk = selectedIds.size > 1
  const targetRecord = items.find(item => selectedIds.has(item.id))
  
  const handleConfirm = async () => {
    try {
      if (isBulk) {
        const ids = Array.from(selectedIds)
        const result = await deleteMultipleAttendanceRecords(ids)
        if (result.success) {
          toast.success(`${selectedIds.size} records deleted`)
          onSuccess()
        } else {
          toast.error(result.message || 'Failed to delete records')
        }
      } else if (targetRecord) {
        const result = await deleteAttendanceRecord(targetRecord.id)
        if (result.success) {
          toast.success('Record deleted')
          onSuccess()
        } else {
          toast.error(result.message || 'Failed to delete record')
        }
      }
    } catch (error) {
      toast.error('Delete operation failed')
      onError('Delete operation failed')
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isBulk ? `Delete ${selectedIds.size} records` : 'Delete attendance record'}
      description={
        isBulk 
          ? `This will permanently delete ${selectedIds.size} selected record(s). This action cannot be undone.`
          : `This will permanently delete the attendance record for ${targetRecord?.member?.name || 'this member'}. This action cannot be undone.`
      }
      confirmText="Delete"
      destructive
      loadingText={isBulk ? 'Deleting records...' : 'Deleting record...'}
      onConfirm={handleConfirm}
    />
  )
}
