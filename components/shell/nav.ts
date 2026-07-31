import type { Role } from '@prisma/client'
import {
  BriefcaseIcon,
  BuildingIcon,
  KanbanSquareIcon,
  LayoutDashboardIcon,
  ReceiptIcon,
  UsersIcon,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  roles: Role[]
  /** Highlight the item for `/projects/abc` as well as `/projects`. */
  matchNested?: boolean
}

export type NavGroup = {
  label: string
  items: NavItem[]
}

const STAFF: Role[] = ['ADMIN', 'DEVELOPER', 'DESIGNER']

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Delivery',
    items: [
      {
        href: '/dashboard',
        label: 'Dashboard',
        icon: LayoutDashboardIcon,
        roles: STAFF,
      },
      {
        href: '/portal',
        label: 'Overview',
        icon: LayoutDashboardIcon,
        roles: ['CLIENT'],
        matchNested: true,
      },
      {
        href: '/projects',
        label: 'Projects',
        icon: BriefcaseIcon,
        roles: STAFF,
        matchNested: true,
      },
      {
        href: '/tasks',
        label: 'Tasks',
        icon: KanbanSquareIcon,
        roles: STAFF,
      },
    ],
  },
  {
    label: 'Business',
    items: [
      {
        href: '/invoices',
        label: 'Invoices',
        icon: ReceiptIcon,
        roles: ['ADMIN', 'CLIENT'],
      },
      {
        href: '/clients',
        label: 'Clients',
        icon: BuildingIcon,
        roles: ['ADMIN'],
      },
      {
        href: '/team',
        label: 'Team',
        icon: UsersIcon,
        roles: ['ADMIN'],
      },
    ],
  },
]

/** Groups visible to `role`, with empty groups dropped. */
export function navGroupsFor(role: Role): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.roles.includes(role)),
  })).filter((group) => group.items.length > 0)
}

export function isActive(pathname: string, item: NavItem) {
  if (pathname === item.href) return true
  return Boolean(item.matchNested) && pathname.startsWith(`${item.href}/`)
}

/**
 * Label for the section the user is currently in — shown in the top bar, where
 * it gives context that the page's own heading often doesn't (the dashboard
 * heading is a greeting, not a section name).
 */
export function sectionLabelFor(pathname: string, role: Role) {
  for (const group of navGroupsFor(role)) {
    for (const item of group.items) {
      if (isActive(pathname, item)) return item.label
    }
  }
  return undefined
}
