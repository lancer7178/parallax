import type { Metadata } from 'next'
import { BuildingIcon } from 'lucide-react'
import { Suspense } from 'react'

import { EmptyState, PageHeader } from '@/components/page-header'
import { TableFallback } from '@/components/skeletons'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { UserAvatar } from '@/components/user-avatar'
import { UserActions } from '@/components/users/user-actions'
import { UserDialog } from '@/components/users/user-dialog'
import { requireRole } from '@/lib/dal'
import { listClientAccounts, listClients } from '@/lib/queries'
import { formatCurrency } from '@/lib/utils'

export const metadata: Metadata = { title: 'Clients' }

export default async function ClientsPage() {
  // Gate before streaming so the redirect stays a real 307.
  await requireRole('ADMIN')

  return (
    <>
      <PageHeader
        title="Clients"
        description="Accounts with access to the client portal."
      >
        <UserDialog
          roles={['CLIENT']}
          triggerLabel="Add client"
          title="Add a client"
          description="Creates a portal account. Share the temporary password with them directly."
        />
      </PageHeader>

      <Suspense fallback={<TableFallback rows={5} />}>
        <ClientsTable />
      </Suspense>
    </>
  )
}

async function ClientsTable() {
  // Two reads: the enriched rows for the table, and the plain list the row
  // actions need for "reassign this client's projects".
  const [clients, plain] = await Promise.all([
    listClientAccounts(),
    listClients(),
  ])

  return (
    <>
      {clients.length === 0 ? (
        <EmptyState
          icon={<BuildingIcon className="size-6" />}
          title="No clients yet"
          description="Add a client to give them access to their project portal."
        />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto px-0 pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Projects</TableHead>
                  <TableHead className="text-right">Invoiced</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead>Awaiting them</TableHead>
                  <TableHead className="w-12 text-center" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <span className="flex items-center gap-3">
                        <UserAvatar
                          name={client.name}
                          avatarUrl={client.avatarUrl}
                        />
                        <span className="min-w-0">
                          <span className="block font-medium">
                            {client.name}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {client.email}
                          </span>
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      <span className="font-medium tabular-nums">
                        {client.activeProjects} active
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {client.completedProjects} completed
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatCurrency(client.finance.invoiced)}
                    </TableCell>
                    <TableCell
                      className={
                        client.finance.overdue > 0
                          ? 'text-right font-medium text-destructive tabular-nums'
                          : 'text-right font-medium tabular-nums'
                      }
                    >
                      {formatCurrency(client.finance.outstanding)}
                      {client.finance.overdue > 0 ? (
                        <span className="block text-xs font-normal">
                          {formatCurrency(client.finance.overdue)} overdue
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-sm">
                      {client.pendingApprovals > 0 ? (
                        <Badge tone="warning">
                          {client.pendingApprovals} approval
                          {client.pendingApprovals === 1 ? '' : 's'}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <UserActions
                        user={{ ...client, role: 'CLIENT' }}
                        editableRoles={['CLIENT']}
                        otherClients={plain.filter((c) => c.id !== client.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  )
}
