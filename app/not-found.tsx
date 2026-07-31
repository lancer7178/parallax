import Link from 'next/link'

import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="font-mono text-sm text-muted-foreground">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">
        We couldn&apos;t find that page
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        It may have been removed, or you may not have access to it.
      </p>
      <Button asChild className="mt-2">
        <Link href="/">Back to your workspace</Link>
      </Button>
    </main>
  )
}
