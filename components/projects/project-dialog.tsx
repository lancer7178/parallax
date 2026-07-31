'use client'

import { PlusIcon } from 'lucide-react'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createProject, updateProject } from '@/lib/actions/projects'
import { PROJECT_STATUSES, PROJECT_STATUS_LABELS } from '@/lib/constants'
import type { FormState } from '@/lib/validation'

const selectClass =
  'h-9 w-full rounded-md border border-input bg-card px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25'

export type ProjectDefaults = {
  id: string
  title: string
  description: string | null
  status: string
  clientId: string
  deadline: Date | null
  budget: number | null
}

/** `<input type="date">` needs a `YYYY-MM-DD` value. */
function toDateInput(date: Date | null) {
  return date ? new Date(date).toISOString().slice(0, 10) : ''
}

export function ProjectDialog({
  clients,
  project,
  trigger,
}: {
  clients: { id: string; name: string }[]
  project?: ProjectDefaults
  trigger?: React.ReactNode
}) {
  const editing = Boolean(project)
  const [open, setOpen] = React.useState(false)

  // See the note in `user-dialog.tsx` — closing lives in the action, not an
  // effect. `createProject` redirects on success, so only the edit path
  // returns a result here.
  const [state, action] = useActionState<FormState | undefined, FormData>(
    async (previous, formData) => {
      const result = editing
        ? await updateProject(previous, formData)
        : await createProject(previous, formData)
      if (result?.ok) {
        toast.success(result.message ?? 'Saved.')
        setOpen(false)
      }
      return result
    },
    undefined
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <PlusIcon />
            New project
          </Button>
        )}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit project' : 'New project'}</DialogTitle>
          <DialogDescription>
            {editing
              ? 'Update scope, timeline or budget for this engagement.'
              : 'Set up an engagement and assign it to a client.'}
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="space-y-4">
          {project ? <input type="hidden" name="id" value={project.id} /> : null}

          <div className="space-y-1.5">
            <Label htmlFor="project-title">Title</Label>
            <Input
              id="project-title"
              name="title"
              defaultValue={project?.title ?? ''}
              placeholder="Helios Commerce Replatform"
              required
              aria-invalid={Boolean(state?.errors?.title)}
            />
            <FieldError messages={state?.errors?.title} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              name="description"
              defaultValue={project?.description ?? ''}
              placeholder="What are we delivering, and for whom?"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="project-client">Client</Label>
              <select
                id="project-client"
                name="clientId"
                defaultValue={project?.clientId ?? ''}
                className={selectClass}
                required
              >
                <option value="" disabled>
                  Select a client…
                </option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              <FieldError messages={state?.errors?.clientId} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="project-status">Status</Label>
              <select
                id="project-status"
                name="status"
                defaultValue={project?.status ?? 'PLANNING'}
                className={selectClass}
              >
                {PROJECT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {PROJECT_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="project-deadline">Deadline</Label>
              <Input
                id="project-deadline"
                name="deadline"
                type="date"
                defaultValue={toDateInput(project?.deadline ?? null)}
              />
              <FieldError messages={state?.errors?.deadline} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="project-budget">Budget (USD)</Label>
              <Input
                id="project-budget"
                name="budget"
                type="number"
                min="0"
                step="500"
                defaultValue={project?.budget ?? ''}
                placeholder="120000"
              />
              <FieldError messages={state?.errors?.budget} />
            </div>
          </div>

          {state?.message && !state.ok ? (
            <FormMessage>{state.message}</FormMessage>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <SubmitButton>
              {editing ? 'Save changes' : 'Create project'}
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
