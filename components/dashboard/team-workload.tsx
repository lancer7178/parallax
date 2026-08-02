import { UsersIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { UserAvatar } from '@/components/user-avatar'
import type { WorkloadRow } from '@/lib/queries'
import { ROLE_LABELS } from '@/lib/rbac'

export function TeamWorkload({ workload }: { workload: WorkloadRow[] }) {
  const busiest = Math.max(1, ...workload.map((person) => person.openTasks))

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="space-y-0.5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <UsersIcon className="size-4 text-muted-foreground" />
          Team workload
        </h2>
        <p className="text-xs text-muted-foreground">
          Open tasks assigned to each person right now.
        </p>
      </div>

      {workload.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Nobody has open tasks.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {workload.map((person) => (
            <li key={person.id} className="flex items-center gap-3">
              <UserAvatar
                name={person.name}
                avatarUrl={person.avatarUrl}
                className="shrink-0"
              />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate font-medium">{person.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {person.openTasks} open
                  </span>
                </div>
                <Progress value={(person.openTasks / busiest) * 100} />
              </div>
              <Badge
                tone={person.role === 'ADMIN' ? 'info' : 'neutral'}
                className="shrink-0"
              >
                {ROLE_LABELS[person.role]}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
