'use client'
import { useEffect } from 'react'

export function PWACleanup() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    // Unregister semua Service Worker pada origin ini
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        regs.forEach(r => r.unregister().catch(() => { }))
      }).catch(() => { })
    }
    // Hapus semua cache SW
    if ('caches' in window) {
      caches.keys().then(keys => {
        keys.forEach(k => caches.delete(k).catch(() => { }))
      }).catch(() => { })
    }
  }, [])
  return null
}
