import type { CSSProperties, ReactNode } from "react"
import { cn } from "cn"

// One entrance per page load: a short fade and 8px rise, staggered by 50ms.
// Runs once on mount (the wrappers never remount), so live data ticks do not
// replay it. tw-animate-css supplies the keyframes; the curve is the strong
// ease-out because the built-in one is too weak for a deliberate entrance.
export const REVEAL_CLASS =
  "animate-in fade-in-0 slide-in-from-bottom-2 duration-300 fill-mode-backwards motion-reduce:animate-none"

const STAGGER_MS = 50

export function revealStyle(index: number): CSSProperties {
  return {
    animationDelay: `${index * STAGGER_MS}ms`,
    animationTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
  }
}

export function Reveal({
  index,
  className,
  children,
}: {
  index: number
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn(REVEAL_CLASS, className)} style={revealStyle(index)}>
      {children}
    </div>
  )
}
