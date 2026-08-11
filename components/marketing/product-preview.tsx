import {
  BriefcaseIcon,
  CheckIcon,
  ClipboardCheckIcon,
  ClockIcon,
  ReceiptIcon,
  TriangleAlertIcon,
  type LucideIcon,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { LandingDictionary } from '@/lib/i18n'
import { cn } from '@/lib/utils'

/**
 * Marketing previews of the real product surfaces.
 *
 * These are built from the same tokens, cards, badges and progress bars the
 * application uses, so the landing page cannot drift away from what people
 * actually get — and so both themes and both text directions are handled for
 * free. They are static by design: no session, no database, nothing to load
 * before the page paints.
 *
 * Money is written with Latin numerals in both locales. Eastern Arabic
 * numerals are correct in prose but agency finance tools are read alongside
 * bank statements and invoices, which use Latin digits.
 */

type Dict = LandingDictionary['preview']

function Tile({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'default',
}: {
  label: string
  value: string
  hint: string
  icon: LucideIcon
  tone?: 'default' | 'success' | 'warning' | 'danger'
}) {
  const toneClass = {
    default: 'bg-primary/12 text-primary',
    success: 'bg-success/15 text-success',
    warning: 'bg-warning/18 text-warning',
    danger: 'bg-destructive/12 text-destructive',
  }[tone]

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[0.6rem] font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </p>
          <p className="mt-0.5 text-base font-semibold tabular-nums">{value}</p>
          <p className="truncate text-[0.65rem] text-muted-foreground">{hint}</p>
        </div>
        <span
          className={cn(
            'flex size-6 shrink-0 items-center justify-center rounded-md',
            toneClass
          )}
        >
          <Icon className="size-3" />
        </span>
      </div>
    </div>
  )
}

function AttentionRow({
  icon: Icon,
  title,
  detail,
  tone,
}: {
  icon: LucideIcon
  title: string
  detail: string
  tone: 'danger' | 'warning'
}) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5">
      <span
        className={cn(
          'flex size-6 shrink-0 items-center justify-center rounded-md',
          tone === 'danger'
            ? 'bg-destructive/12 text-destructive'
            : 'bg-warning/18 text-warning'
        )}
      >
        <Icon className="size-3" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-medium">{title}</span>
        <span className="block truncate text-[0.65rem] text-muted-foreground">
          {detail}
        </span>
      </span>
    </div>
  )
}

function ProjectRow({
  title,
  client,
  percent,
  meta,
  status,
  tone,
}: {
  title: string
  client: string
  percent: number
  meta: string
  status: string
  tone: 'info' | 'warning' | 'danger'
}) {
  return (
    <div className="space-y-2 px-3 py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium">{title}</p>
          <p className="truncate text-[0.65rem] text-muted-foreground" dir="ltr">
            {client}
          </p>
        </div>
        <Badge tone={tone} className="shrink-0 text-[0.6rem]">
          {status}
        </Badge>
      </div>
      <Progress value={percent} className="h-1.5" />
      <div className="flex items-center justify-between text-[0.65rem] text-muted-foreground">
        <span>{meta}</span>
        <span className="font-medium tabular-nums text-foreground">
          {percent}%
        </span>
      </div>
    </div>
  )
}

/** A window chrome that reads as "this is the app", without faking a browser. */
function Frame({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="flex items-center gap-2 border-b border-border/60 bg-muted/40 px-3 py-2">
        <span aria-hidden className="flex gap-1.5">
          <span className="size-2 rounded-full bg-border" />
          <span className="size-2 rounded-full bg-border" />
          <span className="size-2 rounded-full bg-border" />
        </span>
        <span className="text-[0.65rem] font-medium text-muted-foreground">
          {label}
        </span>
      </div>
      {children}
    </Card>
  )
}

/** The hero visual: the operations dashboard, at a glance. */
export function DashboardPreview({
  t,
  className,
}: {
  t: Dict
  className?: string
}) {
  return (
    <Frame label={t.dashboardFrame} className={className}>
      <div className="space-y-3 bg-muted/20 p-3">
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <Tile
            label={t.kpi.activeProjects[0]}
            value="12"
            hint={t.kpi.activeProjects[1]}
            icon={BriefcaseIcon}
          />
          <Tile
            label={t.kpi.outstanding[0]}
            value="$8,420"
            hint={t.kpi.outstanding[1]}
            icon={ReceiptIcon}
            tone="warning"
          />
          <Tile
            label={t.kpi.thisMonth[0]}
            value="$24,820"
            hint={t.kpi.thisMonth[1]}
            icon={CheckIcon}
            tone="success"
          />
          <Tile
            label={t.kpi.overdue[0]}
            value="$2,100"
            hint={t.kpi.overdue[1]}
            icon={TriangleAlertIcon}
            tone="danger"
          />
        </div>

        <div className="grid gap-2 lg:grid-cols-5">
          <div className="rounded-xl border border-border bg-card lg:col-span-3">
            <div className="border-b border-border/60 px-3 py-2.5">
              <p className="text-xs font-semibold">{t.attention.title}</p>
              <p className="text-[0.65rem] text-muted-foreground">
                {t.attention.count}
              </p>
            </div>
            <div className="divide-y divide-border/60">
              <AttentionRow
                icon={ReceiptIcon}
                title={t.attention.invoices[0]}
                detail={t.attention.invoices[1]}
                tone="danger"
              />
              <AttentionRow
                icon={TriangleAlertIcon}
                title={t.attention.risk[0]}
                detail={t.attention.risk[1]}
                tone="danger"
              />
              <AttentionRow
                icon={ClipboardCheckIcon}
                title={t.attention.approval[0]}
                detail={t.attention.approval[1]}
                tone="warning"
              />
              <AttentionRow
                icon={ClockIcon}
                title={t.attention.tasks[0]}
                detail={t.attention.tasks[1]}
                tone="warning"
              />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card lg:col-span-2">
            <div className="border-b border-border/60 px-3 py-2.5">
              <p className="text-xs font-semibold">{t.projects.title}</p>
            </div>
            <div className="divide-y divide-border/60">
              <ProjectRow
                title={t.projects.website.title}
                client={t.projects.website.client}
                percent={84}
                meta={t.projects.website.meta}
                status={t.projects.website.status}
                tone="info"
              />
              <ProjectRow
                title={t.projects.brand.title}
                client={t.projects.brand.client}
                percent={62}
                meta={t.projects.brand.meta}
                status={t.projects.brand.status}
                tone="danger"
              />
            </div>
          </div>
        </div>
      </div>
    </Frame>
  )
}

