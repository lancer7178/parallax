import 'server-only'

import type { ActivityType } from '@prisma/client'

import { prisma } from '@/lib/prisma'

/**
 * Fire-and-record hook called from inside the mutation actions (projects,
 * tasks, invoices, users) right after the write that makes it true. Not a
 * Server Action itself — it's a plain helper, imported into files that
 * already carry `'use server'` for their own exports.
 */
export async function logActivity(input: {
  type: ActivityType
  message: string
  actorId?: string | null
  projectId?: string | null
}) {
  await prisma.activity.create({
    data: {
      type: input.type,
      message: input.message,
      actorId: input.actorId ?? null,
      projectId: input.projectId ?? null,
    },
  })
}
