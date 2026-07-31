'use client'

import { MoonIcon, SunIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

export const THEME_STORAGE_KEY = 'parallax-theme'

/**
 * Deliberately stateless. The inline script in `app/layout.tsx` puts `.dark`
 * on <html> before paint, and CSS picks the matching icon — so there is no
 * React state to hydrate and no theme flash.
 */
export function ThemeToggle() {
  function toggle() {
    const next = !document.documentElement.classList.contains('dark')
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next ? 'dark' : 'light')
    } catch {
      // Private browsing can block storage — the toggle still works.
    }
  }

  return (
    <Button variant="ghost" size="icon-sm" onClick={toggle}>
      <MoonIcon className="dark:hidden" />
      <SunIcon className="hidden dark:block" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
