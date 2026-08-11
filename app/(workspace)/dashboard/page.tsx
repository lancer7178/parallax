import type { Metadata } from 'next'
import { Suspense } from 'react'
import {
  AlertTriangleIcon,
  BriefcaseIcon,
  CalendarClockIcon,
  CircleDollarSignIcon,
  ClipboardCheckIcon,
  KanbanSquareIcon,
  TrendingUpIcon,
  WalletIcon,
} from 'lucide-react'
import Link from 'next/link'

import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { AttentionCenter } from '@/components/dashboard/attention-center'
import { GoalsPanel } from '@/components/dashboard/goals-panel'
import { TeamWorkload } from '@/components/dashboard/team-workload'
import { InvoiceStatusChart } from '@/components/charts/invoice-status-chart'
import { PipelineChart } from '@/components/charts/pipeline-chart'
import { RevenueChart } from '@/components/charts/revenue-chart'
import { PageHeader } from '@/components/page-header'
import { ProjectCard } from '@/components/projects/project-card'
import { DashboardFallback } from '@/components/skeletons'
import { StatCard } from '@/components/stat-card'
import { ProjectStatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { requireRole, type SessionUser } from '@/lib/dal'
import {
  getAttentionItems,
  getDashboardStats,
  getGoalProgress,
  getTeamWorkload,
  listProjects,
  listRecentActivity,
} from '@/lib/queries'
import { canViewFinancials } from '@/lib/rbac'
import { daysUntil, formatCurrency, formatDate } from '@/lib/utils'

export const metadata: Metadata = { title: 'Dashboard' }

/** Server-local time of day. Close enough for a greeting, and stable per render. */
function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export default async function DashboardPage() {
  // The role gate runs before anything streams, so it can still issue a real
  // 307 rather than a client-side hop. See `components/skeletons.tsx`.
  const user = await requireRole('ADMIN', 'DEVELOPER', 'DESIGNER')

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${user.name.split(' ')[0]}.`}
        description="Here's what needs your attention."
      />

      <Suspense fallback={<DashboardFallback />}>
        <DashboardContent user={user} />
      </Suspense>
    </>
  )
}

async function DashboardContent({ user }: { user: SessionUser }) {
  const [stats, attention, projects, goals, workload, activity] =
    await Promise.all([
      getDashboardStats(user),
      getAttentionItems(user),
      listProjects(user),
      getGoalProgress(user),
      getTeamWorkload(user),
      listRecentActivity(),
    ])
  const showMoney = canViewFinancials(user.role)

  // The projects worth looking at first: live work, most troubled at the top.
  const severity = { at_risk: 0, attention: 1, on_track: 2, completed: 3 }
  const live = projects
    .filter((project) => project.status !== 'COMPLETED')
    .sort(
      (a, b) =>
        severity[a.health.level] - severity[b.health.level] ||
        (a.deadline?.getTime() ?? Infinity) - (b.deadline?.getTime() ?? Infinity)
    )

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active projects"
          value={String(stats.activeProjects)}
          hint={`${live.length} in flight`}
          icon={BriefcaseIcon}
        />

        {showMoney ? (
          <>
            <StatCard
              label="Outstanding"
              value={formatCurrency(stats.outstanding)}
              hint="Invoiced, not yet collected"
              icon={WalletIcon}
              tone="warning"
            />
            <StatCard
              label="This month"
              value={formatCurrency(stats.revenueThisMonth)}
              hint="Collected since the 1st"
              icon={TrendingUpIcon}
              tone="success"
            />
            <StatCard
              label="Overdue"
              value={formatCurrency(stats.overdue)}
              hint={
                stats.overdueCount > 0
                  ? `${stats.overdueCount} ${stats.overdueCount === 1 ? 'invoice' : 'invoices'} past due`
                  : 'Nothing past due'
              }
              icon={CircleDollarSignIcon}
              tone={stats.overdue > 0 ? 'danger' : 'default'}
            />
          </>
        ) : (
          <>
            <StatCard
              label="Open tasks"
              value={String(stats.openTasks)}
              hint="Across your projects"
              icon={KanbanSquareIcon}
              tone="warning"
            />
            <StatCard
              label="Needs attention"
              value={String(
                live.filter((p) => p.health.level !== 'on_track').length
              )}
              hint="Projects off track"
              icon={AlertTriangleIcon}
              tone="warning"
            />
            {/* Budget deliberately absent: delivery roles do not see money
                anywhere else in the product, and an agency-wide total would
                be the one place it leaked. */}
            <StatCard
              label="With the client"
              value={String(
                live.reduce((sum, p) => sum + p.pendingApprovals, 0)
              )}
              hint="Deliverables awaiting approval"
              icon={ClipboardCheckIcon}
            />
          </>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AttentionCenter items={attention} />
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

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">
            Projects in flight
          </h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/projects">View all</Link>
          </Button>
        </div>

        {live.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
            No active projects right now.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {live.slice(0, 3).map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                href={`/projects/${project.id}`}
              />
            ))}
          </div>
        )}
      </section>

      {showMoney ? (
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RevenueChart data={stats.revenueByMonth} />
          </div>
          <InvoiceStatusChart data={stats.invoicesByStatus} />
        </section>
      ) : (
        <PipelineChart data={stats.tasksByStatus} />
      )}

      <section className="grid gap-4 lg:grid-cols-3">
        <GoalsPanel goals={goals} user={user} />
        <TeamWorkload workload={workload} />
        <ActivityFeed activity={activity} />
      </section>
    </div>
  )
}
