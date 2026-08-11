'use server'

import { AuthError } from 'next-auth'
import { redirect } from 'next/navigation'

import { signIn, signOut } from '@/auth'
import { prisma } from '@/lib/prisma'
import { homePathFor } from '@/lib/rbac'
import { loginSchema, toFormState, type FormState } from '@/lib/validation'

export async function login(
  _prev: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) return toFormState(parsed.error)

  try {
    await signIn('credentials', {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, message: 'Incorrect email or password.' }
    }
    throw error
  }

  // `/` is the public marketing page, so signing in has to resolve the role's
  // own home page here rather than bouncing through it. The credentials were
  // just verified above, so this read cannot leak anything a caller did not
  // already prove they own.
  const account = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { role: true },
  })

  // `redirect` throws a control-flow exception, so it must sit outside `try`.
  const callbackUrl = formData.get('callbackUrl')
  const target =
    typeof callbackUrl === 'string' && callbackUrl.startsWith('/')
      ? callbackUrl
      : homePathFor(account?.role ?? 'CLIENT')
  redirect(target)
}

export async function logout() {
  // `redirect: false`, then our own relative `redirect()` — same pattern as
  // `login()` above. Letting Auth.js redirect itself would build an absolute
  // URL from `AUTH_URL` (falling back to the request host only when that env
  // var is unset), so a misconfigured `AUTH_URL` sends every sign-out to that
  // literal origin instead of wherever the app is actually running.
  await signOut({ redirect: false })
  redirect('/login')
}
