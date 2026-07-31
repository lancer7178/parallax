'use client'

import * as React from 'react'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/**
 * Shared card + title + legend chrome so every chart on the dashboard reads as
 * one system. `height` sizes the plot only — the axis band and legend live
 * outside it, so axis labels are never clipped.
 */
export function ChartFrame({
  title,
  description,
  legend,
  footer,
  className,
  children,
}: {
  title: string
  description?: string
  legend?: { label: string; color: string }[]
  footer?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <Card className={cn('flex flex-col gap-4 p-5', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-0.5">
          <h2 className="text-sm font-semibold">{title}</h2>
          {description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {legend?.length ? (
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {legend.map((entry) => (
              <li
                key={entry.label}
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <span
                  aria-hidden
                  className="size-2 rounded-full"
                  style={{ background: entry.color }}
                />
                {entry.label}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {children}

      {footer ? (
        <div className="text-xs text-muted-foreground">{footer}</div>
      ) : null}
    </Card>
  )
}

/** Tooltip surface shared by every chart. */
export function ChartTooltip({
  label,
  rows,
}: {
  label?: React.ReactNode
  rows: { key: string; label: string; value: string; color?: string }[]
}) {
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg">
      {label ? (
        <p className="mb-1.5 text-xs font-medium text-popover-foreground">
          {label}
        </p>
      ) : null}
      <ul className="space-y-1">
        {rows.map((row) => (
          <li
            key={row.key}
            className="flex items-center gap-3 text-xs whitespace-nowrap"
          >
            {row.color ? (
              <span
                aria-hidden
                className="size-2 shrink-0 rounded-full"
                style={{ background: row.color }}
              />
            ) : null}
            <span className="text-muted-foreground">{row.label}</span>
            <span className="ml-auto font-medium text-popover-foreground tabular-nums">
              {row.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
