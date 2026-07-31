'use server'

import { revalidatePath } from 'next/cache'

import { authorize, ForbiddenError } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { canManageInvoices } from '@/lib/rbac'
import {
  invoiceSchema,
  invoiceStatusSchema,
  toFormState,
  type FormState,
} from '@/lib/validation'

function revalidateInvoiceViews(projectId?: string) {
  revalidatePath('/dashboard')
  revalidatePath('/invoices')
  revalidatePath('/portal')
  if (projectId) revalidatePath(`/projects/${projectId}`)
}

export async function createInvoice(
  _prev: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  try {
    await authorize(canManageInvoices)
  } catch (error) {
    if (error instanceof ForbiddenError) return { ok: false, message: error.message }
    throw error
  }

  const parsed = invoiceSchema.safeParse({
    projectId: formData.get('projectId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
    dueDate: formData.get('dueDate'),
  })
  if (!parsed.success) return toFormState(parsed.error)

  const project = await prisma.project.findUnique({
    where: { id: parsed.data.projectId },
    select: { id: true },
  })
  if (!project) return { ok: false, message: 'That project no longer exists.' }

  await prisma.invoice.create({ data: parsed.data })

  revalidateInvoiceViews(parsed.data.projectId)
  return { ok: true, message: 'Invoice created.' }
}

export async function updateInvoiceStatus(input: {
  invoiceId: string
  status: string
}) {
  await authorize(canManageInvoices)

  const parsed = invoiceStatusSchema.safeParse(input)
  if (!parsed.success) throw new Error('Invalid invoice status.')

  const invoice = await prisma.invoice.update({
    where: { id: parsed.data.invoiceId },
    data: { status: parsed.data.status },
    select: { projectId: true },
  })

  revalidateInvoiceViews(invoice.projectId)
}

export async function deleteInvoice(formData: FormData) {
  await authorize(canManageInvoices)

  const id = formData.get('id')
  if (typeof id !== 'string' || !id) throw new Error('Missing invoice id.')

  const invoice = await prisma.invoice.delete({
    where: { id },
    select: { projectId: true },
  })

  revalidateInvoiceViews(invoice.projectId)
}
