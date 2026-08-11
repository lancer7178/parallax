'use client'

import * as ProgressPrimitive from '@radix-ui/react-progress'
import * as React from 'react'

import { cn } from '@/lib/utils'

function Progress({
  className,
  value = 0,
  indicatorClassName,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  indicatorClassName?: string
}) {
  return (
    <ProgressPrimitive.Root
      className={cn(
        'relative h-2 w-full overflow-hidden rounded-full bg-secondary',
        className
      )}
      value={value}
      {...props}
    >
      {/* Sized rather than translated. `translateX` is a physical transform,
          so a translated indicator fills from the left even under `dir="rtl"`
          — a width grows from the inline start in whichever direction that
          happens to be. */}
      <ProgressPrimitive.Indicator
        className={cn(
          'h-full rounded-full bg-primary transition-[width] duration-500',
          indicatorClassName
        )}
        style={{ width: `${Math.min(Math.max(value ?? 0, 0), 100)}%` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
