//type yang digunakan untuk components/custom/search-bar.tsx

export interface SearchBarProps {
  onSearch: (query: string) => Promise<void> | void
  placeholder?: string
  initialQuery?: string
  debounceDelay?: number
  className?: string
  disabled?: boolean
}

export type SearchCallback = (query: string) => Promise<void> | void
