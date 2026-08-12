import 'server-only'

import type { ActivityType, Prisma, ProjectStatus } from '@prisma/client'
import { cache } from 'react'

import {
  GOAL_DEFS,
  INVOICE_STATUS_LABELS,
  PROJECT_STATUS_LABELS,
  TASK_STATUS_LABELS,
} from '@/lib/constants'
import type { SessionUser } from '@/lib/dal'
import {
  invoiceReference,
  summarizeFinance,
  type ProjectFinance,
} from '@/lib/finance'
import {
  isTaskOverdue,
  projectHealth,
  taskProgress,
  type ProjectHealth,
} from '@/lib/health'
import { prisma } from '@/lib/prisma'
import { canViewFinancials, canViewProjectMoney, ROLE_LABELS } from '@/lib/rbac'
import { formatCurrency, formatDate } from '@/lib/utils'

/**
 * Every project query is filtered through this. Clients can only ever reach
 * rows where they are the `client`; agency staff see the whole book of work.
 */
function projectScope(user: SessionUser): Prisma.ProjectWhereInput {
  return user.role === 'CLIENT' ? { clientId: user.id } : {}
}

const projectCardSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  deadline: true,
  budget: true,
  updatedAt: true,
  client: { select: { id: true, name: true, email: true, avatarUrl: true } },
  tasks: { select: { status: true, dueDate: true } },
  invoices: { select: { amount: true, status: true, dueDate: true } },
  approvals: { where: { status: 'PENDING' }, select: { id: true } },
} satisfies Prisma.ProjectSelect

type ProjectCardRow = Prisma.ProjectGetPayload<{
  select: typeof projectCardSelect
}>

/**
 * A project as every list surface renders it: work, money and health already
 * derived, and money already *removed* for viewers who may not see it. The
 * gate lives here rather than in the card so a new caller cannot forget it.
 */
export type ProjectCard = {
  id: string
  title: string
  description: string | null
  status: ProjectStatus
  deadline: Date | null
  updatedAt: Date
  client: { id: string; name: string; email: string; avatarUrl: string | null }
  taskTotal: number
  taskDone: number
  progress: number
  pendingApprovals: number
  health: ProjectHealth
  /** `null` when the viewer is not permitted to see this project's money. */
  finance: ProjectFinance | null
}

function toProjectCard(row: ProjectCardRow, seesMoney: boolean): ProjectCard {
  const progress = taskProgress(row.tasks)
  const finance = summarizeFinance(row.invoices, row.budget)
  const overdueTasks = row.tasks.filter(isTaskOverdue).length

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    deadline: row.deadline,
    updatedAt: row.updatedAt,
    client: row.client,
    taskTotal: row.tasks.length,
    taskDone: row.tasks.filter((task) => task.status === 'DONE').length,
    progress,
    pendingApprovals: row.approvals.length,
    // Budget burn and overdue invoices are money facts, so they are only fed
    // into the health calculation for viewers allowed to see money — a
    // designer must not read "budget 92% used" out of a status chip.
    health: projectHealth({
      status: row.status,
      deadline: row.deadline,
      progress,
      budget: seesMoney ? row.budget : null,
      invoiced: seesMoney ? finance.invoiced : undefined,
      overdueInvoices: seesMoney ? finance.overdueCount : 0,
      overdueTasks,
      pendingApprovals: row.approvals.length,
    }),
    finance: seesMoney ? finance : null,
  }
}

export async function listProjects(
  user: SessionUser,
  status?: string
): Promise<ProjectCard[]> {
  const where: Prisma.ProjectWhereInput = { ...projectScope(user) }
  if (status && status !== 'ALL') {
    where.status = status as Prisma.ProjectWhereInput['status']
  }

  const rows = await prisma.project.findMany({
    where,
    select: projectCardSelect,
    orderBy: [{ status: 'asc' }, { deadline: 'asc' }],
  })

  const seesMoney = canViewProjectMoney(user.role)
  return rows.map((row) => toProjectCard(row, seesMoney))
}

const projectDetailSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  deadline: true,
  budget: true,
  createdAt: true,
  client: { select: { id: true, name: true, email: true, avatarUrl: true } },
  tasks: {
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      dueDate: true,
      updatedAt: true,
      assignee: { select: { id: true, name: true, avatarUrl: true } },
    },
    orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
  },
  invoices: {
    select: {
      id: true,
      amount: true,
      status: true,
      dueDate: true,
      createdAt: true,
    },
    orderBy: { dueDate: 'asc' },
  },
  approvals: {
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      feedback: true,
      decidedAt: true,
      createdAt: true,
      requestedBy: { select: { id: true, name: true, avatarUrl: true } },
    },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  },
  files: {
    select: {
      id: true,
      name: true,
      url: true,
      version: true,
      sharedWithClient: true,
      createdAt: true,
      uploadedBy: { select: { id: true, name: true, avatarUrl: true } },
    },
    orderBy: [{ createdAt: 'desc' }],
  },
} satisfies Prisma.ProjectSelect

type ProjectDetailRow = Prisma.ProjectGetPayload<{
  select: typeof projectDetailSelect
}>

export type ProjectDetail = ProjectDetailRow & {
  progress: number
  health: ProjectHealth
  /** `null` when the viewer is not permitted to see this project's money. */
  finance: ProjectFinance | null
}

export type ProjectTask = ProjectDetailRow['tasks'][number]
export type ProjectApproval = ProjectDetailRow['approvals'][number]
export type ProjectFileRow = ProjectDetailRow['files'][number]

/** Returns `null` when the project does not exist *or* is out of scope. */
export async function getProject(
  user: SessionUser,
  id: string
): Promise<ProjectDetail | null> {
  const row = await prisma.project.findFirst({
    where: { id, ...projectScope(user) },
    select: projectDetailSelect,
  })
  if (!row) return null

  const seesMoney = canViewProjectMoney(user.role)
  const progress = taskProgress(row.tasks)
  const finance = summarizeFinance(row.invoices, row.budget)
  const pendingApprovals = row.approvals.filter(
    (approval) => approval.status === 'PENDING'
  ).length

  return {
    ...row,
    // Money-free rows for viewers who may not see money, so nothing leaks
    // through a serialized prop even if a component forgets the check.
    invoices: seesMoney ? row.invoices : [],
    budget: seesMoney ? row.budget : null,
    // Same treatment for working files: a client's payload contains only the
    // files explicitly shared with them, so an internal draft cannot be read
    // out of the serialized props even though the component never shows it.
    files:
      user.role === 'CLIENT'
        ? row.files.filter((file) => file.sharedWithClient)
        : row.files,
    progress,
    finance: seesMoney ? finance : null,
    health: projectHealth({
      status: row.status,
      deadline: row.deadline,
      progress,
      budget: seesMoney ? row.budget : null,
      invoiced: seesMoney ? finance.invoiced : undefined,
      overdueInvoices: seesMoney ? finance.overdueCount : 0,
      overdueTasks: row.tasks.filter(isTaskOverdue).length,
      pendingApprovals,
    }),
  }
}

/**
 * Events a client may read on their own project. Everything omitted here —
 * `TASK_COMPLETED`, `USER_JOINED` — names internal work or internal people,
 * which is exactly what the portal is supposed to keep out of view.
 */
const CLIENT_SAFE_ACTIVITY = [
  'PROJECT_CREATED',
  'PROJECT_COMPLETED',
  'INVOICE_CREATED',
  'INVOICE_PAID',
  'APPROVAL_REQUESTED',
  'APPROVAL_APPROVED',
  'APPROVAL_CHANGES_REQUESTED',
  // Only logged for files that were shared with the client in the first place
  // — see `addProjectFile` in `lib/actions/files.ts`.
  'FILE_ADDED',
] as const satisfies readonly ActivityType[]

/**
 * Activity whose *message* quotes a figure — `logActivity` writes the amount
 * into the sentence, so these rows are money even though the column isn't.
 * Delivery roles never see them.
 */
const MONEY_ACTIVITY = [
  'INVOICE_CREATED',
  'INVOICE_PAID',
] as const satisfies readonly ActivityType[]

/**
 * Which activity rows `user` is allowed to read, as a `where` fragment.
 *
 * Clients are additionally pinned to their own projects: `projectId: null`
 * events (a teammate joining, for instance) belong to nobody's project and so
 * are out of every client's scope by construction.
 */
function activityScope(user: SessionUser): Prisma.ActivityWhereInput {
  if (user.role === 'CLIENT') {
    return {
      type: { in: [...CLIENT_SAFE_ACTIVITY] },
      project: { clientId: user.id },
    }
  }
  if (!canViewFinancials(user.role)) {
    return { type: { notIn: [...MONEY_ACTIVITY] } }
  }
  return {}
}

