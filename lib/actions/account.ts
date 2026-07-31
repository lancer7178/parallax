'use server'

import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'

import { requireUser } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { accountSchema, toFormState, type FormState } from '@/lib/validation'

/**
 * Self-service profile edit. Unlike `lib/actions/users.ts`, this always acts
 * on the signed-in caller's own id — never one supplied by the client — so
 * there is no role check beyond being signed in.
 */
export async function updateAccount(
  _prev: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  const caller = await requireUser()

  const parsed = accountSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    currentPassword: formData.get('currentPassword'),
    newPassword: formData.get('newPassword'),
  })
  if (!parsed.success) return toFormState(parsed.error)

  if (parsed.data.newPassword) {
    if (!parsed.data.currentPassword) {
      return {
        ok: false,
        message: 'Enter your current password to set a new one.',
        errors: { currentPassword: ['Required to change your password.'] },
      }
    }

    const record = await prisma.user.findUniqueOrThrow({
      where: { id: caller.id },
      select: { password: true },
    })
    const valid = await bcrypt.compare(
      parsed.data.currentPassword,
      record.password
    )
    if (!valid) {
      return {
        ok: false,
        message: 'Current password is incorrect.',
        errors: { currentPassword: ['Current password is incorrect.'] },
      }
    }
  }

  if (parsed.data.email !== caller.email) {
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
  }

  await prisma.user.update({
    where: { id: caller.id },
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      ...(parsed.data.newPassword
        ? { password: await bcrypt.hash(parsed.data.newPassword, 10) }
        : {}),
    },
  })

  revalidatePath('/settings')
  return { ok: true, message: 'Your account was updated.' }
}
