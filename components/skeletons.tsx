import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Streaming fallbacks.
 *
 * These are used with an in-page `<Suspense>` rather than a `loading.tsx`, and
 * the distinction matters. A `loading.tsx` puts the Suspense boundary *above*
 * the page, so the response starts streaming before the page body runs — and a
 * streamed response can no longer set its status line. That silently turned
 * `notFound()` into 200 on `/projects/[id]` and every `requireRole()` redirect
 * into a 200 with a client-side hop.
 *
 * Placing the boundary inside the page, below the DAL gate, keeps real 404s and
 * 307s while still streaming the slow database work.
 */
function Busy({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <span className="sr-only" role="status">
        {label}
      </span>
      {children}
    </>
  )
}

export function StatsFallback({ count = 4 }: { count?: number }) {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      aria-busy="true"
    >
      {Array.from({ length: count }, (_, i) => (
        <Card key={i} className="space-y-3 p-5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-3 w-20" />
        </Card>
      ))}
    </div>
  )
}

export function DashboardFallback() {
  return (
    <Busy label="Loading dashboard…">
      <div className="flex flex-col gap-6" aria-busy="true">
        <StatsFallback />
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="space-y-4 p-5 lg:col-span-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-64 w-full" />
          </Card>
          <Card className="space-y-4 p-5">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-64 w-full" />
          </Card>
        </div>
      </div>
    </Busy>
  )
}

export function ProjectCardsFallback({ count = 6 }: { count?: number }) {
  return (
    <Busy label="Loading projects…">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
        {Array.from({ length: count }, (_, i) => (
          <Card key={i} className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-3 w-32" />
          </Card>
        ))}
      </div>
    </Busy>
  )
}

export function TableFallback({
  rows = 6,
  stats = 0,
}: {
  rows?: number
  stats?: number
}) {
  return (
    <Busy label="Loading…">
      <div className="flex flex-col gap-6" aria-busy="true">
        {stats > 0 ? <StatsFallback count={stats} /> : null}
        <Card className="space-y-4 p-5">
          <Skeleton className="h-3 w-full" />
          {Array.from({ length: rows }, (_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </Card>
      </div>
    </Busy>
  )
}

export function BoardFallback() {
  return (
    <Busy label="Loading board…">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" aria-busy="true">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="space-y-2 rounded-xl border border-border bg-muted/40 p-3"
          >
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </Busy>
  )
}
