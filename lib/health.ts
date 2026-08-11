import type { ProjectStatus } from '@prisma/client'

// Type-only Prisma import — see the note in `lib/rbac.ts`.

/**
 * Deterministic project health.
 *
 * Every signal here is arithmetic over data the project already carries: no
 * heuristics, no scoring model, nothing generated. A project is only ever
 * called "at risk" alongside the specific number that made it one, because a
 * status nobody can explain is a status nobody acts on.
 */
export type HealthLevel = 'completed' | 'on_track' | 'attention' | 'at_risk'

export type ProjectHealth = {
  level: HealthLevel
  label: string
  /** Human-readable causes, most severe first. Empty when on track. */
  reasons: string[]
}

export const HEALTH_LABELS: Record<HealthLevel, string> = {
  completed: 'Delivered',
  on_track: 'On track',
  attention: 'Needs attention',
  at_risk: 'At risk',
}

export const HEALTH_TONE: Record<
  HealthLevel,
  'neutral' | 'info' | 'warning' | 'danger' | 'success'
> = {
  completed: 'success',
  on_track: 'info',
  attention: 'warning',
  at_risk: 'danger',
}

export type HealthInput = {
  status: ProjectStatus
  deadline: Date | string | null
  /** Percentage of tasks done, 0–100. */
  progress: number
  budget?: number | null
  /** Non-draft invoiced total. Compared against budget for burn. */
  invoiced?: number
  /** Tasks with a due date in the past that are not done. */
  overdueTasks?: number
  /** Invoices past their due date and not paid. */
  overdueInvoices?: number
  /** Approvals still sitting with the client. */
  pendingApprovals?: number
}

/** Whole days between `date` and today, negative when `date` has passed. */
function daysFromToday(date: Date | string) {
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

/** How close the deadline has to be before an unfinished project is flagged. */
const DEADLINE_WARNING_DAYS = 10
/** Progress a project is expected to have made by the warning window. */
const EXPECTED_PROGRESS_NEAR_DEADLINE = 80
/** Share of budget invoiced before burn is compared against progress. */
const BUDGET_BURN_THRESHOLD = 0.85

export function projectHealth(input: HealthInput): ProjectHealth {
  if (input.status === 'COMPLETED') {
    return { level: 'completed', label: HEALTH_LABELS.completed, reasons: [] }
  }

  const severe: string[] = []
  const moderate: string[] = []

  const days = input.deadline ? daysFromToday(input.deadline) : null

  if (days !== null && days < 0) {
    severe.push(
      `${Math.abs(days)} ${Math.abs(days) === 1 ? 'day' : 'days'} past deadline at ${input.progress}% complete`
    )
  } else if (
    days !== null &&
    days <= DEADLINE_WARNING_DAYS &&
    input.progress < EXPECTED_PROGRESS_NEAR_DEADLINE
  ) {
    moderate.push(
      `Deadline in ${days} ${days === 1 ? 'day' : 'days'} at ${input.progress}% complete`
    )
  }

  // Money burned faster than work delivered. Only meaningful once a budget is
  // set — a project without one has nothing to overrun.
  if (input.budget && input.budget > 0 && input.invoiced !== undefined) {
    const burn = input.invoiced / input.budget
    if (burn > 1) {
      severe.push(
        `Invoiced ${Math.round(burn * 100)}% of budget at ${input.progress}% complete`
      )
    } else if (burn >= BUDGET_BURN_THRESHOLD && burn * 100 > input.progress) {
      moderate.push(
        `Budget ${Math.round(burn * 100)}% used at ${input.progress}% complete`
      )
    }
  }

  if (input.overdueInvoices) {
    severe.push(
      `${input.overdueInvoices} overdue ${input.overdueInvoices === 1 ? 'invoice' : 'invoices'}`
    )
  }

  if (input.overdueTasks) {
    moderate.push(
      `${input.overdueTasks} ${input.overdueTasks === 1 ? 'task' : 'tasks'} past due`
    )
  }

  if (input.pendingApprovals) {
    moderate.push(
      `${input.pendingApprovals} ${input.pendingApprovals === 1 ? 'deliverable' : 'deliverables'} awaiting client approval`
    )
  }

  const level: HealthLevel = severe.length
    ? 'at_risk'
    : moderate.length
      ? 'attention'
      : 'on_track'

  return { level, label: HEALTH_LABELS[level], reasons: [...severe, ...moderate] }
}

/** Share of tasks done, 0–100. Shared so every surface rounds identically. */
export function taskProgress(tasks: { status: string }[]) {
  if (tasks.length === 0) return 0
  const done = tasks.filter((task) => task.status === 'DONE').length
  return Math.round((done / tasks.length) * 100)
}

/** True when a dated, unfinished task has slipped past its due date. */
export function isTaskOverdue(task: {
  status: string
  dueDate: Date | string | null
}) {
  if (!task.dueDate || task.status === 'DONE') return false
  return daysFromToday(task.dueDate) < 0
}

/** True when the task is due today and still open. */
export function isTaskDueToday(task: {
  status: string
  dueDate: Date | string | null
}) {
  if (!task.dueDate || task.status === 'DONE') return false
  return daysFromToday(task.dueDate) === 0
}

export { daysFromToday }
