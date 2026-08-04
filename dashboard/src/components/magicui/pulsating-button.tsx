import { cn } from "@/lib/utils"

interface PulsatingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  pulseColor?: string
  duration?: string
}

export function PulsatingButton({
  className,
  children,
  pulseColor = "#5e6ad2",
  duration = "1.5s",
  ...props
}: PulsatingButtonProps) {
  return (
    <button
      className={cn("relative flex cursor-pointer items-center justify-center rounded-full", className)}
      style={{ "--pulse-color": pulseColor, "--duration": duration } as React.CSSProperties}
      {...props}
    >
      <div className="relative z-10 flex items-center justify-center">{children}</div>
      <div
        className="absolute size-full animate-ping rounded-full opacity-75"
        style={{ backgroundColor: pulseColor, animationDuration: duration }}
      />
    </button>
  )
}
