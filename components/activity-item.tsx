import type { ActivityType } from '@prisma/client'
import { formatDistanceToNowStrict } from 'date-fns'
import {
  BadgeDollarSignIcon,
  CheckCircle2Icon,
  FolderPlusIcon,
  ListChecksIcon,
  MessageSquareWarningIcon,
  PaperclipIcon,
  ReceiptIcon,
  SendIcon,
  ThumbsUpIcon,
  UserPlusIcon,
  type LucideIcon,
} from 'lucide-react'

import type { ActivityRow } from '@/lib/queries'
import { cn } from '@/lib/utils'

const ACTIVITY_ICON: Record<ActivityType, LucideIcon> = {
  PROJECT_CREATED: FolderPlusIcon,
  PROJECT_COMPLETED: CheckCircle2Icon,
  TASK_COMPLETED: ListChecksIcon,
  INVOICE_CREATED: ReceiptIcon,
  INVOICE_PAID: BadgeDollarSignIcon,
  USER_JOINED: UserPlusIcon,
  APPROVAL_REQUESTED: SendIcon,
  APPROVAL_APPROVED: ThumbsUpIcon,
  APPROVAL_CHANGES_REQUESTED: MessageSquareWarningIcon,
  FILE_ADDED: PaperclipIcon,
}

const ACTIVITY_TONE: Record<ActivityType, string> = {
  PROJECT_CREATED: 'bg-primary/12 text-primary',
  PROJECT_COMPLETED: 'bg-success/15 text-success',
  TASK_COMPLETED: 'bg-success/15 text-success',
  INVOICE_CREATED: 'bg-primary/12 text-primary',
  INVOICE_PAID: 'bg-success/15 text-success',
  USER_JOINED: 'bg-primary/12 text-primary',
  APPROVAL_REQUESTED: 'bg-primary/12 text-primary',
  APPROVAL_APPROVED: 'bg-success/15 text-success',
  APPROVAL_CHANGES_REQUESTED: 'bg-warning/18 text-warning',
  FILE_ADDED: 'bg-primary/12 text-primary',
}

/**
 * One row of the append-only activity log. Shared by the dashboard feed and
 * the per-project timeline so a new `ActivityType` only needs its icon and
 * tone adding in one place.
 */
export function ActivityItem({ entry }: { entry: ActivityRow }) {
  const Icon = ACTIVITY_ICON[entry.type]

  return (
    <li className="flex items-start gap-3">
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
          <time dateTime={new Date(entry.createdAt).toISOString()}>
            {formatDistanceToNowStrict(entry.createdAt, { addSuffix: true })}
          </time>
        </p>
      </div>
    </li>
  )
}
