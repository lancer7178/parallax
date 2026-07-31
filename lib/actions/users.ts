'use server'

import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'

import { authorize, ForbiddenError } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { canManageUsers } from '@/lib/rbac'
import { toFormState, userSchema, type FormState } from '@/lib/validation'

export async function createUser(
  _prev: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  try {
    await authorize(canManageUsers)
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

  revalidatePath('/clients')
  revalidatePath('/team')
  return { ok: true, message: `${parsed.data.name} was added.` }
}
