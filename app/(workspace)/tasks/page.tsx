import type { Metadata } from 'next'
import { KanbanSquareIcon } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'

import { EmptyState, PageHeader } from '@/components/page-header'
import { TableFallback } from '@/components/skeletons'
import { PriorityBadge, TaskStatusBadge } from '@/components/status-badge'
import { StatusFilter } from '@/components/status-filter'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { UserAvatar } from '@/components/user-avatar'
import { TASK_STATUSES, TASK_STATUS_LABELS } from '@/lib/constants'
import { requireRole, type SessionUser } from '@/lib/dal'
import { listTasks } from '@/lib/queries'
import { cn, formatDate } from '@/lib/utils'

export const metadata: Metadata = { title: 'Tasks' }

export default async function TasksPage(props: PageProps<'/tasks'>) {
  // Gate before streaming so the redirect stays a real 307.
  const user = await requireRole('ADMIN', 'DEVELOPER', 'DESIGNER')

  const { status, assignee } = await props.searchParams
  const currentStatus = typeof status === 'string' ? status : 'ALL'
  const mineOnly = assignee === 'me'

  const query = (next: Record<string, string | undefined>) => {
    const params = new URLSearchParams()
    if (currentStatus !== 'ALL') params.set('status', currentStatus)
    if (mineOnly) params.set('assignee', 'me')
    for (const [key, value] of Object.entries(next)) {
      if (value === undefined) params.delete(key)
      else params.set(key, value)
    }
    const search = params.toString()
    return search ? `/tasks?${search}` : '/tasks'
  }

  return (
    <>
      <PageHeader
        title="Tasks"
        description="Every piece of work across the projects you can see."
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusFilter
          basePath="/tasks"
          current={currentStatus}
          options={TASK_STATUSES.map((value) => ({
            value,
            label: TASK_STATUS_LABELS[value],
          }))}
        />

        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          <Link
            href={query({ assignee: undefined })}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              !mineOnly
                ? 'bg-primary/12 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            Everyone
          </Link>
          <Link
            href={query({ assignee: 'me' })}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              mineOnly
                ? 'bg-primary/12 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            Assigned to me
          </Link>
        </div>
      </div>

      <Suspense
        key={`${currentStatus}:${mineOnly}`}
        fallback={<TableFallback rows={8} />}
      >
        <TasksTable
          user={user}
          status={currentStatus}
          mineOnly={mineOnly}
        />
      </Suspense>
    </>
  )
}

async function TasksTable({
  user,
  status,
  mineOnly,
}: {
  user: SessionUser
  status: string
  mineOnly: boolean
}) {
  const tasks = await listTasks(user, {
    status,
    assignee: mineOnly ? 'me' : 'all',
  })

  return (
    <>
      {tasks.length === 0 ? (
        <EmptyState
          icon={<KanbanSquareIcon className="size-6" />}
          title="No tasks match these filters"
          description="Open a project to add work to its board."
        />
      ) : (
        <Card>
          <CardContent className="px-0 pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="max-w-72 font-medium">
                      <Link
                        href={`/projects/${task.project.id}`}
                        className="block truncate hover:underline"
                      >
                        {task.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <Link
                        href={`/projects/${task.project.id}`}
                        className="hover:underline"
                      >
                        {task.project.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {task.assignee ? (
                        <span className="flex items-center gap-2">
                          <UserAvatar
                            name={task.assignee.name}
                            avatarUrl={task.assignee.avatarUrl}
                            className="size-6"
                          />
                          <span className="text-sm">{task.assignee.name}</span>
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Unassigned
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={task.priority} />
                    </TableCell>
                    <TableCell>
                      <TaskStatusBadge status={task.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(task.updatedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  )
}
