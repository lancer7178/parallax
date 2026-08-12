import type { Metadata } from 'next'
import { ArrowRightIcon, CheckIcon } from 'lucide-react'
import Link from 'next/link'

import { AuthShell } from '@/components/marketing/auth-shell'

import { RegisterForm } from './register-form'

export const metadata: Metadata = {
  title: 'Create your account',
  description:
    'Create a Parallax client account to follow project progress, sign off deliverables and see your invoices.',
  // A sign-up form has nothing to rank for, and an indexed one only attracts
  // bots. The marketing page at `/` is the page that should be found.
  robots: { index: false, follow: true },
}

/** What the account they are about to create actually gets them. */
const INCLUDED = [
  'Live progress on every project you commission',
  'Approve deliverables or request changes in one place',
  'Every invoice and its payment status',
]

export default function RegisterPage() {
  return (
    <AuthShell
      headline="Follow the work, sign off the work, settle the bill."
      title="Create your account"
      description="Client access to your agency's workspace."
    >
      <RegisterForm />

      <div className="space-y-3 rounded-lg border border-border bg-card/60 p-4">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          What you get
        </p>
        <ul className="space-y-2">
          {INCLUDED.map((line) => (
            <li key={line} className="flex gap-2.5 text-sm text-muted-foreground">
              <CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
              {line}
            </li>
          ))}
        </ul>
        {/* Said plainly rather than discovered later: agency seats are not
            self-serve, and someone signing up expecting a team workspace
            should find that out here, not after creating an account. */}
        <p className="border-t border-border pt-3 text-xs text-muted-foreground">
          Agency accounts — developers, designers and admins — are created by an
          administrator from{' '}
          <span className="font-medium text-foreground">Team</span> inside the
          workspace.
        </p>
      </div>

      <div className="space-y-2 text-center text-sm">
        <p className="text-muted-foreground">
          Already have an account?{' '}
          <Link
            href="/login"
            className="rounded font-medium text-primary underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring outline-none"
          >
            Sign in
          </Link>
        </p>
        <p>
          <Link
            href="/demo"
            className="inline-flex items-center gap-1 rounded text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring outline-none"
          >
            Or look around the demo first
            <ArrowRightIcon className="size-3.5" />
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}
