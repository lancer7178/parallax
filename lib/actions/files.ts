'use server'

import { revalidatePath } from 'next/cache'

import { logActivity } from '@/lib/activity'
import { authorize, ForbiddenError } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { canReachProject } from '@/lib/queries'
import { canManageFiles } from '@/lib/rbac'
import {
  projectFileSchema,
  toFormState,
  type FormState,
} from '@/lib/validation'

/**
 * Attach a file to a project.
 *
 * Two gates, same as the approval actions: the role must be allowed to manage
 * files *and* the project has to be one the caller can already reach, so a
 * designer cannot hang a file off a project they were never given.
 */
export async function addProjectFile(
  _prev: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  let user
  try {
    user = await authorize(canManageFiles)
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { ok: false, message: error.message }
    }
    throw error
  }

  const parsed = projectFileSchema.safeParse({
    projectId: formData.get('projectId'),
    name: formData.get('name'),
    url: formData.get('url'),
    version: formData.get('version'),
    sharedWithClient: formData.get('sharedWithClient') ?? '',
  })
  if (!parsed.success) return toFormState(parsed.error)

  if (!(await canReachProject(user, parsed.data.projectId))) {
    return { ok: false, message: 'Project not found.' }
  }

  const file = await prisma.projectFile.create({
    data: { ...parsed.data, uploadedById: user.id },
    select: { id: true, name: true, projectId: true },
  })

  // Only shared files are worth an activity entry: the timeline is read by the
  // client too, and an internal working file appearing there would announce
  // exactly the thing `sharedWithClient` exists to keep quiet.
  if (parsed.data.sharedWithClient) {
    await logActivity({
      type: 'FILE_ADDED',
      message: `${user.name} added ${file.name}.`,
      actorId: user.id,
      projectId: file.projectId,
    })
  }

  revalidatePath(`/projects/${file.projectId}`)
  return { ok: true, message: `${file.name} was added.` }
}

/** Remove a file reference. The file itself lives elsewhere and is untouched. */
export async function deleteProjectFile(formData: FormData) {
  const user = await authorize(canManageFiles)

  const id = formData.get('id')
  if (typeof id !== 'string' || !id) throw new Error('Missing file id.')

  const file = await prisma.projectFile.findUnique({
    where: { id },
    select: { projectId: true },
  })
  if (!file) return

  if (!(await canReachProject(user, file.projectId))) {
    throw new ForbiddenError('Project not found.')
  }

  await prisma.projectFile.delete({ where: { id } })
  revalidatePath(`/projects/${file.projectId}`)
}
