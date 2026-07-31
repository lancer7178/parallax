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
        <div key={group.label} className="space-y-0.5">
          {showLabels ? (
            <p className="px-3 pb-1.5 text-[0.65rem] font-semibold tracking-widest text-muted-foreground/70 uppercase">
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
                  'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-150',
                  active
                    ? 'bg-primary/10 font-semibold text-primary'
                    : 'font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                )}
              >
                {/* Active rail: a second, non-colour cue for the current page. */}
                <span
                  aria-hidden
                  className={cn(
                    'absolute inset-y-1.5 left-0 w-0.75 rounded-full bg-primary transition-opacity duration-150',
                    active ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <item.icon
                  className={cn(
                    'size-4 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5',
                    !active && 'text-muted-foreground/80 group-hover:text-foreground'
                  )}
                />
                {item.label}
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )
}
