import type { Metadata } from 'next'
import { Suspense } from 'react'
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
import { DashboardFallback } from '@/components/skeletons'
import { StatCard } from '@/components/stat-card'
import { ProjectStatusBadge } from '@/components/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { requireRole, type SessionUser } from '@/lib/dal'
import { getDashboardStats } from '@/lib/queries'
import { canViewFinancials } from '@/lib/rbac'
import { daysUntil, formatCurrency, formatDate } from '@/lib/utils'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  // The role gate runs before anything streams, so it can still issue a real
  // 307 rather than a client-side hop. See `components/skeletons.tsx`.
  const user = await requireRole('ADMIN', 'DEVELOPER', 'DESIGNER')
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

      <Suspense fallback={<DashboardFallback />}>
        <DashboardContent user={user} />
      </Suspense>
    </>
  )
}

async function DashboardContent({ user }: { user: SessionUser }) {
  const stats = await getDashboardStats(user)
  const showMoney = canViewFinancials(user.role)

  return (
    <div className="flex flex-col gap-6">
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

      {/* Both rows share a 2:1 split so the page keeps one rhythm whether or
          not the viewer can see financials. */}
      {showMoney ? (
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RevenueChart data={stats.revenueByMonth} />
          </div>
          <InvoiceStatusChart data={stats.invoicesByStatus} />
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PipelineChart data={stats.tasksByStatus} />
        </div>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClockIcon className="size-4 text-muted-foreground" />
              Upcoming deadlines
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
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
                    <li key={project.id} className="first:-mt-1">
                      <Link
                        href={`/projects/${project.id}`}
                        className="group -mx-2 flex items-start justify-between gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-accent/60"
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
    </div>
  )
}
