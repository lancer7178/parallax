import type { Metadata } from 'next'
import {
  BuildingIcon,
  KanbanSquareIcon,
  ReceiptIcon,
  ShieldCheckIcon,
  TerminalIcon,
} from 'lucide-react'
import Image from 'next/image'

import { ThemeToggle } from '@/components/shell/theme-toggle'

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
const DEMO_PASSWORD = 'Parallax!2026'

const FEATURES = [
  {
    icon: KanbanSquareIcon,
    title: 'Deliver',
    description: 'Kanban boards and task tracking for every engagement.',
  },
  {
    icon: ReceiptIcon,
    title: 'Bill',
    description: 'Invoices, budgets and revenue in one financial view.',
  },
  {
    icon: BuildingIcon,
    title: 'Collaborate',
    description: 'A dedicated portal keeps clients in the loop automatically.',
  },
]

/** Optional. Set it to give people a way to request access. */
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL

export default async function LoginPage(props: PageProps<'/login'>) {
  const { callbackUrl } = await props.searchParams
  const target = typeof callbackUrl === 'string' ? callbackUrl : undefined

  return (
    <main className="flex min-h-dvh flex-1">
      {/* Brand panel — the sign-in form carries the page below lg, so this is
          purely additive: product context for a first-time visitor. */}
      <div className="relative hidden w-[42%] shrink-0 flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex xl:p-14">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle, currentColor 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />
        {/* Both glows only ever lighten, never darken — dark mode's
            primary-foreground is a dark colour that depends on the flat
            primary tone underneath it for contrast, so they're kept clear
            of the text column entirely (right-side corners only). */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 size-80 rounded-full bg-white/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -bottom-24 size-96 rounded-full bg-white/10 blur-3xl"
        />

        <div className="relative flex items-center gap-2.5">
          <Image
            src="/parallax-logo.png"
            alt=""
            width={32}
            height={32}
            className="size-8"
            priority
          />
          <span className="text-[0.95rem] font-semibold tracking-tight">
            Parallax
          </span>
        </div>

        <div className="relative max-w-md space-y-9">
          <h2 className="text-3xl leading-tight font-semibold text-balance">
            Everything your agency needs, in one workspace.
          </h2>

          <ul className="space-y-5">
            {FEATURES.map((feature) => (
              <li key={feature.title} className="flex items-start gap-3.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <feature.icon className="size-4.5" />
                </span>
                <div className="space-y-0.5 pt-1">
                  <p className="font-medium">{feature.title}</p>
                  <p className="text-sm text-primary-foreground/70">
                    {feature.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-primary-foreground/60">
          Client communication, project delivery and agency finances — one
          dashboard.
        </p>
      </div>

      {/* Sign-in panel */}
      <div className="flex flex-1 flex-col bg-background">
        <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:justify-end">
          <div className="flex items-center gap-2 lg:hidden">
            <Image
              src="/parallax-logo.png"
              alt=""
              width={28}
              height={28}
              className="size-7"
              priority
            />
            <span className="text-sm font-semibold tracking-tight">
              Parallax
            </span>
          </div>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
          <div className="w-full max-w-sm space-y-7">
            <div className="space-y-1.5">
              <h1 className="text-2xl font-semibold tracking-tight">
                Welcome back
              </h1>
              <p className="text-sm text-muted-foreground">
                Sign in to your agency workspace.
              </p>
            </div>

            <LoginForm
              callbackUrl={target}
              demoAccounts={DEMO_ACCOUNTS}
              demoPassword={DEMO_PASSWORD}
            />

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
                  Admin accounts are private. They are never listed on this
                  page and cannot be self-registered.
                </p>

                <ul className="list-disc space-y-1 pl-4">
                  <li>
                    <span className="text-foreground">Already have one?</span>{' '}
                    Sign in above with your admin email and password.
                  </li>
                  <li>
                    <span className="text-foreground">Need one?</span> Ask an
                    existing administrator to add you from{' '}
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

                {/* Bootstrap instructions are for whoever runs the project
                    locally; they would be noise (and a hint about tooling) in
                    production. */}
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
          </div>
        </div>
      </div>
    </main>
  )
}
