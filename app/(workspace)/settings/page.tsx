import type { Metadata } from 'next'

import { PageHeader } from '@/components/page-header'
import { AccountForm } from '@/components/settings/account-form'
import { requireUser } from '@/lib/dal'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage() {
  // Every role may manage its own account — no requireRole() gate.
  const user = await requireUser()

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your account details."
      />

      <div className="max-w-2xl">
        <AccountForm user={user} />
      </div>
    </>
  )
}
