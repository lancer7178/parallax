import type { Metadata } from 'next'
import { ArrowRightIcon, RotateCcwIcon, ShieldCheckIcon } from 'lucide-react'
import Link from 'next/link'

import { AuthShell } from '@/components/marketing/auth-shell'
import { DemoCards } from '@/components/marketing/demo-cards'

export const metadata: Metadata = {
  title: 'Explore the demo',
  description:
    'Sign in to the Parallax demo workspace as a developer, a designer or a client and see how the same data looks to each role.',
}

export default function DemoPage() {
  return (
    <AuthShell
      headline="The same agency, seen from three sides."
      title="Explore the demo"
      description="Pick a role and you're in — no sign-up, no credentials to copy."
      contentClassName="max-w-3xl"
    >
      <DemoCards />

      <div className="grid gap-3 sm:grid-cols-2">
        <p className="flex items-start gap-2.5 rounded-lg border border-border bg-card/60 p-3 text-xs text-muted-foreground">
          <ShieldCheckIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <span>
            Each role is enforced in the data layer, not by hiding buttons. The
            client account cannot read agency finances even by editing the URL.
          </span>
        </p>
        <p className="flex items-start gap-2.5 rounded-lg border border-border bg-card/60 p-3 text-xs text-muted-foreground">
          <RotateCcwIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <span>
            The demo is a shared, live workspace. Anything you change is real
            and stays until the data is reseeded — so go ahead and change it.
          </span>
        </p>
      </div>

      <div className="space-y-2 text-center text-sm">
        <p className="text-muted-foreground">
          Want your own?{' '}
          <Link
            href="/register"
            className="rounded font-medium text-primary underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring outline-none"
          >
            Create an account
          </Link>
        </p>
        <p>
          <Link
            href="/login"
            className="inline-flex items-center gap-1 rounded text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring outline-none"
          >
            Sign in with your own credentials
            <ArrowRightIcon className="size-3.5" />
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}
