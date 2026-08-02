import type { Role } from '@prisma/client'

// NOTE: `Role` is imported as a *type only*. Comparing against string literals
// keeps this module free of the Prisma runtime so client components (the
// sidebar, task board, …) can import it safely.

export const isStaff = (role: Role) => role !== 'CLIENT'

/** Revenue, budgets and invoices are agency-internal. */
export const canViewFinancials = (role: Role) => role === 'ADMIN'

/** Clients may read their own invoices even though they aren't "financials". */
export const canViewOwnInvoices = (role: Role) =>
  role === 'ADMIN' || role === 'CLIENT'

export const canManageProjects = (role: Role) => role === 'ADMIN'

export const canManageTasks = (role: Role) => role !== 'CLIENT'

export const canManageInvoices = (role: Role) => role === 'ADMIN'

export const canManageUsers = (role: Role) => role === 'ADMIN'

/** KPI targets shown on the dashboard are an agency-wide setting. */
export const canManageGoals = (role: Role) => role === 'ADMIN'

/** Where a user lands after signing in. */
export const homePathFor = (role: Role) =>
  role === 'CLIENT' ? '/portal' : '/dashboard'

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Admin',
  DEVELOPER: 'Developer',
  DESIGNER: 'Designer',
  CLIENT: 'Client',
}
