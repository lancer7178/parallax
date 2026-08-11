import {
  ArrowRightIcon,
  ClipboardCheckIcon,
  KanbanSquareIcon,
  LayoutDashboardIcon,
  LockIcon,
  ReceiptIcon,
  SearchIcon,
  TrendingUpIcon,
  UsersIcon,
  type LucideIcon,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import {
  DashboardPreview,
  PortalPreview,
  ProjectMoneyPreview,
} from '@/components/marketing/product-preview'
import { SiteNav } from '@/components/marketing/site-nav'
import { Button } from '@/components/ui/button'
import { getSessionUser } from '@/lib/dal'
import { homePathFor } from '@/lib/rbac'

const PILLARS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: KanbanSquareIcon,
    title: 'Deliver',
    body: 'Plan projects, run the board, and keep every task moving with an owner and a date.',
  },
  {
    icon: ReceiptIcon,
    title: 'Bill',
    body: 'Track budgets, raise invoices against the work, and watch what has actually been collected.',
  },
  {
    icon: UsersIcon,
    title: 'Collaborate',
    body: 'Give clients a clear view of progress and a straight answer on what needs their sign-off.',
  },
]

const FEATURES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: LayoutDashboardIcon,
    title: 'An attention centre, not a feed',
    body: 'Overdue invoices, late tasks, projects slipping and approvals waiting — one list, every item a link to the thing itself.',
  },
  {
    icon: TrendingUpIcon,
    title: 'Health you can explain',
    body: 'Projects are flagged by arithmetic, never a guess: budget 92% used at 76% complete says exactly why.',
  },
  {
    icon: ClipboardCheckIcon,
    title: 'Approvals as real objects',
    body: 'Send a deliverable, get an approval or written feedback back. Both sides read the same record.',
  },
  {
    icon: SearchIcon,
    title: 'Everything a keystroke away',
    body: 'Press ⌘K and search projects, clients, tasks and invoices at once, scoped to what you are allowed to see.',
  },
  {
    icon: LockIcon,
    title: 'Roles enforced at the data layer',
    body: 'Clients reach their own projects and nothing else. Permission checks live next to the queries, not in the buttons.',
  },
  {
    icon: ReceiptIcon,
    title: 'Money attached to work',
    body: 'Every invoice hangs off a project, so revenue, budget and delivery are never three separate stories.',
  },
]

export default async function LandingPage() {
  // A visitor with a session gets a route back into the product rather than a
  // second invitation to sign in.
  const user = await getSessionUser()
  const homePath = user ? homePathFor(user.role) : '/login'

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteNav signedIn={Boolean(user)} homePath={homePath} />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/60">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.35] mask-[radial-gradient(ellipse_at_top,black,transparent_70%)]"
            style={{
              backgroundImage:
                'linear-gradient(to right, var(--grid) 1px, transparent 1px), linear-gradient(to bottom, var(--grid) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />

          <div className="relative mx-auto w-full max-w-6xl px-4 pt-16 pb-12 sm:px-6 sm:pt-24">
            <div className="mx-auto max-w-3xl text-center">
              <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                The operating system for your agency
              </p>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                Run your agency from one workspace.
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-lg text-pretty text-muted-foreground">
                Projects, clients, invoices, and revenue — connected in one
                place.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button size="lg" asChild>
                  <Link href={user ? homePath : '/login'}>
                    {user ? 'Open workspace' : 'Start your workspace'}
                    <ArrowRightIcon />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/login#demo">Explore demo</Link>
                </Button>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                The demo signs you straight in as a developer, designer or
                client.
              </p>
            </div>

            <div className="mt-14 sm:mt-16">
              <DashboardPreview />
            </div>
          </div>
        </section>

        {/* Pillars */}
        <section id="product" className="border-b border-border/60 scroll-mt-16">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <h2 className="max-w-xl text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              Everything between brief and payment.
            </h2>

            <div className="mt-10 grid gap-8 sm:grid-cols-3">
              {PILLARS.map((pillar) => (
                <div key={pillar.title} className="space-y-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
                    <pillar.icon className="size-5" />
                  </span>
                  <h3 className="text-lg font-semibold">{pillar.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {pillar.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Client portal */}
        <section id="clients" className="border-b border-border/60 scroll-mt-16">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-16">
            <div className="space-y-5">
              <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                Clients see what matters.
              </h2>
              <p className="text-muted-foreground">
                The portal shows progress, deliverables, approvals and invoices
                — and none of your internal tasks, notes, workload or margins.
              </p>
              <ul className="space-y-3 text-sm">
                {[
                  'Progress on every project they are paying for',
                  'Deliverables waiting on their approval, with a place to say what needs changing',
                  'Invoices and payment status, nothing else from your books',
                ].map((line) => (
                  <li key={line} className="flex gap-2.5 text-muted-foreground">
                    <span
                      aria-hidden
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
                    />
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            <PortalPreview />
          </div>
        </section>

        {/* Project ↔ finance */}
        <section className="border-b border-border/60">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-16">
            <ProjectMoneyPreview className="order-last lg:order-first" />

            <div className="space-y-5">
              <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                Projects and money, finally connected.
              </h2>
              <p className="text-muted-foreground">
                Every invoice belongs to a project, so budget, billing and
                delivery sit on one page. When billing runs ahead of the work,
                Parallax says so — with the two numbers that prove it.
              </p>
              <p className="text-muted-foreground">
                No exports, no second spreadsheet, no reconciling the board
                against the books at month end.
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-b border-border/60 scroll-mt-16">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <h2 className="max-w-xl text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              Built for the way agencies actually work.
            </h2>

            <div className="mt-10 grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="space-y-2.5">
                  <feature.icon className="size-5 text-primary" />
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {feature.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section>
          <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                Less admin. More making.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Put delivery, clients and billing in the same workspace and stop
                reassembling the picture by hand.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button size="lg" asChild>
                  <Link href={user ? homePath : '/login'}>
                    {user ? 'Open workspace' : 'Start your workspace'}
                    <ArrowRightIcon />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/login#demo">Explore demo</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2.5">
            <Image
              src="/parallax-logo.png"
              alt=""
              width={24}
              height={24}
              className="size-6"
            />
            <span className="text-sm font-medium">Parallax</span>
          </div>
          <p className="text-xs text-muted-foreground">
            The operating system for your agency.
          </p>
          <Link
            href="/login"
            className="rounded text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring outline-none"
          >
            Sign in
          </Link>
        </div>
      </footer>
    </div>
  )
}
