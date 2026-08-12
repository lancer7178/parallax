'use client'

import { ArrowRightIcon, EyeOffIcon, Loader2Icon } from 'lucide-react'
import { useActionState } from 'react'

import { FormMessage } from '@/components/form-parts'
import { enterDemo } from '@/lib/actions/auth'
import { DEMO_ACCOUNTS, DEMO_HIDDEN } from '@/lib/demo'
import type { FormState } from '@/lib/validation'

/**
 * Role cards, not credentials.
 *
 * Each card is its own form posting a slug to `enterDemo`, which resolves the
 * password on the server — nothing in this component knows it. Sharing one
 * `useActionState` across the three forms is deliberate: it disables the whole
 * set while any of them is in flight, so a second click during the redirect
 * cannot start a competing sign-in.
 */
export function DemoCards({ compact = false }: { compact?: boolean }) {
  const [state, action, busy] = useActionState<FormState | undefined, FormData>(
    enterDemo,
    undefined
  )

  return (
    <div className="space-y-3">
      <div className={compact ? 'grid gap-1.5' : 'grid gap-3 sm:grid-cols-3'}>
        {DEMO_ACCOUNTS.map((account) => (
          <form key={account.slug} action={action}>
            <input type="hidden" name="slug" value={account.slug} />
            <button
              type="submit"
              disabled={busy}
              className={
                compact
                  ? 'group flex w-full items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 outline-none'
                  : 'group flex h-full w-full flex-col gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 outline-none'
              }
            >
              {compact ? (
                <>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">
                      {account.label}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {account.blurb}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary">
                    Enter demo
                    <ArrowRightIcon className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
                  </span>
                </>
              ) : (
                <>
                  <span className="space-y-1">
                    <span className="block font-medium">{account.label}</span>
                    <span className="block text-sm text-muted-foreground">
                      {account.blurb}
                    </span>
                  </span>

                  <span className="flex flex-wrap gap-1.5">
                    {account.sees.map((item) => (
                      <span
                        key={item}
                        className="rounded-md bg-muted px-1.5 py-0.5 text-[0.7rem] font-medium text-muted-foreground"
                      >
                        {item}
                      </span>
                    ))}
                  </span>

                  {/* The boundary is the point of the demo, so it is stated on
                      the card rather than discovered by poking at the nav. */}
                  <span className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <EyeOffIcon className="mt-0.5 size-3.5 shrink-0" />
                    {DEMO_HIDDEN[account.role]}
                  </span>

                  <span className="mt-auto flex items-center gap-1 pt-1 text-sm font-medium text-primary">
                    Enter demo
                    <ArrowRightIcon className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                  </span>
                </>
              )}
            </button>
          </form>
        ))}
      </div>

      {busy ? (
        <p
          role="status"
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
        >
          <Loader2Icon className="size-4 animate-spin" />
          Opening the demo workspace…
        </p>
      ) : null}

      {state?.message ? (
        <FormMessage ok={state.ok}>{state.message}</FormMessage>
      ) : null}
    </div>
  )
}