/** The project's own slice of the activity log, newest first. */
export async function listProjectActivity(
  user: SessionUser,
  projectId: string,
  limit = 12
) {
  return prisma.activity.findMany({
    // `activityScope` carries the same money and client-safety rules the
    // dashboard feed uses, so the project timeline cannot become the one
    // surface where a designer reads an invoice amount.
    where: { projectId, ...activityScope(user) },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      type: true,
      message: true,
      createdAt: true,
      project: { select: { id: true, title: true } },
      actor: { select: { id: true, name: true, avatarUrl: true } },
    },
  })
}

/** Ownership check reused by the task/invoice actions. */
export async function canReachProject(user: SessionUser, projectId: string) {
  const count = await prisma.project.count({
    where: { id: projectId, ...projectScope(user) },
  })
  return count > 0
}

const taskRowSelect = {
  id: true,
  title: true,
  status: true,
  priority: true,
  dueDate: true,
  updatedAt: true,
  project: { select: { id: true, title: true } },
  assignee: { select: { id: true, name: true, avatarUrl: true } },
} satisfies Prisma.TaskSelect

export type TaskRow = Prisma.TaskGetPayload<{ select: typeof taskRowSelect }>

export async function listTasks(
  user: SessionUser,
  filters: {
    assignee?: 'me' | 'all'
    status?: string
    /** Matches the attention centre's links: `/tasks?due=overdue`. */
    due?: string
  } = {}
) {
  const where: Prisma.TaskWhereInput = { project: projectScope(user) }

  if (filters.assignee === 'me') where.assigneeId = user.id
  if (filters.status && filters.status !== 'ALL') {
    where.status = filters.status as Prisma.TaskWhereInput['status']
  }

  if (filters.due === 'overdue' || filters.due === 'today') {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const tomorrowStart = new Date(todayStart)
    tomorrowStart.setDate(tomorrowStart.getDate() + 1)

    where.status = { not: 'DONE' }
    where.dueDate =
      filters.due === 'overdue'
        ? { lt: todayStart }
        : { gte: todayStart, lt: tomorrowStart }
  }

  return prisma.task.findMany({
    where,
    select: taskRowSelect,
    orderBy: [{ status: 'asc' }, { priority: 'desc' }, { updatedAt: 'desc' }],
  })
}