/** What a client sees when they sign in — progress, approvals, invoices. */
export function PortalPreview({
  t,
  className,
}: {
  t: Dict
  className?: string
}) {
  return (
    <Frame label={t.portalFrame} className={className}>
      <div className="space-y-3 bg-muted/20 p-3">
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border/60 px-3 py-2.5">
            <p className="text-xs font-semibold">{t.portal.project}</p>
          </div>
          <div className="space-y-3 p-3">
            <div className="space-y-1.5">
              <Progress value={78} className="h-1.5" />
              <div className="flex justify-between text-[0.65rem] text-muted-foreground">
                <span>{t.portal.progress}</span>
                <span className="font-medium text-foreground">78%</span>
              </div>
            </div>

            <ul className="space-y-1.5 text-[0.7rem]">
              {t.portal.updates.map((update) => (
                <li key={update} className="flex items-center gap-2">
                  <CheckIcon className="size-3 shrink-0 text-success" />
                  {update}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-xl border border-warning/30 bg-warning/5 p-3">
          <p className="text-xs font-medium">{t.portal.awaiting}</p>
          <p className="mt-0.5 text-[0.65rem] text-muted-foreground">
            {t.portal.awaitingMeta}
          </p>
          <div className="mt-2.5 flex gap-1.5">
            <span className="rounded-md bg-primary px-2 py-1 text-[0.65rem] font-medium text-primary-foreground">
              {t.portal.approve}
            </span>
            <span className="rounded-md border border-border bg-card px-2 py-1 text-[0.65rem] font-medium">
              {t.portal.requestChanges}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card divide-y divide-border/60">
          {[
            ['INV-0241', '$2,400.00', t.portal.paid, 'success'],
            ['INV-0248', '$1,200.00', t.portal.pending, 'warning'],
          ].map(([ref, amount, status, tone]) => (
            <div
              key={ref}
              className="flex items-center justify-between px-3 py-2.5 text-[0.7rem]"
            >
              <span className="font-mono text-muted-foreground" dir="ltr">
                {ref}
              </span>
              <span className="font-medium tabular-nums">{amount}</span>
              <Badge
                tone={tone as 'success' | 'warning'}
                className="text-[0.6rem]"
              >
                {status}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </Frame>
  )
}

/** The project ↔ money relationship, which is the point of the product. */
export function ProjectMoneyPreview({
  t,
  className,
}: {
  t: Dict
  className?: string
}) {
  const figures = [
    [t.finance.budget, '$8,000', t.finance.budgetHint],
    [t.finance.invoiced, '$6,000', t.finance.invoicedHint],
    [t.finance.paid, '$4,500', t.finance.paidHint],
    [t.finance.outstanding, '$1,500', t.finance.outstandingHint],
  ]

  return (
    <Frame label={t.projectFrame} className={className}>
      <div className="space-y-3 bg-muted/20 p-3">
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-xs font-semibold">{t.finance.heading}</p>
          <dl className="mt-3 grid grid-cols-4 gap-2">
            {figures.map(([label, value, hint]) => (
              <div key={label} className="min-w-0">
                <dt className="truncate text-[0.6rem] font-medium tracking-wide text-muted-foreground uppercase">
                  {label}
                </dt>
                <dd className="text-sm font-semibold tabular-nums">{value}</dd>
                <p className="truncate text-[0.6rem] text-muted-foreground">
                  {hint}
                </p>
              </div>
            ))}
          </dl>

          <div className="mt-3 space-y-2 rounded-lg border border-border bg-muted/40 p-2.5">
            <div className="space-y-1">
              <div className="flex justify-between text-[0.65rem]">
                <span className="text-muted-foreground">{t.finance.burn}</span>
                <span className="font-medium tabular-nums">75%</span>
              </div>
              <Progress value={75} className="h-1.5" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[0.65rem]">
                <span className="text-muted-foreground">{t.finance.work}</span>
                <span className="font-medium tabular-nums">82%</span>
              </div>
              <Progress value={82} className="h-1.5" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card divide-y divide-border/60">
          {[
            ['INV-0231', '$3,000.00', t.portal.paid, 'success'],
            ['INV-0239', '$1,500.00', t.portal.paid, 'success'],
            ['INV-0248', '$1,500.00', t.portal.pending, 'warning'],
          ].map(([ref, amount, status, tone]) => (
            <div
              key={ref}
              className="flex items-center justify-between px-3 py-2 text-[0.7rem]"
            >
              <span className="font-mono text-muted-foreground" dir="ltr">
                {ref}
              </span>
              <span className="font-medium tabular-nums">{amount}</span>
              <Badge
                tone={tone as 'success' | 'warning'}
                className="text-[0.6rem]"
              >
                {status}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </Frame>
  )
}
