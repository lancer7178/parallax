'use client'

import { useActionState } from 'react'
import { toast } from 'sonner'

import { FieldError, FormMessage, SubmitButton } from '@/components/form-parts'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { updateAccount } from '@/lib/actions/account'
import type { SessionUser } from '@/lib/dal'
import { ROLE_LABELS } from '@/lib/rbac'
import type { FormState } from '@/lib/validation'

export function AccountForm({ user }: { user: SessionUser }) {
  const [state, action] = useActionState<FormState | undefined, FormData>(
    async (previous, formData) => {
      const result = await updateAccount(previous, formData)
      if (result?.ok) toast.success(result.message ?? 'Account updated.')
      return result
    },
    undefined
  )

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between">
        <div>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Your name, sign-in email and password.
          </CardDescription>
        </div>
        <Badge tone={user.role === 'ADMIN' ? 'info' : 'neutral'}>
          {ROLE_LABELS[user.role]}
        </Badge>
      </CardHeader>

      <form action={action}>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="account-name">Name</Label>
              <Input
                id="account-name"
                name="name"
                defaultValue={user.name}
                required
                aria-invalid={Boolean(state?.errors?.name)}
              />
              <FieldError messages={state?.errors?.name} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="account-email">Email</Label>
              <Input
                id="account-email"
                name="email"
                type="email"
                defaultValue={user.email}
                required
                aria-invalid={Boolean(state?.errors?.email)}
              />
              <FieldError messages={state?.errors?.email} />
            </div>
          </div>

          <Separator />

          <div className="space-y-1">
            <p className="text-sm font-medium">Change password</p>
            <p className="text-xs text-muted-foreground">
              Leave both fields blank to keep your current password.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="account-current-password">
                Current password
              </Label>
              <Input
                id="account-current-password"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                aria-invalid={Boolean(state?.errors?.currentPassword)}
              />
              <FieldError messages={state?.errors?.currentPassword} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="account-new-password">New password</Label>
              <Input
                id="account-new-password"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                aria-invalid={Boolean(state?.errors?.newPassword)}
              />
              <FieldError messages={state?.errors?.newPassword} />
            </div>
          </div>

          {state?.message ? (
            <FormMessage ok={state.ok}>{state.message}</FormMessage>
          ) : null}
        </CardContent>

        <CardFooter className="justify-end border-t border-border pt-5">
          <SubmitButton>Save changes</SubmitButton>
        </CardFooter>
      </form>
    </Card>
  )
}
