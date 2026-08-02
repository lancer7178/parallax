'use server'

import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'

import { logActivity } from '@/lib/activity'
import { authorize, ForbiddenError } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { canManageUsers } from '@/lib/rbac'
import {
  toFormState,
  updateUserSchema,
  userSchema,
  type FormState,
} from '@/lib/validation'

export async function createUser(
  _prev: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  let caller
  try {
    caller = await authorize(canManageUsers)
  } catch (error) {
    if (error instanceof ForbiddenError) return { ok: false, message: error.message }
    throw error
  }

  const parsed = userSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    role: formData.get('role'),
    password: formData.get('password'),
  })
  if (!parsed.success) return toFormState(parsed.error)

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  })
  if (existing) {
    return {
      ok: false,
      message: 'That email is already registered.',
      errors: { email: ['That email is already registered.'] },
    }
  }

  await prisma.user.create({
    data: {
      ...parsed.data,
      password: await bcrypt.hash(parsed.data.password, 10),
    },
  })

  await logActivity({
    type: 'USER_JOINED',
    message: `${parsed.data.name} joined as ${parsed.data.role.toLowerCase()}.`,
    actorId: caller.id,
  })

  revalidatePath('/dashboard')
  revalidatePath('/clients')
  revalidatePath('/team')
  return { ok: true, message: `${parsed.data.name} was added.` }
}

// ---------------------------------------------------------------------------
// Update user
// ---------------------------------------------------------------------------

export async function updateUser(
  _prev: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  try {
    await authorize(canManageUsers)
  } catch (error) {
    if (error instanceof ForbiddenError) return { ok: false, message: error.message }
    throw error
  }

  const userId = formData.get('userId')
  if (typeof userId !== 'string' || !userId) {
    return { ok: false, message: 'Missing user id.' }
  }

  const parsed = updateUserSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    role: formData.get('role'),
    password: formData.get('password'),
  })
  if (!parsed.success) return toFormState(parsed.error)

  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  })
  if (!existing) return { ok: false, message: 'User not found.' }

  const emailOwner = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  })
  if (emailOwner && emailOwner.id !== userId) {
    return {
      ok: false,
      message: 'That email is already registered.',
      errors: { email: ['That email is already registered.'] },
    }
  }

  // --- Last-admin guard: don't let the only admin be demoted ---
  if (existing.role === 'ADMIN' && parsed.data.role !== 'ADMIN') {
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } })
    if (adminCount <= 1) {
      return {
        ok: false,
        message:
          'This is the only admin account. Promote another user to admin before changing this role.',
      }
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      ...(parsed.data.password
        ? { password: await bcrypt.hash(parsed.data.password, 10) }
        : {}),
    },
  })

  revalidatePath('/clients')
  revalidatePath('/team')
  return { ok: true, message: `${parsed.data.name} was updated.` }
}

// ---------------------------------------------------------------------------
// Delete user
// ---------------------------------------------------------------------------

export type DeleteUserResult = {
  ok: boolean
  message: string
  /** When a client still owns projects and no strategy was provided. */
  needsStrategy?: boolean
  projects?: { id: string; title: string; tasks: number; invoices: number }[]
}

/**
 * Safely delete a user from the admin panel.
 *
 * - Staff (DEVELOPER/DESIGNER/ADMIN): deleted directly; assigned tasks become
 *   unassigned (onDelete: SetNull).
 * - Clients with no projects: deleted directly.
 * - Clients with projects: the caller must choose a strategy:
 *     • "reassign" + reassignToId  → move projects to another client first
 *     • "cascade"                  → delete all projects (tasks/invoices cascade)
 *   If no strategy is given the action returns the project list so the UI can
 *   show a choice dialog.
 */
export async function deleteUser(
  userId: string,
  options?: {
    strategy?: 'reassign' | 'cascade'
    reassignToId?: string
  }
): Promise<DeleteUserResult> {
  // --- Auth gate ---
  let caller
  try {
    caller = await authorize(canManageUsers)
  } catch (error) {
    if (error instanceof ForbiddenError)
      return { ok: false, message: error.message }
    throw error
  }

  // --- Self-delete guard ---
  if (caller.id === userId) {
    return { ok: false, message: 'You cannot delete your own account.' }
  }

  // --- Look up the target user ---
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      clientProjects: {
        select: {
          id: true,
          title: true,
          _count: { select: { tasks: true, invoices: true } },
        },
      },
    },
  })

  if (!user) return { ok: false, message: 'User not found.' }

  // --- Last-admin guard ---
  if (user.role === 'ADMIN') {
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } })
    if (adminCount <= 1) {
      return {
        ok: false,
        message:
          'This is the only admin account. Promote another user to admin before deleting this one.',
      }
    }
  }

  const projects = user.clientProjects

  // --- Client with projects requires a strategy ---
  if (projects.length > 0) {
    const strategy = options?.strategy

    if (!strategy) {
      return {
        ok: false,
        needsStrategy: true,
        message: `${user.name} owns ${projects.length} project(s). Choose how to handle them.`,
        projects: projects.map((p) => ({
          id: p.id,
          title: p.title,
          tasks: p._count.tasks,
          invoices: p._count.invoices,
        })),
      }
    }

    if (strategy === 'reassign') {
      const reassignToId = options?.reassignToId
      if (!reassignToId) {
        return { ok: false, message: 'Select a client to reassign projects to.' }
      }
      if (reassignToId === userId) {
        return { ok: false, message: 'Cannot reassign projects to the same user.' }
      }

      const recipient = await prisma.user.findUnique({
        where: { id: reassignToId },
        select: { id: true, role: true },
      })
      if (!recipient) return { ok: false, message: 'Reassignment target not found.' }
      if (recipient.role !== 'CLIENT') {
        return {
          ok: false,
          message: 'Projects can only be reassigned to a user with the Client role.',
        }
      }

      await prisma.project.updateMany({
        where: { clientId: userId },
        data: { clientId: reassignToId },
      })
    }

    if (strategy === 'cascade') {
      // Tasks and invoices cascade from Project via onDelete: Cascade
      await prisma.project.deleteMany({ where: { clientId: userId } })
    }
  }

  // --- Delete the user ---
  await prisma.user.delete({ where: { id: userId } })

  revalidatePath('/dashboard')
  revalidatePath('/clients')
  revalidatePath('/team')
  revalidatePath('/projects')
  revalidatePath('/tasks')

  return { ok: true, message: `${user.name} has been deleted.` }
}
