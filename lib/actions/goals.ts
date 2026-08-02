'use server'

import { revalidatePath } from 'next/cache'

import { authorize, ForbiddenError } from '@/lib/dal'
import { GOAL_DEFS } from '@/lib/constants'
import { prisma } from '@/lib/prisma'
import { canManageGoals } from '@/lib/rbac'
import { goalTargetSchema, type FormState } from '@/lib/validation'

/** Admin-only: rewrites every KPI target on the dashboard's Goals panel at once. */
export async function updateGoals(
  _prev: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  try {
    await authorize(canManageGoals)
  } catch (error) {
    if (error instanceof ForbiddenError) return { ok: false, message: error.message }
    throw error
  }

  const errors: Record<string, string[]> = {}
  const values: { key: string; targetValue: number }[] = []

  for (const def of GOAL_DEFS) {
    const parsed = goalTargetSchema.safeParse(formData.get(`goal:${def.key}`))
    if (!parsed.success) {
      errors[`goal:${def.key}`] = [parsed.error.issues[0]?.message ?? 'Invalid value.']
      continue
    }
    values.push({ key: def.key, targetValue: parsed.data })
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, message: 'Please fix the highlighted fields.', errors }
  }

  await Promise.all(
    values.map(({ key, targetValue }) => {
      const def = GOAL_DEFS.find((d) => d.key === key)!
      return prisma.goal.upsert({
        where: { key },
        update: { targetValue },
        create: { key, label: def.label, targetValue },
      })
    })
  )

  revalidatePath('/dashboard')
  return { ok: true, message: 'Targets updated.' }
}
