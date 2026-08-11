import type { Metadata } from 'next'
import {
  BriefcaseIcon,
  CircleDollarSignIcon,
  ReceiptIcon,
  TrendingUpIcon,
} from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'

import { AttentionCenter } from '@/components/dashboard/attention-center'
import { EmptyState, PageHeader } from '@/components/page-header'
import { DashboardFallback } from '@/components/skeletons'
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
import { requireRole, type SessionUser } from '@/lib/dal'
import { invoiceReference, isInvoiceLate } from '@/lib/finance'
import {
  getAttentionItems,
  getDashboardStats,
  listInvoices,
  listProjects,
} from '@/lib/queries'
import { formatCurrency, formatDate } from '@/lib/utils'

export const metadata: Metadata = { title: 'Your projects' }

export default async function PortalPage() {
  // Gate before streaming so the redirect stays a real 307.
  const user = await requireRole('CLIENT')

  return (
    <>
      <PageHeader
        title={`Welcome, ${user.name}`}
        description="Progress, approvals and billing for your engagements."
      />

      <Suspense fallback={<DashboardFallback />}>
        <PortalContent user={user} />
      </Suspense>
    </>
  )
}

/**
 * The client's whole product.
 *
 * Deliberately thinner than the agency dashboard: progress, what is waiting on
 * them, and what they owe. Every query below is scoped to this client by the
 * data layer, so there is no internal task, note or margin to leak here.
 */
async function PortalContent({ user }: { user: SessionUser }) {
  const [projects, invoices, stats, attention] = await Promise.all([
    listProjects(user),
    listInvoices(user),
    getDashboardStats(user),
    getAttentionItems(user),
  ])

  const active = projects.filter(
    (project) => project.status !== 'COMPLETED'
  ).length

  const totalTasks = projects.reduce(
    (sum, project) => sum + project.taskTotal,
    0
  )
  const doneTasks = projects.reduce((sum, project) => sum + project.taskDone, 0)
  const completion =
    totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100)

  const openInvoices = invoices.filter(
    (invoice) => invoice.status === 'PENDING' || invoice.status === 'OVERDUE'
  )

  return (
    <div className="flex flex-col gap-6">
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
          hint={`${doneTasks} of ${totalTasks} deliverables complete`}
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
              : `${openInvoices.length} open ${openInvoices.length === 1 ? 'invoice' : 'invoices'}`
          }
          icon={ReceiptIcon}
          tone={stats.overdue > 0 ? 'danger' : 'warning'}
        />
      </section>

      {attention.length > 0 ? (
        <AttentionCenter items={attention} clientView />
      ) : null}

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
            <div className="overflow-x-auto">
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
                    const late = isInvoiceLate(invoice)

                    return (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-mono text-xs">
                          {invoiceReference(invoice.id)}
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
