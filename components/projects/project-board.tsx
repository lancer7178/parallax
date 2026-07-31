'use client'

import { PlusIcon } from 'lucide-react'
import * as React from 'react'

import { KanbanBoard } from '@/components/kanban/board'
import { TaskDialog, type Assignee } from '@/components/tasks/task-dialog'
import { Button } from '@/components/ui/button'
import type { ProjectTask } from '@/lib/queries'

/**
 * Client shell around the board so the "new task" / "edit task" dialog and the
 * drag-and-drop state live in one place.
 */
export function ProjectBoard({
  projectId,
  tasks,
  assignees,
  canManage,
}: {
  projectId: string
  tasks: ProjectTask[]
  assignees: Assignee[]
  canManage: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<ProjectTask | null>(null)

  const openNew = React.useCallback(() => {
    setEditing(null)
    setOpen(true)
  }, [])

  const openEdit = React.useCallback((task: ProjectTask) => {
    setEditing(task)
    setOpen(true)
  }, [])

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Task board</h2>
          <p className="text-sm text-muted-foreground">
            {canManage
              ? 'Drag a card between columns to change its stage.'
              : 'A live view of where each piece of work stands.'}
          </p>
        </div>
        {canManage ? (
          <Button onClick={openNew}>
            <PlusIcon />
            New task
          </Button>
        ) : null}
      </div>

      <KanbanBoard
        tasks={tasks}
        interactive={canManage}
        onEdit={canManage ? openEdit : undefined}
      />

      {canManage ? (
        <TaskDialog
          open={open}
          onOpenChange={setOpen}
          projectId={projectId}
          task={editing}
          assignees={assignees}
        />
      ) : null}
    </section>
  )
}
