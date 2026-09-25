"use client"

import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from "recharts"

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { ChartCard, EMERALD, axisTick } from "@/components/company-analysis/company-charts"
import type { MetricConfig } from "@/lib/scorecard/config"
import type { ScoredCompany } from "@/lib/scorecard/engine"

const ROW_HEIGHT = 22
const CHART_PADDING = 16

export function formatMetricValue(value: number | null | undefined, unit: MetricConfig["unit"]) {
  if (value === null || value === undefined) return "—"
  return unit === "x" ? `${value.toFixed(2)}×` : `${value.toFixed(1)}%`
}

export function formatScore(value: number) {
  return value.toFixed(2)
}

function chartHeight(rows: number) {
  return rows * ROW_HEIGHT + CHART_PADDING
}

// Leave room past the longest bar on either side of zero so the value label
// never runs into the axis ticks (negative growth figures are common).
const paddedDomain: [(min: number) => number, (max: number) => number] = [
  (min) => (min < 0 ? min * 1.45 : 0),
  (max) => (max > 0 ? max * 1.2 : 0),
]

type BarLabelProps = { x?: number | string; y?: number | string; width?: number | string; height?: number | string; value?: unknown }

/** Value label at the outer end of the bar, including zero-length bars. */
function barLabel(format: (value: number) => string, className: string) {
  function BarLabel({ x = 0, y = 0, width = 0, height = 0, value }: BarLabelProps) {
    const num = Number(value)
    const end = Number(x) + Number(width)
    const negative = num < 0
    return (
      <text
        x={negative ? end - 4 : end + 4}
        y={Number(y) + Number(height) / 2}
        textAnchor={negative ? "end" : "start"}
        dominantBaseline="central"
        fontSize={10}
        className={className}
      >
        {format(num)}
      </text>
    )
  }
  return BarLabel
}

const metricConfig: ChartConfig = { value: { label: "Value", color: EMERALD } }

/** One metric's raw values, best reading on top, best bar in the signal colour. */
export function MetricBarChart({ metric, companies }: { metric: MetricConfig; companies: ScoredCompany[] }) {
  const withValue = companies.filter((c) => c.values[metric.name] !== null)
  const missing = companies.filter((c) => c.values[metric.name] === null)
  const data = withValue
    .map((c) => ({ symbol: c.symbol, name: c.name, value: c.values[metric.name] as number }))
    .sort((a, b) => (metric.direction === "higher" ? b.value - a.value : a.value - b.value))

  return (
    <ChartCard
      title={metric.label}
      sub={`${metric.description}. ${metric.direction === "higher" ? "Higher" : "Lower"} is better.`}
    >
      {data.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">No company in this set reports this figure.</p>
      ) : (
        <ChartContainer config={metricConfig} className="aspect-auto w-full" style={{ height: chartHeight(data.length) }}>
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 48, top: 0, bottom: 0 }}>
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <XAxis type="number" hide domain={paddedDomain} />
            <YAxis
              type="category"
              dataKey="symbol"
              tickLine={false}
              axisLine={false}
              width={84}
              tick={{ ...axisTick, fontFamily: "var(--font-mono)" }}
              interval={0}
            />
            <ChartTooltip
              cursor={{ fillOpacity: 0.4 }}
              content={
                <ChartTooltipContent
                  hideIndicator
                  labelKey="name"
                  formatter={(value) => formatMetricValue(Number(value), metric.unit)}
                />
              }
            />
            <Bar dataKey="value" radius={3} maxBarSize={14} isAnimationActive={false}>
              {data.map((entry, index) => (
                <Cell
                  key={entry.symbol}
                  fill={index === 0 ? EMERALD : "var(--muted-foreground)"}
                  fillOpacity={index === 0 ? 1 : 0.35}
                />
              ))}
              <LabelList
                dataKey="value"
                content={barLabel((v) => formatMetricValue(v, metric.unit), "fill-muted-foreground")}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
      {missing.length > 0 && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          Not available: <span className="font-mono">{missing.map((c) => c.symbol).join(", ")}</span>
        </p>
      )}
    </ChartCard>
  )
}

const totalConfig: ChartConfig = { totalScore: { label: "Total score", color: EMERALD } }

export function TotalScoreChart({ companies }: { companies: ScoredCompany[] }) {
  const data = companies.map((c) => ({ symbol: c.symbol, name: c.name, totalScore: c.totalScore }))
  return (
    <ChartCard title="Total score" sub="Sum of every weighted metric score, ranked">
      <ChartContainer config={totalConfig} className="aspect-auto w-full" style={{ height: chartHeight(data.length) }}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 48, top: 0, bottom: 0 }}>
          <CartesianGrid horizontal={false} strokeDasharray="3 3" />
          <XAxis type="number" hide domain={paddedDomain} />
          <YAxis
            type="category"
            dataKey="symbol"
            tickLine={false}
            axisLine={false}
            width={84}
            tick={{ ...axisTick, fontFamily: "var(--font-mono)" }}
            interval={0}
          />
          <ChartTooltip
            cursor={{ fillOpacity: 0.4 }}
            content={<ChartTooltipContent hideIndicator labelKey="name" formatter={(value) => formatScore(Number(value))} />}
          />
          <Bar dataKey="totalScore" fill={EMERALD} radius={3} maxBarSize={14} isAnimationActive={false}>
            <LabelList dataKey="totalScore" content={barLabel(formatScore, "fill-foreground")} />
          </Bar>
        </BarChart>
      </ChartContainer>
    </ChartCard>
  )
}
