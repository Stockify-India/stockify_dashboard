"use client"

import { cn } from "cn"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  INDICES,
  MAX_HEAT_PCT,
  formatLevel,
  type IndexId,
  type IndexQuote,
} from "@/lib/market"
import { formatSignedPercent } from "@/lib/portfolio"

// Tint strength tops out below full opacity so the foreground text keeps
// at least 4.5:1 contrast against the tile in both themes.
function tileColor(changePct: number) {
  const strength = Math.min(Math.abs(changePct) / MAX_HEAT_PCT, 1)
  const hue =
    changePct >= 0 ? "var(--color-emerald-500)" : "var(--color-rose-500)"
  return `color-mix(in oklch, ${hue} ${Math.round(8 + strength * 22)}%, transparent)`
}

export function IndexHeatmap({
  byId,
  selected,
  onSelect,
}: {
  byId: Map<IndexId, IndexQuote>
  selected: IndexId
  onSelect: (id: IndexId) => void
}) {
  const ready = byId.size > 0

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Index heatmap</CardTitle>
        <CardDescription>
          Change from previous close. Select a tile to chart it.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="grid h-full grid-cols-2 gap-1.5 @[420px]/card:grid-cols-3">
          {INDICES.map((index) => {
            const quote = byId.get(index.id)
            if (!ready || !quote)
              return <Skeleton key={index.id} className="min-h-20 rounded-lg" />
            const isSelected = selected === index.id
            return (
              <button
                key={index.id}
                type="button"
                aria-pressed={isSelected}
                aria-label={`${index.name}, ${formatSignedPercent(quote.changePct)}`}
                onClick={() => onSelect(index.id)}
                style={{ backgroundColor: tileColor(quote.changePct) }}
                className={cn(
                  "flex min-h-20 flex-col justify-between rounded-lg p-2.5 text-left outline-none",
                  "transition-[background-color,box-shadow] duration-700 ease-out motion-reduce:transition-none",
                  "focus-visible:ring-2 focus-visible:ring-ring active:translate-y-px",
                  isSelected
                    ? "ring-2 ring-foreground/70"
                    : "ring-1 ring-foreground/10 hover:ring-foreground/30"
                )}
              >
                <span className="text-xs font-medium">{index.short}</span>
                <span className="flex flex-col">
                  <span className="text-sm font-semibold tabular-nums">
                    {formatSignedPercent(quote.changePct)}
                  </span>
                  <span className="text-[11px] text-foreground/75 tabular-nums">
                    {formatLevel(quote.level)}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
