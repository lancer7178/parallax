import 'server-only'

import type { Prisma, ProjectStatus } from '@prisma/client'
import { cache } from 'react'

import type { SessionUser } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { canViewFinancials } from '@/lib/rbac'

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
  tasks: { select: { status: true } },
} satisfies Prisma.ProjectSelect

export type ProjectCard = Prisma.ProjectGetPayload<{
  select: typeof projectCardSelect
}>

export async function listProjects(user: SessionUser, status?: string) {
  const where: Prisma.ProjectWhereInput = { ...projectScope(user) }
  if (status && status !== 'ALL') {
    where.status = status as Prisma.ProjectWhereInput['status']
  }

  return prisma.project.findMany({
    where,
    select: projectCardSelect,
    orderBy: [{ status: 'asc' }, { deadline: 'asc' }],
  })
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
} satisfies Prisma.ProjectSelect

export type ProjectDetail = Prisma.ProjectGetPayload<{
  select: typeof projectDetailSelect
}>
export type ProjectTask = ProjectDetail['tasks'][number]

/** Returns `null` when the project does not exist *or* is out of scope. */
export async function getProject(user: SessionUser, id: string) {
  return prisma.project.findFirst({
    where: { id, ...projectScope(user) },
    select: projectDetailSelect,
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
  updatedAt: true,
  project: { select: { id: true, title: true } },
  assignee: { select: { id: true, name: true, avatarUrl: true } },
} satisfies Prisma.TaskSelect

export type TaskRow = Prisma.TaskGetPayload<{ select: typeof taskRowSelect }>

export async function listTasks(
  user: SessionUser,
  filters: { assignee?: 'me' | 'all'; status?: string } = {}
) {
  const where: Prisma.TaskWhereInput = { project: projectScope(user) }

  if (filters.assignee === 'me') where.assigneeId = user.id
  if (filters.status && filters.status !== 'ALL') {
    where.status = filters.status as Prisma.TaskWhereInput['status']
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
  outstanding: number
  overdue: number
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
  const showMoney = canViewFinancials(user.role) || user.role === 'CLIENT'

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5, 1)
  sixMonthsAgo.setHours(0, 0, 0, 0)

  const [
    invoiceGroups,
    projectGroups,
    taskGroups,
    budgetAgg,
    recentInvoices,
    upcomingDeadlines,
  ] = await Promise.all([
    prisma.invoice.groupBy({
      by: ['status'],
      where: { project: scope },
      _count: { _all: true },
      _sum: { amount: true },
    }),
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
    prisma.project.aggregate({ where: scope, _sum: { budget: true } }),
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
    outstanding,
    overdue,
    activeProjects:
      projectGroups.find((g) => g.status === 'ACTIVE')?._count._all ?? 0,
    openTasks: taskGroups
      .filter((g) => g.status !== 'DONE')
      .reduce((sum, g) => sum + g._count._all, 0),
    budgetAllocated: budgetAgg._sum.budget ?? 0,
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
