import React from 'react'

/**
 * Utility untuk menangani responsive classes tanpa hydration error
 * Responsive classes hanya diterapkan setelah client-side hydration
 */

export function getResponsiveClasses(baseClasses: string, responsiveClasses: string, isClient: boolean): string {
  if (!isClient) {
    return baseClasses
  }
  return `${baseClasses} ${responsiveClasses}`.trim()
}

/**
 * Hook untuk mendeteksi apakah component sudah di-hydrate di client
 * Gunakan untuk conditional rendering responsive classes
 */
export function useIsClient(): boolean {
  const [isClient, setIsClient] = React.useState(false)

  React.useEffect(() => {
    setIsClient(true)
  }, [])

  return isClient
}
