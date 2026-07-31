'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { ChartFrame, ChartTooltip } from '@/components/charts/chart-frame'
import type { RevenuePoint } from '@/lib/queries'
import { formatCurrency } from '@/lib/utils'

const SERIES = [
  { key: 'billed', label: 'Billed', color: 'var(--chart-1)' },
  { key: 'collected', label: 'Collected', color: 'var(--chart-2)' },
] as const

const axisStyle = {
  fontSize: 11,
  fill: 'var(--muted-foreground)',
}

const compact = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  return (
    <ChartFrame
      title="Billing trend"
      description="Invoiced versus collected over the last six months."
      legend={SERIES.map((s) => ({ label: s.label, color: s.color }))}
      footer="Draft invoices are excluded from Billed. Full detail is on the Invoices page."
    >
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
          >
            <defs>
              {SERIES.map((s) => (
                <linearGradient
                  key={s.key}
                  id={`fill-${s.key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>

            <CartesianGrid
              vertical={false}
              stroke="var(--grid)"
              strokeWidth={1}
            />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={axisStyle}
              tickMargin={10}
            />
            <YAxis
              width={52}
              tickLine={false}
              axisLine={false}
              tick={axisStyle}
              tickFormatter={(value: number) => `$${compact.format(value)}`}
            />
            <Tooltip
              cursor={{ stroke: 'var(--grid)', strokeWidth: 1 }}
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <ChartTooltip
                    label={label as string}
                    rows={SERIES.map((s) => ({
                      key: s.key,
                      label: s.label,
                      color: s.color,
                      value: formatCurrency(
                        Number(
                          payload.find((p) => p.dataKey === s.key)?.value ?? 0
                        )
                      ),
                    }))}
                  />
                ) : null
              }
            />

            {SERIES.map((s) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={2}
                fill={`url(#fill-${s.key})`}
                dot={false}
                activeDot={{
                  r: 4,
                  strokeWidth: 2,
                  stroke: 'var(--card)',
                }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartFrame>
  )
}
