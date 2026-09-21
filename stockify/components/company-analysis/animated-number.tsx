"use client"

import { useEffect, useRef } from "react"
import { animate, useMotionValue, useReducedMotion } from "framer-motion"

const EASE = [0.16, 1, 0.3, 1] as const

/**
 * Ticks a numeric value from its previous reading to the next, the way a
 * terminal quote updates in place. Used for the handful of headline metrics
 * (ROCE, EPS, latest-quarter figures) — not for dense statement tables,
 * where dozens of concurrent tweens would hurt scanability and cost more
 * than they communicate.
 */
export function AnimatedNumber({
  value,
  format,
  className,
}: {
  value: number | null
  format: (n: number) => string
  className?: string
}) {
  const spanRef = useRef<HTMLSpanElement>(null)
  const motionValue = useMotionValue(value ?? 0)
  const hasMounted = useRef(false)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    if (value === null) return

    if (prefersReducedMotion) {
      motionValue.set(value)
      if (spanRef.current) spanRef.current.textContent = format(value)
      hasMounted.current = true
      return
    }

    const from = hasMounted.current ? motionValue.get() : 0
    motionValue.set(from)
    const controls = animate(motionValue, value, {
      duration: 0.8,
      ease: EASE,
      onUpdate: (latest) => {
        if (spanRef.current) spanRef.current.textContent = format(latest)
      },
    })
    hasMounted.current = true
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, prefersReducedMotion])

  return (
    <span ref={spanRef} className={className}>
      {value !== null ? format(value) : "—"}
    </span>
  )
}

/** Same tween, applied to both ends of a low–high range in lockstep. */
export function AnimatedRange({
  low,
  high,
  format,
  className,
}: {
  low: number | null
  high: number | null
  format: (n: number) => string
  className?: string
}) {
  if (low === null || high === null) {
    return <span className={className}>—</span>
  }
  return (
    <span className={className}>
      <AnimatedNumber value={low} format={format} /> – <AnimatedNumber value={high} format={format} />
    </span>
  )
}
