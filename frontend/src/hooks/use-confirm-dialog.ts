"use client"

import { useState } from 'react'

export function useConfirmDialog() {
  const [open, setOpen] = useState(false)
  const [callback, setCallback] = useState<(() => Promise<void> | void) | null>(null)

  const onConfirm = (callback: () => Promise<void> | void) => {
    setCallback(() => callback)
    setOpen(true)
  }

  const handleConfirm = async () => {
    if (callback) {
      await callback()
    }
    setOpen(false)
    setCallback(null)
  }

  return {
    open,
    setOpen,
    onConfirm,
    handleConfirm
  }
}
