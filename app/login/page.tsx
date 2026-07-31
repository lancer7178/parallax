import type { Metadata } from 'next'
import { LayersIcon, ShieldCheckIcon, TerminalIcon } from 'lucide-react'

import { LoginForm } from './login-form'

export const metadata: Metadata = { title: 'Sign in' }

/**
 * Shown on the sign-in card so reviewers can try each role. The private admin
 * account is intentionally absent — keep it that way.
 */
const DEMO_ACCOUNTS: { email: string; role: string }[] = [
  { email: 'abdulatef@parallax.agency', role: 'Developer' },
  { email: 'nova@parallax.agency', role: 'Designer' },
  { email: 'ops@helios-retail.com', role: 'Client' },
]

/** Optional. Set it to give people a way to request access. */
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL

export default async function LoginPage(props: PageProps<'/login'>) {
  const { callbackUrl } = await props.searchParams
  const target = typeof callbackUrl === 'string' ? callbackUrl : undefined

  return (
    <main className="flex flex-1 items-center justify-center bg-muted/40 px-4 py-12">
      {/* max-w-md rather than max-w-sm: the access notes below the form need
          the extra measure to stay readable. */}
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <LayersIcon className="size-5" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Parallax</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to your agency workspace.
          </p>
        </div>

        <LoginForm callbackUrl={target} />

        {/* Demo logins are read-only-ish roles on purpose. The admin account
            is private and is never advertised here. */}
        {DEMO_ACCOUNTS.length > 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card/60 p-4 text-xs text-muted-foreground">
            <p className="mb-2 font-medium text-foreground">Demo accounts</p>
            <ul className="space-y-1">
              {DEMO_ACCOUNTS.map((account) => (
                <li key={account.email}>
                  <code className="font-mono">{account.email}</code> —{' '}
                  {account.role}
                </li>
              ))}
            </ul>
            <p className="mt-2">
              Password: <code className="font-mono">Parallax!2026</code>
            </p>
          </div>
        ) : null}

        <div className="rounded-lg border border-border bg-card/60 p-4 text-xs text-muted-foreground">
          <p className="mb-2 flex items-center gap-1.5 font-medium text-foreground">
            <ShieldCheckIcon className="size-3.5" />
            Administrator access
          </p>
          <p>
            Admin accounts are private. They are never listed on this page and
            cannot be self-registered.
          </p>

          <ul className="mt-2 list-disc space-y-1 pl-4">
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
            <div className="mt-3 rounded-md border border-border bg-muted/50 p-2.5">
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
      </div>
    </main>
  )
}
