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

const STAFF: Role[] = ['ADMIN', 'DEVELOPER', 'DESIGNER']

export const NAV_ITEMS: NavItem[] = [
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
]

export function navItemsFor(role: Role) {
  return NAV_ITEMS.filter((item) => item.roles.includes(role))
}

export function isActive(pathname: string, item: NavItem) {
  if (pathname === item.href) return true
  return Boolean(item.matchNested) && pathname.startsWith(`${item.href}/`)
}
