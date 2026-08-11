import type {
  ApprovalStatus,
  InvoiceStatus,
  ProjectStatus,
  TaskStatus,
} from '@prisma/client'
import {
  CheckCircle2Icon,
  CircleAlertIcon,
  CircleCheckIcon,
  TriangleAlertIcon,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { HEALTH_TONE, type ProjectHealth } from '@/lib/health'
import {
  APPROVAL_STATUS_LABELS,
  APPROVAL_STATUS_TONE,
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

/**
 * Derived delivery health, distinct from the project's stored status: status
 * is what the team set, health is what the numbers say. Always paired with a
 * shape as well as a colour so it does not communicate by hue alone.
 */
export function HealthBadge({
  health,
  className,
}: {
  health: ProjectHealth
  className?: string
}) {
  const Icon = {
    completed: CheckCircle2Icon,
    on_track: CircleCheckIcon,
    attention: CircleAlertIcon,
    at_risk: TriangleAlertIcon,
  }[health.level]

  return (
    <Badge
      tone={HEALTH_TONE[health.level]}
      className={className}
      title={health.reasons[0]}
    >
      <Icon className="size-3" aria-hidden />
      {health.label}
    </Badge>
  )
}

export function ApprovalStatusBadge({ status }: { status: ApprovalStatus }) {
  return (
    <Badge tone={APPROVAL_STATUS_TONE[status]}>
      {APPROVAL_STATUS_LABELS[status]}
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
