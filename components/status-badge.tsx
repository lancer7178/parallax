import type { InvoiceStatus, ProjectStatus, TaskStatus } from '@prisma/client'

import { Badge } from '@/components/ui/badge'
import {
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_TONE,
  PRIORITY_LABELS,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_TONE,
  TASK_STATUS_LABELS,
  TASK_STATUS_TONE,
} from '@/lib/constants'

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <Badge tone={PROJECT_STATUS_TONE[status]}>
      {PROJECT_STATUS_LABELS[status]}
    </Badge>
  )
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <Badge tone={TASK_STATUS_TONE[status]}>{TASK_STATUS_LABELS[status]}</Badge>
  )
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <Badge tone={INVOICE_STATUS_TONE[status]}>
      {INVOICE_STATUS_LABELS[status]}
    </Badge>
  )
}

export function PriorityBadge({ priority }: { priority: number }) {
  const tone =
    priority >= 3 ? 'danger' : priority === 2 ? 'warning' : 'outline'
  return (
    <Badge tone={tone}>{PRIORITY_LABELS[priority] ?? 'Low'}</Badge>
  )
}
