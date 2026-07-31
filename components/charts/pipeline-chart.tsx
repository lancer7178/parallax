'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { ChartFrame, ChartTooltip } from '@/components/charts/chart-frame'
import { TASK_STATUSES, TASK_STATUS_LABELS } from '@/lib/constants'

export function PipelineChart({
  data,
}: {
  data: { status: string; count: number }[]
}) {
  // Ordered stages of one pipeline — a single series, so a single hue.
  const rows = TASK_STATUSES.map((status) => ({
    status,
    label: TASK_STATUS_LABELS[status],
    count: data.find((d) => d.status === status)?.count ?? 0,
  }))

  const total = rows.reduce((sum, row) => sum + row.count, 0)
  const done = rows.find((r) => r.status === 'DONE')?.count ?? 0

  return (
    <ChartFrame
      title="Delivery pipeline"
      description="Tasks in each stage across your projects."
      footer={
        total > 0
          ? `${done} of ${total} tasks complete (${Math.round((done / total) * 100)}%).`
          : 'No tasks yet.'
      }
    >
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            margin={{ top: 20, right: 8, bottom: 0, left: 0 }}
            barCategoryGap={16}
          >
            <CartesianGrid
              vertical={false}
              stroke="var(--grid)"
              strokeWidth={1}
            />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              tickMargin={10}
            />
            <YAxis
              width={32}
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
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
                        key: 'count',
                        label: 'Tasks',
                        color: 'var(--chart-1)',
                        value: String(row.count),
                      },
                    ]}
                  />
                ) : null
              }}
            />
            <Bar
              dataKey="count"
              fill="var(--chart-1)"
              radius={[4, 4, 0, 0]}
              maxBarSize={44}
            >
              <LabelList
                dataKey="count"
                position="top"
                offset={8}
                className="fill-muted-foreground"
                fontSize={11}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartFrame>
  )
}
