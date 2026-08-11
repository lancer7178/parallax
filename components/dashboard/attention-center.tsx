import {
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

import { Card } from '@/components/ui/card'
import type { AttentionItem, AttentionKind } from '@/lib/queries'
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

/**
 * The one section that answers "what do I do next".
 *
 * Every row is a fact plus a destination — nothing here is informational. When
 * it is empty that is the useful state, not a broken one, so it says so
 * plainly rather than rendering an empty card.
 */
export function AttentionCenter({
  items,
  clientView = false,
}: {
  items: AttentionItem[]
  clientView?: boolean
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
        <div className="space-y-0.5">
          <h2 className="text-sm font-semibold">
            {clientView ? 'Needs you' : 'Needs your attention'}
          </h2>
          <p className="text-xs text-muted-foreground">
            {items.length === 0
              ? 'Nothing outstanding.'
              : `${items.length} ${items.length === 1 ? 'item' : 'items'} to act on.`}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
          <span className="flex size-9 items-center justify-center rounded-lg bg-success/15 text-success">
            <SparklesIcon className="size-4.5" />
          </span>
          <p className="text-sm font-medium">All clear</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            No overdue invoices, no late work and nothing waiting on a decision.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border/60">
          {items.map((item) => {
            const Icon = KIND_ICON[item.kind]
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-accent/50 focus-visible:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring outline-none"
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
      )}
    </Card>
  )
}
