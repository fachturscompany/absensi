"use client"

import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { useDebounceSearch } from '@/hooks/use-debounce-search'
import type { SearchBarProps } from '@/types/search'

export function SearchBar({
  onSearch,
  placeholder = 'Search...',
  initialQuery = '',
  debounceDelay = 500,
  className = '',
  disabled = false
}: SearchBarProps) {
  const [inputValue, setInputValue] = useState(initialQuery)
  const { isLoading, search } = useDebounceSearch(onSearch, debounceDelay)

  useEffect(() => {
    setInputValue(initialQuery)
  }, [initialQuery])


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    search(value)
  }

  const handleClear = () => {
    setInputValue('')
    search('')
  }

  return (
    <div className={`relative w-full max-w-md ${className}`}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />

      <Input
        value={inputValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="pl-10 pr-10 h-10 !bg-transparent dark:!bg-black !border-zinc-800 dark:!border-zinc-800 shadow-none transition-colors"
        disabled={disabled || isLoading}
      />

      {inputValue && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-2 top-1/2 h-8 w-8 p-0 -translate-y-1/2 hover:bg-transparent"
          onClick={handleClear}
          disabled={isLoading}
        >
          <X className="h-3 w-3" />
          <span className="sr-only">Clear search</span>
        </Button>
      )}

      {isLoading && (
        <div className="absolute right-10 top-1/2 h-4 w-4 -translate-y-1/2">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
    </div>
  )
}
