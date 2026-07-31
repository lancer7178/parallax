'use server'

import { revalidatePath } from 'next/cache'

import { authorize, ForbiddenError } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { canReachProject } from '@/lib/queries'
import { canManageTasks } from '@/lib/rbac'
import {
  taskSchema,
  taskStatusSchema,
  toFormState,
  type FormState,
} from '@/lib/validation'

function revalidateTaskViews(projectId: string) {
  revalidatePath('/dashboard')
  revalidatePath('/tasks')
  revalidatePath('/projects')
  revalidatePath(`/projects/${projectId}`)
}

export async function createTask(
  _prev: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  let user
  try {
    user = await authorize(canManageTasks)
  } catch (error) {
    if (error instanceof ForbiddenError) return { ok: false, message: error.message }
    throw error
  }

  const parsed = taskSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    status: formData.get('status'),
    priority: formData.get('priority'),
    projectId: formData.get('projectId'),
    assigneeId: formData.get('assigneeId'),
  })
  if (!parsed.success) return toFormState(parsed.error)

  // A designer must not be able to attach a task to a project they can't see.
  if (!(await canReachProject(user, parsed.data.projectId))) {
    return { ok: false, message: 'Project not found.' }
  }

  await prisma.task.create({ data: parsed.data })

  revalidateTaskViews(parsed.data.projectId)
  return { ok: true, message: 'Task created.' }
}

export async function updateTask(
  _prev: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  let user
  try {
    user = await authorize(canManageTasks)
  } catch (error) {
    if (error instanceof ForbiddenError) return { ok: false, message: error.message }
    throw error
  }

  const id = formData.get('id')
  if (typeof id !== 'string' || !id) {
    return { ok: false, message: 'Missing task id.' }
  }

  const parsed = taskSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    status: formData.get('status'),
    priority: formData.get('priority'),
    projectId: formData.get('projectId'),
    assigneeId: formData.get('assigneeId'),
  })
  if (!parsed.success) return toFormState(parsed.error)

  if (!(await canReachProject(user, parsed.data.projectId))) {
    return { ok: false, message: 'Project not found.' }
  }

  await prisma.task.update({ where: { id }, data: parsed.data })

  revalidateTaskViews(parsed.data.projectId)
  return { ok: true, message: 'Task updated.' }
}

/**
 * Kanban drag-and-drop target. Called directly (not via `<form>`), so it takes
 * plain arguments and re-validates them server-side.
 */
export async function moveTask(input: { taskId: string; status: string }) {
  const user = await authorize(canManageTasks)

  const parsed = taskStatusSchema.safeParse(input)
  if (!parsed.success) throw new Error('Invalid task status.')

  const task = await prisma.task.findUnique({
    where: { id: parsed.data.taskId },
    select: { projectId: true },
  })
  if (!task) throw new Error('Task not found.')

  if (!(await canReachProject(user, task.projectId))) {
    throw new ForbiddenError('Project not found.')
  }

  await prisma.task.update({
    where: { id: parsed.data.taskId },
    data: { status: parsed.data.status },
  })

  revalidateTaskViews(task.projectId)
}

export async function deleteTask(formData: FormData) {
  const user = await authorize(canManageTasks)

  const id = formData.get('id')
  if (typeof id !== 'string' || !id) throw new Error('Missing task id.')

  const task = await prisma.task.findUnique({
    where: { id },
    select: { projectId: true },
  })
  if (!task) return

  if (!(await canReachProject(user, task.projectId))) {
    throw new ForbiddenError('Project not found.')
  }

  await prisma.task.delete({ where: { id } })
  revalidateTaskViews(task.projectId)
}
