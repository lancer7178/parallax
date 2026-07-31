import type { Metadata } from 'next'
import { BuildingIcon } from 'lucide-react'
import { Suspense } from 'react'

import { EmptyState, PageHeader } from '@/components/page-header'
import { TableFallback } from '@/components/skeletons'
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
import { listClients } from '@/lib/queries'
import { formatDate } from '@/lib/utils'

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
  const clients = await listClients()

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
          <CardContent className="px-0 pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Projects</TableHead>
                  <TableHead>Joined</TableHead>
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
                        <span className="font-medium">{client.name}</span>
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {client.email}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {client._count.clientProjects}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(client.createdAt)}
                    </TableCell>
                    <TableCell className="text-center">
                      <UserActions 
                        user={client} 
                        otherClients={clients.filter((c) => c.id !== client.id)} 
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
