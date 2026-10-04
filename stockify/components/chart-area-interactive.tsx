"use client"

import * as React from "react"
import { useReducedMotion } from "framer-motion"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  CHART_RANGES,
  INDICES,
  buildSeries,
  formatLevel,
  type ChartRange,
  type IndexId,
  type IndexQuote,
} from "@/lib/market"
import { EMERALD, ROSE } from "@/components/company-analysis/company-charts"
import { formatSignedPercent, toneClass } from "@/lib/portfolio"

const SELECT_ITEMS = INDICES.map((i) => ({ value: i.id, label: i.name }))

export function ChartAreaInteractive({
  quote,
  selected,
  onSelect,
}: {
  quote: IndexQuote | undefined
  selected: IndexId
  onSelect: (id: IndexId) => void
}) {
  const [range, setRange] = React.useState<ChartRange>("1D")
  const reduceMotion = useReducedMotion()
  const def = INDICES.find((i) => i.id === selected)!

  const series = React.useMemo(
    () => (quote ? buildSeries(quote, range) : []),
    [quote, range]
  )
  const first = series[0]?.value
  const last = series.at(-1)?.value
  const rangeChange = first && last ? ((last - first) / first) * 100 : null
  const isUp = rangeChange === null || rangeChange >= 0
  const color = isUp ? EMERALD : ROSE

  const chartConfig = {
    value: { label: def.name, color },
  } satisfies ChartConfig

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>{def.name}</CardTitle>
        <CardDescription className={toneClass(rangeChange)}>
          {rangeChange === null
            ? "Loading"
            : `${formatSignedPercent(rangeChange)} over ${CHART_RANGES.find((r) => r.value === range)!.label}`}
        </CardDescription>
        <CardAction className="flex flex-wrap items-center justify-end gap-2 max-sm:col-start-1 max-sm:row-span-1 max-sm:row-start-3 max-sm:mt-2 max-sm:justify-self-start">
          <Select
            items={SELECT_ITEMS}
            value={selected}
            onValueChange={(value) => {
              if (value !== null) onSelect(value as IndexId)
            }}
          >
            <SelectTrigger
              size="sm"
              className="w-44"
              aria-label="Choose an index or sector"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl" alignItemWithTrigger={false}>
              {SELECT_ITEMS.map((item) => (
                <SelectItem
                  key={item.value}
                  value={item.value}
                  className="rounded-lg"
                >
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ToggleGroup
            multiple={false}
            value={[range]}
            onValueChange={(value) => {
              if (value[0]) setRange(value[0] as ChartRange)
            }}
            variant="outline"
            size="sm"
            aria-label="Chart range"
          >
            {CHART_RANGES.map((r) => (
              <ToggleGroupItem
                key={r.value}
                value={r.value}
                aria-label={r.label}
              >
                {r.value}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {quote ? (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[280px] w-full"
          >
            <AreaChart data={series} margin={{ left: 4, right: 4 }}>
              <defs>
                <linearGradient id="fillIndex" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-value)"
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-value)"
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={48}
              />
              <YAxis
                orientation="right"
                width={64}
                tickLine={false}
                axisLine={false}
                domain={["dataMin", "dataMax"]}
                tickFormatter={(v: number) =>
                  v.toLocaleString("en-IN", { maximumFractionDigits: 0 })
                }
              />
              {range === "1D" && (
                <ReferenceLine
                  y={quote.previousClose}
                  stroke="var(--muted-foreground)"
                  strokeDasharray="4 4"
                />
              )}
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    formatter={(value) => (
                      <span className="font-mono font-medium tabular-nums">
                        {formatLevel(Number(value))}
                      </span>
                    )}
                  />
                }
              />
              <Area
                dataKey="value"
                type="monotone"
                fill="url(#fillIndex)"
                stroke="var(--color-value)"
                strokeWidth={2}
                isAnimationActive={!reduceMotion}
                animationDuration={400}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <Skeleton className="h-[280px] w-full" />
        )}
      </CardContent>
    </Card>
  )
}
