'use client'

import { ArrowRightIcon } from 'lucide-react'
import * as React from 'react'
import { useActionState } from 'react'

import { FieldError, FormMessage, SubmitButton } from '@/components/form-parts'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { login } from '@/lib/actions/auth'
import type { FormState } from '@/lib/validation'

type DemoAccount = { email: string; role: string; blurb: string }

export function LoginForm({
  callbackUrl,
  demoAccounts = [],
  demoPassword,
}: {
  callbackUrl?: string
  demoAccounts?: DemoAccount[]
  demoPassword?: string
}) {
  const [state, action, busy] = useActionState<FormState | undefined, FormData>(
    login,
    undefined
  )

  const formRef = React.useRef<HTMLFormElement>(null)
  const emailRef = React.useRef<HTMLInputElement>(null)
  const passwordRef = React.useRef<HTMLInputElement>(null)

  // One click both fills and submits — the point of a demo account is to try
  // the product, not to practice typing its password.
  function signInAs(email: string) {
    if (!demoPassword) return
    if (emailRef.current) emailRef.current.value = email
    if (passwordRef.current) passwordRef.current.value = demoPassword
    formRef.current?.requestSubmit()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-5">
          <form ref={formRef} action={action} className="space-y-4">
            {callbackUrl ? (
              <input type="hidden" name="callbackUrl" value={callbackUrl} />
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                ref={emailRef}
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@parallax.agency"
                required
                aria-invalid={Boolean(state?.errors?.email)}
              />
              <FieldError messages={state?.errors?.email} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                ref={passwordRef}
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                aria-invalid={Boolean(state?.errors?.password)}
              />
              <FieldError messages={state?.errors?.password} />
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

      {demoAccounts.length > 0 ? (
        <div id="demo" className="scroll-mt-8 space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="h-px flex-1 bg-border" aria-hidden />
            <span className="text-[0.7rem] font-medium tracking-wide text-muted-foreground uppercase">
              Explore demo
            </span>
            <span className="h-px flex-1 bg-border" aria-hidden />
          </div>

          {/* Role cards, not credentials: one click fills the form and submits
              it, so nobody has to copy a password to look around. */}
          <div className="grid gap-1.5">
            {demoAccounts.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => signInAs(account.email)}
                disabled={busy}
                className="group flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 outline-none"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">
                    {account.role}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {account.blurb}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary">
                  Enter demo
                  <ArrowRightIcon className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
