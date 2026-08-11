'use server'

import { revalidatePath } from 'next/cache'

import { logActivity } from '@/lib/activity'
import { authorize, ForbiddenError } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { canReachProject } from '@/lib/queries'
import { canDecideApprovals, canRequestApprovals } from '@/lib/rbac'
import {
  approvalDecisionSchema,
  approvalSchema,
  toFormState,
  type FormState,
} from '@/lib/validation'

function revalidateApprovalViews(projectId: string) {
  revalidatePath('/dashboard')
  revalidatePath('/portal')
  revalidatePath('/projects')
  revalidatePath(`/projects/${projectId}`)
}

/** Staff hand a deliverable to the client for sign-off. */
export async function requestApproval(
  _prev: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  let user
  try {
    user = await authorize(canRequestApprovals)
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { ok: false, message: error.message }
    }
    throw error
  }

  const parsed = approvalSchema.safeParse({
    projectId: formData.get('projectId'),
    title: formData.get('title'),
    description: formData.get('description'),
  })
  if (!parsed.success) return toFormState(parsed.error)

  // Same ownership check the task actions use: a designer must not be able to
  // raise an approval against a project they cannot reach.
  if (!(await canReachProject(user, parsed.data.projectId))) {
    return { ok: false, message: 'Project not found.' }
  }

  const project = await prisma.project.findUnique({
    where: { id: parsed.data.projectId },
    select: { id: true, client: { select: { name: true } } },
  })
  if (!project) return { ok: false, message: 'Project not found.' }

  await prisma.approval.create({
    data: { ...parsed.data, requestedById: user.id },
  })

  await logActivity({
    type: 'APPROVAL_REQUESTED',
    message: `${parsed.data.title} was sent to ${project.client.name} for approval.`,
    actorId: user.id,
    projectId: project.id,
  })

  revalidateApprovalViews(project.id)
  return { ok: true, message: 'Sent for approval.' }
}

/**
 * The client's decision — approve, or request changes with a note.
 *
 * This is the one write a client account can perform, so it is checked twice:
 * the role must be CLIENT, *and* the approval must hang off a project that
 * client owns. Role alone would let any client decide any approval.
 */
export async function decideApproval(
  _prev: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  let user
  try {
    user = await authorize(canDecideApprovals)
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return {
        ok: false,
        message: 'Only the client on this project can approve deliverables.',
      }
    }
    throw error
  }

  const parsed = approvalDecisionSchema.safeParse({
    approvalId: formData.get('approvalId'),
    decision: formData.get('decision'),
    feedback: formData.get('feedback'),
  })
  if (!parsed.success) return toFormState(parsed.error)

  const approval = await prisma.approval.findUnique({
    where: { id: parsed.data.approvalId },
    select: {
      id: true,
      title: true,
      status: true,
      projectId: true,
      project: { select: { clientId: true } },
    },
  })
  if (!approval || approval.project.clientId !== user.id) {
    return { ok: false, message: 'Approval not found.' }
  }

  if (approval.status !== 'PENDING') {
    return { ok: false, message: 'This deliverable has already been reviewed.' }
  }

  const approved = parsed.data.decision === 'APPROVED'

  await prisma.approval.update({
    where: { id: approval.id },
    data: {
      status: parsed.data.decision,
      // An approval carries no note; only a change request does.
      feedback: approved ? null : (parsed.data.feedback ?? null),
      decidedAt: new Date(),
    },
  })

  await logActivity({
    type: approved ? 'APPROVAL_APPROVED' : 'APPROVAL_CHANGES_REQUESTED',
    message: approved
      ? `${user.name} approved ${approval.title}.`
      : `${user.name} requested changes on ${approval.title}.`,
    actorId: user.id,
    projectId: approval.projectId,
  })

  revalidateApprovalViews(approval.projectId)
  return {
    ok: true,
    message: approved ? 'Approved. The team has been notified.' : 'Feedback sent.',
  }
}

/** Staff withdraw a deliverable that was sent by mistake. */
export async function deleteApproval(formData: FormData) {
  const user = await authorize(canRequestApprovals)

  const id = formData.get('id')
  if (typeof id !== 'string' || !id) throw new Error('Missing approval id.')

  const approval = await prisma.approval.findUnique({
    where: { id },
    select: { projectId: true },
  })
  if (!approval) return

  if (!(await canReachProject(user, approval.projectId))) {
    throw new ForbiddenError('Project not found.')
  }

  await prisma.approval.delete({ where: { id } })
  revalidateApprovalViews(approval.projectId)
}
