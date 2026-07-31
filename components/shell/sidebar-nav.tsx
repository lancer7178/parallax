'use client'

import type { Role } from '@prisma/client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { isActive, navGroupsFor } from '@/components/shell/nav'
import { cn } from '@/lib/utils'

export function SidebarNav({ role }: { role: Role }) {
  const pathname = usePathname()
  const groups = navGroupsFor(role)
  // A single group needs no heading — the label would be noise.
  const showLabels = groups.length > 1

  return (
    <nav className="flex flex-1 flex-col gap-5 overflow-y-auto">
      {groups.map((group) => (
        <div key={group.label} className="space-y-1">
          {showLabels ? (
            <p className="px-3 pb-1 text-[0.68rem] font-semibold tracking-wider text-muted-foreground/70 uppercase">
              {group.label}
            </p>
          ) : null}

          {group.items.map((item) => {
            const active = isActive(pathname, item)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary/12 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                {/* Active rail: a second, non-colour cue for the current page. */}
                <span
                  aria-hidden
                  className={cn(
                    'absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-primary transition-opacity',
                    active ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <item.icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )
}
