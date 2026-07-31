'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { authorize, ForbiddenError } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { canManageProjects } from '@/lib/rbac'
import { projectSchema, toFormState, type FormState } from '@/lib/validation'

function fields(formData: FormData) {
  return {
    title: formData.get('title'),
    description: formData.get('description'),
    status: formData.get('status'),
    clientId: formData.get('clientId'),
    deadline: formData.get('deadline'),
    budget: formData.get('budget'),
  }
}

function revalidateProjectViews(id?: string) {
  revalidatePath('/dashboard')
  revalidatePath('/projects')
  revalidatePath('/portal')
  if (id) revalidatePath(`/projects/${id}`)
}

export async function createProject(
  _prev: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  try {
    await authorize(canManageProjects)
  } catch (error) {
    if (error instanceof ForbiddenError) return { ok: false, message: error.message }
    throw error
  }

  const parsed = projectSchema.safeParse(fields(formData))
  if (!parsed.success) return toFormState(parsed.error)

  const client = await prisma.user.findFirst({
    where: { id: parsed.data.clientId, role: 'CLIENT' },
    select: { id: true },
  })
  if (!client) {
    return { ok: false, message: 'That client no longer exists.' }
  }

  const project = await prisma.project.create({
    data: parsed.data,
    select: { id: true },
  })

  revalidateProjectViews(project.id)
  redirect(`/projects/${project.id}`)
}

export async function updateProject(
  _prev: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  try {
    await authorize(canManageProjects)
  } catch (error) {
    if (error instanceof ForbiddenError) return { ok: false, message: error.message }
    throw error
  }

  const id = formData.get('id')
  if (typeof id !== 'string' || !id) {
    return { ok: false, message: 'Missing project id.' }
  }

  const parsed = projectSchema.safeParse(fields(formData))
  if (!parsed.success) return toFormState(parsed.error)

  await prisma.project.update({ where: { id }, data: parsed.data })

  revalidateProjectViews(id)
  return { ok: true, message: 'Project updated.' }
}

export async function deleteProject(formData: FormData) {
  await authorize(canManageProjects)

  const id = formData.get('id')
  if (typeof id !== 'string' || !id) throw new Error('Missing project id.')

  // Tasks and invoices cascade via the schema's `onDelete: Cascade`.
  await prisma.project.delete({ where: { id } })

  revalidateProjectViews()
  redirect('/projects')
}
