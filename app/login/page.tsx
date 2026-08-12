import type { Metadata } from 'next'
import { ShieldCheckIcon, TerminalIcon } from 'lucide-react'
import Link from 'next/link'

import { AuthShell } from '@/components/marketing/auth-shell'
import { DemoCards } from '@/components/marketing/demo-cards'

import { LoginForm } from './login-form'

export const metadata: Metadata = { title: 'Sign in' }

/** Optional. Set it to give people a way to request access. */
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL

export default async function LoginPage(props: PageProps<'/login'>) {
  const { callbackUrl } = await props.searchParams
  const target = typeof callbackUrl === 'string' ? callbackUrl : undefined

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to your agency workspace."
    >
      <LoginForm callbackUrl={target} />

      <p className="text-center text-sm text-muted-foreground">
        No account yet?{' '}
        <Link
          href="/register"
          className="rounded font-medium text-primary underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring outline-none"
        >
          Create one
        </Link>
      </p>

      {/* Role cards, not credentials: one click signs in on the server, so
          nobody has to copy a password to look around. */}
      <div id="demo" className="scroll-mt-8 space-y-2.5">
        <div className="flex items-center gap-2">
          <span className="h-px flex-1 bg-border" aria-hidden />
          <span className="text-[0.7rem] font-medium tracking-wide text-muted-foreground uppercase">
            Explore demo
          </span>
          <span className="h-px flex-1 bg-border" aria-hidden />
        </div>

        <DemoCards compact />

        <p className="text-center text-xs text-muted-foreground">
          <Link
            href="/demo"
            className="rounded underline-offset-4 hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring outline-none"
          >
            What each role can see →
          </Link>
        </p>
      </div>

      <details className="group rounded-lg border border-border bg-card/60 text-xs text-muted-foreground [&_summary::-webkit-details-marker]:hidden">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 p-3 font-medium text-foreground">
          <ShieldCheckIcon className="size-3.5" />
          Administrator access
          <span className="ml-auto text-muted-foreground transition-transform group-open:rotate-180">
            ⌄
          </span>
        </summary>

        <div className="space-y-2 px-3 pb-3">
          <p>
            Admin accounts are private. They are never listed on this page and
            cannot be self-registered.
          </p>

          <ul className="list-disc space-y-1 pl-4">
            <li>
              <span className="text-foreground">Already have one?</span> Sign in
              above with your admin email and password.
            </li>
            <li>
              <span className="text-foreground">Need one?</span> Ask an existing
              administrator to add you from{' '}
              <span className="font-medium text-foreground">
                Team → Add member
              </span>
              .
            </li>
            {SUPPORT_EMAIL ? (
              <li>
                Or email{' '}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  {SUPPORT_EMAIL}
                </a>
                .
              </li>
            ) : null}
          </ul>

          {/* Bootstrap instructions are for whoever runs the project locally;
              they would be noise (and a hint about tooling) in production. */}
          {process.env.NODE_ENV !== 'production' ? (
            <div className="rounded-md border border-border bg-muted/50 p-2.5">
              <p className="mb-1.5 flex items-center gap-1.5 font-medium text-foreground">
                <TerminalIcon className="size-3.5" />
                First admin, or lost the password?
              </p>
              <code className="block overflow-x-auto rounded bg-background px-2 py-1.5 font-mono text-[0.7rem] whitespace-nowrap">
                npm run admin:password -- &lt;email&gt;
              </code>
              <p className="mt-1.5">
                Prints a new password once. Shown in development only.
              </p>
            </div>
          ) : null}
        </div>
      </details>
    </AuthShell>
  )
}
