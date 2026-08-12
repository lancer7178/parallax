import { AppShell } from '@/components/shell/app-shell'
import { requireUser } from '@/lib/dal'
import { countAttention } from '@/lib/queries'

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // The shell needs the identity anyway; every page below re-checks
  // authorization through the DAL rather than relying on this layout.
  const user = await requireUser()

  // Counts only — the notification panel loads its contents when it is opened.
  // Cheap enough to run per navigation, and it keeps the badge honest on every
  // page rather than only on the dashboard.
  const attentionCount = await countAttention(user)

  return (
    <AppShell user={user} attentionCount={attentionCount}>
      {children}
    </AppShell>
  )
}
