"use client"

import { cn } from "cn"
import { TrendingDownIcon, TrendingUpIcon } from "lucide-react"

import { REVEAL_CLASS, revealStyle } from "@/components/market/reveal"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  HEADLINE_INDICES,
  INDICES,
  formatLevel,
  type IndexId,
  type IndexQuote,
} from "@/lib/market"
import {
  formatSignedPercent,
  formatSignedRupee,
  pillClass,
  toneClass,
} from "@/lib/portfolio"

// Signed index points: reuse the rupee formatter without its currency sign.
function formatPoints(value: number) {
  return formatSignedRupee(value).replace("₹", "")
}

export function SectionCards({
  byId,
  selected,
  onSelect,
}: {
  byId: Map<IndexId, IndexQuote>
  selected: IndexId
  onSelect: (id: IndexId) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      {HEADLINE_INDICES.map((id, position) => {
        const def = INDICES.find((i) => i.id === id)!
        const quote = byId.get(id)
        const Icon =
          quote && quote.change < 0 ? TrendingDownIcon : TrendingUpIcon
        const isSelected = selected === id

        return (
          <Card
            key={id}
            role="button"
            tabIndex={0}
            aria-pressed={isSelected}
            aria-label={`Show ${def.name} on the chart`}
            onClick={() => onSelect(id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                onSelect(id)
              }
            }}
            style={revealStyle(position + 1)}
            className={cn(
              "@container/card cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring",
              REVEAL_CLASS,
              // Press feedback only. The entrance owns transform while it runs
              // (fill-mode-backwards releases it afterwards), so active scale works.
              "[transition:box-shadow_150ms_ease,transform_120ms_cubic-bezier(0.23,1,0.32,1)] active:scale-[0.985] motion-reduce:active:scale-100",
              isSelected && "ring-2 ring-primary/60"
            )}
          >
            <CardHeader>
              <CardDescription>{def.name}</CardDescription>
              {quote ? (
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {formatLevel(quote.level)}
                </CardTitle>
              ) : (
                <Skeleton className="h-8 w-36" />
              )}
              <CardAction>
                {quote ? (
                  <Badge
                    variant="outline"
                    className={cn("tabular-nums", pillClass(quote.change))}
                  >
                    <Icon />
                    {formatSignedPercent(quote.changePct)}
                  </Badge>
                ) : (
                  <Skeleton className="h-5 w-16" />
                )}
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              {quote ? (
                <>
                  <div
                    className={cn(
                      "flex gap-2 font-medium tabular-nums",
                      toneClass(quote.change)
                    )}
                  >
                    {formatPoints(quote.change)} points today
                    <Icon className="size-4" />
                  </div>
                  <div className="text-muted-foreground tabular-nums">
                    Previous close {formatLevel(quote.previousClose)}
                  </div>
                </>
              ) : (
                <>
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-32" />
                </>
              )}
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
