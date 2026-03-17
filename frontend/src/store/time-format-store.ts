import { create } from 'zustand'

interface TimeFormatState {
  format: '12h' | '24h'
  setFormat: (format: '12h' | '24h') => void
}

export const useTimeFormat = create<TimeFormatState>((set) => ({
  format: '24h',
  setFormat: (format) => set({ format }),
}))
