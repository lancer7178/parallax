import Image from 'next/image'
import Link from 'next/link'

import { ThemeToggle } from '@/components/shell/theme-toggle'
import { Button } from '@/components/ui/button'
import {
  LOCALES,
  LOCALE_LABEL,
  LOCALE_PATH,
  LOCALE_SHORT,
  type LandingDictionary,
  type Locale,
} from '@/lib/i18n'
import { cn } from '@/lib/utils'

/**
 * Switches which language the landing page is served in.
 *
 * Plain links to the other locale's path, not a client-side toggle: the two
 * versions are separate URLs so they can be shared, bookmarked and indexed,
 * and the choice survives without a cookie or any JavaScript.
 */
function LanguageSwitch({
  locale,
  label,
}: {
  locale: Locale
  label: string
}) {
  return (
    <nav
      aria-label={label}
      className="flex items-center rounded-lg border border-border bg-card p-0.5"
    >
      {LOCALES.map((option) => {
        const active = option === locale
        return (
          <Link
            key={option}
            href={LOCALE_PATH[option]}
            hrefLang={option}
            lang={option}
            aria-current={active ? 'true' : undefined}
            className={cn(
              'rounded-md px-2 py-1 text-xs font-medium transition-colors',
              active
                ? 'bg-primary/12 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <span aria-hidden>{LOCALE_SHORT[option]}</span>
            <span className="sr-only">{LOCALE_LABEL[option]}</span>
          </Link>
        )
      })}
    </nav>
  )
}

/**
 * Marketing header. `signedIn` swaps the two calls to action for a single way
 * back into the workspace — a signed-in visitor landing here wants their
 * dashboard, not a sign-in form.
 */
export function SiteNav({
  t,
  locale,
  signedIn,
  homePath,
}: {
  t: LandingDictionary['nav']
  locale: Locale
  signedIn: boolean
  homePath: string
}) {
  const links = [
    { href: '#product', label: t.sections.product },
    { href: '#clients', label: t.sections.clients },
    { href: '#features', label: t.sections.features },
  ]

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link
          href={LOCALE_PATH[locale]}
          className="flex items-center gap-2.5 rounded-lg focus-visible:ring-2 focus-visible:ring-ring outline-none"
        >
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
        </Link>

        <nav aria-label={t.sectionsLabel} className="hidden md:block">
          <ul className="flex items-center gap-6">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="rounded text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring outline-none"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* `ms-auto`, not `ml-auto`: the actions belong at the inline end,
            which is the left edge once the page flips to RTL. */}
        <div className="ms-auto flex items-center gap-2">
          <LanguageSwitch locale={locale} label={t.languageLabel} />
          <ThemeToggle />
          {signedIn ? (
            <Button size="sm" asChild>
              <Link href={homePath}>{t.openWorkspace}</Link>
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="hidden sm:inline-flex"
              >
                <Link href="/login">{t.signIn}</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/login">{t.start}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
