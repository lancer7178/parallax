import Link from 'next/link'

import { cn } from '@/lib/utils'

/**
 * One filter row above the content it scopes. Rendered as links so filtering
 * works without client JavaScript and stays shareable via the URL.
 */
export function StatusFilter({
  basePath,
  current,
  options,
  /** Other active filters, preserved so the rows compose instead of resetting. */
  keep,
}: {
  basePath: string
  current: string
  options: { value: string; label: string }[]
  keep?: Record<string, string | undefined>
}) {
  const all = [{ value: 'ALL', label: 'All' }, ...options]

  const hrefFor = (value: string) => {
    const params = new URLSearchParams()
    for (const [key, entry] of Object.entries(keep ?? {})) {
      if (entry) params.set(key, entry)
    }
    if (value !== 'ALL') params.set('status', value)
    const search = params.toString()
    return search ? `${basePath}?${search}` : basePath
  }

  return (
    <nav
      aria-label="Filter by status"
      className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-card p-1"
    >
      {all.map((option) => {
        const active = current === option.value
        const href = hrefFor(option.value)

        return (
          <Link
            key={option.value}
            href={href}
            aria-current={active ? 'true' : undefined}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              active
                ? 'bg-primary/12 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            {option.label}
          </Link>
        )
      })}
    </nav>
  )
}
