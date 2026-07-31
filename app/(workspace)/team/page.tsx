import type { Metadata } from 'next'
import { Suspense } from 'react'

import { PageHeader } from '@/components/page-header'
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
import { UserDialog } from '@/components/users/user-dialog'
import { requireRole } from '@/lib/dal'
import { listTeam } from '@/lib/queries'
import { ROLE_LABELS } from '@/lib/rbac'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = { title: 'Team' }

export default async function TeamPage() {
  // Gate before streaming so the redirect stays a real 307.
  await requireRole('ADMIN')

  return (
    <>
      <PageHeader
        title="Team"
        description="Everyone with an account, and what they can reach."
      >
        <UserDialog
          roles={['DEVELOPER', 'DESIGNER', 'ADMIN', 'CLIENT']}
          triggerLabel="Add member"
          title="Add a team member"
          description="Admins see finances; developers and designers see delivery only."
        />
      </PageHeader>

      <Suspense fallback={<TableFallback rows={6} />}>
        <TeamTable />
      </Suspense>
    </>
  )
}

async function TeamTable() {
  const people = await listTeam()

  return (
    <Card>
      <CardContent className="px-0 pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Assigned tasks</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {people.map((person) => (
                <TableRow key={person.id}>
                  <TableCell>
                    <span className="flex items-center gap-3">
                      <UserAvatar
                        name={person.name}
                        avatarUrl={person.avatarUrl}
                      />
                      <span className="font-medium">{person.name}</span>
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {person.email}
                  </TableCell>
                  <TableCell>
                    <Badge tone={person.role === 'ADMIN' ? 'info' : 'neutral'}>
                      {ROLE_LABELS[person.role]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {person._count.assignedTasks}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(person.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
