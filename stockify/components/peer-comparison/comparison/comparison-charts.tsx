"use client"

import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, LabelList, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { AMBER, ChartCard, EMERALD, ROSE, SKY, VIOLET, axisTick } from "@/components/company-analysis/company-charts"
import type { AnnualFinancials, QuarterlyResult } from "@/lib/company-data"
import type { ComparisonCompany } from "@/lib/comparison/data"
import { fiscalQuarterLabel, fiscalYearLabel, toCrore } from "@/lib/format"

export const COMPANY_PALETTE = [EMERALD, SKY, AMBER, ROSE, VIOLET, "#64748b"]

function buildTrendConfig(companies: ComparisonCompany[]): ChartConfig {
  const config: ChartConfig = {}
  companies.forEach((company, index) => {
    config[company.symbol] = { label: company.symbol, color: COMPANY_PALETTE[index % COMPANY_PALETTE.length] }
  })
  return config
}

type Point = Record<string, string | number | null>

function buildAnnualPoints(
  companies: ComparisonCompany[],
  pick: (row: AnnualFinancials) => number | null,
  transform: (value: number) => number = (v) => v
): Point[] {
  const years = new Set<string>()
  companies.forEach((c) => c.annual.forEach((row) => years.add(fiscalYearLabel(row.period_end))))

  return Array.from(years)
    .sort()
    .map((year) => {
      const point: Point = { year }
      companies.forEach((c) => {
        const row = c.annual.find((r) => fiscalYearLabel(r.period_end) === year)
        const raw = row ? pick(row) : null
        point[c.symbol] = raw === null ? null : transform(raw)
      })
      return point
    })
}

function buildQuarterlyPoints(
  companies: ComparisonCompany[],
  pick: (row: QuarterlyResult) => number | null,
  transform: (value: number) => number = (v) => v
): Point[] {
  const periods = new Set<string>()
  companies.forEach((c) => c.quarterly.forEach((row) => periods.add(row.period_end)))

  return Array.from(periods)
    .sort()
    .map((periodEnd) => {
      const point: Point = { period: fiscalQuarterLabel(periodEnd) }
      companies.forEach((c) => {
        const row = c.quarterly.find((r) => r.period_end === periodEnd)
        const raw = row ? pick(row) : null
        point[c.symbol] = raw === null ? null : transform(raw)
      })
      return point
    })
}

// YoY growth per company, keyed by the later row's fiscal year. Companies
// keep their own consecutive-row pairing rather than being forced onto a
// shared year axis, so one company's missing year doesn't blank another's.
function buildGrowthPoints(companies: ComparisonCompany[], pick: (row: AnnualFinancials) => number | null): Point[] {
  const perCompany = new Map<string, Map<string, number>>()
  companies.forEach((c) => {
    const growth = new Map<string, number>()
    for (let i = 1; i < c.annual.length; i++) {
      const prev = pick(c.annual[i - 1])
      const curr = pick(c.annual[i])
      if (prev !== null && curr !== null && prev !== 0) {
        growth.set(fiscalYearLabel(c.annual[i].period_end), Number((((curr - prev) / Math.abs(prev)) * 100).toFixed(1)))
      }
    }
    perCompany.set(c.symbol, growth)
  })

  const years = new Set<string>()
  perCompany.forEach((growth) => growth.forEach((_, year) => years.add(year)))

  return Array.from(years)
    .sort()
    .map((year) => {
      const point: Point = { year }
      companies.forEach((c) => {
        point[c.symbol] = perCompany.get(c.symbol)?.get(year) ?? null
      })
      return point
    })
}

function CompanyLines({ companies }: { companies: ComparisonCompany[] }) {
  return (
    <>
      {companies.map((c) => (
        <Line
          key={c.symbol}
          type="monotone"
          dataKey={c.symbol}
          stroke={`var(--color-${c.symbol})`}
          strokeWidth={2}
          dot={false}
          connectNulls={false}
        />
      ))}
    </>
  )
}

// ---------- Revenue trend (multi-line, annual) ----------

