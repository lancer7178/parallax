import { CalendarIcon, CheckCircle2Icon, ClockIcon } from 'lucide-react'
import Link from 'next/link'

import { HealthBadge } from '@/components/status-badge'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { UserAvatar } from '@/components/user-avatar'
import type { ProjectCard as ProjectCardData } from '@/lib/queries'
import { daysUntil, formatCurrency, formatDate } from '@/lib/utils'

/**
 * One project, summarised the way an agency actually reads one: how much work
 * is done, how much money it has drawn, and whether either of those is a
 * problem. `finance` arrives `null` for viewers who may not see money, so the
 * money row simply is not rendered rather than being hidden with CSS.
 */
export function ProjectCard({
  project,
  href,
}: {
  project: ProjectCardData
  href: string
}) {
  const { finance, health } = project
  const days = project.deadline ? daysUntil(project.deadline) : null
  const late = days !== null && days < 0 && project.status !== 'COMPLETED'

  return (
    <Card className="relative flex h-full flex-col gap-4 p-5 transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-ring">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h3 className="truncate font-semibold">
            {/* Stretched link: the whole card is the target, so the hit area
                matches what the card looks like. */}
            <Link href={href} className="outline-none after:absolute after:inset-0">
              {project.title}
            </Link>
          </h3>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <UserAvatar
              name={project.client.name}
              avatarUrl={project.client.avatarUrl}
              className="size-5"
            />
            {project.client.name}
          </span>
        </div>
        <HealthBadge health={health} className="relative shrink-0" />
      </div>

      {health.reasons.length > 0 ? (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {health.reasons[0]}
        </p>
      ) : project.description ? (
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {project.description}
        </p>
      ) : null}

      <div className="mt-auto space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <CheckCircle2Icon className="size-3.5" />
              {project.taskDone} of {project.taskTotal} tasks
            </span>
            <span className="font-medium tabular-nums">{project.progress}%</span>
          </div>
          <Progress value={project.progress} />
        </div>

        {finance ? (
          <dl className="grid grid-cols-3 gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs">
            <div>
              <dt className="text-muted-foreground">Budget</dt>
              <dd className="font-medium tabular-nums">
                {finance.budget ? formatCurrency(finance.budget) : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Invoiced</dt>
              <dd className="font-medium tabular-nums">
                {formatCurrency(finance.invoiced)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Outstanding</dt>
              <dd
                className={
                  finance.overdue > 0
                    ? 'font-medium text-destructive tabular-nums'
                    : 'font-medium tabular-nums'
                }
              >
                {formatCurrency(finance.outstanding)}
              </dd>
            </div>
          </dl>
        ) : null}

        <div className="flex items-center justify-between gap-2 text-xs">
          <span
            className={
              late
                ? 'flex items-center gap-1.5 font-medium text-destructive'
                : 'flex items-center gap-1.5 text-muted-foreground'
            }
          >
            <CalendarIcon className="size-3.5" />
            {formatDate(project.deadline)}
            {late ? ` · ${Math.abs(days)}d late` : null}
          </span>
          {project.pendingApprovals > 0 ? (
            <span className="flex items-center gap-1.5 font-medium text-warning">
              <ClockIcon className="size-3.5" />
              {project.pendingApprovals} awaiting approval
            </span>
          ) : null}
        </div>
      </div>
    </Card>
  )
}
