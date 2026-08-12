'use client'

import { useActionState } from 'react'

import { FieldError, FormMessage, SubmitButton } from '@/components/form-parts'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { login } from '@/lib/actions/auth'
import type { FormState } from '@/lib/validation'

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, action] = useActionState<FormState | undefined, FormData>(
    login,
    undefined
  )

  return (
    <Card>
      <CardContent className="pt-5">
        <form action={action} className="space-y-4">
          {callbackUrl ? (
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@parallax.agency"
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
              autoComplete="current-password"
              required
              aria-invalid={Boolean(state?.errors?.password)}
              aria-describedby={
                state?.errors?.password ? 'password-error' : undefined
              }
            />
            <FieldError
              id="password-error"
              messages={state?.errors?.password}
            />
          </div>

          {state?.message ? (
            <FormMessage ok={state.ok}>{state.message}</FormMessage>
          ) : null}

          <SubmitButton className="w-full" pendingLabel="Signing in…">
            Sign in
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  )
}