export function RevenueTrendChart({ companies }: { companies: ComparisonCompany[] }) {
  const data = buildAnnualPoints(companies, (r) => r.sales, toCrore)
  if (data.length < 2) return null
  const config = buildTrendConfig(companies)

  return (
    <ChartCard title="Revenue" sub="₹ Cr, by year">
      <ChartContainer config={config} className="aspect-auto h-64 w-full">
        <LineChart data={data} margin={{ left: 4, right: 4, top: 4 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="year" tickLine={false} axisLine={false} tick={axisTick} />
          <YAxis tickLine={false} axisLine={false} width={48} tick={axisTick} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <CompanyLines companies={companies} />
        </LineChart>
      </ChartContainer>
    </ChartCard>
  )
}

// ---------- Net profit trend (multi-line, annual) ----------

export function NetProfitTrendChart({ companies }: { companies: ComparisonCompany[] }) {
  const data = buildAnnualPoints(companies, (r) => r.net_profit, toCrore)
  if (data.length < 2) return null
  const config = buildTrendConfig(companies)

  return (
    <ChartCard title="Net profit" sub="₹ Cr, by year">
      <ChartContainer config={config} className="aspect-auto h-64 w-full">
        <LineChart data={data} margin={{ left: 4, right: 4, top: 4 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="year" tickLine={false} axisLine={false} tick={axisTick} />
          <YAxis tickLine={false} axisLine={false} width={48} tick={axisTick} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <CompanyLines companies={companies} />
        </LineChart>
      </ChartContainer>
    </ChartCard>
  )
}

// ---------- Revenue growth, YoY (multi-line, annual) ----------

export function RevenueGrowthChart({ companies }: { companies: ComparisonCompany[] }) {
  const data = buildGrowthPoints(companies, (r) => r.sales)
  if (data.length < 2) return null
  const config = buildTrendConfig(companies)

  return (
    <ChartCard title="Revenue growth" sub="YoY %, by year">
      <ChartContainer config={config} className="aspect-auto h-64 w-full">
        <LineChart data={data} margin={{ left: 4, right: 4, top: 4 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="year" tickLine={false} axisLine={false} tick={axisTick} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={44}
            tick={axisTick}
            tickFormatter={(v: number) => `${v}%`}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <CompanyLines companies={companies} />
        </LineChart>
      </ChartContainer>
    </ChartCard>
  )
}

// ---------- Net profit growth, YoY (multi-line, annual) ----------

export function ProfitGrowthChart({ companies }: { companies: ComparisonCompany[] }) {
  const data = buildGrowthPoints(companies, (r) => r.net_profit)
  if (data.length < 2) return null
  const config = buildTrendConfig(companies)

  return (
    <ChartCard title="Net profit growth" sub="YoY %, by year">
      <ChartContainer config={config} className="aspect-auto h-64 w-full">
        <LineChart data={data} margin={{ left: 4, right: 4, top: 4 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="year" tickLine={false} axisLine={false} tick={axisTick} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={44}
            tick={axisTick}
            tickFormatter={(v: number) => `${v}%`}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <CompanyLines companies={companies} />
        </LineChart>
      </ChartContainer>
    </ChartCard>
  )
}

// ---------- Operating margin trend (multi-line, annual) ----------

export function MarginTrendChart({ companies }: { companies: ComparisonCompany[] }) {
  const data = buildAnnualPoints(companies, (r) => r.opm_pct)
  if (data.length < 2) return null
  const config = buildTrendConfig(companies)

  return (
    <ChartCard title="Operating margin" sub="OPM %, by year">
      <ChartContainer config={config} className="aspect-auto h-64 w-full">
        <LineChart data={data} margin={{ left: 4, right: 4, top: 4 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="year" tickLine={false} axisLine={false} tick={axisTick} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={42}
            tick={axisTick}
            tickFormatter={(v: number) => `${v}%`}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <CompanyLines companies={companies} />
        </LineChart>
      </ChartContainer>
    </ChartCard>
  )
}

// ---------- ROCE trend (multi-line, annual) ----------

export function RoceTrendComparisonChart({ companies }: { companies: ComparisonCompany[] }) {
  const data = buildAnnualPoints(companies, (r) => r.roce_pct)
  if (data.length < 2) return null
  const config = buildTrendConfig(companies)

  return (
    <ChartCard title="ROCE" sub="% by year">
      <ChartContainer config={config} className="aspect-auto h-64 w-full">
        <LineChart data={data} margin={{ left: 4, right: 4, top: 4 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="year" tickLine={false} axisLine={false} tick={axisTick} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={42}
            tick={axisTick}
            tickFormatter={(v: number) => `${v}%`}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <CompanyLines companies={companies} />
        </LineChart>
      </ChartContainer>
    </ChartCard>
  )
}

// ---------- Quarterly revenue trend (multi-line, quarterly) ----------

export function QuarterlyRevenueTrendChart({ companies }: { companies: ComparisonCompany[] }) {
  const data = buildQuarterlyPoints(companies, (r) => r.revenue, toCrore)
  if (data.length < 2) return null
  const config = buildTrendConfig(companies)

  return (
    <ChartCard title="Quarterly revenue" sub="₹ Cr, by quarter">
      <ChartContainer config={config} className="aspect-auto h-64 w-full">
        <LineChart data={data} margin={{ left: 4, right: 4, top: 4 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="period"
            tickLine={false}
            axisLine={false}
            interval={Math.max(0, Math.ceil(data.length / 8) - 1)}
            tick={axisTick}
          />
          <YAxis tickLine={false} axisLine={false} width={48} tick={axisTick} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <CompanyLines companies={companies} />
        </LineChart>
      </ChartContainer>
    </ChartCard>
  )
}

// ---------- Latest-year / latest-quarter snapshot (horizontal bar, best highlighted) ----------

const ROW_HEIGHT = 26
const CHART_PADDING = 16

const paddedDomain: [(min: number) => number, (max: number) => number] = [
  (min) => (min < 0 ? min * 1.45 : 0),
  (max) => (max > 0 ? max * 1.2 : 0),
]

type BarLabelProps = { x?: number | string; y?: number | string; width?: number | string; height?: number | string; value?: unknown }

function barLabel(format: (value: number) => string) {
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
        className="fill-muted-foreground"
      >
        {format(num)}
      </text>
    )
  }
  return BarLabel
}

export type SnapshotFormat = "crore" | "percent" | "rupee"

function formatSnapshotValue(value: number, format: SnapshotFormat) {
  if (format === "crore") return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })} Cr`
  if (format === "percent") return `${value.toFixed(1)}%`
  return `₹${value.toFixed(2)}`
}

const snapshotConfig: ChartConfig = { value: { label: "Value", color: EMERALD } }

export function LatestSnapshotChart({
  title,
  sub,
  companies,
  value,
  format,
}: {
  title: string
  sub?: string
  companies: ComparisonCompany[]
  value: (company: ComparisonCompany) => number | null
  format: SnapshotFormat
}) {
  const rows = companies
    .map((c) => {
      const raw = value(c)
      const displayValue = raw === null ? null : format === "crore" ? toCrore(raw) : Number(raw.toFixed(format === "percent" ? 1 : 2))
      return { symbol: c.symbol, name: c.name, value: displayValue }
    })
    .filter((r): r is { symbol: string; name: string; value: number } => r.value !== null)
    .sort((a, b) => b.value - a.value)

  const missing = companies.length - rows.length

  return (
    <ChartCard title={title} sub={sub}>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">No company in this set reports this figure.</p>
      ) : (
        <ChartContainer config={snapshotConfig} className="aspect-auto w-full" style={{ height: rows.length * ROW_HEIGHT + CHART_PADDING }}>
          <BarChart data={rows} layout="vertical" margin={{ left: 0, right: 56, top: 0, bottom: 0 }}>
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
                  formatter={(v) => formatSnapshotValue(Number(v), format)}
                />
              }
            />
            <Bar dataKey="value" radius={3} maxBarSize={16} isAnimationActive={false}>
              {rows.map((entry, index) => (
                <Cell
                  key={entry.symbol}
                  fill={index === 0 ? EMERALD : "var(--muted-foreground)"}
                  fillOpacity={index === 0 ? 1 : 0.35}
                />
              ))}
              <LabelList dataKey="value" content={barLabel((v) => formatSnapshotValue(v, format))} />
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
      {missing > 0 && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          {missing} {missing === 1 ? "company doesn't" : "companies don't"} report this figure.
        </p>
      )}
    </ChartCard>
  )
}

export function latestAnnual(company: ComparisonCompany) {
  return company.annual.at(-1) ?? null
}

export function latestQuarterly(company: ComparisonCompany) {
  return company.quarterly.at(-1) ?? null
}
