import Image from 'next/image'
import Link from 'next/link'

import { ThemeToggle } from '@/components/shell/theme-toggle'
import { Button } from '@/components/ui/button'

const LINKS = [
  { href: '#product', label: 'Product' },
  { href: '#clients', label: 'Client portal' },
  { href: '#features', label: 'Features' },
]

/**
 * Marketing header. `signedIn` swaps the two calls to action for a single way
 * back into the workspace — a signed-in visitor landing here wants their
 * dashboard, not a sign-in form.
 */
export function SiteNav({ signedIn, homePath }: { signedIn: boolean; homePath: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link
          href="/"
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

        <nav aria-label="Sections" className="hidden md:block">
          <ul className="flex items-center gap-6">
            {LINKS.map((link) => (
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

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {signedIn ? (
            <Button size="sm" asChild>
              <Link href={homePath}>Open workspace</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/login">Start your workspace</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
