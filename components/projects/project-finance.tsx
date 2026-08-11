import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { ProjectFinance as ProjectFinanceData } from '@/lib/finance'
import { cn, formatCurrency } from '@/lib/utils'

function Figure({
  label,
  value,
  hint,
  tone,
}: {
  label: string
  value: string
  hint?: string
  tone?: 'default' | 'warning' | 'danger' | 'success'
}) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd
        className={cn(
          'text-xl font-semibold tabular-nums',
          tone === 'danger' && 'text-destructive',
          tone === 'warning' && 'text-warning',
          tone === 'success' && 'text-success'
        )}
      >
        {value}
      </dd>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

/**
 * The project's money in one block: what was agreed, what has been billed,
 * what has landed, and what is still owed. Rendered only when the caller has
 * already established the viewer may see it — `finance` is `null` otherwise.
 */
export function ProjectFinanceCard({
  finance,
  progress,
}: {
  finance: ProjectFinanceData
  progress: number
}) {
  const { budget, invoiced, paid, outstanding, overdue, burn } = finance

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial overview</CardTitle>
        <p className="text-sm text-muted-foreground">
          Budget, billing and collection for this project.
        </p>
      </CardHeader>

      <CardContent className="space-y-5">
        <dl className="grid grid-cols-2 gap-5 sm:grid-cols-4">
          <Figure
            label="Budget"
            value={budget ? formatCurrency(budget) : 'Not set'}
            hint={
              finance.remaining !== null
                ? `${formatCurrency(Math.max(finance.remaining, 0))} left to bill`
                : undefined
            }
          />
          <Figure
            label="Invoiced"
            value={formatCurrency(invoiced)}
            hint={burn !== null ? `${burn}% of budget` : 'Drafts excluded'}
          />
          <Figure
            label="Paid"
            value={formatCurrency(paid)}
            tone={paid > 0 ? 'success' : 'default'}
            hint={
              invoiced > 0
                ? `${Math.round((paid / invoiced) * 100)}% collected`
                : 'Nothing billed yet'
            }
          />
          <Figure
            label="Outstanding"
            value={formatCurrency(outstanding)}
            tone={overdue > 0 ? 'danger' : outstanding > 0 ? 'warning' : 'default'}
            hint={
              overdue > 0 ? `${formatCurrency(overdue)} overdue` : 'Nothing overdue'
            }
          />
        </dl>

        {/* Budget burn against delivery progress — the pair that says whether
            the money and the work are moving at the same rate. */}
        {burn !== null ? (
          <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Budget invoiced</span>
                <span className="font-medium tabular-nums">{burn}%</span>
              </div>
              <Progress
                value={Math.min(burn, 100)}
                aria-label="Share of budget invoiced"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Work complete</span>
                <span className="font-medium tabular-nums">{progress}%</span>
              </div>
              <Progress value={progress} aria-label="Share of tasks complete" />
            </div>
            {burn > progress + 10 ? (
              <p className="text-xs text-muted-foreground">
                Billing is running {burn - progress} points ahead of delivery.
              </p>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
