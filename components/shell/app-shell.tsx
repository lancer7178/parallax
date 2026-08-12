'use client'

import { LogOutIcon, MenuIcon, SettingsIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as React from 'react'

import { CommandPalette } from '@/components/shell/command-palette'
import { sectionLabelFor } from '@/components/shell/nav'
import { Notifications } from '@/components/shell/notifications'
import { SidebarNav } from '@/components/shell/sidebar-nav'
import { ThemeToggle } from '@/components/shell/theme-toggle'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { UserAvatar } from '@/components/user-avatar'
import { logout } from '@/lib/actions/auth'
import type { SessionUser } from '@/lib/dal'
import { ROLE_LABELS } from '@/lib/rbac'

function Brand() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 rounded-lg px-1 py-1 focus-visible:ring-2 focus-visible:ring-ring outline-none"
    >
      <Image
        src="/parallax-logo.png"
        alt=""
        width={32}
        height={32}
        className="size-8 shrink-0"
        priority
      />
      <span className="text-[0.95rem] leading-tight font-semibold tracking-tight">
        Parallax
        <span className="block text-[0.7rem] font-normal text-muted-foreground">
          Agency Workspace
        </span>
      </span>
    </Link>
  )
}

function UserMenu({ user }: { user: SessionUser }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-full p-0.5 pr-1 transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring sm:pr-2.5 outline-none"
        >
          <UserAvatar name={user.name} avatarUrl={user.image} />
          <span className="hidden text-sm font-medium sm:block">
            {user.name}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel className="font-normal">
          <span className="block font-medium">{user.name}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {user.email}
          </span>
          <span className="mt-1.5 inline-flex rounded-full bg-primary/12 px-2 py-0.5 text-[0.7rem] font-medium text-primary">
            {ROLE_LABELS[user.role]}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <SettingsIcon />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={logout}>
          <DropdownMenuItem asChild variant="destructive">
            <button type="submit" className="w-full">
              <LogOutIcon />
              Sign out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Identity block pinned to the bottom of the sidebar — links to Settings. */
function SidebarFooter({ user }: { user: SessionUser }) {
  return (
    <div className="mt-auto border-t border-border/60 pt-3">
      <Link
        href="/settings"
        className="flex items-center gap-2.5 rounded-xl border border-transparent p-2 transition-colors hover:border-border/60 hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring outline-none"
      >
        <UserAvatar name={user.name} avatarUrl={user.image} className="size-8" />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {ROLE_LABELS[user.role]}
          </p>
        </div>
      </Link>
    </div>
  )
}

export function AppShell({
  user,
  attentionCount,
  children,
}: {
  user: SessionUser
  /** Badge value for the bell, computed per navigation by the layout. */
  attentionCount: number
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const section = sectionLabelFor(pathname, user.role)

  // Close the drawer whenever the route changes. Adjusting state during render
  // (rather than in an effect) avoids a second paint with the drawer still up.
  const [lastPath, setLastPath] = React.useState(pathname)
  if (lastPath !== pathname) {
    setLastPath(pathname)
    setMobileOpen(false)
  }

  return (
    <div className="flex h-dvh flex-1 bg-muted/30 lg:gap-3 lg:p-3">
      {/* Desktop sidebar — its own floating panel, sized and shadowed to
          match the content pane so the two read as a pair. Sticky and
          independently scrollable so the nav stays reachable on long pages. */}
      <aside className="sticky top-0 hidden h-full w-60 shrink-0 flex-col gap-5 rounded-3xl border border-border/60 bg-card px-3 py-4 shadow-sm lg:flex">
        <Brand />
        <SidebarNav role={user.role} />
        <SidebarFooter user={user} />
      </aside>

      <div className="relative flex min-w-0 flex-1 flex-col lg:rounded-3xl border-0 lg:border border-border/60 bg-card lg:shadow-sm overflow-hidden">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border/40 bg-card/90 px-4 backdrop-blur-md sm:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="lg:hidden">
                <MenuIcon />
                <span className="sr-only">Open navigation</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              title="Navigation"
              description="Move between sections of the workspace."
              className="lg:hidden"
            >
              <Brand />
              <SidebarNav role={user.role} />
              <SidebarFooter user={user} />
            </SheetContent>
          </Sheet>

          {/* The brand is only in the sidebar on desktop, so mobile gets it
              here instead. */}
          <span className="lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/parallax-logo.png"
                alt=""
                width={28}
                height={28}
                className="size-7 shrink-0"
              />
              <span className="text-sm font-semibold tracking-tight">
                Parallax
              </span>
            </Link>
          </span>

          {section ? (
            <span className="hidden text-sm font-medium text-muted-foreground lg:block">
              {section}
            </span>
          ) : null}

          <div className="ml-auto flex items-center gap-1.5">
            <CommandPalette role={user.role} />
            <Notifications initialCount={attentionCount} />
            <ThemeToggle />
            <UserMenu user={user} />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 scrollbar-thin">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
