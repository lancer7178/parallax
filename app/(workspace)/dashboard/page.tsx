import type { Metadata } from 'next'
import {
  AlertTriangleIcon,
  BriefcaseIcon,
  CalendarClockIcon,
  CircleDollarSignIcon,
  KanbanSquareIcon,
  WalletIcon,
} from 'lucide-react'
import Link from 'next/link'

import { InvoiceStatusChart } from '@/components/charts/invoice-status-chart'
import { PipelineChart } from '@/components/charts/pipeline-chart'
import { RevenueChart } from '@/components/charts/revenue-chart'
import { PageHeader } from '@/components/page-header'
import { StatCard } from '@/components/stat-card'
import { ProjectStatusBadge } from '@/components/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { requireRole } from '@/lib/dal'
import { getDashboardStats } from '@/lib/queries'
import { canViewFinancials } from '@/lib/rbac'
import { daysUntil, formatCurrency, formatDate } from '@/lib/utils'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const user = await requireRole('ADMIN', 'DEVELOPER', 'DESIGNER')
  const stats = await getDashboardStats(user)
  const showMoney = canViewFinancials(user.role)

  return (
    <>
      <PageHeader
        title={`Good to see you, ${user.name.split(' ')[0]}`}
        description={
          showMoney
            ? 'Revenue, delivery and workload across the agency.'
            : 'Delivery and workload across the agency.'
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {showMoney ? (
          <>
            <StatCard
              label="Revenue collected"
              value={formatCurrency(stats.revenue)}
              hint="All paid invoices"
              icon={CircleDollarSignIcon}
              tone="success"
            />
            <StatCard
              label="Outstanding"
              value={formatCurrency(stats.outstanding)}
              hint={
                stats.overdue > 0
                  ? `${formatCurrency(stats.overdue)} overdue`
                  : 'Nothing overdue'
              }
              icon={WalletIcon}
              tone={stats.overdue > 0 ? 'danger' : 'warning'}
            />
          </>
        ) : (
          <StatCard
            label="Budget allocated"
            value={formatCurrency(stats.budgetAllocated)}
            hint="Across all projects"
            icon={WalletIcon}
          />
        )}

        <StatCard
          label="Active projects"
          value={String(stats.activeProjects)}
          hint="Currently in delivery"
          icon={BriefcaseIcon}
        />
        <StatCard
          label="Open tasks"
          value={String(stats.openTasks)}
          hint="Not yet done"
          icon={KanbanSquareIcon}
          tone="warning"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {showMoney ? (
          <>
            <RevenueChart data={stats.revenueByMonth} />
            <InvoiceStatusChart data={stats.invoicesByStatus} />
          </>
        ) : (
          <PipelineChart data={stats.tasksByStatus} />
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {showMoney ? (
          <div className="lg:col-span-2">
            <PipelineChart data={stats.tasksByStatus} />
          </div>
        ) : null}

        <Card className={showMoney ? '' : 'lg:col-span-3'}>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarClockIcon className="size-4 text-muted-foreground" />
              Upcoming deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.upcomingDeadlines.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No deadlines scheduled.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {stats.upcomingDeadlines.map((project) => {
                  const days = project.deadline
                    ? daysUntil(project.deadline)
                    : null
                  const late = days !== null && days < 0

                  return (
                    <li key={project.id} className="py-3 first:pt-0 last:pb-0">
                      <Link
                        href={`/projects/${project.id}`}
                        className="group flex items-start justify-between gap-3"
                      >
                        <span className="min-w-0 space-y-1">
                          <span className="block truncate text-sm font-medium group-hover:underline">
                            {project.title}
                          </span>
                          <span
                            className={
                              late
                                ? 'flex items-center gap-1 text-xs text-destructive'
                                : 'block text-xs text-muted-foreground'
                            }
                          >
                            {late ? (
                              <AlertTriangleIcon className="size-3" />
                            ) : null}
                            {formatDate(project.deadline)}
                            {days !== null
                              ? late
                                ? ` · ${Math.abs(days)}d overdue`
                                : ` · in ${days}d`
                              : null}
                          </span>
                        </span>
                        <ProjectStatusBadge status={project.status} />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </>
  )
}
