import type { InvoiceStatus, ProjectStatus, TaskStatus } from '@prisma/client'

// Type-only Prisma import — see the note in `lib/rbac.ts`.

export const TASK_STATUSES = [
  'TODO',
  'IN_PROGRESS',
  'IN_REVIEW',
  'DONE',
] as const satisfies readonly TaskStatus[]

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
}

export const PROJECT_STATUSES = [
  'PLANNING',
  'ACTIVE',
  'IN_REVIEW',
  'COMPLETED',
] as const satisfies readonly ProjectStatus[]

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  PLANNING: 'Planning',
  ACTIVE: 'Active',
  IN_REVIEW: 'In Review',
  COMPLETED: 'Completed',
}

export const INVOICE_STATUSES = [
  'DRAFT',
  'PENDING',
  'PAID',
  'OVERDUE',
] as const satisfies readonly InvoiceStatus[]

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  DRAFT: 'Draft',
  PENDING: 'Pending',
  PAID: 'Paid',
  OVERDUE: 'Overdue',
}

export const PRIORITY_LABELS: Record<number, string> = {
  1: 'Low',
  2: 'Medium',
  3: 'High',
}

/** Tailwind classes for the `<Badge>` variants used across the app. */
export const PROJECT_STATUS_TONE: Record<
  ProjectStatus,
  'neutral' | 'info' | 'warning' | 'success'
> = {
  PLANNING: 'neutral',
  ACTIVE: 'info',
  IN_REVIEW: 'warning',
  COMPLETED: 'success',
}

export const INVOICE_STATUS_TONE: Record<
  InvoiceStatus,
  'neutral' | 'info' | 'warning' | 'success' | 'danger'
> = {
  DRAFT: 'neutral',
  PENDING: 'warning',
  PAID: 'success',
  OVERDUE: 'danger',
}

export const TASK_STATUS_TONE: Record<
  TaskStatus,
  'neutral' | 'info' | 'warning' | 'success'
> = {
  TODO: 'neutral',
  IN_PROGRESS: 'info',
  IN_REVIEW: 'warning',
  DONE: 'success',
}

/**
 * Categorical chart slots, assigned in fixed order and never cycled. The
 * underlying values are validated for CVD separation and contrast in both
 * themes — see the note in `app/globals.css`.
 */
export const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
] as const

/**
 * Invoice status is a *state*, not an identity, so it uses the reserved status
 * tokens rather than a categorical slot. Always shipped with a visible label.
 */
export const INVOICE_STATUS_COLOR: Record<InvoiceStatus, string> = {
  DRAFT: 'var(--muted-foreground)',
  PENDING: 'var(--warning)',
  PAID: 'var(--success)',
  OVERDUE: 'var(--destructive)',
}

/**
 * The fixed set of agency-wide KPI targets shown on the dashboard's Goals
 * panel. `key` is the `Goal.key` row in the database — the seed creates one
 * row per entry here with `defaultTarget`, and admins edit `targetValue`
 * from there. Adding an entry here requires a matching case in
 * `getDashboardStats` to compute its current value.
 */
export const GOAL_DEFS = [
  {
    key: 'MONTHLY_REVENUE',
    label: 'Monthly revenue',
    defaultTarget: 60_000,
    format: 'currency',
  },
  {
    key: 'ACTIVE_PROJECTS',
    label: 'Active projects',
    defaultTarget: 6,
    format: 'number',
  },
  {
    key: 'TASK_COMPLETION_RATE',
    label: 'Task completion rate',
    defaultTarget: 75,
    format: 'percent',
  },
] as const satisfies readonly {
  key: string
  label: string
  defaultTarget: number
  format: 'currency' | 'number' | 'percent'
}[]

export type GoalKey = (typeof GOAL_DEFS)[number]['key']
