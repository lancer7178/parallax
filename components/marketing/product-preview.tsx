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
import { cn } from '@/lib/utils'

/**
 * Marketing previews of the real product surfaces.
 *
 * These are built from the same tokens, cards, badges and progress bars the
 * application uses, so the landing page cannot drift away from what people
 * actually get — and so both themes are handled for free. They are static by
 * design: no session, no database, nothing to load before the page paints.
 */

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
          <p className="truncate text-[0.65rem] text-muted-foreground">
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
export function DashboardPreview({ className }: { className?: string }) {
  return (
    <Frame label="Parallax · Dashboard" className={className}>
      <div className="space-y-3 bg-muted/20 p-3">
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <Tile
            label="Active projects"
            value="12"
            hint="4 in flight"
            icon={BriefcaseIcon}
          />
          <Tile
            label="Outstanding"
            value="$8,420"
            hint="Not yet collected"
            icon={ReceiptIcon}
            tone="warning"
          />
          <Tile
            label="This month"
            value="$24,820"
            hint="Collected since the 1st"
            icon={CheckIcon}
            tone="success"
          />
          <Tile
            label="Overdue"
            value="$2,100"
            hint="3 invoices past due"
            icon={TriangleAlertIcon}
            tone="danger"
          />
        </div>

        <div className="grid gap-2 lg:grid-cols-5">
          <div className="rounded-xl border border-border bg-card lg:col-span-3">
            <div className="border-b border-border/60 px-3 py-2.5">
              <p className="text-xs font-semibold">Needs your attention</p>
              <p className="text-[0.65rem] text-muted-foreground">
                4 items to act on.
              </p>
            </div>
            <div className="divide-y divide-border/60">
              <AttentionRow
                icon={ReceiptIcon}
                title="3 invoices overdue"
                detail="$2,100 unpaid · oldest Aug 2"
                tone="danger"
              />
              <AttentionRow
                icon={TriangleAlertIcon}
                title="Helios Replatform is at risk"
                detail="Budget 92% used at 76% complete"
                tone="danger"
              />
              <AttentionRow
                icon={ClipboardCheckIcon}
                title="1 client approval outstanding"
                detail="Nova Technologies · Homepage v3"
                tone="warning"
              />
              <AttentionRow
                icon={ClockIcon}
                title="2 tasks due today"
                detail="Across the agency"
                tone="warning"
              />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card lg:col-span-2">
            <div className="border-b border-border/60 px-3 py-2.5">
              <p className="text-xs font-semibold">Projects in flight</p>
            </div>
            <div className="divide-y divide-border/60">
              <ProjectRow
                title="Website Redesign"
                client="Nova Technologies"
                percent={84}
                meta="18 of 21 tasks"
                status="On track"
                tone="info"
              />
              <ProjectRow
                title="Brand System"
                client="Helios Retail"
                percent={62}
                meta="11 of 18 tasks"
                status="At risk"
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
export function PortalPreview({ className }: { className?: string }) {
  return (
    <Frame label="Parallax · Client portal" className={className}>
      <div className="space-y-3 bg-muted/20 p-3">
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border/60 px-3 py-2.5">
            <p className="text-xs font-semibold">Website Redesign</p>
          </div>
          <div className="space-y-3 p-3">
            <div className="space-y-1.5">
              <Progress value={78} className="h-1.5" />
              <div className="flex justify-between text-[0.65rem] text-muted-foreground">
                <span>14 of 18 deliverables complete</span>
                <span className="font-medium text-foreground">78%</span>
              </div>
            </div>

            <ul className="space-y-1.5 text-[0.7rem]">
              <li className="flex items-center gap-2">
                <CheckIcon className="size-3 text-success" />
                Homepage approved
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="size-3 text-success" />
                Mobile version delivered
              </li>
            </ul>
          </div>
        </div>

        <div className="rounded-xl border border-warning/30 bg-warning/5 p-3">
          <p className="text-xs font-medium">Awaiting your approval</p>
          <p className="mt-0.5 text-[0.65rem] text-muted-foreground">
            About page · sent Aug 10
          </p>
          <div className="mt-2.5 flex gap-1.5">
            <span className="rounded-md bg-primary px-2 py-1 text-[0.65rem] font-medium text-primary-foreground">
              Approve
            </span>
            <span className="rounded-md border border-border bg-card px-2 py-1 text-[0.65rem] font-medium">
              Request changes
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card divide-y divide-border/60">
          <div className="flex items-center justify-between px-3 py-2.5 text-[0.7rem]">
            <span className="font-mono text-muted-foreground">INV-0241</span>
            <span className="font-medium tabular-nums">$2,400.00</span>
            <Badge tone="success" className="text-[0.6rem]">
              Paid
            </Badge>
          </div>
          <div className="flex items-center justify-between px-3 py-2.5 text-[0.7rem]">
            <span className="font-mono text-muted-foreground">INV-0248</span>
            <span className="font-medium tabular-nums">$1,200.00</span>
            <Badge tone="warning" className="text-[0.6rem]">
              Pending
            </Badge>
          </div>
        </div>
      </div>
    </Frame>
  )
}

/** The project ↔ money relationship, which is the point of the product. */
export function ProjectMoneyPreview({ className }: { className?: string }) {
  return (
    <Frame label="Parallax · Nova Website" className={className}>
      <div className="space-y-3 bg-muted/20 p-3">
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-xs font-semibold">Financial overview</p>
          <dl className="mt-3 grid grid-cols-4 gap-2">
            {[
              ['Budget', '$8,000', ''],
              ['Invoiced', '$6,000', '75% of budget'],
              ['Paid', '$4,500', '75% collected'],
              ['Outstanding', '$1,500', 'Nothing overdue'],
            ].map(([label, value, hint]) => (
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
                <span className="text-muted-foreground">Budget invoiced</span>
                <span className="font-medium tabular-nums">75%</span>
              </div>
              <Progress value={75} className="h-1.5" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[0.65rem]">
                <span className="text-muted-foreground">Work complete</span>
                <span className="font-medium tabular-nums">82%</span>
              </div>
              <Progress value={82} className="h-1.5" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card divide-y divide-border/60">
          {[
            ['INV-0231', 'Paid', '$3,000.00', 'success'],
            ['INV-0239', 'Paid', '$1,500.00', 'success'],
            ['INV-0248', 'Pending', '$1,500.00', 'warning'],
          ].map(([ref, status, amount, tone]) => (
            <div
              key={ref}
              className="flex items-center justify-between px-3 py-2 text-[0.7rem]"
            >
              <span className="font-mono text-muted-foreground">{ref}</span>
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
