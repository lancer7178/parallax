import { AppShell } from '@/components/shell/app-shell'
import { requireUser } from '@/lib/dal'

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // The shell needs the identity anyway; every page below re-checks
  // authorization through the DAL rather than relying on this layout.
  const user = await requireUser()

  return <AppShell user={user}>{children}</AppShell>
}
