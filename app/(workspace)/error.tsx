'use client'

import { AlertTriangleIcon } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <Card className="flex flex-col items-center gap-3 p-10 text-center">
      <span className="flex size-10 items-center justify-center rounded-lg bg-destructive/12 text-destructive">
        <AlertTriangleIcon className="size-5" />
      </span>
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        {/* The message is safe to show: Server Actions here throw only
            deliberate, non-sensitive errors. */}
        {error.message || 'This view could not be loaded.'}
      </p>
      <Button onClick={reset} className="mt-2">
        Try again
      </Button>
    </Card>
  )
}
