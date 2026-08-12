import { InvoiceStatus, ProjectStatus, Role, TaskStatus } from '@prisma/client'
import * as z from 'zod'

export const loginSchema = z.object({
  email: z.email({ error: 'Enter a valid email address.' }).trim(),
  password: z.string().min(1, { error: 'Password is required.' }),
})

const strongPassword = z
  .string()
  .min(8, { error: 'Password must be at least 8 characters.' })
  .regex(/[a-zA-Z]/, { error: 'Password must contain a letter.' })
  .regex(/[0-9]/, { error: 'Password must contain a number.' })

/**
 * Self-service sign-up. There is no `role` field on purpose: `register()`
 * hard-codes `CLIENT`, so no amount of extra form data can promote the account
 * that a public, unauthenticated endpoint creates.
 */
export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, { error: 'Name must be at least 2 characters.' })
      .max(80),
    email: z
      .email({ error: 'Enter a valid email address.' })
      .trim()
      .toLowerCase(),
    password: strongPassword,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    error: 'Both passwords must match.',
  })

const optionalText = z
  .string()
  .trim()
  .max(2000)
  .optional()
  .transform((value) => (value ? value : null))

/** `<input type="date">` submits '' when empty and 'YYYY-MM-DD' otherwise. */
const optionalDate = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? new Date(`${value}T12:00:00Z`) : null))
  .refine((value) => value === null || !Number.isNaN(value.getTime()), {
    error: 'Enter a valid date.',
  })

const requiredDate = z
  .string()
  .trim()
  .min(1, { error: 'A due date is required.' })
  .transform((value) => new Date(`${value}T12:00:00Z`))
  .refine((value) => !Number.isNaN(value.getTime()), {
    error: 'Enter a valid date.',
  })

const optionalMoney = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? Number(value) : null))
  .refine((value) => value === null || (Number.isFinite(value) && value >= 0), {
    error: 'Enter a positive amount.',
  })

export const projectSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, { error: 'Title must be at least 3 characters.' })
    .max(120),
  description: optionalText,
  status: z.enum(ProjectStatus),
  clientId: z.uuid({ error: 'Select a client.' }),
  deadline: optionalDate,
  budget: optionalMoney,
})

export const taskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, { error: 'Title must be at least 3 characters.' })
    .max(160),
  description: optionalText,
  status: z.enum(TaskStatus),
  priority: z.coerce.number().int().min(1).max(3),
  dueDate: optionalDate,
  projectId: z.uuid(),
  assigneeId: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : null))
    .refine((value) => value === null || z.uuid().safeParse(value).success, {
      error: 'Select a valid assignee.',
    }),
})

export const taskStatusSchema = z.object({
  taskId: z.uuid(),
  status: z.enum(TaskStatus),
})

export const invoiceSchema = z.object({
  projectId: z.uuid({ error: 'Select a project.' }),
  amount: z.coerce
    .number({ error: 'Enter a valid amount.' })
    .positive({ error: 'Amount must be greater than zero.' }),
  status: z.enum(InvoiceStatus),
  dueDate: requiredDate,
})

export const invoiceStatusSchema = z.object({
  invoiceId: z.uuid(),
  status: z.enum(InvoiceStatus),
})

export const approvalSchema = z.object({
  projectId: z.uuid(),
  title: z
    .string()
    .trim()
    .min(3, { error: 'Title must be at least 3 characters.' })
    .max(160),
  description: optionalText,
})

/**
 * The client's decision. `feedback` is required when changes are requested —
 * "changes requested" without saying what to change is not a decision.
 */
export const approvalDecisionSchema = z
  .object({
    approvalId: z.uuid(),
    decision: z.enum(['APPROVED', 'CHANGES_REQUESTED']),
    feedback: z.string().trim().max(2000).optional(),
  })
  .refine(
    (value) =>
      value.decision !== 'CHANGES_REQUESTED' ||
      (value.feedback?.length ?? 0) >= 5,
    {
      path: ['feedback'],
      error: 'Tell the team what needs changing.',
    }
  )

/**
 * A file attached to a project. `url` is restricted to `http(s)` on purpose —
 * the value is rendered as a link, so allowing `javascript:` or `data:` here
 * would turn "attach a file" into stored XSS against everyone on the project.
 */
export const projectFileSchema = z.object({
  projectId: z.uuid(),
  name: z
    .string()
    .trim()
    .min(3, { error: 'Give the file a name, including its extension.' })
    .max(160),
  url: z
    .url({ error: 'Enter a valid link, starting with https://' })
    .trim()
    .max(2000)
    .refine((value) => /^https?:\/\//i.test(value), {
      error: 'Links must start with http:// or https://',
    }),
  version: z.coerce
    .number({ error: 'Version must be a number.' })
    .int()
    .min(1, { error: 'Version starts at 1.' })
    .max(999),
  // An unchecked checkbox submits nothing at all, so absence means "internal".
  sharedWithClient: z
    .union([z.literal('on'), z.literal('')])
    .optional()
    .transform((value) => value === 'on'),
})

export const userSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: 'Name must be at least 2 characters.' })
    .max(80),
  email: z.email({ error: 'Enter a valid email address.' }).trim().toLowerCase(),
  role: z.enum(Role),
  password: strongPassword,
})

/** Same as `userSchema`, but the password is only rotated when provided. */
export const updateUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: 'Name must be at least 2 characters.' })
    .max(80),
  email: z.email({ error: 'Enter a valid email address.' }).trim().toLowerCase(),
  role: z.enum(Role),
  password: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined))
    .refine(
      (value) =>
        value === undefined ||
        (value.length >= 8 && /[a-zA-Z]/.test(value) && /[0-9]/.test(value)),
      {
        error:
          'Password must be at least 8 characters and contain a letter and a number.',
      }
    ),
})

/** Self-service account edit — no `role`, and the password is only rotated
 *  when a new one is given alongside the current one. */
export const accountSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: 'Name must be at least 2 characters.' })
    .max(80),
  email: z.email({ error: 'Enter a valid email address.' }).trim().toLowerCase(),
  currentPassword: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
  newPassword: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined))
    .refine(
      (value) =>
        value === undefined ||
        (value.length >= 8 && /[a-zA-Z]/.test(value) && /[0-9]/.test(value)),
      {
        error:
          'Password must be at least 8 characters and contain a letter and a number.',
      }
    ),
})

/** One target value per `GOAL_DEFS` key, submitted as `goal:<key>` fields. */
export const goalTargetSchema = z.coerce
  .number({ error: 'Enter a valid number.' })
  .positive({ error: 'Target must be greater than zero.' })

export type FormState = {
  ok?: boolean
  message?: string
  errors?: Record<string, string[]>
}

/** Collapse a ZodError into the flat `errors` shape used by our form state. */
export function toFormState(error: z.ZodError, message?: string): FormState {
  const flattened = z.flattenError(error)
  return {
    ok: false,
    message: message ?? 'Please fix the highlighted fields.',
    errors: flattened.fieldErrors as Record<string, string[]>,
  }
}
