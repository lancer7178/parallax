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

/**
 * Money *on a project they can already reach*: the agency sees the whole book,
 * a client sees the bill for their own engagement, and delivery roles see
 * neither. Distinct from `canViewFinancials`, which gates agency-wide revenue.
 */
export const canViewProjectMoney = (role: Role) =>
  role === 'ADMIN' || role === 'CLIENT'

/** Only the client on a project may accept or reject a deliverable. */
export const canDecideApprovals = (role: Role) => role === 'CLIENT'

/** Staff send deliverables for sign-off; clients never create their own. */
export const canRequestApprovals = (role: Role) => role !== 'CLIENT'

/**
 * Who can attach a file to a project or remove one. Clients read the files
 * shared with them but never add to the project themselves — the filter that
 * decides *which* files they read lives in `lib/queries.ts`.
 */
export const canManageFiles = (role: Role) => role !== 'CLIENT'

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
