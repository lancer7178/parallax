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
import { createInvoice } from '@/lib/actions/invoices'
import { INVOICE_STATUSES, INVOICE_STATUS_LABELS } from '@/lib/constants'
import type { FormState } from '@/lib/validation'

const selectClass =
  'h-9 w-full rounded-md border border-input bg-card px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25'

export function InvoiceDialog({
  projects,
  projectId,
}: {
  projects: { id: string; title: string }[]
  /** Pre-selected and locked when raised from a project page. */
  projectId?: string
}) {
  const [open, setOpen] = React.useState(false)

  // See the note in `user-dialog.tsx` — closing lives in the action, not an
  // effect.
  const [state, action] = useActionState<FormState | undefined, FormData>(
    async (previous, formData) => {
      const result = await createInvoice(previous, formData)
      if (result?.ok) {
        toast.success(result.message ?? 'Invoice created.')
        setOpen(false)
      }
      return result
    },
    undefined
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon />
          New invoice
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>New invoice</DialogTitle>
          <DialogDescription>
            Raise an invoice against a project. Drafts are excluded from
            reporting until they are sent.
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="invoice-project">Project</Label>
            {projectId ? (
              <input type="hidden" name="projectId" value={projectId} />
            ) : null}
            <select
              id="invoice-project"
              name={projectId ? undefined : 'projectId'}
              defaultValue={projectId ?? ''}
              disabled={Boolean(projectId)}
              className={selectClass}
              required
            >
              <option value="" disabled>
                Select a project…
              </option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
            <FieldError messages={state?.errors?.projectId} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="invoice-amount">Amount (USD)</Label>
              <Input
                id="invoice-amount"
                name="amount"
                type="number"
                min="0"
                step="100"
                placeholder="24000"
                required
                aria-invalid={Boolean(state?.errors?.amount)}
              />
              <FieldError messages={state?.errors?.amount} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="invoice-due">Due date</Label>
              <Input id="invoice-due" name="dueDate" type="date" required />
              <FieldError messages={state?.errors?.dueDate} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="invoice-status">Status</Label>
              <select
                id="invoice-status"
                name="status"
                defaultValue="DRAFT"
                className={selectClass}
              >
                {INVOICE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {INVOICE_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
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
            <SubmitButton>Create invoice</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
