'use client'

import type { InvoiceStatus } from '@prisma/client'
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { ChartFrame, ChartTooltip } from '@/components/charts/chart-frame'
import {
  INVOICE_STATUSES,
  INVOICE_STATUS_COLOR,
  INVOICE_STATUS_LABELS,
} from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'

const compact = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

export function InvoiceStatusChart({
  data,
}: {
  data: { status: string; count: number; amount: number }[]
}) {
  // Dense series so every status keeps its slot even at zero.
  const rows = INVOICE_STATUSES.map((status) => {
    const match = data.find((d) => d.status === status)
    return {
      status,
      label: INVOICE_STATUS_LABELS[status],
      amount: match?.amount ?? 0,
      count: match?.count ?? 0,
      color: INVOICE_STATUS_COLOR[status as InvoiceStatus],
    }
  })

  const total = rows.reduce((sum, row) => sum + row.amount, 0)

  return (
    <ChartFrame
      title="Invoices by status"
      description="Total value in each stage of the billing cycle."
      footer={`${formatCurrency(total)} invoiced across ${rows.reduce(
        (sum, r) => sum + r.count,
        0
      )} invoices.`}
    >
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ top: 4, right: 56, bottom: 4, left: 0 }}
            barCategoryGap={10}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="label"
              width={78}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
            />
            <Tooltip
              cursor={{ fill: 'var(--muted)', opacity: 0.5 }}
              content={({ active, payload }) => {
                const row = payload?.[0]?.payload as
                  | (typeof rows)[number]
                  | undefined
                return active && row ? (
                  <ChartTooltip
                    label={row.label}
                    rows={[
                      {
                        key: 'amount',
                        label: 'Value',
                        color: row.color,
                        value: formatCurrency(row.amount),
                      },
                      {
                        key: 'count',
                        label: 'Invoices',
                        value: String(row.count),
                      },
                    ]}
                  />
                ) : null
              }}
            />
            <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={16}>
              {rows.map((row) => (
                <Cell key={row.status} fill={row.color} />
              ))}
              {/* Only four bars, so every value is directly labelled. */}
              <LabelList
                dataKey="amount"
                position="right"
                offset={8}
                className="fill-muted-foreground"
                fontSize={11}
                formatter={(value) =>
                  Number(value) > 0 ? `$${compact.format(Number(value))}` : '—'
                }
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartFrame>
  )
}
