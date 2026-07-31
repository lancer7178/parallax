import { CalendarIcon, CheckCircle2Icon } from 'lucide-react'
import Link from 'next/link'

import { ProjectStatusBadge } from '@/components/status-badge'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { UserAvatar } from '@/components/user-avatar'
import type { ProjectCard as ProjectCardData } from '@/lib/queries'
import { daysUntil, formatCurrency, formatDate } from '@/lib/utils'

export function ProjectCard({
  project,
  href,
  showBudget,
  showClient = true,
}: {
  project: ProjectCardData
  href: string
  showBudget: boolean
  showClient?: boolean
}) {
  const total = project.tasks.length
  const done = project.tasks.filter((task) => task.status === 'DONE').length
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)

  const days = project.deadline ? daysUntil(project.deadline) : null
  const late = days !== null && days < 0 && project.status !== 'COMPLETED'

  return (
    <Card className="flex h-full flex-col gap-4 p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <Link href={href} className="min-w-0 space-y-1">
          <h3 className="truncate font-semibold hover:underline">
            {project.title}
          </h3>
          {showClient ? (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <UserAvatar
                name={project.client.name}
                avatarUrl={project.client.avatarUrl}
                className="size-5"
              />
              {project.client.name}
            </span>
          ) : null}
        </Link>
        <ProjectStatusBadge status={project.status} />
      </div>

      {project.description ? (
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {project.description}
        </p>
      ) : null}

      <div className="mt-auto space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <CheckCircle2Icon className="size-3.5" />
              {done} of {total} tasks
            </span>
            <span className="font-medium tabular-nums">{percent}%</span>
          </div>
          <Progress value={percent} />
        </div>

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
          {showBudget && project.budget ? (
            <span className="font-medium tabular-nums">
              {formatCurrency(project.budget)}
            </span>
          ) : null}
        </div>
      </div>
    </Card>
  )
}
