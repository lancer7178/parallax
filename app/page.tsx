import { redirect } from 'next/navigation'

import { requireUser } from '@/lib/dal'
import { homePathFor } from '@/lib/rbac'

/**
 * Entry point after sign-in. Staff land on the operations dashboard, clients
 * land on the client portal.
 */
export default async function RootPage() {
  const user = await requireUser()
  redirect(homePathFor(user.role))
}
