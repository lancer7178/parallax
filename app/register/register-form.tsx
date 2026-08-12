'use client'

import { useActionState } from 'react'

import { FieldError, FormMessage, SubmitButton } from '@/components/form-parts'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { register } from '@/lib/actions/auth'
import type { FormState } from '@/lib/validation'

export function RegisterForm() {
  const [state, action] = useActionState<FormState | undefined, FormData>(
    register,
    undefined
  )

  return (
    <Card>
      <CardContent className="pt-5">
        <form action={action} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              name="name"
              autoComplete="name"
              placeholder="Amina Farouk"
              required
              aria-invalid={Boolean(state?.errors?.name)}
              aria-describedby={state?.errors?.name ? 'name-error' : undefined}
            />
            <FieldError id="name-error" messages={state?.errors?.name} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Work email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              required
              aria-invalid={Boolean(state?.errors?.email)}
              aria-describedby={
                state?.errors?.email ? 'email-error' : undefined
              }
            />
            <FieldError id="email-error" messages={state?.errors?.email} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              aria-invalid={Boolean(state?.errors?.password)}
              aria-describedby="password-hint"
            />
            <p id="password-hint" className="text-xs text-muted-foreground">
              At least 8 characters, with a letter and a number.
            </p>
            <FieldError messages={state?.errors?.password} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              aria-invalid={Boolean(state?.errors?.confirmPassword)}
              aria-describedby={
                state?.errors?.confirmPassword ? 'confirm-error' : undefined
              }
            />
            <FieldError
              id="confirm-error"
              messages={state?.errors?.confirmPassword}
            />
          </div>

          {state?.message ? (
            <FormMessage ok={state.ok}>{state.message}</FormMessage>
          ) : null}

          <SubmitButton className="w-full" pendingLabel="Creating account…">
            Create account
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  )
}
