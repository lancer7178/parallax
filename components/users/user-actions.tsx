'use client'

import { MoreHorizontalIcon, TrashIcon } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DeleteUserDialog } from '@/components/users/delete-user-dialog'

interface Client {
  id: string
  name: string
}

export function UserActions({
  user,
  otherClients,
}: {
  user: { id: string; name: string }
  otherClients?: Client[]
}) {
  const [deleteOpen, setDeleteOpen] = React.useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8">
            <span className="sr-only">Open menu</span>
            <MoreHorizontalIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <TrashIcon className="mr-2" />
            Delete {otherClients !== undefined ? 'client' : 'member'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteUserDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        userId={user.id}
        userName={user.name}
        otherClients={otherClients}
      />
    </>
  )
}
