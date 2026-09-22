"use client"

import { useMemo, useState } from "react"
import { Area, AreaChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { InfoIcon, UsersIcon } from "lucide-react"
import { cn } from "cn"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  AMBER,
  ChartCard,
  EMERALD,
  InsightNote,
  ROSE,
  SKY,
  VIOLET,
} from "@/components/company-analysis/company-charts"
import { EmptyPanel } from "@/components/company-analysis/company-tab-nav"
import type { ShareholdingCategory, ShareholdingHistory, ShareholdingPoint } from "@/lib/shareholding"

const STAGGER_ITEM =
  "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 fill-mode-backwards duration-300"

function staggerDelay(index: number) {
  return { animationDelay: `${index * 40}ms` }
}

const CATEGORIES: { key: ShareholdingCategory; label: string; color: string }[] = [
  { key: "promoters", label: "Promoters", color: EMERALD },
  { key: "foreign_institutions", label: "FIIs", color: SKY },
  { key: "domestic_institutions", label: "DIIs", color: VIOLET },
  { key: "government", label: "Government", color: ROSE },
  { key: "public", label: "Public", color: AMBER },
]

const shareholdingConfig: ChartConfig = CATEGORIES.reduce<ChartConfig>((acc, cat) => {
  acc[cat.label] = { label: cat.label, color: cat.color }
  return acc
}, {})

const fiiDiiPromoterConfig: ChartConfig = {
  Promoters: { label: "Promoters", color: EMERALD },
  FIIs: { label: "FIIs", color: SKY },
  DIIs: { label: "DIIs", color: VIOLET },
}

function formatShareholders(value: number | null): string {
  if (value === null) return "—"
  return value.toLocaleString("en-IN")
}

function formatPct(value: number | null): string {
  if (value === null) return "—"
  return `${value.toFixed(2)}%`
}

function seriesFor(points: ShareholdingPoint[], key: ShareholdingCategory): number[] {
  return points.map((p) => p[key] ?? 0)
}

function domainWithPadding(values: number[], padding: number): [number, number] {
  if (values.length === 0) return [0, 100]
  return [Math.floor(Math.min(...values) - padding), Math.ceil(Math.max(...values) + padding)]
}

// Only fires when DII holding genuinely overtakes FII holding somewhere in
// the window, and the underlying trend is a real decline/rise on both sides
// — not just a one-quarter wobble.
function buildFiiDiiCrossoverInsight(points: ShareholdingPoint[]): string | null {
  const fii = seriesFor(points, "foreign_institutions")
  const dii = seriesFor(points, "domestic_institutions")
  if (fii.length < 2) return null

  let crossoverIndex: number | null = null
  for (let i = 1; i < fii.length; i++) {
    if (fii[i - 1] >= dii[i - 1] && fii[i] < dii[i]) {
      crossoverIndex = i
      break
    }
  }
  if (crossoverIndex === null) return null

  const fiiStart = fii[0]
  const fiiEnd = fii[fii.length - 1]
  const diiStart = dii[0]
  const diiEnd = dii[dii.length - 1]
  if (fiiEnd >= fiiStart || diiEnd <= diiStart) return null

  const period = points[crossoverIndex].quarter
  return `DII holding overtook FII holding for the first time in this window in ${period} (DII ${dii[crossoverIndex].toFixed(2)}% vs. FII ${fii[crossoverIndex].toFixed(2)}%). FIIs have fallen from ${fiiStart.toFixed(2)}% to ${fiiEnd.toFixed(2)}% while DIIs rose from ${diiStart.toFixed(2)}% to ${diiEnd.toFixed(2)}% over the same period — a classic "FIIs selling, domestic institutions absorbing" pattern worth tracking as a standing signal.`
}

function FiiDiiPromoterTrendChart({ points }: { points: ShareholdingPoint[] }) {
  const data = points.map((p) => ({
    period: p.quarter,
    Promoters: p.promoters ?? 0,
    FIIs: p.foreign_institutions ?? 0,
    DIIs: p.domestic_institutions ?? 0,
  }))

  const promoterDomain = domainWithPadding(seriesFor(points, "promoters"), 1)
  const fiiDiiDomain = domainWithPadding(
    [...seriesFor(points, "foreign_institutions"), ...seriesFor(points, "domestic_institutions")],
    1
  )
  const insight = buildFiiDiiCrossoverInsight(points)

  return (
    <ChartCard
      title="Promoters vs. FIIs vs. DIIs"
      sub="% of total shares held, by quarter — promoters on the left axis, FIIs/DIIs on the right"
    >
      <ChartContainer config={fiiDiiPromoterConfig} className="aspect-auto h-64 w-full">
        <LineChart data={data} margin={{ left: 4, right: 4, top: 4 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="period" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
          <YAxis
            yAxisId="left"
            tickLine={false}
            axisLine={false}
            width={40}
            domain={promoterDomain}
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tickLine={false}
            axisLine={false}
            width={40}
            domain={fiiDiiDomain}
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 11 }}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="Promoters"
            stroke="var(--color-Promoters)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="FIIs"
            stroke="var(--color-FIIs)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="DIIs"
            stroke="var(--color-DIIs)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ChartContainer>
      {insight && <InsightNote>{insight}</InsightNote>}
    </ChartCard>
  )
}

