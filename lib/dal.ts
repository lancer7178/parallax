import 'server-only'

import type { Role } from '@prisma/client'
import { redirect } from 'next/navigation'
import { cache } from 'react'

import { auth } from '@/auth'
import { homePathFor } from '@/lib/rbac'

export type SessionUser = {
  id: string
  name: string
  email: string
  role: Role
  image: string | null
}

/**
 * Data Access Layer.
 *
 * Every read and every mutation goes through `requireUser()` / `requireRole()`
 * so authorization lives next to the data rather than in the UI. `proxy.ts`
 * only performs an optimistic cookie check — it is not a security boundary.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth()
  if (!session?.user?.id) return null

  return {
    id: session.user.id,
    name: session.user.name ?? 'Unknown',
    email: session.user.email ?? '',
    role: session.user.role,
    image: session.user.image ?? null,
  }
})

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  return user
}

/**
 * Redirects to the caller's own home page when their role is not permitted,
 * so a bookmarked admin URL never renders for a designer.
 */
export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireUser()
  if (!roles.includes(user.role)) redirect(homePathFor(user.role))
  return user
}

/** Thrown by Server Actions when the caller lacks permission. */
export class ForbiddenError extends Error {
  constructor(message = 'You do not have permission to perform this action.') {
    super(message)
    this.name = 'ForbiddenError'
  }
}

/** Action-side guard: returns the user or throws instead of redirecting. */
export async function authorize(
  predicate: (role: Role) => boolean
): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) throw new ForbiddenError('You must be signed in.')
  if (!predicate(user.role)) throw new ForbiddenError()
  return user
}
