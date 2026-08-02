import { TargetIcon } from 'lucide-react'

import { GoalsEditDialog } from '@/components/dashboard/goals-edit-dialog'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { SessionUser } from '@/lib/dal'
import type { GoalProgress } from '@/lib/queries'
import { canManageGoals } from '@/lib/rbac'
import { formatCurrency } from '@/lib/utils'

function formatGoalValue(format: GoalProgress['format'], value: number) {
  if (format === 'currency') return formatCurrency(value)
  if (format === 'percent') return `${Math.round(value)}%`
  return String(Math.round(value))
}

export function GoalsPanel({
  goals,
  user,
}: {
  goals: GoalProgress[]
  user: SessionUser
}) {
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-0.5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <TargetIcon className="size-4 text-muted-foreground" />
            Targets
          </h2>
          <p className="text-xs text-muted-foreground">
            This month against agency-wide goals.
          </p>
        </div>
        {canManageGoals(user.role) ? <GoalsEditDialog goals={goals} /> : null}
      </div>

      <ul className="flex flex-col gap-4">
        {goals.map((goal) => {
          const pct =
            goal.target > 0
              ? Math.min(100, Math.round((goal.current / goal.target) * 100))
              : 0

          return (
            <li key={goal.key} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="font-medium">{goal.label}</span>
                <span className="text-muted-foreground tabular-nums">
                  {formatGoalValue(goal.format, goal.current)} /{' '}
                  {formatGoalValue(goal.format, goal.target)}
                </span>
              </div>
              <Progress
                value={pct}
                indicatorClassName={pct >= 100 ? 'bg-success' : undefined}
              />
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
