import type { Metadata } from 'next'
import { PlusIcon, ReceiptIcon } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'

import { InvoiceDialog } from '@/components/invoices/invoice-dialog'
import { InvoiceStatusSelect } from '@/components/invoices/invoice-status-select'
import { EmptyState, PageHeader } from '@/components/page-header'
import { TableFallback } from '@/components/skeletons'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/stat-card'
import { InvoiceStatusBadge } from '@/components/status-badge'
import { StatusFilter } from '@/components/status-filter'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { INVOICE_STATUSES, INVOICE_STATUS_LABELS } from '@/lib/constants'
import { requireRole, type SessionUser } from '@/lib/dal'
import { listInvoices, listProjects } from '@/lib/queries'
import { canManageInvoices } from '@/lib/rbac'
import { daysUntil, formatCurrency, formatDate } from '@/lib/utils'

export const metadata: Metadata = { title: 'Invoices' }

export default async function InvoicesPage(props: PageProps<'/invoices'>) {
  // Clients reach this page too, but `listInvoices` scopes them to their own
  // projects. The gate runs before streaming so its redirect stays a real 307.
  const user = await requireRole('ADMIN', 'CLIENT')

  const { status } = await props.searchParams
  const current = typeof status === 'string' ? status : 'ALL'
  const canBill = canManageInvoices(user.role)

  return (
    <>
      <PageHeader
        title="Invoices"
        description={
          canBill
            ? 'Billing across every engagement.'
            : 'Invoices raised against your projects.'
        }
      >
        {canBill ? (
          <Suspense
            fallback={
              <Button disabled>
                <PlusIcon />
                New invoice
              </Button>
            }
          >
            <NewInvoiceButton user={user} />
          </Suspense>
        ) : null}
      </PageHeader>

      <StatusFilter
        basePath="/invoices"
        current={current}
        options={INVOICE_STATUSES.map((value) => ({
          value,
          label: INVOICE_STATUS_LABELS[value],
        }))}
      />

      <Suspense key={current} fallback={<TableFallback rows={6} stats={3} />}>
        <InvoiceContent user={user} status={current} canBill={canBill} />
      </Suspense>
    </>
  )
}

async function NewInvoiceButton({ user }: { user: SessionUser }) {
  const projects = await listProjects(user)
  return (
    <InvoiceDialog
      projects={projects.map((p) => ({ id: p.id, title: p.title }))}
    />
  )
}

async function InvoiceContent({
  user,
  status,
  canBill,
}: {
  user: SessionUser
  status: string
  canBill: boolean
}) {
  const invoices = await listInvoices(user, status)

  const paid = invoices
    .filter((invoice) => invoice.status === 'PAID')
    .reduce((sum, invoice) => sum + invoice.amount, 0)
  const outstanding = invoices
    .filter(
      (invoice) => invoice.status === 'PENDING' || invoice.status === 'OVERDUE'
    )
    .reduce((sum, invoice) => sum + invoice.amount, 0)
  const overdueCount = invoices.filter(
    (invoice) => invoice.status === 'OVERDUE'
  ).length

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Paid"
          value={formatCurrency(paid)}
          hint={status === 'ALL' ? 'All time' : 'Filtered view'}
          icon={ReceiptIcon}
          tone="success"
        />
        <StatCard
          label="Outstanding"
          value={formatCurrency(outstanding)}
          hint="Pending and overdue"
          icon={ReceiptIcon}
          tone="warning"
        />
        <StatCard
          label="Overdue invoices"
          value={String(overdueCount)}
          hint={overdueCount > 0 ? 'Needs chasing' : 'Nothing overdue'}
          icon={ReceiptIcon}
          tone={overdueCount > 0 ? 'danger' : 'success'}
        />
      </section>

      {invoices.length === 0 ? (
        <EmptyState
          icon={<ReceiptIcon className="size-6" />}
          title="No invoices here"
          description="Nothing matches this filter yet."
        />
      ) : (
        <Card>
          <CardContent className="px-0 pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Project</TableHead>
                  {canBill ? <TableHead>Client</TableHead> : null}
                  <TableHead>Due</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => {
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
                      {canBill ? (
                        <TableCell className="text-muted-foreground">
                          {invoice.project.client.name}
                        </TableCell>
                      ) : null}
                      <TableCell
                        className={
                          late
                            ? 'font-medium text-destructive'
                            : 'text-muted-foreground'
                        }
                      >
                        {formatDate(invoice.dueDate)}
                        {late ? ` · ${Math.abs(days)}d late` : null}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatCurrency(invoice.amount, true)}
                      </TableCell>
                      <TableCell>
                        {canBill ? (
                          <InvoiceStatusSelect
                            invoiceId={invoice.id}
                            status={invoice.status}
                          />
                        ) : (
                          <InvoiceStatusBadge status={invoice.status} />
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
