'use client'

import type { InvoiceStatus } from '@prisma/client'
import * as React from 'react'
import { toast } from 'sonner'

import { updateInvoiceStatus } from '@/lib/actions/invoices'
import { INVOICE_STATUSES, INVOICE_STATUS_LABELS } from '@/lib/constants'

export function InvoiceStatusSelect({
  invoiceId,
  status,
}: {
  invoiceId: string
  status: InvoiceStatus
}) {
  const [value, setValue] = React.useState<InvoiceStatus>(status)
  const [pending, startTransition] = React.useTransition()

  // Re-sync when the server sends fresh data, during render rather than in an
  // effect so the select never briefly shows the stale value.
  const [lastStatus, setLastStatus] = React.useState(status)
  if (lastStatus !== status) {
    setLastStatus(status)
    setValue(status)
  }

  function onChange(next: InvoiceStatus) {
    const previous = value
    setValue(next)

    startTransition(async () => {
      try {
        await updateInvoiceStatus({ invoiceId, status: next })
        toast.success(`Marked as ${INVOICE_STATUS_LABELS[next].toLowerCase()}.`)
      } catch {
        setValue(previous)
        toast.error('Could not update that invoice.')
      }
    })
  }

  return (
    <select
      aria-label="Invoice status"
      value={value}
      disabled={pending}
      onChange={(event) => onChange(event.target.value as InvoiceStatus)}
      className="h-8 rounded-md border border-input bg-card px-2 text-xs shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25 disabled:opacity-60"
    >
      {INVOICE_STATUSES.map((option) => (
        <option key={option} value={option}>
          {INVOICE_STATUS_LABELS[option]}
        </option>
      ))}
    </select>
  )
}
