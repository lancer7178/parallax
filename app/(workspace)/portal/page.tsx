import type { Metadata } from 'next'
import {
  BriefcaseIcon,
  CircleDollarSignIcon,
  ReceiptIcon,
  TrendingUpIcon,
} from 'lucide-react'
import Link from 'next/link'

import { EmptyState, PageHeader } from '@/components/page-header'
import { ProjectCard } from '@/components/projects/project-card'
import { StatCard } from '@/components/stat-card'
import { InvoiceStatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { requireRole } from '@/lib/dal'
import { getDashboardStats, listInvoices, listProjects } from '@/lib/queries'
import { daysUntil, formatCurrency, formatDate } from '@/lib/utils'

export const metadata: Metadata = { title: 'Your projects' }

export default async function PortalPage() {
  const user = await requireRole('CLIENT')

  const [projects, invoices, stats] = await Promise.all([
    listProjects(user),
    listInvoices(user),
    getDashboardStats(user),
  ])

  const active = projects.filter(
    (project) => project.status !== 'COMPLETED'
  ).length

  const allTasks = projects.flatMap((project) => project.tasks)
  const completion =
    allTasks.length === 0
      ? 0
      : Math.round(
          (allTasks.filter((task) => task.status === 'DONE').length /
            allTasks.length) *
            100
        )

  const openInvoices = invoices.filter(
    (invoice) => invoice.status === 'PENDING' || invoice.status === 'OVERDUE'
  )

  return (
    <>
      <PageHeader
        title={`Welcome, ${user.name}`}
        description="Track delivery progress and billing for your engagements."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active projects"
          value={String(active)}
          hint={`${projects.length} total`}
          icon={BriefcaseIcon}
        />
        <StatCard
          label="Overall progress"
          value={`${completion}%`}
          hint={`${allTasks.length} tasks tracked`}
          icon={TrendingUpIcon}
        />
        <StatCard
          label="Paid to date"
          value={formatCurrency(stats.revenue)}
          hint="Across all invoices"
          icon={CircleDollarSignIcon}
          tone="success"
        />
        <StatCard
          label="Amount due"
          value={formatCurrency(stats.outstanding)}
          hint={
            stats.overdue > 0
              ? `${formatCurrency(stats.overdue)} overdue`
              : `${openInvoices.length} open invoices`
          }
          icon={ReceiptIcon}
          tone={stats.overdue > 0 ? 'danger' : 'warning'}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Your projects</h2>

        {projects.length === 0 ? (
          <EmptyState
            icon={<BriefcaseIcon className="size-6" />}
            title="No projects yet"
            description="Once your engagement kicks off it will appear here."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                href={`/projects/${project.id}`}
                showBudget
                showClient={false}
              />
            ))}
          </div>
        )}
      </section>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Recent invoices</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/invoices">View all</Link>
          </Button>
        </CardHeader>
        <CardContent className="px-0">
          {invoices.length === 0 ? (
            <p className="px-5 py-6 text-center text-sm text-muted-foreground">
              No invoices have been raised yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.slice(0, 5).map((invoice) => {
                  const days = daysUntil(invoice.dueDate)
                  const late =
                    days < 0 &&
                    invoice.status !== 'PAID' &&
                    invoice.status !== 'DRAFT'

                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono text-xs">
                        INV-{invoice.id.slice(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell className="max-w-56">
                        <Link
                          href={`/projects/${invoice.project.id}`}
                          className="block truncate font-medium hover:underline"
                        >
                          {invoice.project.title}
                        </Link>
                      </TableCell>
                      <TableCell
                        className={
                          late
                            ? 'font-medium text-destructive'
                            : 'text-muted-foreground'
                        }
                      >
                        {formatDate(invoice.dueDate)}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatCurrency(invoice.amount, true)}
                      </TableCell>
                      <TableCell>
                        <InvoiceStatusBadge status={invoice.status} />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  )
}
