'use client'

import type { Role } from '@prisma/client'
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
import { createUser } from '@/lib/actions/users'
import { ROLE_LABELS } from '@/lib/rbac'
import type { FormState } from '@/lib/validation'

export function UserDialog({
  roles,
  title,
  description,
  triggerLabel,
}: {
  roles: Role[]
  title: string
  description: string
  triggerLabel: string
}) {
  const [open, setOpen] = React.useState(false)

  // Closing happens inside the action's transition rather than in an effect,
  // so the dialog never renders once with a successful result still on screen.
  const [state, action] = useActionState<FormState | undefined, FormData>(
    async (previous, formData) => {
      const result = await createUser(previous, formData)
      if (result?.ok) {
        toast.success(result.message ?? 'Account created.')
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
          {triggerLabel}
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form action={action} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="user-name">Name</Label>
            <Input
              id="user-name"
              name="name"
              placeholder="Nadia Farouk"
              required
              aria-invalid={Boolean(state?.errors?.name)}
            />
            <FieldError messages={state?.errors?.name} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="user-email">Email</Label>
            <Input
              id="user-email"
              name="email"
              type="email"
              placeholder="name@example.com"
              required
              aria-invalid={Boolean(state?.errors?.email)}
            />
            <FieldError messages={state?.errors?.email} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="user-role">Role</Label>
              <select
                id="user-role"
                name="role"
                defaultValue={roles[0]}
                className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25"
              >
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="user-password">Temporary password</Label>
              <Input
                id="user-password"
                name="password"
                type="text"
                placeholder="At least 8 characters"
                required
                aria-invalid={Boolean(state?.errors?.password)}
              />
              <FieldError messages={state?.errors?.password} />
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
            <SubmitButton>Create account</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
