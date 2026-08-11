'use client'

import { SendIcon } from 'lucide-react'
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
import { requestApproval } from '@/lib/actions/approvals'
import type { FormState } from '@/lib/validation'

export function RequestApprovalDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = React.useState(false)

  const [state, action] = useActionState<FormState | undefined, FormData>(
    async (previous, formData) => {
      const result = await requestApproval(previous, formData)
      if (result?.ok) {
        toast.success(result.message ?? 'Sent for approval.')
        setOpen(false)
      }
      return result
    },
    undefined
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <SendIcon />
          Send for approval
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send for approval</DialogTitle>
          <DialogDescription>
            The client sees this in their portal and can approve it or send
            back written feedback.
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="space-y-4">
          <input type="hidden" name="projectId" value={projectId} />

          <div className="space-y-1.5">
            <Label htmlFor="approval-title">Deliverable</Label>
            <Input
              id="approval-title"
              name="title"
              placeholder="Homepage v3"
              required
              aria-invalid={Boolean(state?.errors?.title)}
            />
            <FieldError messages={state?.errors?.title} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="approval-description">What to review</Label>
            <Textarea
              id="approval-description"
              name="description"
              rows={3}
              placeholder="Desktop and mobile layouts, including the new hero."
            />
            <FieldError messages={state?.errors?.description} />
          </div>

          {state?.message && !state.ok ? (
            <FormMessage>{state.message}</FormMessage>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton pendingLabel="Sending…">Send</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
