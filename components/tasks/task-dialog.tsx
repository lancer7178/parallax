'use client'

import * as React from 'react'
import { useActionState } from 'react'
import { toast } from 'sonner'

import { FieldError, FormMessage, SubmitButton } from '@/components/form-parts'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createTask, updateTask } from '@/lib/actions/tasks'
import {
  PRIORITY_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
} from '@/lib/constants'
import type { ProjectTask } from '@/lib/queries'
import type { FormState } from '@/lib/validation'

export type Assignee = { id: string; name: string; role: string }

export function TaskDialog({
  open,
  onOpenChange,
  projectId,
  task,
  assignees,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  task?: ProjectTask | null
  assignees: Assignee[]
}) {
  const editing = Boolean(task)

  // Closing happens inside the action's transition rather than in an effect,
  // so the dialog never renders once with a successful result still on screen.
  const [state, action] = useActionState<FormState | undefined, FormData>(
    async (previous, formData) => {
      const result = editing
        ? await updateTask(previous, formData)
        : await createTask(previous, formData)
      if (result?.ok) {
        toast.success(result.message ?? 'Saved.')
        onOpenChange(false)
      }
      return result
    },
    undefined
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit task' : 'New task'}</DialogTitle>
          <DialogDescription>
            {editing
              ? 'Update the details, owner or stage of this task.'
              : 'Add a task to this project and drop it into the board.'}
          </DialogDescription>
        </DialogHeader>

        {/* Remounting on task change resets defaultValues between edits. */}
        <form key={task?.id ?? 'new'} action={action} className="space-y-4">
          <input type="hidden" name="projectId" value={projectId} />
          {task ? <input type="hidden" name="id" value={task.id} /> : null}

          <div className="space-y-1.5">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              name="title"
              defaultValue={task?.title ?? ''}
              placeholder="Build the checkout summary"
              required
              aria-invalid={Boolean(state?.errors?.title)}
            />
            <FieldError messages={state?.errors?.title} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-description">Description</Label>
            <Textarea
              id="task-description"
              name="description"
              defaultValue={task?.description ?? ''}
              placeholder="Context, acceptance criteria, links…"
            />
            <FieldError messages={state?.errors?.description} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="task-status">Stage</Label>
              <select
                id="task-status"
                name="status"
                defaultValue={task?.status ?? 'TODO'}
                className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25"
              >
                {TASK_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {TASK_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="task-priority">Priority</Label>
              <select
                id="task-priority"
                name="priority"
                defaultValue={String(task?.priority ?? 1)}
                className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25"
              >
                {[1, 2, 3].map((value) => (
                  <option key={value} value={value}>
                    {PRIORITY_LABELS[value]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="task-assignee">Assignee</Label>
              <select
                id="task-assignee"
                name="assigneeId"
                defaultValue={task?.assignee?.id ?? ''}
                className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25"
              >
                <option value="">Unassigned</option>
                {assignees.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </select>
              <FieldError messages={state?.errors?.assigneeId} />
            </div>
          </div>

          {state?.message && !state.ok ? (
            <FormMessage>{state.message}</FormMessage>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <SubmitButton>{editing ? 'Save changes' : 'Create task'}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
