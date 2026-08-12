'use server'

import bcrypt from 'bcryptjs'
import { AuthError } from 'next-auth'
import { redirect } from 'next/navigation'

import { signIn, signOut } from '@/auth'
import { logActivity } from '@/lib/activity'
import { findDemoAccount } from '@/lib/demo'
import { prisma } from '@/lib/prisma'
import { homePathFor } from '@/lib/rbac'
import {
  loginSchema,
  registerSchema,
  toFormState,
  type FormState,
} from '@/lib/validation'

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

/**
 * Self-service sign-up.
 *
 * This is a public, unauthenticated endpoint, so the account it creates is
 * always a `CLIENT` — the role is written here as a literal and is never read
 * from the form. Agency roles stay admin-provisioned from `/team`, which is
 * what keeps `ADMIN` unreachable from the open internet.
 *
 * A new client lands in the portal with nothing in it, which is correct: their
 * engagement appears the moment an admin attaches a project to them.
 */
export async function register(
  _prev: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })
  if (!parsed.success) return toFormState(parsed.error)

  const { name, email, password } = parsed.data

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })
  if (existing) {
    // Sign-up is one of the few places where confirming an address is already
    // taken is unavoidable — the alternative is silently doing nothing. The
    // message stays neutral and points at sign-in rather than at the account.
    return {
      ok: false,
      message: 'That email already has an account. Try signing in instead.',
      errors: { email: ['That email already has an account.'] },
    }
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: await bcrypt.hash(password, 10),
      role: 'CLIENT',
    },
    select: { id: true, name: true },
  })

  await logActivity({
    type: 'USER_JOINED',
    message: `${user.name} created a client account.`,
    actorId: user.id,
  })

  try {
    await signIn('credentials', { email, password, redirect: false })
  } catch (error) {
    if (error instanceof AuthError) {
      // The account exists either way, so send them to sign in by hand rather
      // than losing the registration to a transient auth failure.
      redirect('/login')
    }
    throw error
  }

  redirect(homePathFor('CLIENT'))
}

/**
 * One-click demo sign-in.
 *
 * The client sends a slug, never a password: the shared demo password is read
 * from the server environment here and never reaches the browser. `slug` is
 * matched against a fixed list that cannot contain an admin (see
 * `lib/demo.ts`), and the account's role is re-checked against the database
 * afterwards, so a demo account that was later promoted still cannot be used
 * to walk in through this door.
 */
export async function enterDemo(
  _prev: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  const slug = formData.get('slug')
  const account = typeof slug === 'string' ? findDemoAccount(slug) : undefined
  if (!account) return { ok: false, message: 'Unknown demo account.' }

  const password = process.env.SEED_PASSWORD ?? 'Parallax!2026'

  const row = await prisma.user.findUnique({
    where: { email: account.email },
    select: { role: true },
  })
  if (!row) {
    return {
      ok: false,
      message: 'The demo data has not been seeded yet. Run `npm run db:seed`.',
    }
  }
  if (row.role === 'ADMIN') {
    return { ok: false, message: 'That account is not available for demo access.' }
  }

  try {
    await signIn('credentials', {
      email: account.email,
      password,
      redirect: false,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        ok: false,
        message:
          'Could not open the demo. The demo password may not match SEED_PASSWORD.',
      }
    }
    throw error
  }

  redirect(homePathFor(row.role))
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
