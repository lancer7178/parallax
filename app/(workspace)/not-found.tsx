import { SearchXIcon } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

/**
 * Keeps `notFound()` inside the workspace shell — without this, a missing or
 * out-of-scope project dropped the user onto the bare root 404 with no nav.
 */
export default function WorkspaceNotFound() {
  return (
    <Card className="flex flex-col items-center gap-3 p-12 text-center">
      <span className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <SearchXIcon className="size-5" />
      </span>
      <h1 className="text-lg font-semibold">We couldn&apos;t find that</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        It may have been removed, or it isn&apos;t part of the work you have
        access to.
      </p>
      <Button asChild className="mt-2">
        <Link href="/">Back to your workspace</Link>
      </Button>
    </Card>
  )
}
