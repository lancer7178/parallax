import { ActivityItem } from '@/components/activity-item'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ActivityRow } from '@/lib/queries'

/** The project's own history — the same log the dashboard feed reads. */
export function ProjectTimeline({ activity }: { activity: ActivityRow[] }) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Activity</CardTitle>
        <p className="text-sm text-muted-foreground">
          What has happened on this project.
        </p>
      </CardHeader>
      <CardContent className="flex-1">
        {activity.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nothing recorded yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {activity.map((entry) => (
              <ActivityItem key={entry.id} entry={entry} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
