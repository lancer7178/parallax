'use client'

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import type { TaskStatus } from '@prisma/client'
import * as React from 'react'
import { toast } from 'sonner'

import { TaskCard } from '@/components/kanban/task-card'
import { TASK_STATUSES, TASK_STATUS_LABELS } from '@/lib/constants'
import type { ProjectTask } from '@/lib/queries'
import { moveTask } from '@/lib/actions/tasks'
import { cn } from '@/lib/utils'

function Column({
  status,
  tasks,
  interactive,
  onEdit,
}: {
  status: TaskStatus
  tasks: ProjectTask[]
  interactive: boolean
  onEdit?: (task: ProjectTask) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status, disabled: !interactive })

  return (
    <section
      ref={setNodeRef}
      aria-label={TASK_STATUS_LABELS[status]}
      className={cn(
        'flex min-h-64 flex-col gap-3 rounded-xl border border-border bg-muted/40 p-3 transition-colors',
        isOver && 'border-primary/50 bg-primary/8'
      )}
    >
      <header className="flex items-center justify-between px-1">
        <h3 className="text-xs font-semibold tracking-wide uppercase">
          {TASK_STATUS_LABELS[status]}
        </h3>
        <span className="rounded-full bg-card px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
          {tasks.length}
        </span>
      </header>

      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            draggable={interactive}
            onEdit={onEdit}
          />
        ))}
        {tasks.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
            Nothing here
          </p>
        ) : null}
      </div>
    </section>
  )
}

export function KanbanBoard({
  tasks,
  interactive,
  onEdit,
}: {
  tasks: ProjectTask[]
  interactive: boolean
  onEdit?: (task: ProjectTask) => void
}) {
  // Optimistic overrides keyed by task id, cleared once the server responds.
  const [overrides, setOverrides] = React.useState<Record<string, TaskStatus>>(
    {}
  )
  const [dragging, setDragging] = React.useState<ProjectTask | null>(null)

  // Drop stale overrides whenever fresh server data arrives. Done during
  // render so the board never flashes the optimistic value over real data.
  const [lastTasks, setLastTasks] = React.useState(tasks)
  if (lastTasks !== tasks) {
    setLastTasks(tasks)
    setOverrides({})
  }

  const sensors = useSensors(
    // A small distance threshold keeps clicks from being read as drags.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  )

  const resolved = React.useMemo(
    () =>
      tasks.map((task) => ({
        ...task,
        status: overrides[task.id] ?? task.status,
      })),
    [tasks, overrides]
  )

  function handleDragStart(event: DragStartEvent) {
    setDragging(resolved.find((t) => t.id === event.active.id) ?? null)
  }

  async function handleDragEnd(event: DragEndEvent) {
    setDragging(null)

    const taskId = String(event.active.id)
    const status = event.over?.id as TaskStatus | undefined
    if (!status) return

    const current = resolved.find((t) => t.id === taskId)
    if (!current || current.status === status) return

    setOverrides((prev) => ({ ...prev, [taskId]: status }))

    try {
      await moveTask({ taskId, status })
    } catch {
      setOverrides((prev) => {
        const next = { ...prev }
        delete next[taskId]
        return next
      })
      toast.error('Could not move that task. Please try again.')
    }
  }

  const board = (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {TASK_STATUSES.map((status) => (
        <Column
          key={status}
          status={status}
          tasks={resolved.filter((task) => task.status === status)}
          interactive={interactive}
          onEdit={onEdit}
        />
      ))}
    </div>
  )

  if (!interactive) return board

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setDragging(null)}
    >
      {board}
      <DragOverlay>
        {dragging ? <TaskCard task={dragging} draggable={false} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
