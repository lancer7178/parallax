import {
  BuildingIcon,
  KanbanSquareIcon,
  ReceiptIcon,
  type LucideIcon,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import * as React from 'react'

import { ThemeToggle } from '@/components/shell/theme-toggle'
import { cn } from '@/lib/utils'

/**
 * The two-panel frame shared by `/login`, `/register` and `/demo`.
 *
 * Extracted so the three entry points cannot drift apart: they are one moment
 * in the product, and a visitor moving between them should not feel the page
 * change shape underneath them. The brand panel is additive — it is hidden
 * below `lg`, where the form carries the page on its own.
 */

const PILLARS: { icon: LucideIcon; title: string; description: string }[] = [
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

function BrandPanel({ headline }: { headline: string }) {
  return (
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

      <Link
        href="/"
        className="relative flex items-center gap-2.5 rounded-lg focus-visible:ring-2 focus-visible:ring-white/60 outline-none"
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

      <div className="relative max-w-md space-y-9">
        <h2 className="text-3xl leading-tight font-semibold text-balance">
          {headline}
        </h2>

        <ul className="space-y-5">
          {PILLARS.map((pillar) => (
            <li key={pillar.title} className="flex items-start gap-3.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                <pillar.icon className="size-4.5" />
              </span>
              <div className="space-y-0.5 pt-1">
                <p className="font-medium">{pillar.title}</p>
                <p className="text-sm text-primary-foreground/70">
                  {pillar.description}
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
  )
}

export function AuthShell({
  headline = 'Everything your agency needs, in one workspace.',
  title,
  description,
  contentClassName,
  children,
}: {
  /** Copy on the brand panel. Defaults to the product's own line. */
  headline?: string
  title: string
  description: string
  /** Widen the column for pages that are not a single form. */
  contentClassName?: string
  children: React.ReactNode
}) {
  return (
    <main className="flex min-h-dvh flex-1">
      <BrandPanel headline={headline} />

      <div className="flex min-w-0 flex-1 flex-col bg-background">
        <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:justify-end">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg focus-visible:ring-2 focus-visible:ring-ring outline-none lg:hidden"
          >
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
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
          {/* `min-w-0`: this column is a flex item, so without it a single
              unwrappable descendant (long `overflow-x-auto` code snippet, an
              untruncated string) can force the item to its content's natural
              width instead of shrinking to fit a narrow phone — the classic
              flexbox min-width:auto blowout. */}
          <div
            className={cn('w-full min-w-0 max-w-sm space-y-7', contentClassName)}
          >
            <div className="space-y-1.5">
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>

            {children}
          </div>
        </div>
      </div>
    </main>
  )
}
