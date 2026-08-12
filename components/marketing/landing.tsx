import {
  ArrowLeftIcon,
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
import { getDictionary, isRtl, LOCALE_PATH, type Locale } from '@/lib/i18n'
import { homePathFor } from '@/lib/rbac'
import { cn } from '@/lib/utils'

/**
 * The public landing page, in one locale.
 *
 * `dir` and `lang` are set on this wrapper rather than on `<html>` because the
 * root layout is shared with the workspace, which stays LTR English. Scoping
 * the direction here means the Arabic page flips completely — flex order, text
 * alignment, progress fills — without touching any signed-in route.
 */
export async function Landing({
  locale,
  className,
}: {
  locale: Locale
  className?: string
}) {
  const t = getDictionary(locale)
  const rtl = isRtl(locale)

  // A visitor with a session gets a route back into the product rather than a
  // second invitation to sign in.
  const user = await getSessionUser()
  const homePath = user ? homePathFor(user.role) : '/login'

  // Arrows are directional: pointing right in an RTL page would point back the
  // way the reader came from.
  const ArrowIcon = rtl ? ArrowLeftIcon : ArrowRightIcon
  const ctaLabel = user ? t.nav.openWorkspace : t.nav.start

  const pillars: { icon: LucideIcon; title: string; body: string }[] = [
    { icon: KanbanSquareIcon, ...t.pillars.deliver },
    { icon: ReceiptIcon, ...t.pillars.bill },
    { icon: UsersIcon, ...t.pillars.collaborate },
  ]

  const features: { icon: LucideIcon; title: string; body: string }[] = [
    { icon: LayoutDashboardIcon, ...t.features.attention },
    { icon: TrendingUpIcon, ...t.features.health },
    { icon: ClipboardCheckIcon, ...t.features.approvals },
    { icon: SearchIcon, ...t.features.search },
    { icon: LockIcon, ...t.features.roles },
    { icon: ReceiptIcon, ...t.features.money },
  ]

  const calls = (
    <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
      <Button size="lg" asChild>
        <Link href={user ? homePath : '/register'}>
          {ctaLabel}
          <ArrowIcon />
        </Link>
      </Button>
      <Button size="lg" variant="outline" asChild>
        <Link href="/demo">{t.hero.demo}</Link>
      </Button>
    </div>
  )

  return (
    <div
      lang={locale}
      dir={rtl ? 'rtl' : 'ltr'}
      className={cn('flex min-h-dvh flex-col', className)}
    >
      <SiteNav
        t={t.nav}
        locale={locale}
        signedIn={Boolean(user)}
        homePath={homePath}
      />

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
                {t.hero.eyebrow}
              </p>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                {t.hero.heading}
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-lg text-pretty text-muted-foreground">
                {t.hero.subheading}
              </p>

              {calls}

              <p className="mt-3 text-xs text-muted-foreground">
                {t.hero.demoHint}
              </p>
            </div>

            <div className="mt-14 sm:mt-16">
              <DashboardPreview t={t.preview} />
            </div>
          </div>
        </section>

        {/* Pillars */}
        <section id="product" className="border-b border-border/60 scroll-mt-16">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <h2 className="max-w-xl text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              {t.pillars.heading}
            </h2>

            <div className="mt-10 grid gap-8 sm:grid-cols-3">
              {pillars.map((pillar) => (
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
                {t.portal.heading}
              </h2>
              <p className="text-muted-foreground">{t.portal.body}</p>
              <ul className="space-y-3 text-sm">
                {t.portal.points.map((line) => (
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

            <PortalPreview t={t.preview} />
          </div>
        </section>

        {/* Project ↔ finance */}
        <section className="border-b border-border/60">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-16">
            <ProjectMoneyPreview
              t={t.preview}
              className="order-last lg:order-first"
            />

            <div className="space-y-5">
              <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                {t.money.heading}
              </h2>
              <p className="text-muted-foreground">{t.money.body}</p>
              <p className="text-muted-foreground">{t.money.extra}</p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-b border-border/60 scroll-mt-16">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <h2 className="max-w-xl text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              {t.features.heading}
            </h2>

            <div className="mt-10 grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
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
                {t.cta.heading}
              </h2>
              <p className="mt-4 text-muted-foreground">{t.cta.body}</p>
              {calls}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <Link
            href={LOCALE_PATH[locale]}
            className="flex items-center gap-2.5 rounded-lg focus-visible:ring-2 focus-visible:ring-ring outline-none"
          >
            <Image
              src="/parallax-logo.png"
              alt=""
              width={24}
              height={24}
              className="size-6"
            />
            <span className="text-sm font-medium">Parallax</span>
          </Link>
          <p className="text-xs text-muted-foreground">{t.footer.tagline}</p>
          <Link
            href="/login"
            className="rounded text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring outline-none"
          >
            {t.nav.signIn}
          </Link>
        </div>
      </footer>
    </div>
  )
}
