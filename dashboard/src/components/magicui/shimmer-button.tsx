import { cn } from '@/lib/utils'
import React from 'react'

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string
  borderRadius?: string
  background?: string
  className?: string
  children: React.ReactNode
}

export function ShimmerButton({
  shimmerColor = '#5e6ad2',
  borderRadius = '8px',
  background = 'rgba(255,255,255,0.04)',
  className,
  children,
  ...props
}: ShimmerButtonProps) {
  return (
    <button
      style={{ borderRadius } as React.CSSProperties}
      className={cn(
        'relative flex cursor-pointer items-center justify-center overflow-hidden',
        'whitespace-nowrap px-5 py-2 text-sm font-medium text-white',
        'transition-all duration-300',
        className
      )}
      {...props}
    >
      {/* Animated border */}
      <span
        className='pointer-events-none absolute inset-0'
        style={{
          borderRadius,
          padding: '1px',
          background: `linear-gradient(135deg, ${shimmerColor}88, transparent 50%, ${shimmerColor}44)`,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />
      {/* Background fill */}
      <span
        className='pointer-events-none absolute inset-[1px]'
        style={{ borderRadius: `calc(${borderRadius} - 1px)`, background }}
      />
      {/* Shimmer sweep */}
      <span
        className='pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300'
        style={{
          background: `radial-gradient(ellipse at center, ${shimmerColor}22 0%, transparent 70%)`,
        }}
      />
      <span className='relative z-10 group'>{children}</span>
    </button>
  )
}
