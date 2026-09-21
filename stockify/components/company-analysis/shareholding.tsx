"use client"

import { useState } from "react"
import { Area, AreaChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { InfoIcon } from "lucide-react"
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

const STAGGER_ITEM =
  "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 fill-mode-backwards duration-300"

function staggerDelay(index: number) {
  return { animationDelay: `${index * 40}ms` }
}

// Screener-style shareholding pattern disclosure — hardcoded per the user's
// pasted figures, since this isn't backed by a synced `shareholding` row yet.
const PERIODS = [
  "Sep 2023",
  "Dec 2023",
  "Mar 2024",
  "Jun 2024",
  "Sep 2024",
  "Dec 2024",
  "Mar 2025",
  "Jun 2025",
  "Sep 2025",
  "Dec 2025",
  "Mar 2026",
  "Jun 2026",
] as const

const YEARLY_INDICES = PERIODS.reduce<number[]>((acc, period, index) => {
  if (period.startsWith("Mar")) acc.push(index)
  return acc
}, [])

type Category = "Promoters" | "FIIs" | "DIIs" | "Government" | "Public"

const ROWS: { category: Category; values: number[] }[] = [
  { category: "Promoters", values: [72.30, 72.41, 71.77, 71.77, 71.77, 71.77, 71.77, 71.77, 71.77, 71.77, 71.77, 71.77] },
  { category: "FIIs", values: [12.47, 12.46, 12.70, 12.35, 12.66, 12.68, 12.04, 11.48, 10.33, 10.37, 9.66, 9.07] },
  { category: "DIIs", values: [10.01, 10.03, 10.61, 11.00, 10.86, 10.86, 11.49, 11.95, 12.64, 12.81, 13.34, 13.41] },
  { category: "Government", values: [0.05, 0.05, 0.06, 0.06, 0.06, 0.06, 0.06, 0.06, 0.06, 0.06, 0.06, 0.06] },
  { category: "Public", values: [5.17, 5.03, 4.86, 4.82, 4.66, 4.63, 4.63, 4.77, 5.21, 4.98, 5.16, 5.69] },
]

const SHAREHOLDERS = [
  "23,67,003",
  "23,36,016",
  "22,03,209",
  "21,81,391",
  "20,93,962",
  "20,75,117",
  "21,15,093",
  "21,64,289",
  "23,88,232",
  "23,32,275",
  "24,50,090",
  "26,05,182",
]

const shareholdingConfig: ChartConfig = {
  Promoters: { label: "Promoters", color: EMERALD },
  FIIs: { label: "FIIs", color: SKY },
  DIIs: { label: "DIIs", color: VIOLET },
  Government: { label: "Government", color: ROSE },
  Public: { label: "Public", color: AMBER },
}

function buildChartData(indices: number[]) {
  return indices.map((i) => {
    const point: Record<string, string | number> = { period: PERIODS[i] }
    for (const row of ROWS) point[row.category] = row.values[i]
    return point
  })
}

const fiiDiiPromoterConfig: ChartConfig = {
  Promoters: { label: "Promoters", color: EMERALD },
  FIIs: { label: "FIIs", color: SKY },
  DIIs: { label: "DIIs", color: VIOLET },
}

function seriesFor(category: Category) {
  return ROWS.find((row) => row.category === category)!.values
}

function domainWithPadding(values: number[], padding: number): [number, number] {
  return [Math.floor(Math.min(...values) - padding), Math.ceil(Math.max(...values) + padding)]
}

// Only fires when DII holding genuinely overtakes FII holding somewhere in
// the window, and the underlying trend is a real decline/rise on both sides
// — not just a one-quarter wobble.
function buildFiiDiiCrossoverInsight() {
  const fii = seriesFor("FIIs")
  const dii = seriesFor("DIIs")

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

  return `DII holding overtook FII holding for the first time in this window in ${PERIODS[crossoverIndex]} (DII ${dii[crossoverIndex].toFixed(2)}% vs. FII ${fii[crossoverIndex].toFixed(2)}%). FIIs have fallen from ${fiiStart.toFixed(2)}% to ${fiiEnd.toFixed(2)}% while DIIs rose from ${diiStart.toFixed(2)}% to ${diiEnd.toFixed(2)}% over the same period — a classic "FIIs selling, domestic institutions absorbing" pattern worth tracking as a standing signal.`
}

function FiiDiiPromoterTrendChart() {
  const data = PERIODS.map((period, i) => ({
    period,
    Promoters: ROWS[0].values[i],
    FIIs: ROWS[1].values[i],
    DIIs: ROWS[2].values[i],
  }))

  const promoterDomain = domainWithPadding(seriesFor("Promoters"), 1)
  const fiiDiiDomain = domainWithPadding([...seriesFor("FIIs"), ...seriesFor("DIIs")], 1)
  const insight = buildFiiDiiCrossoverInsight()

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

function ShareholdingTable({ indices }: { indices: number[] }) {
  const stickyColClass =
    "sticky left-0 z-10 bg-background shadow-[6px_0_8px_-6px_rgba(0,0,0,0.12)] dark:shadow-[6px_0_8px_-6px_rgba(0,0,0,0.5)]"

  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className={cn(stickyColClass, "min-w-[150px]")}>Category</TableHead>
            {indices.map((i) => (
              <TableHead key={PERIODS[i]} className="min-w-[84px] text-right font-mono">
                {PERIODS[i]}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {ROWS.map((row, rowIndex) => (
            <TableRow key={row.category} className={STAGGER_ITEM} style={staggerDelay(rowIndex)}>
              <TableCell className={cn(stickyColClass, "font-medium text-foreground/80")}>
                {row.category}
              </TableCell>
              {indices.map((i) => (
                <TableCell key={PERIODS[i]} className="text-right tabular-nums">
                  {row.values[i].toFixed(2)}%
                </TableCell>
              ))}
            </TableRow>
          ))}
          <TableRow className={STAGGER_ITEM} style={staggerDelay(ROWS.length)}>
            <TableCell className={cn(stickyColClass, "font-medium text-foreground/80")}>
              No. of Shareholders
            </TableCell>
            {indices.map((i) => (
              <TableCell key={PERIODS[i]} className="text-right tabular-nums">
                {SHAREHOLDERS[i]}
              </TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}

export function ShareholdingPanel() {
  const [view, setView] = useState<"quarterly" | "yearly">("quarterly")

  const indices = view === "yearly" ? YEARLY_INDICES : PERIODS.map((_, i) => i)
  const chartData = buildChartData(indices)

  return (
    <div className="flex flex-col gap-4">
      <FiiDiiPromoterTrendChart />

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
            <Area
              type="monotone"
              dataKey="Promoters"
              stackId="holding"
              stroke="var(--color-Promoters)"
              fill="var(--color-Promoters)"
              fillOpacity={0.75}
            />
            <Area
              type="monotone"
              dataKey="FIIs"
              stackId="holding"
              stroke="var(--color-FIIs)"
              fill="var(--color-FIIs)"
              fillOpacity={0.75}
            />
            <Area
              type="monotone"
              dataKey="DIIs"
              stackId="holding"
              stroke="var(--color-DIIs)"
              fill="var(--color-DIIs)"
              fillOpacity={0.75}
            />
            <Area
              type="monotone"
              dataKey="Government"
              stackId="holding"
              stroke="var(--color-Government)"
              fill="var(--color-Government)"
              fillOpacity={0.75}
            />
            <Area
              type="monotone"
              dataKey="Public"
              stackId="holding"
              stroke="var(--color-Public)"
              fill="var(--color-Public)"
              fillOpacity={0.75}
            />
          </AreaChart>
        </ChartContainer>
      </ChartCard>

      <ShareholdingTable indices={indices} />

      <p className="px-1 text-xs text-muted-foreground">
        * The classifications might have changed from Sep&apos;2022 onwards.
      </p>
    </div>
  )
}
