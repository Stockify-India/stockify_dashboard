"use client"

import { TrendingDownIcon, TrendingUpIcon } from "lucide-react"
import { motion, useReducedMotion } from "framer-motion"
import { cn } from "cn"

import { Skeleton } from "@/components/ui/skeleton"
import {
  formatMoney,
  formatSignedPercent,
  formatSignedRupee,
  toneClass,
  type PortfolioTotals,
  type Position,
} from "@/lib/portfolio"

function Change({
  amount,
  percent,
  loading,
}: {
  amount: number
  percent: number | null
  loading: boolean
}) {
  if (loading) return <Skeleton className="h-5 w-32" />
  const Icon = amount < 0 ? TrendingDownIcon : TrendingUpIcon
  return (
    <span
      className={cn(
        "flex flex-wrap items-center gap-x-1.5 text-sm font-medium tabular-nums",
        toneClass(amount)
      )}
    >
      <span className="flex items-center gap-1.5 whitespace-nowrap">
        <Icon className="size-4" />
        {formatSignedRupee(amount)}
      </span>
      <span className="text-xs whitespace-nowrap">
        ({formatSignedPercent(percent)})
      </span>
    </span>
  )
}

export function PortfolioSummary({
  totals,
  loading,
}: {
  totals: PortfolioTotals
  loading: boolean
}) {
  const unpriced = totals.total - totals.priced

  return (
    <div className="flex flex-col gap-5 rounded-2xl border bg-card p-5">
      <div className="flex flex-col gap-1.5">
        <p className="text-sm text-muted-foreground">Current value</p>
        {loading ? (
          <Skeleton className="h-10 w-56" />
        ) : (
          <p className="text-3xl font-semibold tracking-tight tabular-nums md:text-4xl">
            {formatMoney(totals.value)}
          </p>
        )}
        {unpriced > 0 && !loading && (
          <p className="text-xs text-muted-foreground">
            {unpriced} of {totals.total}{" "}
            {unpriced === 1 ? "stock has" : "stocks have"} no live price and{" "}
            {unpriced === 1 ? "is" : "are"} left out of these totals.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 border-t pt-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <p className="text-xs text-muted-foreground">Invested</p>
          {loading ? (
            <Skeleton className="h-5 w-28" />
          ) : (
            <p className="text-sm font-medium tabular-nums">
              {formatMoney(totals.invested)}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="text-xs text-muted-foreground">Total profit and loss</p>
          <Change
            amount={totals.pnl}
            percent={totals.pnlPct}
            loading={loading}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="text-xs text-muted-foreground">Today</p>
          <Change
            amount={totals.dayChange}
            percent={totals.dayChangePct}
            loading={loading}
          />
        </div>
      </div>
    </div>
  )
}

const SEGMENT_OPACITY = [
  "opacity-100",
  "opacity-75",
  "opacity-55",
  "opacity-40",
  "opacity-25",
  "opacity-15",
]
const MAX_SEGMENTS = 5

export function AllocationPanel({ positions }: { positions: Position[] }) {
  const reduceMotion = useReducedMotion()
  const weighted = positions
    .map((p) => ({ symbol: p.symbol, amount: p.value ?? p.invested }))
    .sort((a, b) => b.amount - a.amount)
  const total = weighted.reduce((sum, p) => sum + p.amount, 0)

  const top = weighted.slice(0, MAX_SEGMENTS)
  const rest = weighted.slice(MAX_SEGMENTS)
  const slices = [
    ...top,
    ...(rest.length > 0
      ? [
          {
            symbol: `${rest.length} others`,
            amount: rest.reduce((s, p) => s + p.amount, 0),
          },
        ]
      : []),
  ].map((s) => ({ ...s, weight: total > 0 ? (s.amount / total) * 100 : 0 }))

  return (
    <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5">
      <p className="text-sm font-medium">Allocation</p>

      <div
        className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full"
        role="img"
        aria-label="Portfolio allocation by stock"
      >
        {slices.map((slice, i) => (
          // Each segment grows from its left edge in sequence, so the bar
          // reads as the portfolio being divided up. Entrance only: later
          // price ticks change widths without replaying it.
          <motion.div
            key={slice.symbol}
            initial={reduceMotion ? false : { transform: "scaleX(0)" }}
            animate={{ transform: "scaleX(1)" }}
            transition={{
              duration: 0.5,
              delay: 0.15 + i * 0.05,
              ease: [0.23, 1, 0.32, 1],
            }}
            className={cn(
              "h-full origin-left bg-foreground",
              SEGMENT_OPACITY[i]
            )}
            style={{ width: `${slice.weight}%` }}
          />
        ))}
      </div>

      <ul className="flex flex-col gap-2">
        {slices.map((slice, i) => (
          <li key={slice.symbol} className="flex items-center gap-2.5 text-sm">
            <span
              className={cn(
                "size-2.5 shrink-0 rounded-sm bg-foreground",
                SEGMENT_OPACITY[i]
              )}
            />
            <span
              className={cn(
                "truncate",
                slice.symbol.includes("others")
                  ? "text-muted-foreground"
                  : "font-mono font-medium"
              )}
            >
              {slice.symbol}
            </span>
            <span className="ml-auto text-muted-foreground tabular-nums">
              {slice.weight.toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
