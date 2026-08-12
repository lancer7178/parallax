'use client'

import { formatDistanceToNowStrict } from 'date-fns'
import {
  BellIcon,
  ChevronRightIcon,
  ClipboardCheckIcon,
  ClockIcon,
  MessageSquareWarningIcon,
  ReceiptIcon,
  SparklesIcon,
  TriangleAlertIcon,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import {
  fetchNotifications,
  type NotificationPayload,
} from '@/lib/actions/notifications'
import type { AttentionKind } from '@/lib/queries'
import { cn } from '@/lib/utils'

const KIND_ICON: Record<AttentionKind, LucideIcon> = {
  invoice_overdue: ReceiptIcon,
  approval_waiting: ClipboardCheckIcon,
  approval_changes: MessageSquareWarningIcon,
  task_overdue: ClockIcon,
  task_due_today: ClockIcon,
  project_at_risk: TriangleAlertIcon,
}

const TONE_CLASS = {
  danger: 'bg-destructive/12 text-destructive',
  warning: 'bg-warning/18 text-warning',
  info: 'bg-primary/12 text-primary',
} as const

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="px-3 pt-2.5 pb-1.5 text-[0.7rem] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      {children}
    </div>
  )
}

/**
 * The bell in the top bar.
 *
 * Two things, kept apart on purpose: what is *waiting on you* (the same
 * derived attention items the dashboard leads with, each linking to the object
 * itself) and what has *happened* lately. Neither is stored, so there is no
 * read/unread state to maintain — an item leaves the list when the fact behind
 * it is resolved, which is the only definition of "read" that can't go stale.
 *
 * The list is fetched when the panel opens rather than on every page load; the
 * badge beside the bell comes from a counts-only query in the layout.
 */
export function Notifications({ initialCount }: { initialCount: number }) {
  const [open, setOpen] = React.useState(false)
  const [data, setData] = React.useState<NotificationPayload | null>(null)
  const [failed, setFailed] = React.useState(false)
  const pathname = usePathname()

  // A navigation can resolve the very thing the panel is showing, so the
  // cached payload is dropped and refetched on next open rather than served
  // stale. Adjusting state during render avoids a second paint.
  const [lastPath, setLastPath] = React.useState(pathname)
  if (lastPath !== pathname) {
    setLastPath(pathname)
    setData(null)
  }

  const load = React.useCallback(async () => {
    setFailed(false)
    try {
      setData(await fetchNotifications())
    } catch {
      setFailed(true)
    }
  }, [])

  function onOpenChange(next: boolean) {
    setOpen(next)
    if (next && !data) void load()
  }

  // Once loaded, the panel's own list is the truthful count; before that, the
  // server's cheap count stands in.
  const count = data ? data.actions.length : initialCount

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="relative"
          aria-label={
            count > 0
              ? `Notifications, ${count} needing attention`
              : 'Notifications'
          }
        >
          <BellIcon />
          {count > 0 ? (
            <span
              aria-hidden
              className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive px-1 text-[0.6rem] font-semibold text-destructive-foreground tabular-nums"
            >
              {count > 9 ? '9+' : count}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="max-h-[70vh] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto p-0"
      >
        <div className="border-b border-border/60 px-3 py-2.5">
          <p className="text-sm font-semibold">Notifications</p>
        </div>

        {!data && !failed ? (
          <div className="space-y-3 p-3" aria-busy="true">
            <span className="sr-only" role="status">
              Loading notifications…
            </span>
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-8 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-36" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {failed ? (
          <div className="space-y-2 p-4 text-center">
            <p className="text-sm font-medium">Couldn&apos;t load these</p>
            <p className="text-xs text-muted-foreground">
              Something went wrong on our side.
            </p>
            <Button size="sm" variant="outline" onClick={() => void load()}>
              Try again
            </Button>
          </div>
        ) : null}

        {data ? (
          <>
            {data.actions.length === 0 && data.recent.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
                <span className="flex size-9 items-center justify-center rounded-lg bg-success/15 text-success">
                  <SparklesIcon className="size-4.5" />
                </span>
                <p className="text-sm font-medium">You&apos;re all caught up</p>
                <p className="text-xs text-muted-foreground">
                  Nothing needs you and nothing has changed lately.
                </p>
              </div>
            ) : null}

            {data.actions.length > 0 ? (
              <Section label="Needs you">
                <ul>
                  {data.actions.map((item) => {
                    const Icon = KIND_ICON[item.kind]
                    return (
                      <li key={item.id}>
                        <Link
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className="group flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-accent/60 focus-visible:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring outline-none"
                        >
                          <span
                            aria-hidden
                            className={cn(
                              'flex size-8 shrink-0 items-center justify-center rounded-lg',
                              TONE_CLASS[item.tone]
                            )}
                          >
                            <Icon className="size-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">
                              {item.title}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {item.detail}
                            </span>
                          </span>
                          <ChevronRightIcon
                            aria-hidden
                            className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5"
                          />
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </Section>
            ) : null}

            {data.recent.length > 0 ? (
              <Section label="Recent">
                <ul className="pb-1">
                  {data.recent.map((entry) => {
                    const body = (
                      <>
                        <span className="block text-sm leading-snug">
                          {entry.message}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {entry.project ? `${entry.project.title} · ` : ''}
                          <time
                            dateTime={new Date(entry.createdAt).toISOString()}
                          >
                            {formatDistanceToNowStrict(entry.createdAt, {
                              addSuffix: true,
                            })}
                          </time>
                        </span>
                      </>
                    )

                    // Only events attached to a project have somewhere to go;
                    // the rest stay plain text rather than pretending to be
                    // links that lead nowhere.
                    return (
                      <li key={entry.id}>
                        {entry.project ? (
                          <Link
                            href={`/projects/${entry.project.id}`}
                            onClick={() => setOpen(false)}
                            className="block px-3 py-2 transition-colors hover:bg-accent/60 focus-visible:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring outline-none"
                          >
                            {body}
                          </Link>
                        ) : (
                          <div className="px-3 py-2">{body}</div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </Section>
            ) : null}
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
