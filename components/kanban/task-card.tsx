'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import {
  AlertTriangleIcon,
  CalendarIcon,
  GripVerticalIcon,
  PencilIcon,
} from 'lucide-react'

import { PriorityBadge } from '@/components/status-badge'
import { UserAvatar } from '@/components/user-avatar'
import { isTaskDueToday, isTaskOverdue } from '@/lib/health'
import type { ProjectTask } from '@/lib/queries'
import { cn } from '@/lib/utils'

/** Day and month only — the card has no room for a year that is almost always
 *  the current one. */
const shortDate = (date: Date | string) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
    new Date(date)
  )

export function TaskCard({
  task,
  draggable,
  onEdit,
}: {
  task: ProjectTask
  draggable: boolean
  onEdit?: (task: ProjectTask) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: task.id, disabled: !draggable })

  const overdue = isTaskOverdue(task)

  return (
    <article
      ref={draggable ? setNodeRef : undefined}
      style={
        draggable && transform
          ? { transform: CSS.Translate.toString(transform) }
          : undefined
      }
      className={cn(
        'group relative rounded-lg border border-border bg-card p-3 shadow-xs transition-shadow',
        isDragging && 'opacity-40',
        draggable && 'hover:shadow-md'
      )}
    >
      <div className="flex items-start gap-2">
        {draggable ? (
          <button
            type="button"
            aria-label={`Move ${task.title}`}
            className="-ml-1 cursor-grab rounded p-0.5 text-muted-foreground/60 hover:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring outline-none active:cursor-grabbing"
            {...listeners}
            {...attributes}
          >
            <GripVerticalIcon className="size-4" />
          </button>
        ) : null}

        <p className="min-w-0 flex-1 text-sm leading-snug font-medium">
          {task.title}
        </p>

        {onEdit ? (
          <button
            type="button"
            onClick={() => onEdit(task)}
            aria-label={`Edit ${task.title}`}
            className="rounded p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring outline-none"
          >
            <PencilIcon className="size-3.5" />
          </button>
        ) : null}
      </div>

      {task.description ? (
        <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
          {task.description}
        </p>
      ) : null}

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5">
          <PriorityBadge priority={task.priority} />
          {task.dueDate ? (
            <span
              className={cn(
                'flex items-center gap-1 text-xs',
                overdue
                  ? 'font-medium text-destructive'
                  : isTaskDueToday(task)
                    ? 'font-medium text-warning'
                    : 'text-muted-foreground'
              )}
            >
              {overdue ? (
                <AlertTriangleIcon className="size-3" />
              ) : (
                <CalendarIcon className="size-3" />
              )}
              {shortDate(task.dueDate)}
            </span>
          ) : null}
        </span>
        {task.assignee ? (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <UserAvatar
              name={task.assignee.name}
              avatarUrl={task.assignee.avatarUrl}
              className="size-6"
            />
            <span className="hidden sm:inline">
              {task.assignee.name.split(' ')[0]}
            </span>
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Unassigned</span>
        )}
      </div>
    </article>
  )
}
