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
import { invoiceReference, isInvoiceLate, summarizeFinance } from '@/lib/finance'
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
  const { paid, outstanding, overdue, overdueCount, invoiced } =
    summarizeFinance(invoices)

  // Share of billed value in each state. Percentages, not counts: one $88k
  // invoice slipping matters more than three $500 ones.
  const share = (amount: number) =>
    invoiced > 0 ? Math.round((amount / invoiced) * 100) : 0
  const health = [
    { label: 'Paid', percent: share(paid), className: 'bg-success' },
    {
      label: 'Pending',
      percent: share(outstanding - overdue),
      className: 'bg-warning',
    },
    { label: 'Overdue', percent: share(overdue), className: 'bg-destructive' },
  ]

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
          label="Overdue"
          value={formatCurrency(overdue)}
          hint={
            overdueCount > 0
              ? `${overdueCount} ${overdueCount === 1 ? 'invoice' : 'invoices'} to chase`
              : 'Nothing overdue'
          }
          icon={ReceiptIcon}
          tone={overdueCount > 0 ? 'danger' : 'success'}
        />
      </section>

      {invoiced > 0 ? (
        <Card className="p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold">Invoice health</h2>
            <span className="text-xs text-muted-foreground">
              {formatCurrency(invoiced)} billed
            </span>
          </div>

          <div
            className="mt-3 flex h-2 overflow-hidden rounded-full bg-muted"
            role="img"
            aria-label={health
              .map((part) => `${part.label} ${part.percent}%`)
              .join(', ')}
          >
            {health.map((part) =>
              part.percent > 0 ? (
                <span
                  key={part.label}
                  className={part.className}
                  style={{ width: `${part.percent}%` }}
                />
              ) : null
            )}
          </div>

          {/* The bar is a summary; these labels are what actually carries the
              numbers, so nothing here depends on colour alone. */}
          <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
            {health.map((part) => (
              <div key={part.label} className="flex items-center gap-2">
                <span
                  aria-hidden
                  className={`size-2 rounded-full ${part.className}`}
                />
                <dt className="text-xs text-muted-foreground">{part.label}</dt>
                <dd className="text-xs font-medium tabular-nums">
                  {part.percent}%
                </dd>
              </div>
            ))}
          </dl>
        </Card>
      ) : null}

      {invoices.length === 0 ? (
        <EmptyState
          icon={<ReceiptIcon className="size-6" />}
          title="No invoices here"
          description="Nothing matches this filter yet."
        />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto px-0 pt-0">
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
