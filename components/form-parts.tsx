'use client'

import { Loader2Icon } from 'lucide-react'
import * as React from 'react'
import { useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/** Submit button wired to the enclosing `<form>`'s pending state. */
export function SubmitButton({
  children,
  className,
  pendingLabel,
  ...props
}: React.ComponentProps<typeof Button> & { pendingLabel?: string }) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending} className={className} {...props}>
      {pending ? (
        <>
          <Loader2Icon className="animate-spin" />
          {pendingLabel ?? 'Saving…'}
        </>
      ) : (
        children
      )}
    </Button>
  )
}

export function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null
  return (
    <p className="text-xs text-destructive" role="alert">
      {messages[0]}
    </p>
  )
}

export function FormMessage({
  ok,
  children,
  className,
}: {
  ok?: boolean
  children?: React.ReactNode
  className?: string
}) {
  if (!children) return null
  return (
    <p
      role="status"
      className={cn(
        'rounded-md border px-3 py-2 text-sm',
        ok
          ? 'border-success/30 bg-success/10 text-success'
          : 'border-destructive/30 bg-destructive/10 text-destructive',
        className
      )}
    >
      {children}
    </p>
  )
}
