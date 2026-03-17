"use client"

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Client-side layout wrapper to disable aggressive prefetching
 * Reduces initial page load requests
 */
export function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  useEffect(() => {
    // Fully disable automatic prefetching for all internal links
    const disablePrefetchOnLinks = (root: ParentNode | Document | Element) => {
      const links = root.querySelectorAll?.('a[href^="/"]') ?? []
      links.forEach((link) => {
        const a = link as HTMLAnchorElement
        a.removeAttribute('data-prefetch')
        a.setAttribute('data-no-prefetch', 'true')
      })
    }

    // Initial pass for current DOM
    disablePrefetchOnLinks(document)

    // Observe for dynamically inserted links and disable prefetch on them as well
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'childList') {
          m.addedNodes.forEach((node) => {
            if (node instanceof Element) {
              const el = node as Element
              if (el.matches && el.matches('a[href^="/"]')) {
                const a = el as HTMLAnchorElement
                a.removeAttribute('data-prefetch')
                a.setAttribute('data-no-prefetch', 'true')
              } else if (typeof (el as Element).querySelectorAll === 'function') {
                disablePrefetchOnLinks(el)
              }
            }
          })
        }
      }
    })

    observer.observe(document.body, { childList: true, subtree: true })

    // Intercept internal link clicks and force full document navigation
    const handleClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return
      if (e.button !== 0) return // only left click
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return // allow new tab/window behavior

      // Skip if clicking on a button or input element
      let target = e.target as Element | null
      while (target) {
        if (target instanceof HTMLButtonElement || 
            target instanceof HTMLInputElement ||
            target.tagName === 'BUTTON' ||
            target.tagName === 'INPUT') {
          return // Don't intercept button clicks
        }
        target = target.parentElement
      }

      let node = e.target as Element | null
      while (node && !(node instanceof HTMLAnchorElement)) {
        node = node.parentElement
      }
      if (!node) return
      const a = node as HTMLAnchorElement
      const href = a.getAttribute('href') || ''
      if (!href.startsWith('/')) return // external link
      if (a.target && a.target !== '_self') return // respect non-self targets

      // Prevent Next.js client navigation (which would fetch ?_rsc) and do hard navigation
      e.preventDefault()
      window.location.assign(href)
    }

    document.addEventListener('click', handleClick, true)

    return () => {
      observer.disconnect()
      document.removeEventListener('click', handleClick, true)
    }
  }, [pathname])

  return <>{children}</>
}
