"use client"

import { useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts"
import { cn } from "cn"

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { AnnualFinancials, QuarterlyResult } from "@/lib/company-data"
import type { Company } from "@/lib/companies"
import { fiscalQuarterLabel, fiscalYearLabel, formatCrore, toCrore } from "@/lib/format"

export const EMERALD = "#10b981"
export const SKY = "#0ea5e9"
export const AMBER = "#f59e0b"
export const ROSE = "#f43f5e"
export const VIOLET = "#8b5cf6"

export function ChartCard({
  title,
  sub,
  action,
  children,
}: {
  title: string
  sub?: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{title}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

export function InsightNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
      {children}
    </p>
  )
}

export const axisTick = { fontSize: 11 }

// ---------- Quarters: revenue & net profit trend (line) ----------

const trendConfig: ChartConfig = {
  revenue: { label: "Revenue", color: EMERALD },
  netProfit: { label: "Net Profit", color: SKY },
}

export function QuarterlyTrendChart({ quarters }: { quarters: QuarterlyResult[] }) {
  if (quarters.length < 2) return null

  const data = quarters.map((q) => ({
    period: fiscalQuarterLabel(q.period_end),
    revenue: toCrore(q.revenue),
    netProfit: toCrore(q.net_profit),
  }))

  return (
    <ChartCard title="Revenue & net profit trend" sub="₹ Cr, by quarter">
      <ChartContainer config={trendConfig} className="aspect-auto h-64 w-full">
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
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="var(--color-revenue)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="netProfit"
            stroke="var(--color-netProfit)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ChartContainer>
    </ChartCard>
  )
}

// ---------- Quarters: net profit margin trend (line) ----------

const marginConfig: ChartConfig = {
  margin: { label: "Net Profit Margin", color: EMERALD },
}

export function NetProfitMarginChart({ quarters }: { quarters: QuarterlyResult[] }) {
  const data = quarters
    .filter((q) => q.revenue !== null && q.revenue !== 0 && q.net_profit !== null)
    .map((q) => ({
      period: fiscalQuarterLabel(q.period_end),
      margin: Number(((Number(q.net_profit) / Number(q.revenue)) * 100).toFixed(1)),
    }))

  if (data.length < 2) return null

  return (
    <ChartCard title="Net profit margin trend" sub="Net profit ÷ revenue, by quarter">
      <ChartContainer config={marginConfig} className="aspect-auto h-56 w-full">
        <LineChart data={data} margin={{ left: 4, right: 4, top: 4 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="period"
            tickLine={false}
            axisLine={false}
            interval={Math.max(0, Math.ceil(data.length / 8) - 1)}
            tick={axisTick}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={42}
            tick={axisTick}
            tickFormatter={(v: number) => `${v}%`}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line
            type="monotone"
            dataKey="margin"
            stroke="var(--color-margin)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ChartContainer>
    </ChartCard>
  )
}

// ---------- Quarters: same-quarter year-over-year comparison (grouped bar) ----------

const YEAR_PALETTE = [EMERALD, SKY, AMBER, ROSE, VIOLET, "#64748b"]

export function YoyQuarterComparisonChart({ quarters }: { quarters: QuarterlyResult[] }) {
  if (quarters.length < 5) return null

  const byPosition = new Map<number, Record<string, number>>()
  const yearsSeen = new Set<string>()

  for (const q of quarters) {
    if (q.net_profit === null) continue
    const date = new Date(q.period_end)
    const position = Math.floor(((date.getMonth() + 9) % 12) / 3) + 1
    const year = fiscalYearLabel(q.period_end)
    yearsSeen.add(year)
    const row = byPosition.get(position) ?? {}
    row[year] = toCrore(q.net_profit)
    byPosition.set(position, row)
  }

  const years = Array.from(yearsSeen).sort()
  const data = [1, 2, 3, 4].map((position) => ({
    quarter: `Q${position}`,
    ...(byPosition.get(position) ?? {}),
  }))

  const config: ChartConfig = {}
  years.forEach((year, i) => {
    config[year] = { label: year, color: YEAR_PALETTE[i % YEAR_PALETTE.length] }
  })

  return (
    <ChartCard
      title="Net profit, same quarter year over year"
      sub="₹ Cr, grouped by quarter position so seasonality doesn't distort growth"
    >
      <ChartContainer config={config} className="aspect-auto h-64 w-full">
        <BarChart data={data} margin={{ left: 4, right: 4, top: 4 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="quarter" tickLine={false} axisLine={false} tick={axisTick} />
          <YAxis tickLine={false} axisLine={false} width={48} tick={axisTick} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          {years.map((year) => (
            <Bar key={year} dataKey={year} fill={`var(--color-${year})`} radius={4} />
          ))}
        </BarChart>
      </ChartContainer>
    </ChartCard>
  )
}

// ---------- Quarters: PBT split into net profit kept vs. tax paid (stacked bar) ----------

const pbtConfig: ChartConfig = {
  netProfit: { label: "Net Profit", color: EMERALD },
  tax: { label: "Tax", color: ROSE },
}

export function PbtTaxSplitChart({ quarters }: { quarters: QuarterlyResult[] }) {
  if (quarters.length < 2) return null

  const data = quarters
    .filter((q) => q.net_profit !== null && q.tax_expense !== null)
    .map((q) => ({
      period: fiscalQuarterLabel(q.period_end),
      netProfit: toCrore(q.net_profit),
      tax: toCrore(q.tax_expense),
    }))

  if (data.length < 2) return null

  return (
    <ChartCard
      title="Profit before tax: kept vs. paid as tax"
      sub="₹ Cr, by quarter, net profit + tax stacked to PBT"
    >
      <ChartContainer config={pbtConfig} className="aspect-auto h-64 w-full">
        <BarChart data={data} margin={{ left: 4, right: 4, top: 4 }}>
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
          <Bar dataKey="netProfit" stackId="pbt" fill="var(--color-netProfit)" radius={[0, 0, 4, 4]} />
          <Bar dataKey="tax" stackId="pbt" fill="var(--color-tax)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </ChartCard>
  )
}

// ---------- Profit & Loss: sales, expenses & net profit, annual/quarterly toggle (bar) ----------

const revExpProfitConfig: ChartConfig = {
  revenue: { label: "Sales", color: EMERALD },
  expenses: { label: "Expenses", color: AMBER },
  netProfit: { label: "Net Profit", color: SKY },
}

export function RevenueExpenseProfitChart({
  annual,
  quarters,
}: {
  annual: AnnualFinancials[]
  quarters: QuarterlyResult[]
}) {
  const [view, setView] = useState<"annual" | "quarterly">("annual")

  const annualData = annual.map((row) => ({
    period: fiscalYearLabel(row.period_end),
    revenue: toCrore(row.sales),
    expenses: toCrore(row.expenses),
    netProfit: toCrore(row.net_profit),
  }))
  const quarterlyData = quarters.map((q) => ({
    period: fiscalQuarterLabel(q.period_end),
    revenue: toCrore(q.revenue),
    expenses: toCrore(q.expenses_total),
    netProfit: toCrore(q.net_profit),
  }))

  const data = view === "annual" ? annualData : quarterlyData
  if (annualData.length < 2) return null

  return (
    <ChartCard
      title="Sales, expenses & net profit"
      sub={view === "annual" ? "₹ Cr, by year" : "₹ Cr, by quarter"}
      action={
        <div className="inline-flex shrink-0 rounded-lg border bg-muted/40 p-0.5">
          {(["annual", "quarterly"] as const).map((option) => (
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
      }
    >
      <ChartContainer config={revExpProfitConfig} className="aspect-auto h-64 w-full">
        <BarChart data={data} margin={{ left: 4, right: 4, top: 4 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="period"
            tickLine={false}
            axisLine={false}
            interval={view === "quarterly" ? Math.max(0, Math.ceil(data.length / 8) - 1) : 0}
            tick={axisTick}
          />
          <YAxis tickLine={false} axisLine={false} width={48} tick={axisTick} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
          <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
          <Bar dataKey="netProfit" fill="var(--color-netProfit)" radius={4} />
        </BarChart>
      </ChartContainer>
    </ChartCard>
  )
}

// ---------- Profit & Loss: OPM% / Tax% / Dividend Payout% trend (annual, line) ----------

const marginPayoutConfig: ChartConfig = {
  opm: { label: "OPM %", color: EMERALD },
  tax: { label: "Tax %", color: AMBER },
  payout: { label: "Dividend Payout %", color: VIOLET },
}

export function MarginPayoutTrendChart({ annual }: { annual: AnnualFinancials[] }) {
  const data = annual.map((row) => ({
    year: fiscalYearLabel(row.period_end),
    opm: row.opm_pct,
    tax: row.tax_pct,
    payout: row.dividend_payout_pct,
  }))

  if (data.length < 2) return null

  return (
    <ChartCard title="Margin & payout ratios by year" sub="% by year">
      <ChartContainer config={marginPayoutConfig} className="aspect-auto h-64 w-full">
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
          <Line type="monotone" dataKey="opm" stroke="var(--color-opm)" strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="tax" stroke="var(--color-tax)" strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="payout" stroke="var(--color-payout)" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ChartContainer>
    </ChartCard>
  )
}

// ---------- Profit & Loss: interest + depreciation burden trend (annual, line + insight) ----------

const burdenConfig: ChartConfig = {
  burden: { label: "Interest + Depreciation ÷ Operating Profit", color: ROSE },
}

function buildBurdenInsight(
  data: { year: string; burden: number | null; opm: number | null }[]
): string | null {
  const valid = data.filter((d) => d.burden !== null && d.opm !== null)
  if (valid.length < 2) return null

  const first = valid[0]
  const last = valid[valid.length - 1]
  const burdenChange = last.burden! - first.burden!
  const opmChange = last.opm! - first.opm!

  if (burdenChange <= opmChange) return null

  return `Interest and depreciation rose from ${first.burden!.toFixed(1)}% to ${last.burden!.toFixed(1)}% of operating profit between ${first.year} and ${last.year}, outpacing OPM's move from ${first.opm!.toFixed(1)}% to ${last.opm!.toFixed(1)}%. Fixed costs may be eating into margin gains.`
}

export function InterestDepreciationBurdenChart({ annual }: { annual: AnnualFinancials[] }) {
  const data = annual.map((row) => {
    const { interest, depreciation, operating_profit: operatingProfit } = row
    const burden =
      interest !== null && depreciation !== null && operatingProfit !== null && operatingProfit !== 0
        ? Number((((interest + depreciation) / operatingProfit) * 100).toFixed(1))
        : null
    return { year: fiscalYearLabel(row.period_end), burden, opm: row.opm_pct }
  })

  if (data.length < 2) return null
  const insight = buildBurdenInsight(data)

  return (
    <ChartCard title="Interest + depreciation, as % of operating profit" sub="by year">
      <ChartContainer config={burdenConfig} className="aspect-auto h-56 w-full">
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
          <Line
            type="monotone"
            dataKey="burden"
            stroke="var(--color-burden)"
            strokeWidth={2}
            dot={{ r: 3, fill: ROSE }}
          />
        </LineChart>
      </ChartContainer>
      {insight && <InsightNote>{insight}</InsightNote>}
    </ChartCard>
  )
}

// ---------- Profit & Loss: PBT split into net profit kept vs. tax paid (annual, stacked bar) ----------

export function AnnualPbtTaxSplitChart({ annual }: { annual: AnnualFinancials[] }) {
  const data = annual
    .filter(
      (row): row is AnnualFinancials & { profit_before_tax: number; net_profit: number } =>
        row.profit_before_tax !== null && row.net_profit !== null
    )
    .map((row) => ({
      year: fiscalYearLabel(row.period_end),
      netProfit: toCrore(row.net_profit),
      tax: toCrore(row.profit_before_tax - row.net_profit),
    }))

  if (data.length < 2) return null

  return (
    <ChartCard
      title="Profit before tax: kept vs. paid as tax"
      sub="₹ Cr, by year, net profit + tax stacked to PBT"
    >
      <ChartContainer config={pbtConfig} className="aspect-auto h-64 w-full">
        <BarChart data={data} margin={{ left: 4, right: 4, top: 4 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="year" tickLine={false} axisLine={false} tick={axisTick} />
          <YAxis tickLine={false} axisLine={false} width={48} tick={axisTick} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="netProfit" stackId="pbt" fill="var(--color-netProfit)" radius={[0, 0, 4, 4]} />
          <Bar dataKey="tax" stackId="pbt" fill="var(--color-tax)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </ChartCard>
  )
}

// ---------- Profit & Loss: EPS vs dividend payout % (annual, dual-axis + insight) ----------

const epsPayoutConfig: ChartConfig = {
  eps: { label: "EPS", color: EMERALD },
  payout: { label: "Dividend Payout %", color: VIOLET },
}

function buildPayoutSmoothingFlags(
  data: { year: string; eps: number | null; payout: number | null }[]
): string[] {
  const flags: string[] = []
  for (let i = 1; i < data.length; i++) {
    const prev = data[i - 1]
    const curr = data[i]
    if (prev.eps === null || curr.eps === null || prev.payout === null || curr.payout === null) continue
    if (curr.eps < prev.eps && curr.payout > prev.payout) {
      flags.push(
        `${curr.year}: EPS fell (₹${prev.eps.toFixed(2)} to ₹${curr.eps.toFixed(2)}) while dividend payout rose (${prev.payout.toFixed(1)}% to ${curr.payout.toFixed(1)}%). Possible payout-smoothing.`
      )
    }
  }
  return flags
}

export function EpsPayoutChart({ annual }: { annual: AnnualFinancials[] }) {
  const data = annual.map((row) => ({
    year: fiscalYearLabel(row.period_end),
    eps: row.eps,
    payout: row.dividend_payout_pct,
  }))

  if (data.length < 2) return null
  const flags = buildPayoutSmoothingFlags(data)

  return (
    <ChartCard title="EPS vs. dividend payout %" sub="₹ EPS (left axis) vs. payout % (right axis), by year">
      <ChartContainer config={epsPayoutConfig} className="aspect-auto h-64 w-full">
        <LineChart data={data} margin={{ left: 4, right: 4, top: 4 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="year" tickLine={false} axisLine={false} tick={axisTick} />
          <YAxis
            yAxisId="eps"
            tickLine={false}
            axisLine={false}
            width={44}
            tick={axisTick}
            tickFormatter={(v: number) => `₹${v}`}
          />
          <YAxis
            yAxisId="payout"
            orientation="right"
            tickLine={false}
            axisLine={false}
            width={42}
            tick={axisTick}
            tickFormatter={(v: number) => `${v}%`}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Line
            yAxisId="eps"
            type="monotone"
            dataKey="eps"
            stroke="var(--color-eps)"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            yAxisId="payout"
            type="monotone"
            dataKey="payout"
            stroke="var(--color-payout)"
            strokeWidth={2}
            strokeDasharray="4 3"
            dot={{ r: 3 }}
          />
        </LineChart>
      </ChartContainer>
      {flags.map((flag) => (
        <InsightNote key={flag}>{flag}</InsightNote>
      ))}
    </ChartCard>
  )
}

// ---------- Cash Flow: CFO / CFI / CFF per year (grouped bar) with net cash flow overlay ----------

const cashFlowConfig: ChartConfig = {
  cfo: { label: "Operating", color: EMERALD },
  cfi: { label: "Investing", color: AMBER },
  cff: { label: "Financing", color: ROSE },
  netCashFlow: { label: "Net Cash Flow", color: SKY },
}

export function CashFlowMixChart({ annual }: { annual: AnnualFinancials[] }) {
  if (annual.length < 2) return null

  const data = annual.map((row) => ({
    year: fiscalYearLabel(row.period_end),
    cfo: toCrore(row.cfo),
    cfi: toCrore(row.cfi),
    cff: toCrore(row.cff),
    netCashFlow: toCrore(row.net_cash_flow),
  }))

  return (
    <ChartCard
      title="Cash flow by activity"
      sub="₹ Cr, by year. Operating vs. investing vs. financing, with net cash flow overlaid."
    >
      <ChartContainer config={cashFlowConfig} className="aspect-auto h-64 w-full">
        <ComposedChart data={data} margin={{ left: 4, right: 4, top: 4 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="year" tickLine={false} axisLine={false} tick={axisTick} />
          <YAxis tickLine={false} axisLine={false} width={52} tick={axisTick} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="cfo" fill="var(--color-cfo)" radius={4} />
          <Bar dataKey="cfi" fill="var(--color-cfi)" radius={4} />
          <Bar dataKey="cff" fill="var(--color-cff)" radius={4} />
          <Line
            type="monotone"
            dataKey="netCashFlow"
            stroke="var(--color-netCashFlow)"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </ComposedChart>
      </ChartContainer>
    </ChartCard>
  )
}

// ---------- Cash Flow: free cash flow trend (line) ----------

const fcfConfig: ChartConfig = {
  freeCashFlow: { label: "Free Cash Flow", color: ROSE },
}

export function FreeCashFlowTrendChart({ annual }: { annual: AnnualFinancials[] }) {
  const data = annual
    .filter((row) => row.free_cash_flow !== null)
    .map((row) => ({ year: fiscalYearLabel(row.period_end), freeCashFlow: toCrore(row.free_cash_flow) }))

  if (data.length < 2) return null

  const negativeYears = data.filter((d) => d.freeCashFlow < 0).length

  return (
    <ChartCard title="Free cash flow trend" sub="₹ Cr, by year (cash from operations minus investing)">
      <ChartContainer config={fcfConfig} className="aspect-auto h-56 w-full">
        <LineChart data={data} margin={{ left: 4, right: 4, top: 4 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="year" tickLine={false} axisLine={false} tick={axisTick} />
          <YAxis tickLine={false} axisLine={false} width={64} tick={axisTick} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line
            type="monotone"
            dataKey="freeCashFlow"
            stroke="var(--color-freeCashFlow)"
            strokeWidth={2}
            dot={{ r: 3, fill: ROSE }}
          />
        </LineChart>
      </ChartContainer>
      {negativeYears >= Math.ceil(data.length / 2) && (
        <InsightNote>
          {`Free cash flow was negative in ${negativeYears} of ${data.length} years shown. Investing outflow is consistently outpacing operating cash generation.`}
        </InsightNote>
      )}
    </ChartCard>
  )
}

// ---------- Cash Flow: CFO / net profit ratio, "cash conversion" (line + insight) ----------

const cashConversionConfig: ChartConfig = {
  cashConversion: { label: "CFO / Net Profit", color: EMERALD },
}

function buildCashConversionInsight(
  data: { year: string; cashConversion: number | null }[]
): string | null {
  const valid = data.filter((d) => d.cashConversion !== null) as { year: string; cashConversion: number }[]
  if (valid.length < 2) return null

  let maxSwingYear = ""
  let maxSwing = 0
  let fromValue = 0
  let toValue = 0

  for (let i = 1; i < valid.length; i++) {
    const swing = Math.abs(valid[i].cashConversion - valid[i - 1].cashConversion)
    if (swing > maxSwing) {
      maxSwing = swing
      maxSwingYear = valid[i].year
      fromValue = valid[i - 1].cashConversion
      toValue = valid[i].cashConversion
    }
  }

  if (maxSwing < 100) return null

  return `Cash conversion swung from ${fromValue.toFixed(0)}% to ${toValue.toFixed(0)}% of net profit in ${maxSwingYear}, a ${maxSwing.toFixed(0)}-point move. A business with stable earnings quality shouldn't see operating cash flow at multiples of profit one year and a fraction of it the next. Worth digging into working capital and receivable/payable timing.`
}

export function CashConversionChart({ annual }: { annual: AnnualFinancials[] }) {
  const data = annual.map((row) => ({
    year: fiscalYearLabel(row.period_end),
    cashConversion:
      row.cfo !== null && row.net_profit !== null && row.net_profit !== 0
        ? Number(((row.cfo / row.net_profit) * 100).toFixed(0))
        : null,
  }))

  if (data.filter((d) => d.cashConversion !== null).length < 2) return null
  const insight = buildCashConversionInsight(data)

  return (
    <ChartCard title="Cash conversion" sub="CFO ÷ net profit, by year">
      <ChartContainer config={cashConversionConfig} className="aspect-auto h-56 w-full">
        <LineChart data={data} margin={{ left: 4, right: 4, top: 4 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="year" tickLine={false} axisLine={false} tick={axisTick} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={52}
            tick={axisTick}
            tickFormatter={(v: number) => `${v}%`}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line
            type="monotone"
            dataKey="cashConversion"
            stroke="var(--color-cashConversion)"
            strokeWidth={2}
            dot={{ r: 3, fill: EMERALD }}
            connectNulls={false}
          />
        </LineChart>
      </ChartContainer>
      {insight && <InsightNote>{insight}</InsightNote>}
    </ChartCard>
  )
}

// ---------- Cash Flow: investing vs financing, is capex debt-funded or not (line + insight) ----------

const cfiCffConfig: ChartConfig = {
  cfi: { label: "Investing", color: AMBER },
  cff: { label: "Financing", color: ROSE },
}

function buildFundingSourceInsight(annual: AnnualFinancials[]): string | null {
  const valid = annual.filter(
    (row) => row.cfi !== null && row.cff !== null && row.borrowings !== null
  )
  if (valid.length < 2) return null

  const first = valid[0]
  const last = valid[valid.length - 1]

  const investingOutflowGrew = last.cfi! < first.cfi!
  const financingTurnedPositive = last.cff! > 0 && first.cff! <= last.cff!

  if (!investingOutflowGrew || !financingTurnedPositive) return null

  const borrowingsFell = last.borrowings! < first.borrowings!
  const borrowingsRose = last.borrowings! > first.borrowings! * 1.1

  const base = `Financing moved from ${formatCrore(first.cff)} to ${formatCrore(last.cff)} between ${fiscalYearLabel(first.period_end)} and ${fiscalYearLabel(last.period_end)} as investing outflow grew (${formatCrore(first.cfi)} to ${formatCrore(last.cfi)}).`

  if (borrowingsFell) {
    return `${base} Borrowings fell over the same period, so the growing investment looks funded by equity or internal reserves, not debt.`
  }
  if (borrowingsRose) {
    return `${base} Borrowings also rose over the same period, consistent with debt-funded expansion.`
  }
  return `${base} Borrowings stayed roughly flat, so check equity or reserves movements on the Balance Sheet tab for the funding source.`
}

export function InvestingFinancingChart({ annual }: { annual: AnnualFinancials[] }) {
  const data = annual.map((row) => ({
    year: fiscalYearLabel(row.period_end),
    cfi: toCrore(row.cfi),
    cff: toCrore(row.cff),
  }))

  if (data.length < 2) return null
  const insight = buildFundingSourceInsight(annual)

  return (
    <ChartCard title="Investing vs. financing" sub="₹ Cr, by year">
      <ChartContainer config={cfiCffConfig} className="aspect-auto h-56 w-full">
        <LineChart data={data} margin={{ left: 4, right: 4, top: 4 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="year" tickLine={false} axisLine={false} tick={axisTick} />
          <YAxis tickLine={false} axisLine={false} width={56} tick={axisTick} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Line type="monotone" dataKey="cfi" stroke="var(--color-cfi)" strokeWidth={2} dot={{ r: 3 }} />
          <Line
            type="monotone"
            dataKey="cff"
            stroke="var(--color-cff)"
            strokeWidth={2}
            strokeDasharray="4 3"
            dot={{ r: 3 }}
          />
        </LineChart>
      </ChartContainer>
      {insight && <InsightNote>{insight}</InsightNote>}
    </ChartCard>
  )
}

// ---------- Balance Sheet: assets vs liabilities composition by year (mirrored stacked bar) ----------
//
// A balance sheet's most useful visual is composition and structural shift
// over time, not a single trend line. Two stackId groups ("assets" and
// "liabilities") render as two side-by-side stacked columns per year, so the
// asset mix and the liability mix that funds it sit next to each other for
// every year at once. Segments are left square (not rounded) because a
// deficit-reserves year can push a segment below the zero line, and rounding
// only the nominal "last" bar in the stack breaks down once any segment can
// be negative.

const balanceSheetCompositionConfig: ChartConfig = {
  fixedAssets: { label: "Fixed Assets", color: EMERALD },
  cwip: { label: "CWIP", color: SKY },
  investments: { label: "Investments", color: AMBER },
  otherAssets: { label: "Other Assets", color: VIOLET },
  equityCapital: { label: "Equity Capital", color: "#0d9488" },
  reserves: { label: "Reserves", color: "#6366f1" },
  borrowings: { label: "Borrowings", color: "#f97316" },
  otherLiabilities: { label: "Other Liabilities", color: "#64748b" },
}

export function BalanceSheetCompositionChart({ annual }: { annual: AnnualFinancials[] }) {
  const data = annual.map((row) => ({
    year: fiscalYearLabel(row.period_end),
    fixedAssets: toCrore(row.fixed_assets),
    cwip: toCrore(row.cwip),
    investments: toCrore(row.investments),
    otherAssets: toCrore(row.other_assets),
    equityCapital: toCrore(row.equity_capital),
    reserves: toCrore(row.reserves),
    borrowings: toCrore(row.borrowings),
    otherLiabilities: toCrore(row.other_liabilities),
  }))

  if (data.length < 2) return null

  return (
    <ChartCard
      title="Assets vs. liabilities composition"
      sub="₹ Cr, by year. Left column of each pair is assets, right is liabilities."
    >
      <ChartContainer config={balanceSheetCompositionConfig} className="aspect-auto h-72 w-full">
        <BarChart data={data} margin={{ left: 4, right: 4, top: 4 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="year" tickLine={false} axisLine={false} tick={axisTick} />
          <YAxis tickLine={false} axisLine={false} width={52} tick={axisTick} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="fixedAssets" stackId="assets" fill="var(--color-fixedAssets)" />
          <Bar dataKey="cwip" stackId="assets" fill="var(--color-cwip)" />
          <Bar dataKey="investments" stackId="assets" fill="var(--color-investments)" />
          <Bar dataKey="otherAssets" stackId="assets" fill="var(--color-otherAssets)" />
          <Bar dataKey="equityCapital" stackId="liabilities" fill="var(--color-equityCapital)" />
          <Bar dataKey="reserves" stackId="liabilities" fill="var(--color-reserves)" />
          <Bar dataKey="borrowings" stackId="liabilities" fill="var(--color-borrowings)" />
          <Bar dataKey="otherLiabilities" stackId="liabilities" fill="var(--color-otherLiabilities)" />
        </BarChart>
      </ChartContainer>
    </ChartCard>
  )
}

// ---------- Balance Sheet: reserves trend (line + insight) ----------

const reservesConfig: ChartConfig = {
  reserves: { label: "Reserves", color: VIOLET },
}

function buildReservesInsights(annual: AnnualFinancials[]): string[] {
  const flags: string[] = []

  for (let i = 1; i < annual.length; i++) {
    const prev = annual[i - 1]
    const curr = annual[i]
    if (prev.reserves === null || curr.reserves === null) continue

    const year = fiscalYearLabel(curr.period_end)

    if (prev.reserves < 0 && curr.reserves >= 0) {
      flags.push(
        `${year}: Reserves turned positive, from ${formatCrore(prev.reserves)} to ${formatCrore(curr.reserves)}. Often signals recovery from accumulated losses or a capital restructuring.`
      )
    } else if (prev.reserves >= 0 && curr.reserves < 0) {
      flags.push(
        `${year}: Reserves turned negative, from ${formatCrore(prev.reserves)} to ${formatCrore(curr.reserves)}. Often signals accumulated losses or a capital restructuring.`
      )
    }

    if (curr.reserves < prev.reserves && curr.net_profit !== null && curr.net_profit > 0) {
      flags.push(
        `${year}: Reserves fell (${formatCrore(prev.reserves)} to ${formatCrore(curr.reserves)}) despite a profitable year (net profit ${formatCrore(curr.net_profit)}). Worth checking for a large dividend payout or buyback.`
      )
    }
  }

  return flags
}

export function ReservesTrendChart({ annual }: { annual: AnnualFinancials[] }) {
  const data = annual.map((row) => ({
    year: fiscalYearLabel(row.period_end),
    reserves: toCrore(row.reserves),
  }))

  if (data.length < 2) return null
  const flags = buildReservesInsights(annual)

  return (
    <ChartCard title="Reserves trend" sub="₹ Cr, by year">
      <ChartContainer config={reservesConfig} className="aspect-auto h-56 w-full">
        <LineChart data={data} margin={{ left: 4, right: 4, top: 4 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="year" tickLine={false} axisLine={false} tick={axisTick} />
          <YAxis tickLine={false} axisLine={false} width={56} tick={axisTick} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line
            type="monotone"
            dataKey="reserves"
            stroke="var(--color-reserves)"
            strokeWidth={2}
            dot={{ r: 3, fill: VIOLET }}
          />
        </LineChart>
      </ChartContainer>
      {flags.map((flag) => (
        <InsightNote key={flag}>{flag}</InsightNote>
      ))}
    </ChartCard>
  )
}

// ---------- Balance Sheet: borrowings vs fixed assets (dual-axis line + insight) ----------

const borrowingsAssetsConfig: ChartConfig = {
  fixedAssets: { label: "Fixed Assets", color: EMERALD },
  borrowings: { label: "Borrowings", color: ROSE },
}

function buildDeleveragingInsight(annual: AnnualFinancials[]): string | null {
  const valid = annual.filter((row) => row.fixed_assets !== null && row.borrowings !== null)
  if (valid.length < 2) return null

  const first = valid[0]
  const last = valid[valid.length - 1]
  const assetsGrew = last.fixed_assets! > first.fixed_assets!
  const borrowingsFell = last.borrowings! < first.borrowings!

  if (!assetsGrew || !borrowingsFell) return null

  return `Fixed assets grew from ${formatCrore(first.fixed_assets)} to ${formatCrore(last.fixed_assets)} between ${fiscalYearLabel(first.period_end)} and ${fiscalYearLabel(last.period_end)}, while borrowings fell from ${formatCrore(first.borrowings)} to ${formatCrore(last.borrowings)}. Capex looks funded by internal accruals, not debt.`
}

export function BorrowingsVsFixedAssetsChart({ annual }: { annual: AnnualFinancials[] }) {
  const data = annual.map((row) => ({
    year: fiscalYearLabel(row.period_end),
    fixedAssets: toCrore(row.fixed_assets),
    borrowings: toCrore(row.borrowings),
  }))

  if (data.length < 2) return null
  const insight = buildDeleveragingInsight(annual)

  return (
    <ChartCard
      title="Borrowings vs. fixed assets"
      sub="₹ Cr, fixed assets (left axis) vs. borrowings (right axis), by year"
    >
      <ChartContainer config={borrowingsAssetsConfig} className="aspect-auto h-64 w-full">
        <LineChart data={data} margin={{ left: 4, right: 4, top: 4 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="year" tickLine={false} axisLine={false} tick={axisTick} />
          <YAxis yAxisId="assets" tickLine={false} axisLine={false} width={52} tick={axisTick} />
          <YAxis
            yAxisId="borrowings"
            orientation="right"
            tickLine={false}
            axisLine={false}
            width={52}
            tick={axisTick}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Line
            yAxisId="assets"
            type="monotone"
            dataKey="fixedAssets"
            stroke="var(--color-fixedAssets)"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            yAxisId="borrowings"
            type="monotone"
            dataKey="borrowings"
            stroke="var(--color-borrowings)"
            strokeWidth={2}
            strokeDasharray="4 3"
            dot={{ r: 3 }}
          />
        </LineChart>
      </ChartContainer>
      {insight && <InsightNote>{insight}</InsightNote>}
    </ChartCard>
  )
}

// ---------- Balance Sheet: debt to equity (line, kept separate since negative reserves distort it) ----------

const debtEquityConfig: ChartConfig = {
  debtToEquity: { label: "Debt / Equity", color: AMBER },
}

export function DebtToEquityChart({ annual }: { annual: AnnualFinancials[] }) {
  const rows = annual.map((row) => {
    const equity =
      row.equity_capital !== null && row.reserves !== null ? row.equity_capital + row.reserves : null
    const debtToEquity =
      equity !== null && equity > 0 && row.borrowings !== null
        ? Number((row.borrowings / equity).toFixed(2))
        : null
    return {
      year: fiscalYearLabel(row.period_end),
      debtToEquity,
      distorted: equity !== null && equity <= 0,
    }
  })

  if (rows.filter((r) => r.debtToEquity !== null).length < 2) return null
  const distortedYears = rows.filter((r) => r.distorted).map((r) => r.year)

  return (
    <ChartCard title="Debt to equity" sub="Borrowings ÷ (equity capital + reserves), by year">
      <ChartContainer config={debtEquityConfig} className="aspect-auto h-56 w-full">
        <LineChart data={rows} margin={{ left: 4, right: 4, top: 4 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="year" tickLine={false} axisLine={false} tick={axisTick} />
          <YAxis tickLine={false} axisLine={false} width={40} tick={axisTick} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line
            type="monotone"
            dataKey="debtToEquity"
            stroke="var(--color-debtToEquity)"
            strokeWidth={2}
            dot={{ r: 3, fill: AMBER }}
            connectNulls={false}
          />
        </LineChart>
      </ChartContainer>
      {distortedYears.length > 0 && (
        <InsightNote>
          {`Omitted for ${distortedYears.join(", ")}: equity capital + reserves was zero or negative, so the ratio isn't meaningful for ${distortedYears.length === 1 ? "that year" : "those years"}.`}
        </InsightNote>
      )}
    </ChartCard>
  )
}

// ---------- Ratios: ROCE trend across years (line) ----------

const roceConfig: ChartConfig = {
  roce: { label: "ROCE %", color: EMERALD },
}

export function RoceTrendChart({ annual }: { annual: AnnualFinancials[] }) {
  const data = annual
    .filter((row) => row.roce_pct !== null)
    .map((row) => ({ year: fiscalYearLabel(row.period_end), roce: Number(row.roce_pct) }))

  if (data.length < 2) return null

  return (
    <ChartCard title="ROCE trend" sub="% by year">
      <ChartContainer config={roceConfig} className="aspect-auto h-56 w-full">
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
          <Line
            type="monotone"
            dataKey="roce"
            stroke="var(--color-roce)"
            strokeWidth={2}
            dot={{ r: 3, fill: EMERALD }}
          />
        </LineChart>
      </ChartContainer>
    </ChartCard>
  )
}

// ---------- Peers: net profit comparison (bar, current company highlighted) ----------

const peerConfig: ChartConfig = {
  netProfit: { label: "Net Profit", color: EMERALD },
}

export function PeerNetProfitChart({
  currentCompanyLabel,
  currentNetProfit,
  peers,
  peerSnapshots,
}: {
  currentCompanyLabel: string
  currentNetProfit: number | null
  peers: Company[]
  peerSnapshots: Map<string, AnnualFinancials>
}) {
  const data = [
    {
      name: currentCompanyLabel,
      netProfit: toCrore(currentNetProfit),
      isCurrent: true,
    },
    ...peers.map((peer) => ({
      name: peer.symbol,
      netProfit: toCrore(peerSnapshots.get(peer.symbol)?.net_profit ?? null),
      isCurrent: false,
    })),
  ]

  if (data.length < 2) return null

  return (
    <ChartCard title="Net profit vs. peers" sub="₹ Cr, latest reported year">
      <ChartContainer config={peerConfig} className="aspect-auto h-64 w-full">
        <BarChart data={data} margin={{ left: 4, right: 4, top: 4 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="name" tickLine={false} axisLine={false} tick={axisTick} />
          <YAxis tickLine={false} axisLine={false} width={48} tick={axisTick} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="netProfit" radius={4}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.isCurrent ? EMERALD : "var(--muted-foreground)"} fillOpacity={entry.isCurrent ? 1 : 0.35} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </ChartCard>
  )
}
