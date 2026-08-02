import type { ActivityType } from '@prisma/client'
import { formatDistanceToNowStrict } from 'date-fns'
import {
  BadgeDollarSignIcon,
  CheckCircle2Icon,
  FolderPlusIcon,
  ListChecksIcon,
  ReceiptIcon,
  UserPlusIcon,
  type LucideIcon,
} from 'lucide-react'

import { Card } from '@/components/ui/card'
import type { ActivityRow } from '@/lib/queries'
import { cn } from '@/lib/utils'

const ACTIVITY_ICON: Record<ActivityType, LucideIcon> = {
  PROJECT_CREATED: FolderPlusIcon,
  PROJECT_COMPLETED: CheckCircle2Icon,
  TASK_COMPLETED: ListChecksIcon,
  INVOICE_CREATED: ReceiptIcon,
  INVOICE_PAID: BadgeDollarSignIcon,
  USER_JOINED: UserPlusIcon,
}

const ACTIVITY_TONE: Record<ActivityType, string> = {
  PROJECT_CREATED: 'bg-primary/12 text-primary',
  PROJECT_COMPLETED: 'bg-success/15 text-success',
  TASK_COMPLETED: 'bg-success/15 text-success',
  INVOICE_CREATED: 'bg-primary/12 text-primary',
  INVOICE_PAID: 'bg-success/15 text-success',
  USER_JOINED: 'bg-primary/12 text-primary',
}

export function ActivityFeed({ activity }: { activity: ActivityRow[] }) {
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="space-y-0.5">
        <h2 className="text-sm font-semibold">Recent activity</h2>
        <p className="text-xs text-muted-foreground">
          What&apos;s happened across the agency lately.
        </p>
      </div>

      {activity.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Nothing yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {activity.map((entry) => {
            const Icon = ACTIVITY_ICON[entry.type]
            return (
              <li key={entry.id} className="flex items-start gap-3">
                <span
                  aria-hidden
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-full',
                    ACTIVITY_TONE[entry.type]
                  )}
                >
                  <Icon className="size-3.5" />
                </span>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="text-sm leading-snug">{entry.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.actor ? `${entry.actor.name} · ` : ''}
                    {formatDistanceToNowStrict(entry.createdAt, {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
