'use client'

import { MenuIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import * as React from 'react'

import { ThemeToggle } from '@/components/shell/theme-toggle'
import { Button } from '@/components/ui/button'
import { Sheet, SheetClose, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  LOCALE_LABEL,
  LOCALE_PATH,
  LOCALE_SHORT,
  type LandingDictionary,
  type Locale,
} from '@/lib/i18n'

/**
 * Switches which language the landing page is served in.
 *
 * A single button showing the *other* locale, not a two-option pill — one
 * tap toggles, and at 32×32 it sits next to the theme toggle at every
 * breakpoint instead of needing its own hidden/shown breakpoint logic. A
 * plain link to the other locale's path, not a client-side switch: the two
 * versions are separate URLs so they can be shared, bookmarked and indexed,
 * and the choice survives without a cookie or any JavaScript.
 */
function LanguageToggle({ locale }: { locale: Locale }) {
  const other: Locale = locale === 'en' ? 'ar' : 'en'

  return (
    // `outline`, not `ghost`: a plain glyph with no border only reads as a
    // button once you hover it, which a touch screen never does. The other
    // icon-sm controls next to it (theme, menu) get away with `ghost`
    // because an icon shape is recognizable on its own — bare text isn't.
    <Button variant="outline" size="icon-sm" asChild>
      <Link href={LOCALE_PATH[other]} hrefLang={other} lang={other}>
        <span aria-hidden className="text-xs font-semibold">
          {LOCALE_SHORT[other]}
        </span>
        <span className="sr-only">{LOCALE_LABEL[other]}</span>
      </Link>
    </Button>
  )
}

/**
 * Marketing header. `signedIn` swaps the two calls to action for a single way
 * back into the workspace — a signed-in visitor landing here wants their
 * dashboard, not a sign-in form.
 *
 * Below `md` the section links and sign-in link move into a `Sheet` drawer
 * behind a menu button — inline, they don't fit next to the primary CTA
 * without wrapping or forcing horizontal scroll. The language toggle and
 * theme toggle stay in the header at every width, since both are one tap and
 * neither needs the room a drawer buys. `t.startShort` exists for the same
 * space reason: the full "Start your workspace" label alone is wider than a
 * 320px phone has room for beside the logo and a menu button.
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
  const [menuOpen, setMenuOpen] = React.useState(false)

  const links = [
    { href: '#product', label: t.sections.product },
    { href: '#clients', label: t.sections.clients },
    { href: '#features', label: t.sections.features },
  ]

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:gap-6 sm:px-6">
        <Link
          href={LOCALE_PATH[locale]}
          className="flex min-w-0 items-center gap-2 rounded-lg focus-visible:ring-2 focus-visible:ring-ring outline-none sm:gap-2.5"
        >
          <Image
            src="/parallax-logo.png"
            alt=""
            width={32}
            height={32}
            className="size-7 shrink-0 sm:size-8"
            priority
          />
          {/* Below ~380px the language toggle, theme toggle, CTA and menu
              button already claim most of the row, so the wordmark is the
              first thing to go — the mark alone still reads as the brand,
              where a truncated "Parall…" reads as broken. */}
          <span className="hidden truncate text-[0.9rem] font-semibold tracking-tight min-[380px]:inline sm:text-[0.95rem]">
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
        <div className="ms-auto flex shrink-0 items-center gap-1 sm:gap-1.5">
          <LanguageToggle locale={locale} />
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
                className="hidden md:inline-flex"
              >
                <Link href="/login">{t.signIn}</Link>
              </Button>
              <Button size="sm" asChild>
                {/* Short label below `sm` — see the note above. */}
                <Link href="/register">
                  <span className="sm:hidden">{t.startShort}</span>
                  <span className="hidden sm:inline">{t.start}</span>
                </Link>
              </Button>
            </>
          )}

          {/* Section links and sign-in collapse into this drawer below `md`;
              language and theme stay in the header above, so they're never
              buried behind an extra tap. */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="md:hidden">
                <MenuIcon />
                <span className="sr-only">{t.menuLabel}</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side={locale === 'ar' ? 'right' : 'left'}
              title={t.menuLabel}
              description={t.sectionsLabel}
              className="md:hidden"
            >
              <Link
                href={LOCALE_PATH[locale]}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-lg focus-visible:ring-2 focus-visible:ring-ring outline-none"
              >
                <Image
                  src="/parallax-logo.png"
                  alt=""
                  width={28}
                  height={28}
                  className="size-7"
                />
                <span className="text-sm font-semibold tracking-tight">
                  Parallax
                </span>
              </Link>

              <nav aria-label={t.sectionsLabel}>
                <ul className="flex flex-col gap-1">
                  {links.map((link) => (
                    <li key={link.href}>
                      <SheetClose asChild>
                        <a
                          href={link.href}
                          className="block rounded-lg px-2 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring outline-none"
                        >
                          {link.label}
                        </a>
                      </SheetClose>
                    </li>
                  ))}
                </ul>
              </nav>

              {!signedIn ? (
                <div className="border-t border-border/60 pt-4">
                  <SheetClose asChild>
                    <Link
                      href="/login"
                      className="flex items-center justify-center rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring outline-none"
                    >
                      {t.signIn}
                    </Link>
                  </SheetClose>
                </div>
              ) : null}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
