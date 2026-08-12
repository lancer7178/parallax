import type { Role } from '@prisma/client'

// Type-only Prisma import — see the note in `lib/rbac.ts`.

/**
 * The accounts offered for one-click demo sign-in, described by what the role
 * *does* rather than by its credentials. Nobody evaluating the product wants
 * to copy a password out of a page.
 *
 * The password is deliberately **not** here. `enterDemo` in
 * `lib/actions/auth.ts` reads it from the server environment and signs in on
 * the server, so it never reaches the browser — the client only ever sends a
 * slug from this list.
 *
 * `Exclude<Role, 'ADMIN'>` is the point of the type: adding the admin account
 * to this list is a compile error rather than a silent privilege grant, the
 * same guard `prisma/seed.ts` uses.
 */
export type DemoAccount = {
  /** URL- and form-safe id. The only thing the client ever sends. */
  slug: string
  email: string
  role: Exclude<Role, 'ADMIN'>
  label: string
  /** One line on what this role is for. */
  blurb: string
  /** What the role can reach, shown on `/demo`. */
  sees: string[]
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    slug: 'developer',
    email: 'abdulatef@parallax.agency',
    role: 'DEVELOPER',
    label: 'Developer',
    blurb: 'Assigned projects, the task board and delivery work.',
    sees: ['Dashboard', 'Projects', 'Task board', 'Approvals'],
  },
  {
    slug: 'designer',
    email: 'sara@parallax.agency',
    role: 'DESIGNER',
    label: 'Designer',
    blurb: 'Creative work, deliverables and client sign-off.',
    sees: ['Dashboard', 'Projects', 'Files', 'Approvals'],
  },
  {
    slug: 'client',
    email: 'ops@helios-retail.com',
    role: 'CLIENT',
    label: 'Client',
    blurb: 'The client portal: progress, approvals and invoices.',
    sees: ['Their projects', 'Progress', 'Approvals', 'Their invoices'],
  },
]

export const findDemoAccount = (slug: string) =>
  DEMO_ACCOUNTS.find((account) => account.slug === slug)

/**
 * What each role is kept away from. Stated on `/demo` because the boundary is
 * a feature — an evaluator should see that the client account genuinely cannot
 * reach agency internals, not just that it has a smaller menu.
 */
export const DEMO_HIDDEN: Record<DemoAccount['role'], string> = {
  DEVELOPER: 'No budgets, invoices or agency revenue.',
  DESIGNER: 'No budgets, invoices or agency revenue.',
  CLIENT: 'No internal tasks, no team, no other clients.',
}