const invoiceRowSelect = {
  id: true,
  amount: true,
  status: true,
  dueDate: true,
  createdAt: true,
  project: {
    select: {
      id: true,
      title: true,
      client: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.InvoiceSelect

export type InvoiceRow = Prisma.InvoiceGetPayload<{
  select: typeof invoiceRowSelect
}>

export async function listInvoices(user: SessionUser, status?: string) {
  const where: Prisma.InvoiceWhereInput = { project: projectScope(user) }
  if (status && status !== 'ALL') {
    where.status = status as Prisma.InvoiceWhereInput['status']
  }

  return prisma.invoice.findMany({
    where,
    select: invoiceRowSelect,
    orderBy: { dueDate: 'asc' },
  })
}

/** Assignable team members — clients are never valid assignees. */
export const listAssignees = cache(async () =>
  prisma.user.findMany({
    where: { role: { not: 'CLIENT' } },
    select: { id: true, name: true, role: true, avatarUrl: true },
    orderBy: { name: 'asc' },
  })
)

export const listClients = cache(async () =>
  prisma.user.findMany({
    where: { role: 'CLIENT' },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      createdAt: true,
      _count: { select: { clientProjects: true } },
    },
    orderBy: { name: 'asc' },
  })
)

export type ClientAccount = Awaited<ReturnType<typeof listClients>>[number] & {
  activeProjects: number
  completedProjects: number
  finance: ProjectFinance
  pendingApprovals: number
}

/**
 * Clients with the numbers that make the list worth reading: how much work is
 * live, and what they owe. Admin-only — `listClients` remains the plain
 * version used to populate the project form's client picker.
 */
export async function listClientAccounts(): Promise<ClientAccount[]> {
  const clients = await prisma.user.findMany({
    where: { role: 'CLIENT' },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      createdAt: true,
      _count: { select: { clientProjects: true } },
      clientProjects: {
        select: {
          status: true,
          invoices: { select: { amount: true, status: true, dueDate: true } },
          approvals: { where: { status: 'PENDING' }, select: { id: true } },
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  return clients.map(({ clientProjects, ...client }) => ({
    ...client,
    activeProjects: clientProjects.filter((p) => p.status !== 'COMPLETED')
      .length,
    completedProjects: clientProjects.filter((p) => p.status === 'COMPLETED')
      .length,
    finance: summarizeFinance(clientProjects.flatMap((p) => p.invoices)),
    pendingApprovals: clientProjects.reduce(
      (sum, project) => sum + project.approvals.length,
      0
    ),
  }))
}

export const listTeam = cache(async () =>
  prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
      createdAt: true,
      _count: { select: { assignedTasks: true } },
    },
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
  })
)

// --- Dashboard aggregates ---------------------------------------------------

export type RevenuePoint = { month: string; collected: number; billed: number }

export type DashboardStats = {
  revenue: number
  /** Paid invoices dated inside the current calendar month. */
  revenueThisMonth: number
  outstanding: number
  overdue: number
  overdueCount: number
  activeProjects: number
  openTasks: number
  budgetAllocated: number
  revenueByMonth: RevenuePoint[]
  invoicesByStatus: { status: string; count: number; amount: number }[]
  projectsByStatus: { status: string; count: number }[]
  tasksByStatus: { status: string; count: number }[]
  upcomingDeadlines: {
    id: string
    title: string
    deadline: Date | null
    status: ProjectStatus
  }[]
}

const MONTH_LABEL = new Intl.DateTimeFormat('en-US', { month: 'short' })

export async function getDashboardStats(
  user: SessionUser
): Promise<DashboardStats> {
  const scope = projectScope(user)
  const showMoney = canViewProjectMoney(user.role)

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5, 1)
  sixMonthsAgo.setHours(0, 0, 0, 0)

  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const [
    invoiceGroups,
    projectGroups,
    taskGroups,
    budgetAgg,
    recentInvoices,
    upcomingDeadlines,
  ] = await Promise.all([
    showMoney
      ? prisma.invoice.groupBy({
          by: ['status'],
          where: { project: scope },
          _count: { _all: true },
          _sum: { amount: true },
        })
      : Promise.resolve([]),
    prisma.project.groupBy({
      by: ['status'],
      where: scope,
      _count: { _all: true },
    }),
    prisma.task.groupBy({
      by: ['status'],
      where: { project: scope },
      _count: { _all: true },
    }),
    // Budget is money like any other, so delivery roles do not get the total.
    showMoney
      ? prisma.project.aggregate({ where: scope, _sum: { budget: true } })
      : Promise.resolve(null),
    showMoney
      ? prisma.invoice.findMany({
          where: { project: scope, dueDate: { gte: sixMonthsAgo } },
          select: { amount: true, status: true, dueDate: true },
        })
      : Promise.resolve([]),
    prisma.project.findMany({
      where: { ...scope, status: { not: 'COMPLETED' }, deadline: { not: null } },
      select: { id: true, title: true, deadline: true, status: true },
      orderBy: { deadline: 'asc' },
      take: 5,
    }),
  ])

  const invoiceTotal = (status: string) =>
    invoiceGroups.find((g) => g.status === status)?._sum.amount ?? 0

  const revenue = invoiceTotal('PAID')
  const outstanding = invoiceTotal('PENDING') + invoiceTotal('OVERDUE')
  const overdue = invoiceTotal('OVERDUE')
  const overdueCount =
    invoiceGroups.find((g) => g.status === 'OVERDUE')?._count._all ?? 0
  const revenueThisMonth = recentInvoices
    .filter(
      (invoice) => invoice.status === 'PAID' && invoice.dueDate >= monthStart
    )
    .reduce((sum, invoice) => sum + invoice.amount, 0)

  // Build a dense 6-month series so the chart never has gaps.
  const buckets = new Map<string, RevenuePoint>()
  for (let i = 0; i < 6; i++) {
    const date = new Date(sixMonthsAgo)
    date.setMonth(date.getMonth() + i)
    buckets.set(`${date.getFullYear()}-${date.getMonth()}`, {
      month: MONTH_LABEL.format(date),
      collected: 0,
      billed: 0,
    })
  }

  for (const invoice of recentInvoices) {
    const key = `${invoice.dueDate.getFullYear()}-${invoice.dueDate.getMonth()}`
    const bucket = buckets.get(key)
    if (!bucket) continue
    if (invoice.status !== 'DRAFT') bucket.billed += invoice.amount
    if (invoice.status === 'PAID') bucket.collected += invoice.amount
  }

  return {
    revenue,
    revenueThisMonth,
    outstanding,
    overdue,
    overdueCount,
    activeProjects:
      projectGroups.find((g) => g.status === 'ACTIVE')?._count._all ?? 0,
    openTasks: taskGroups
      .filter((g) => g.status !== 'DONE')
      .reduce((sum, g) => sum + g._count._all, 0),
    budgetAllocated: budgetAgg?._sum.budget ?? 0,
    revenueByMonth: [...buckets.values()],
    invoicesByStatus: invoiceGroups.map((g) => ({
      status: g.status,
      count: g._count._all,
      amount: g._sum.amount ?? 0,
    })),
    projectsByStatus: projectGroups.map((g) => ({
      status: g.status,
      count: g._count._all,
    })),
    tasksByStatus: taskGroups.map((g) => ({
      status: g.status,
      count: g._count._all,
    })),
    upcomingDeadlines,
  }
}

// --- Goals -------------------------------------------------------------

export type GoalProgress = {
  key: string
  label: string
  format: 'currency' | 'number' | 'percent'
  current: number
  target: number
}

/**
 * Merges the fixed `GOAL_DEFS` list with whatever admin-set targets exist in
 * the `Goal` table (falling back to `defaultTarget` for goals nobody has
 * edited yet) and computes each goal's current value live. Revenue is
 * omitted for roles that can't see financials, same as the rest of the
 * dashboard.
 */
export async function getGoalProgress(user: SessionUser): Promise<GoalProgress[]> {
  const scope = projectScope(user)
  const showMoney = canViewFinancials(user.role)

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const [goalRows, monthlyRevenue, activeProjects, taskGroups] = await Promise.all([
    prisma.goal.findMany(),
    showMoney
      ? prisma.invoice.aggregate({
          where: {
            project: scope,
            status: 'PAID',
            dueDate: { gte: monthStart, lt: monthEnd },
          },
          _sum: { amount: true },
        })
      : Promise.resolve(null),
    prisma.project.count({ where: { ...scope, status: 'ACTIVE' } }),
    prisma.task.groupBy({
      by: ['status'],
      where: { project: scope },
      _count: { _all: true },
    }),
  ])

  const targetFor = (key: string) =>
    goalRows.find((g) => g.key === key)?.targetValue ??
    GOAL_DEFS.find((d) => d.key === key)!.defaultTarget

  const totalTasks = taskGroups.reduce((sum, g) => sum + g._count._all, 0)
  const doneTasks = taskGroups.find((g) => g.status === 'DONE')?._count._all ?? 0
  const completionRate =
    totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  const progress: GoalProgress[] = []

  if (showMoney) {
    progress.push({
      key: 'MONTHLY_REVENUE',
      label: GOAL_DEFS.find((d) => d.key === 'MONTHLY_REVENUE')!.label,
      format: 'currency',
      current: monthlyRevenue?._sum.amount ?? 0,
      target: targetFor('MONTHLY_REVENUE'),
    })
  }

  progress.push({
    key: 'ACTIVE_PROJECTS',
    label: GOAL_DEFS.find((d) => d.key === 'ACTIVE_PROJECTS')!.label,
    format: 'number',
    current: activeProjects,
    target: targetFor('ACTIVE_PROJECTS'),
  })

  progress.push({
    key: 'TASK_COMPLETION_RATE',
    label: GOAL_DEFS.find((d) => d.key === 'TASK_COMPLETION_RATE')!.label,
    format: 'percent',
    current: completionRate,
    target: targetFor('TASK_COMPLETION_RATE'),
  })

  return progress
}

// --- Team workload -------------------------------------------------------

export type WorkloadRow = {
  id: string
  name: string
  avatarUrl: string | null
  role: 'ADMIN' | 'DEVELOPER' | 'DESIGNER'
  openTasks: number
  inProgressTasks: number
}

/** Open (non-DONE) task load per staff member, busiest first. */
export async function getTeamWorkload(user: SessionUser): Promise<WorkloadRow[]> {
  const scope = projectScope(user)

  const staff = await prisma.user.findMany({
    where: { role: { not: 'CLIENT' } },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      role: true,
      assignedTasks: {
        where: { status: { not: 'DONE' }, project: scope },
        select: { status: true },
      },
    },
    orderBy: { name: 'asc' },
  })

  return staff
    .map((person) => ({
      id: person.id,
      name: person.name,
      avatarUrl: person.avatarUrl,
      role: person.role as WorkloadRow['role'],
      openTasks: person.assignedTasks.length,
      inProgressTasks: person.assignedTasks.filter(
        (t) => t.status === 'IN_PROGRESS'
      ).length,
    }))
    .sort((a, b) => b.openTasks - a.openTasks)
}

// --- Attention centre ------------------------------------------------------

export type AttentionKind =
  | 'invoice_overdue'
  | 'approval_waiting'
  | 'approval_changes'
  | 'task_overdue'
  | 'task_due_today'
  | 'project_at_risk'

export type AttentionItem = {
  id: string
  kind: AttentionKind
  /** The headline — a count and a noun, never a sentence. */
  title: string
  /** Why it is here, in the fewest words that stay specific. */
  detail: string
  href: string
  tone: 'danger' | 'warning' | 'info'
}

/**
 * Everything the signed-in user should act on, in one severity-ordered list.
 *
 * Each item is derived, never stored: nothing to mark as read, nothing to keep
 * in sync, and it disappears on its own once the underlying fact is resolved.
 * The set of items differs by role because the *actions* differ by role — a
 * client is never shown a task, a designer is never shown an invoice.
 */
export async function getAttentionItems(
  user: SessionUser
): Promise<AttentionItem[]> {
  const scope = projectScope(user)
  const seesMoney = canViewProjectMoney(user.role)
  const isClient = user.role === 'CLIENT'
  // Delivery roles only ever count their own work, so the link they follow has
  // to carry the same filter or the destination contradicts the count.
  const mineOnly = user.role !== 'ADMIN'

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const tomorrowStart = new Date(todayStart)
  tomorrowStart.setDate(tomorrowStart.getDate() + 1)

  const [lateInvoices, pendingApprovals, changeRequests, overdueTasks, dueToday, projects] =
    await Promise.all([
      seesMoney
        ? prisma.invoice.findMany({
            where: {
              project: scope,
              status: { in: ['PENDING', 'OVERDUE'] },
              dueDate: { lt: todayStart },
            },
            select: {
              id: true,
              amount: true,
              dueDate: true,
              project: { select: { id: true, title: true } },
            },
            orderBy: { dueDate: 'asc' },
          })
        : Promise.resolve([]),
      prisma.approval.findMany({
        where: { status: 'PENDING', project: scope },
        select: {
          id: true,
          title: true,
          createdAt: true,
          project: {
            select: { id: true, title: true, client: { select: { name: true } } },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      // Changes the client asked for are the agency's move, not the client's.
      isClient
        ? Promise.resolve([])
        : prisma.approval.findMany({
            where: { status: 'CHANGES_REQUESTED', project: scope },
            select: {
              id: true,
              title: true,
              decidedAt: true,
              project: { select: { id: true, title: true } },
            },
            orderBy: { decidedAt: 'desc' },
          }),
      isClient
        ? Promise.resolve([])
        : prisma.task.findMany({
            where: {
              project: scope,
              status: { not: 'DONE' },
              dueDate: { lt: todayStart },
              ...(user.role === 'ADMIN' ? {} : { assigneeId: user.id }),
            },
            select: { id: true, title: true, project: { select: { id: true } } },
          }),
      isClient
        ? Promise.resolve([])
        : prisma.task.findMany({
            where: {
              project: scope,
              status: { not: 'DONE' },
              dueDate: { gte: todayStart, lt: tomorrowStart },
              ...(user.role === 'ADMIN' ? {} : { assigneeId: user.id }),
            },
            select: { id: true, title: true, project: { select: { id: true } } },
          }),
      isClient
        ? Promise.resolve([])
        : prisma.project.findMany({
            where: { ...scope, status: { not: 'COMPLETED' } },
            select: projectCardSelect,
          }),
    ])

  const items: AttentionItem[] = []

  if (lateInvoices.length > 0) {
    const total = lateInvoices.reduce((sum, invoice) => sum + invoice.amount, 0)
    const oldest = lateInvoices[0]!
    items.push({
      id: 'invoices-overdue',
      kind: 'invoice_overdue',
      title:
        lateInvoices.length === 1
          ? '1 invoice overdue'
          : `${lateInvoices.length} invoices overdue`,
      detail: `${formatCurrency(total)} unpaid · oldest ${formatDate(oldest.dueDate)}`,
      href: '/invoices',
      tone: 'danger',
    })
  }

  // Projects whose numbers say "at risk" — each carries its own reason so the
  // item is actionable rather than merely alarming.
  const atRisk = projects
    .map((row) => toProjectCard(row, seesMoney))
    .filter((project) => project.health.level === 'at_risk')

  for (const project of atRisk.slice(0, 3)) {
    items.push({
      id: `project-${project.id}`,
      kind: 'project_at_risk',
      title: `${project.title} is at risk`,
      detail: project.health.reasons[0]!,
      href: `/projects/${project.id}`,
      tone: 'danger',
    })
  }

  if (pendingApprovals.length > 0) {
    const oldest = pendingApprovals[0]!
    if (isClient) {
      items.push({
        id: 'approvals-waiting',
        kind: 'approval_waiting',
        title:
          pendingApprovals.length === 1
            ? '1 deliverable needs your approval'
            : `${pendingApprovals.length} deliverables need your approval`,
        detail: `${oldest.title} · sent ${formatDate(oldest.createdAt)}`,
        href: `/projects/${oldest.project.id}#approvals`,
        tone: 'warning',
      })
    } else {
      items.push({
        id: 'approvals-waiting',
        kind: 'approval_waiting',
        title:
          pendingApprovals.length === 1
            ? '1 client approval outstanding'
            : `${pendingApprovals.length} client approvals outstanding`,
        detail: `${oldest.project.client.name} · ${oldest.title} since ${formatDate(oldest.createdAt)}`,
        href: `/projects/${oldest.project.id}#approvals`,
        tone: 'warning',
      })
    }
  }

  if (changeRequests.length > 0) {
    const latest = changeRequests[0]!
    items.push({
      id: 'approvals-changes',
      kind: 'approval_changes',
      title:
        changeRequests.length === 1
          ? '1 deliverable has change requests'
          : `${changeRequests.length} deliverables have change requests`,
      detail: `${latest.project.title} · ${latest.title}`,
      href: `/projects/${latest.project.id}#approvals`,
      tone: 'warning',
    })
  }

  if (overdueTasks.length > 0) {
    items.push({
      id: 'tasks-overdue',
      kind: 'task_overdue',
      title:
        overdueTasks.length === 1
          ? '1 task past due'
          : `${overdueTasks.length} tasks past due`,
      detail:
        user.role === 'ADMIN'
          ? `Across ${new Set(overdueTasks.map((t) => t.project.id)).size} projects`
          : 'Assigned to you',
      href: mineOnly ? '/tasks?due=overdue&assignee=me' : '/tasks?due=overdue',
      tone: 'danger',
    })
  }

  if (dueToday.length > 0) {
    items.push({
      id: 'tasks-due-today',
      kind: 'task_due_today',
      title:
        dueToday.length === 1
          ? '1 task due today'
          : `${dueToday.length} tasks due today`,
      detail: user.role === 'ADMIN' ? 'Across the agency' : 'Assigned to you',
      href: mineOnly ? '/tasks?due=today&assignee=me' : '/tasks?due=today',
      tone: 'warning',
    })
  }

  const severity = { danger: 0, warning: 1, info: 2 } as const
  return items.sort((a, b) => severity[a.tone] - severity[b.tone])
}

/**
 * How many things are waiting on the caller — the number on the top bar's
 * bell, and nothing else.
 *
 * Counts only, so it stays cheap enough to run on every workspace page load:
 * each branch is an indexed `count()`, and the expensive part of
 * `getAttentionItems` (deriving project health across the whole book of work)
 * is deliberately left out. The full list is fetched only when the panel is
 * actually opened.
 */
export async function countAttention(user: SessionUser): Promise<number> {
  const scope = projectScope(user)
  const seesMoney = canViewProjectMoney(user.role)
  const isClient = user.role === 'CLIENT'
  const mine = user.role === 'ADMIN' ? {} : { assigneeId: user.id }

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const tomorrowStart = new Date(todayStart)
  tomorrowStart.setDate(tomorrowStart.getDate() + 1)

  const [invoices, approvals, changes, tasks] = await Promise.all([
    seesMoney
      ? prisma.invoice.count({
          where: {
            project: scope,
            status: { in: ['PENDING', 'OVERDUE'] },
            dueDate: { lt: todayStart },
          },
        })
      : 0,
    prisma.approval.count({ where: { status: 'PENDING', project: scope } }),
    isClient
      ? 0
      : prisma.approval.count({
          where: { status: 'CHANGES_REQUESTED', project: scope },
        }),
    isClient
      ? 0
      : prisma.task.count({
          where: {
            project: scope,
            status: { not: 'DONE' },
            dueDate: { lt: tomorrowStart },
            ...mine,
          },
        }),
  ])

  return invoices + approvals + changes + tasks
}

// --- Global search ---------------------------------------------------------

export type SearchResult = {
  id: string
  group: 'Projects' | 'Clients' | 'Tasks' | 'Invoices' | 'Team'
  title: string
  subtitle: string
  href: string
}

const SEARCH_LIMIT = 5

/**
 * Powers the command palette. Every branch is scoped the same way the pages
 * are — a client searching "Atlas" gets nothing back unless Atlas is theirs,
 * and a designer never matches an invoice.
 */
export async function searchWorkspace(
  user: SessionUser,
  term: string
): Promise<SearchResult[]> {
  const query = term.trim()
  if (query.length < 2) return []

  const scope = projectScope(user)
  const contains = { contains: query, mode: 'insensitive' } as const
  const isAdmin = user.role === 'ADMIN'
  const seesMoney = canViewProjectMoney(user.role)

  const [projects, tasks, invoices, people] = await Promise.all([
    prisma.project.findMany({
      where: {
        ...scope,
        OR: [{ title: contains }, { description: contains }],
      },
      select: {
        id: true,
        title: true,
        status: true,
        client: { select: { name: true } },
      },
      take: SEARCH_LIMIT,
      orderBy: { updatedAt: 'desc' },
    }),
    user.role === 'CLIENT'
      ? Promise.resolve([])
      : prisma.task.findMany({
          where: { project: scope, title: contains },
          select: {
            id: true,
            title: true,
            status: true,
            project: { select: { id: true, title: true } },
          },
          take: SEARCH_LIMIT,
          orderBy: { updatedAt: 'desc' },
        }),
    seesMoney
      ? prisma.invoice.findMany({
          where: {
            project: { ...scope, OR: [{ title: contains }, { client: { name: contains } }] },
          },
          select: {
            id: true,
            amount: true,
            status: true,
            project: { select: { id: true, title: true } },
          },
          take: SEARCH_LIMIT,
          orderBy: { dueDate: 'desc' },
        })
      : Promise.resolve([]),
    isAdmin
      ? prisma.user.findMany({
          where: { OR: [{ name: contains }, { email: contains }] },
          select: { id: true, name: true, email: true, role: true },
          take: SEARCH_LIMIT,
          orderBy: { name: 'asc' },
        })
      : Promise.resolve([]),
  ])

  const results: SearchResult[] = []

  for (const project of projects) {
    results.push({
      id: `project-${project.id}`,
      group: 'Projects',
      title: project.title,
      subtitle: `${PROJECT_STATUS_LABELS[project.status]} · ${project.client.name}`,
      href: `/projects/${project.id}`,
    })
  }

  for (const task of tasks) {
    results.push({
      id: `task-${task.id}`,
      group: 'Tasks',
      title: task.title,
      subtitle: `${TASK_STATUS_LABELS[task.status]} · ${task.project.title}`,
      href: `/projects/${task.project.id}`,
    })
  }

  for (const invoice of invoices) {
    results.push({
      id: `invoice-${invoice.id}`,
      group: 'Invoices',
      title: invoiceReference(invoice.id),
      subtitle: `${formatCurrency(invoice.amount)} · ${INVOICE_STATUS_LABELS[invoice.status]} · ${invoice.project.title}`,
      href: `/projects/${invoice.project.id}`,
    })
  }

  for (const person of people) {
    const isClient = person.role === 'CLIENT'
    results.push({
      id: `user-${person.id}`,
      group: isClient ? 'Clients' : 'Team',
      title: person.name,
      subtitle: `${ROLE_LABELS[person.role]} · ${person.email}`,
      href: isClient ? '/clients' : '/team',
    })
  }

  return results
}

// --- Activity feed ---------------------------------------------------------

/**
 * The workspace-wide feed, filtered to what the caller may read.
 *
 * The filter is not cosmetic. `logActivity` writes amounts into the message
 * itself ("$4,500 invoice paid for Nova Website"), so an unscoped feed would
 * hand agency revenue to a designer in plain prose — the one place money could
 * still reach a role that is excluded from it everywhere else.
 */
export async function listRecentActivity(user: SessionUser, limit = 8) {
  return prisma.activity.findMany({
    where: activityScope(user),
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      type: true,
      message: true,
      createdAt: true,
      project: { select: { id: true, title: true } },
      actor: { select: { id: true, name: true, avatarUrl: true } },
    },
  })
}

export type ActivityRow = Awaited<ReturnType<typeof listRecentActivity>>[number]
