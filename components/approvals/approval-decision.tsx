'use client'

import { CheckIcon, MessageSquareIcon } from 'lucide-react'
import * as React from 'react'
import { useActionState } from 'react'
import { toast } from 'sonner'

import { FieldError, FormMessage, SubmitButton } from '@/components/form-parts'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { decideApproval } from '@/lib/actions/approvals'
import type { FormState } from '@/lib/validation'

/**
 * The client's two moves on a pending deliverable.
 *
 * Approving is one click. Requesting changes opens a note field first, because
 * a rejection the team cannot act on just costs another round trip.
 */
export function ApprovalDecision({
  approvalId,
  title,
}: {
  approvalId: string
  title: string
}) {
  const [changing, setChanging] = React.useState(false)

  const [state, action] = useActionState<FormState | undefined, FormData>(
    async (previous, formData) => {
      const result = await decideApproval(previous, formData)
      if (result?.ok) {
        toast.success(result.message ?? 'Sent.')
        setChanging(false)
      }
      return result
    },
    undefined
  )

  return (
    <div className="mt-4 border-t border-warning/25 pt-4">
      {changing ? (
        <form action={action} className="space-y-3">
          <input type="hidden" name="approvalId" value={approvalId} />
          <input type="hidden" name="decision" value="CHANGES_REQUESTED" />

          <div className="space-y-1.5">
            <Label htmlFor={`feedback-${approvalId}`}>
              What needs to change?
            </Label>
            <Textarea
              id={`feedback-${approvalId}`}
              name="feedback"
              rows={3}
              required
              autoFocus
              placeholder="The pricing table should show annual rates first…"
              aria-invalid={Boolean(state?.errors?.feedback)}
            />
            <FieldError messages={state?.errors?.feedback} />
          </div>

          {state?.message && !state.ok ? (
            <FormMessage>{state.message}</FormMessage>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <SubmitButton size="sm" pendingLabel="Sending…">
              Send feedback
            </SubmitButton>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setChanging(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <form action={action}>
            <input type="hidden" name="approvalId" value={approvalId} />
            <input type="hidden" name="decision" value="APPROVED" />
            <SubmitButton size="sm" pendingLabel="Approving…">
              <CheckIcon />
              Approve
            </SubmitButton>
          </form>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setChanging(true)}
          >
            <MessageSquareIcon />
            Request changes
          </Button>

          <span className="sr-only">for {title}</span>
        </div>
      )}

      {state?.message && !state.ok && !changing ? (
        <FormMessage className="mt-3">{state.message}</FormMessage>
      ) : null}
    </div>
  )
}
