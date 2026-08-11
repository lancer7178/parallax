import { ActivityItem } from '@/components/activity-item'
import { Card } from '@/components/ui/card'
import type { ActivityRow } from '@/lib/queries'

export function ActivityFeed({ activity }: { activity: ActivityRow[] }) {
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="space-y-0.5">
        <h2 className="text-sm font-semibold">Recent activity</h2>
        <p className="text-xs text-muted-foreground">
          What&apos;s happened across the agency lately.
        </p>
      </div>

      {activity.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Nothing yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {activity.map((entry) => (
            <ActivityItem key={entry.id} entry={entry} />
          ))}
        </ul>
      )}
    </Card>
  )
}
