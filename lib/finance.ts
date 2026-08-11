import type { InvoiceStatus } from '@prisma/client'

// Type-only Prisma import — see the note in `lib/rbac.ts`.

export type InvoiceMoney = {
  amount: number
  status: InvoiceStatus
  dueDate: Date | string
}

/**
 * The money side of a project, derived from its invoices in one place so the
 * project card, the project page, the client portal and the finance page can
 * never disagree about what "outstanding" means.
 *
 *   invoiced  — everything raised, drafts excluded (a draft isn't billed yet)
 *   paid      — collected
 *   outstanding — invoiced but not collected
 *   overdue   — the part of `outstanding` already past its due date
 */
export type ProjectFinance = {
  budget: number | null
  invoiced: number
  paid: number
  outstanding: number
  overdue: number
  overdueCount: number
  /** Budget not yet invoiced. `null` without a budget. */
  remaining: number | null
  /** Share of budget invoiced, 0–100. `null` without a budget. */
  burn: number | null
}

const isBillable = (status: InvoiceStatus) => status !== 'DRAFT'

/** An invoice is late when it is unpaid and its due date has passed. */
export function isInvoiceLate(invoice: InvoiceMoney) {
  if (invoice.status === 'PAID' || invoice.status === 'DRAFT') return false
  if (invoice.status === 'OVERDUE') return true
  return new Date(invoice.dueDate).getTime() < Date.now()
}

export function summarizeFinance(
  invoices: InvoiceMoney[],
  budget: number | null = null
): ProjectFinance {
  let invoiced = 0
  let paid = 0
  let overdue = 0
  let overdueCount = 0

  for (const invoice of invoices) {
    if (isBillable(invoice.status)) invoiced += invoice.amount
    if (invoice.status === 'PAID') paid += invoice.amount
    if (isInvoiceLate(invoice)) {
      overdue += invoice.amount
      overdueCount += 1
    }
  }

  return {
    budget,
    invoiced,
    paid,
    outstanding: invoiced - paid,
    overdue,
    overdueCount,
    remaining: budget === null ? null : budget - invoiced,
    burn: budget && budget > 0 ? Math.round((invoiced / budget) * 100) : null,
  }
}

/** Sequential, human-quotable reference. Invoices have no number column. */
export function invoiceReference(id: string) {
  return `INV-${id.slice(0, 8).toUpperCase()}`
}
