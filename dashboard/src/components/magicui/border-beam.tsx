import { cn } from '@/lib/utils'
import React from 'react'

interface BorderBeamProps {
  className?: string
  duration?: number
  delay?: number
  colorFrom?: string
  colorTo?: string
}

export function BorderBeam({
  className,
  duration = 8,
  delay = 0,
  colorFrom = '#5e6ad2',
  colorTo = 'transparent',
}: BorderBeamProps) {
  return (
    <span
      style={
        {
          '--duration': `${duration}s`,
          '--delay': `-${delay}s`,
          '--color-from': colorFrom,
          '--color-to': colorTo,
        } as React.CSSProperties
      }
      className={cn(
        'pointer-events-none absolute inset-0 rounded-[inherit]',
        '[border:1px_solid_transparent]',
        '[background:linear-gradient(var(--color-from),var(--color-to))_border-box]',
        '[mask:linear-gradient(#fff_0_0)_padding-box,linear-gradient(#fff_0_0)]',
        '[mask-composite:exclude]',
        'animate-border-beam-fade',
        className
      )}
    />
  )
}
