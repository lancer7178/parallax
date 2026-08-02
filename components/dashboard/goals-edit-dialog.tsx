'use client'

import { PencilIcon } from 'lucide-react'
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
import { updateGoals } from '@/lib/actions/goals'
import type { GoalProgress } from '@/lib/queries'
import type { FormState } from '@/lib/validation'

export function GoalsEditDialog({ goals }: { goals: GoalProgress[] }) {
  const [open, setOpen] = React.useState(false)

  const [state, action] = useActionState<FormState | undefined, FormData>(
    async (previous, formData) => {
      const result = await updateGoals(previous, formData)
      if (result?.ok) {
        toast.success(result.message ?? 'Targets updated.')
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
          <PencilIcon />
          Edit targets
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit targets</DialogTitle>
          <DialogDescription>
            These are the goals the dashboard measures the agency against.
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="space-y-4">
          {goals.map((goal) => (
            <div key={goal.key} className="space-y-1.5">
              <Label htmlFor={`goal-${goal.key}`}>{goal.label}</Label>
              <Input
                id={`goal-${goal.key}`}
                name={`goal:${goal.key}`}
                type="number"
                min={0}
                step={goal.format === 'currency' ? 1000 : 1}
                defaultValue={goal.target}
                required
                aria-invalid={Boolean(state?.errors?.[`goal:${goal.key}`])}
              />
              <FieldError messages={state?.errors?.[`goal:${goal.key}`]} />
            </div>
          ))}

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
            <SubmitButton>Save targets</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