function ShareholdingTable({ points }: { points: ShareholdingPoint[] }) {
  const stickyColClass =
    "sticky left-0 z-10 bg-background shadow-[6px_0_8px_-6px_rgba(0,0,0,0.12)] dark:shadow-[6px_0_8px_-6px_rgba(0,0,0,0.5)]"

  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className={cn(stickyColClass, "min-w-[150px]")}>Category</TableHead>
            {points.map((p) => (
              <TableHead key={p.quarter} className="min-w-[84px] text-right font-mono">
                {p.quarter}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {CATEGORIES.map((cat, rowIndex) => (
            <TableRow key={cat.key} className={STAGGER_ITEM} style={staggerDelay(rowIndex)}>
              <TableCell className={cn(stickyColClass, "font-medium text-foreground/80")}>
                {cat.label}
              </TableCell>
              {points.map((p) => (
                <TableCell key={p.quarter} className="text-right tabular-nums">
                  {formatPct(p[cat.key])}
                </TableCell>
              ))}
            </TableRow>
          ))}
          <TableRow className={STAGGER_ITEM} style={staggerDelay(CATEGORIES.length)}>
            <TableCell className={cn(stickyColClass, "font-medium text-foreground/80")}>
              No. of Shareholders
            </TableCell>
            {points.map((p) => (
              <TableCell key={p.quarter} className="text-right tabular-nums">
                {formatShareholders(p.numShareholders)}
              </TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}

export function ShareholdingPanel({ history }: { history: ShareholdingHistory }) {
  const hasQuarterly = history.quarterly.length > 0
  const hasYearly = history.yearly.length > 0
  const [view, setView] = useState<"quarterly" | "yearly">(hasQuarterly ? "quarterly" : "yearly")

  const points = view === "yearly" ? history.yearly : history.quarterly

  const chartData = useMemo(
    () =>
      points.map((p) => {
        const point: Record<string, string | number> = { period: p.quarter }
        for (const cat of CATEGORIES) point[cat.label] = p[cat.key] ?? 0
        return point
      }),
    [points]
  )

  if (!hasQuarterly && !hasYearly) {
    return (
      <EmptyPanel
        icon={UsersIcon}
        title="No shareholding data"
        description="Shareholding pattern disclosures haven't been synced from the exchange yet for this company."
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <FiiDiiPromoterTrendChart points={points} />

      <ChartCard
        title="Shareholding pattern"
        sub="% of total shares held, by category"
        action={
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Badge variant="secondary" className="gap-1 text-[11px]">
                    <InfoIcon className="size-3" />
                    Recent trades
                  </Badge>
                }
              />
              <TooltipContent className="max-w-56 text-xs">
                Promoter and institutional stakes can move between disclosure
                windows from open-market trades, block deals, or pledges.
              </TooltipContent>
            </Tooltip>
            {hasQuarterly && hasYearly && (
              <div className="inline-flex shrink-0 rounded-lg border bg-muted/40 p-0.5">
                {(["quarterly", "yearly"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setView(option)}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                      view === option
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        }
      >
        <ChartContainer config={shareholdingConfig} className="aspect-auto h-64 w-full">
          <AreaChart data={chartData} margin={{ left: 4, right: 4, top: 4 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="period" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={40}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 11 }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            {CATEGORIES.map((cat) => (
              <Area
                key={cat.key}
                type="monotone"
                dataKey={cat.label}
                stackId="holding"
                stroke={`var(--color-${cat.label})`}
                fill={`var(--color-${cat.label})`}
                fillOpacity={0.75}
              />
            ))}
          </AreaChart>
        </ChartContainer>
      </ChartCard>

      <ShareholdingTable points={points} />

      <p className="px-1 text-xs text-muted-foreground">
        * Classifications reflect each company&apos;s most recent shareholding disclosure and may
        change between filing windows.
      </p>
    </div>
  )
}
