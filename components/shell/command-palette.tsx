'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import type { Role } from '@prisma/client'
import {
  ArrowRightIcon,
  BuildingIcon,
  Loader2Icon,
  SearchIcon,
  type LucideIcon,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { navGroupsFor } from '@/components/shell/nav'
import { DialogOverlay } from '@/components/ui/dialog'
import { search } from '@/lib/actions/search'
import type { SearchResult } from '@/lib/queries'
import { cn } from '@/lib/utils'

type Item = {
  id: string
  group: string
  title: string
  subtitle?: string
  href: string
  icon?: LucideIcon
}

const GROUP_ORDER = [
  'Go to',
  'Projects',
  'Tasks',
  'Clients',
  'Invoices',
  'Team',
]

/** Debounce for the server round-trip. Short enough to feel like typing. */
const SEARCH_DELAY = 160

export function CommandPalette({ role }: { role: Role }) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [pending, setPending] = React.useState(false)
  const [active, setActive] = React.useState(0)
  const listRef = React.useRef<HTMLDivElement>(null)

  // Navigation targets come from the same source as the sidebar, so the
  // palette can never offer a destination the role is not allowed to open.
  const destinations = React.useMemo<Item[]>(
    () =>
      navGroupsFor(role).flatMap((group) =>
        group.items.map((item) => ({
          id: `nav-${item.href}`,
          group: 'Go to',
          title: item.label,
          href: item.href,
          icon: item.icon,
        }))
      ),
    [role]
  )

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((value) => !value)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Debounced search. `stale` drops the response of a request that was
  // superseded while it was in flight, so results never flicker backwards.
  React.useEffect(() => {
    const term = query.trim()
    if (term.length < 2) return

    let stale = false
    const timer = setTimeout(async () => {
      setPending(true)
      try {
        const found = await search(term)
        if (!stale) setResults(found)
      } catch {
        if (!stale) setResults([])
      } finally {
        if (!stale) setPending(false)
      }
    }, SEARCH_DELAY)

    return () => {
      stale = true
      clearTimeout(timer)
    }
  }, [query])

  const filteredDestinations = React.useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return destinations
    return destinations.filter((item) =>
      item.title.toLowerCase().includes(term)
    )
  }, [destinations, query])

  const items: Item[] = React.useMemo(() => {
    // Results for a term shorter than the threshold are always stale — the
    // effect below stops fetching but the last response is still in state.
    const matches = query.trim().length < 2 ? [] : results
    return [
      ...filteredDestinations,
      ...matches.map((result) => ({
        id: result.id,
        group: result.group,
        title: result.title,
        subtitle: result.subtitle,
        href: result.href,
        icon: result.group === 'Clients' ? BuildingIcon : undefined,
      })),
    ]
  }, [filteredDestinations, results, query])

  // Clamped rather than corrected in an effect: the list shrinks as results
  // arrive and the highlight has to stay inside it without an extra render.
  const activeIndex = items.length === 0 ? 0 : Math.min(active, items.length - 1)

  // Keyboard navigation has to move the viewport too, or the highlight walks
  // off the bottom of the scroll container.
  React.useEffect(() => {
    listRef.current
      ?.querySelector('[aria-selected="true"]')
      ?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, items])

  function go(item: Item | undefined) {
    if (!item) return
    setOpen(false)
    router.push(item.href)
  }

  function onOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      setQuery('')
      setResults([])
      setActive(0)
    }
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((current) => (items.length ? (current + 1) % items.length : 0))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((current) =>
        items.length ? (current - 1 + items.length) % items.length : 0
      )
    } else if (event.key === 'Enter') {
      event.preventDefault()
      go(items[activeIndex])
    }
  }

  // Group while preserving the order results were built in.
  const grouped = GROUP_ORDER.map((group) => ({
    group,
    items: items.filter((item) => item.group === group),
  })).filter((section) => section.items.length > 0)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-8 items-center gap-2 rounded-lg border border-border bg-muted/40 px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring outline-none sm:w-56 md:w-64"
      >
        <SearchIcon className="size-4 shrink-0" />
        <span className="hidden sm:inline">Search…</span>
        <kbd className="ml-auto hidden rounded border border-border bg-card px-1.5 py-0.5 font-sans text-[0.65rem] font-medium sm:inline">
          ⌘K
        </kbd>
        <span className="sr-only">Search the workspace</span>
      </button>

      <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
        <DialogPrimitive.Portal>
          <DialogOverlay />
          <DialogPrimitive.Content
            aria-label="Search the workspace"
            onKeyDown={onKeyDown}
            className={cn(
              'fixed top-[12vh] left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2',
              'overflow-hidden rounded-xl border border-border bg-card shadow-xl',
              'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
              'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95'
            )}
          >
            <DialogPrimitive.Title className="sr-only">
              Search the workspace
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">
              Search projects, tasks, clients and invoices, or jump to a
              section. Use the arrow keys to choose a result.
            </DialogPrimitive.Description>

            <div className="flex items-center gap-2.5 border-b border-border px-4">
              <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
              <input
                autoFocus
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setActive(0)
                }}
                placeholder="Search projects, clients, tasks, invoices…"
                aria-controls="command-results"
                aria-autocomplete="list"
                role="combobox"
                aria-expanded
                className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              {pending ? (
                <Loader2Icon className="size-4 shrink-0 animate-spin text-muted-foreground" />
              ) : null}
            </div>

            <div
              id="command-results"
              ref={listRef}
              role="listbox"
              className="max-h-[min(24rem,50dvh)] overflow-y-auto p-2 scrollbar-thin"
            >
              {grouped.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                  {query.trim().length < 2
                    ? 'Type at least two characters to search.'
                    : `No matches for “${query.trim()}”.`}
                </p>
              ) : (
                grouped.map((section) => (
                  <div key={section.group} className="mb-1 last:mb-0">
                    <p className="px-3 py-1.5 text-[0.65rem] font-semibold tracking-widest text-muted-foreground/70 uppercase">
                      {section.group}
                    </p>
                    {section.items.map((item) => {
                      const index = items.indexOf(item)
                      const selected = index === activeIndex
                      const Icon = item.icon ?? ArrowRightIcon
                      return (
                        <button
                          key={item.id}
                          type="button"
                          role="option"
                          aria-selected={selected}
                          onMouseEnter={() => setActive(index)}
                          onClick={() => go(item)}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors',
                            selected ? 'bg-accent' : 'hover:bg-accent/60'
                          )}
                        >
                          <Icon className="size-4 shrink-0 text-muted-foreground" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">
                              {item.title}
                            </span>
                            {item.subtitle ? (
                              <span className="block truncate text-xs text-muted-foreground">
                                {item.subtitle}
                              </span>
                            ) : null}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center gap-4 border-t border-border bg-muted/30 px-4 py-2 text-[0.7rem] text-muted-foreground">
              <span>↑↓ to navigate</span>
              <span>↵ to open</span>
              <span className="ml-auto">esc to close</span>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  )
}
