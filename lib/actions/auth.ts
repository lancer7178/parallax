'use server'

import { AuthError } from 'next-auth'
import { redirect } from 'next/navigation'

import { signIn, signOut } from '@/auth'
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

  // `/` reads the new session and forwards each role to its own home page.
  // `redirect` throws a control-flow exception, so it must sit outside `try`.
  const callbackUrl = formData.get('callbackUrl')
  const target =
    typeof callbackUrl === 'string' && callbackUrl.startsWith('/')
      ? callbackUrl
      : '/'
  redirect(target)
}

export async function logout() {
  await signOut({ redirectTo: '/login' })
}
