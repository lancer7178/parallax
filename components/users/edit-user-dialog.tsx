'use client'

import type { Role } from '@prisma/client'
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
import { updateUser } from '@/lib/actions/users'
import { ROLE_LABELS } from '@/lib/rbac'
import type { FormState } from '@/lib/validation'

export function EditUserDialog({
  open,
  onOpenChange,
  user,
  roles,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: { id: string; name: string; email: string; role: Role }
  roles: Role[]
}) {
  const [state, action] = useActionState<FormState | undefined, FormData>(
    async (previous, formData) => {
      const result = await updateUser(previous, formData)
      if (result?.ok) {
        toast.success(result.message ?? 'Account updated.')
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
          <DialogTitle>Edit {user.name}</DialogTitle>
          <DialogDescription>
            Update account details. Leave the password blank to keep it
            unchanged.
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="space-y-4">
          <input type="hidden" name="userId" value={user.id} />

          <div className="space-y-1.5">
            <Label htmlFor="edit-user-name">Name</Label>
            <Input
              id="edit-user-name"
              name="name"
              defaultValue={user.name}
              required
              aria-invalid={Boolean(state?.errors?.name)}
            />
            <FieldError messages={state?.errors?.name} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-user-email">Email</Label>
            <Input
              id="edit-user-email"
              name="email"
              type="email"
              defaultValue={user.email}
              required
              aria-invalid={Boolean(state?.errors?.email)}
            />
            <FieldError messages={state?.errors?.email} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-user-role">Role</Label>
              <select
                id="edit-user-role"
                name="role"
                defaultValue={user.role}
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
              <Label htmlFor="edit-user-password">New password</Label>
              <Input
                id="edit-user-password"
                name="password"
                type="text"
                placeholder="Leave blank to keep current"
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
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <SubmitButton>Save changes</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
