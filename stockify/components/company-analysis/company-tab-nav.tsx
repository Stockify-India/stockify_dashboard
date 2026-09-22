"use client"

import { useEffect, useRef, useState } from "react"
import {
  AlertTriangleIcon,
  BuildingIcon,
  FileTextIcon,
  GlobeIcon,
  SearchIcon,
  UsersIcon,
} from "lucide-react"
import { motion } from "framer-motion"
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
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCompanyAnalysis, type CompanyAnalysisData } from "@/components/company-analysis/use-company-analysis"
import { AnimatedNumber, AnimatedRange } from "@/components/company-analysis/animated-number"
import { MetricCategoryGrid } from "@/components/company-analysis/company-metrics"
import { AnalysisPanel } from "@/components/company-analysis/analysis-panel"
import { ShareholdingPanel } from "@/components/company-analysis/shareholding"
import { buildMetricCategories } from "@/lib/financial-metrics"
import {
  AnnualPbtTaxSplitChart,
  BalanceSheetCompositionChart,
  BorrowingsVsFixedAssetsChart,
  CashConversionChart,
  CashFlowMixChart,
  DebtToEquityChart,
  EpsPayoutChart,
  FreeCashFlowTrendChart,
  InterestDepreciationBurdenChart,
  InvestingFinancingChart,
  MarginPayoutTrendChart,
  NetProfitMarginChart,
  PbtTaxSplitChart,
  PeerNetProfitChart,
  QuarterlyTrendChart,
  ReservesTrendChart,
  RevenueExpenseProfitChart,
  RoceTrendChart,
  YoyQuarterComparisonChart,
} from "@/components/company-analysis/company-charts"
import {
  fiscalQuarterLabel,
  fiscalYearEndYear,
  fiscalYearLabel,
  formatCrore,
  formatDate,
  formatPercent,
  formatRupee,
} from "@/lib/format"
import type { AnnualFinancials, QuarterlyResult } from "@/lib/company-data"

const SPRING = { type: "spring", stiffness: 100, damping: 20 } as const

const STAGGER_ITEM =
  "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 fill-mode-backwards duration-300"

function staggerDelay(index: number) {
  return { animationDelay: `${index * 40}ms` }
}

export function EmptyPanel({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="flex size-11 items-center justify-center rounded-full bg-muted">
        <Icon className="size-5 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="mx-auto max-w-sm text-sm text-balance text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  )
}

function TabSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="h-4 w-2/3 rounded" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  )
}

type MetricValue =
  | { kind: "number"; value: number | null; format: (n: number) => string }
  | { kind: "range"; low: number | null; high: number | null; format: (n: number) => string }
  | { kind: "text"; value: string }

type MetricTile = { label: string; value: MetricValue; sub?: string }

function num(value: number | null, format: (n: number) => string): MetricValue {
  return { kind: "number", value, format }
}

function MetricValueDisplay({ value, className }: { value: MetricValue; className?: string }) {
  if (value.kind === "number") {
    return <AnimatedNumber value={value.value} format={value.format} className={className} />
  }
  if (value.kind === "range") {
    return (
      <AnimatedRange low={value.low} high={value.high} format={value.format} className={className} />
    )
  }
  return <span className={className}>{value.value}</span>
}

function MetricBento({
  highlight,
  tiles,
}: {
  highlight: MetricTile
  tiles: MetricTile[]
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:[grid-auto-flow:dense]">
      <Card className="col-span-2 row-span-2 h-full rounded-2xl bg-foreground/[0.03] dark:bg-foreground/[0.06]">
        <CardContent className="flex h-full flex-col justify-between gap-3">
          <span className="text-xs font-medium text-muted-foreground">
            {highlight.label}
          </span>
          <div>
            <MetricValueDisplay
              value={highlight.value}
              className="text-2xl font-semibold tracking-tight text-foreground tabular-nums"
            />
            {highlight.sub && (
              <p className="mt-1 text-xs text-muted-foreground">{highlight.sub}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {tiles.map((tile) => (
        <Card
          key={tile.label}
          className="rounded-2xl transition-transform duration-300 ease-out hover:-translate-y-0.5"
        >
          <CardContent className="flex flex-col gap-2">
            <span className="text-xs text-muted-foreground">{tile.label}</span>
            <MetricValueDisplay value={tile.value} className="text-sm font-semibold tabular-nums" />
            {tile.sub && (
              <span className="text-[11px] text-muted-foreground">{tile.sub}</span>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function StatementTable({
  periods,
  rows,
}: {
  periods: string[]
  rows: { label: string; values: string[] }[]
}) {
  // The sticky first column needs a fully opaque background — anything
  // translucent lets the header/body text scrolling underneath bleed
  // through it, which is what produced the ghosted double-text. The
  // right-edge shadow (rather than a border) is what actually signals
  // "content continues under here" once you've scrolled.
  const stickyColClass =
    "sticky left-0 z-10 bg-background shadow-[6px_0_8px_-6px_rgba(0,0,0,0.12)] dark:shadow-[6px_0_8px_-6px_rgba(0,0,0,0.5)]"

  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className={cn(stickyColClass, "min-w-[168px]")}>
              Particulars
            </TableHead>
            {periods.map((period) => (
              <TableHead key={period} className="min-w-[92px] text-right font-mono">
                {period}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow
              key={row.label}
              className={STAGGER_ITEM}
              style={staggerDelay(index)}
            >
              <TableCell className={cn(stickyColClass, "font-medium text-foreground/80")}>
                {row.label}
              </TableCell>
              {row.values.map((value, i) => (
                <TableCell key={periods[i]} className="text-right tabular-nums">
                  {value}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function RangeBar({
  label,
  low,
  high,
  lowSub,
  highSub,
}: {
  label: string
  low: number | null
  high: number | null
  lowSub?: string
  highSub?: string
}) {
  if (low === null || high === null) {
    return (
      <div className="rounded-xl border px-4 py-6 text-center text-sm text-muted-foreground">
        {label}: not available
      </div>
    )
  }

  return (
    <div className="rounded-xl border p-4">
      <p className="mb-3 text-xs font-medium text-muted-foreground">{label}</p>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full w-full origin-left rounded-full bg-gradient-to-r from-rose-500/30 via-muted to-emerald-500/40"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <div>
          <AnimatedNumber
            value={low}
            format={formatRupee}
            className="text-sm font-semibold tabular-nums"
          />
          {lowSub && <div className="text-[11px] text-muted-foreground">{lowSub}</div>}
        </div>
        <div className="text-right">
          <AnimatedNumber
            value={high}
            format={formatRupee}
            className="text-sm font-semibold tabular-nums"
          />
          {highSub && <div className="text-[11px] text-muted-foreground">{highSub}</div>}
        </div>
      </div>
    </div>
  )
}

function PeerTable({ data }: { data: CompanyAnalysisData }) {
  if (data.peers.length === 0) {
    return (
      <EmptyPanel
        icon={UsersIcon}
        title="No peers found"
        description={`No other tracked companies share the "${data.profile.industry}" industry classification.`}
      />
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[32%]">Company</TableHead>
            <TableHead className="text-right">Sales</TableHead>
            <TableHead className="text-right">Net Profit</TableHead>
            <TableHead className="text-right">ROCE %</TableHead>
            <TableHead className="text-right">EPS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.peers.map((peer, index) => {
            const snapshot = data.peerSnapshots.get(peer.symbol)
            return (
              <TableRow
                key={peer.symbol}
                className={STAGGER_ITEM}
                style={staggerDelay(index)}
              >
                <TableCell className="font-medium text-foreground/80">
                  {peer.name}
                  <span className="ml-1.5 font-mono text-[11px] text-muted-foreground">
                    {peer.symbol}
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCrore(snapshot?.sales)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCrore(snapshot?.net_profit)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatPercent(snapshot?.roce_pct)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatRupee(snapshot?.eps)}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

function CompanyProfileCard({ data }: { data: CompanyAnalysisData }) {
  const { profile } = data
  return (
    <Card className="rounded-2xl">
      <CardContent className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BuildingIcon className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">{profile.industry}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            ISIN {profile.isin ?? "—"} · Listed {formatDate(profile.listingDate)}
          </p>
        </div>
        {profile.website && (
          <a
            href={profile.website}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <GlobeIcon className="size-3.5" />
            Website
          </a>
        )}
      </CardContent>
      {profile.indices.length > 0 && (
        <CardContent className="flex flex-wrap gap-1.5">
          {profile.indices.map((index) => (
            <Badge key={index} variant="secondary" className="text-[11px]">
              {index}
            </Badge>
          ))}
        </CardContent>
      )}
    </Card>
  )
}

function latestAnnual(annual: AnnualFinancials[]) {
  return annual[annual.length - 1]
}

function latestQuarter(quarterly: QuarterlyResult[]) {
  return quarterly[quarterly.length - 1]
}

function OverviewPanel({ data }: { data: CompanyAnalysisData }) {
  const { priceStats, annual, quarterly } = data
  const fy = latestAnnual(annual)
  const q = latestQuarter(quarterly)

  return (
    <div className="flex flex-col gap-6">
      <CompanyProfileCard data={data} />
      <MetricBento
        highlight={{
          label: "52-Week Range",
          value: { kind: "range", low: priceStats.week52Low, high: priceStats.week52High, format: formatRupee },
          sub: "Low to high, trailing 52 weeks",
        }}
        tiles={[
          {
            label: "All-Time High",
            value: num(priceStats.allTimeHigh, formatRupee),
            sub: formatDate(priceStats.allTimeHighDate),
          },
          {
            label: "All-Time Low",
            value: num(priceStats.allTimeLow, formatRupee),
            sub: formatDate(priceStats.allTimeLowDate),
          },
          {
            label: "ROCE",
            value: num(fy?.roce_pct ?? null, formatPercent),
            sub: fy ? fiscalYearLabel(fy.period_end) : undefined,
          },
          {
            label: "EPS",
            value: num(fy?.eps ?? null, formatRupee),
            sub: fy ? fiscalYearLabel(fy.period_end) : undefined,
          },
          {
            label: "Latest Quarter Revenue",
            value: num(q?.revenue ?? null, formatCrore),
            sub: q ? fiscalQuarterLabel(q.period_end) : undefined,
          },
          {
            label: "Latest Quarter Net Profit",
            value: num(q?.net_profit ?? null, formatCrore),
            sub: q ? fiscalQuarterLabel(q.period_end) : undefined,
          },
        ]}
      />
    </div>
  )
}

function RatiosPanel({ data }: { data: CompanyAnalysisData }) {
  const fy = latestAnnual(data.annual)
  if (!fy) {
    return (
      <EmptyPanel
        icon={AlertTriangleIcon}
        title="No ratio data"
        description="Annual financials haven't been extracted for this company yet."
      />
    )
  }

  const categories = buildMetricCategories(data.annual, data.rawFinancials)
  return <MetricCategoryGrid categories={categories} />
}

const SECTION_TABS = [
  { value: "overview", label: "Overview" },
  { value: "chart", label: "Chart" },
  { value: "analysis", label: "Analysis" },
  { value: "peers", label: "Peers" },
  { value: "quarters", label: "Quarters" },
  { value: "profit-loss", label: "Profit & Loss" },
  { value: "balance-sheet", label: "Balance Sheet" },
  { value: "cash-flow", label: "Cash Flow" },
  { value: "ratios", label: "Ratios" },
  { value: "investors", label: "Shareholding" },
  { value: "documents", label: "Documents" },
] as const

function TabTrigger({
  value,
  isActive,
  className,
  children,
}: {
  value: string
  isActive: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <TabsTrigger
      value={value}
      className={cn(
        "after:opacity-0! active:scale-[0.97] rounded-md transition-colors",
        "hover:bg-foreground/5 dark:hover:bg-foreground/10",
        className
      )}
    >
      {children}
      {isActive && (
        <motion.span
          layoutId="company-tabs-underline"
          className="absolute inset-x-1.5 -bottom-2 h-0.5 rounded-full bg-foreground"
          transition={SPRING}
        />
      )}
    </TabsTrigger>
  )
}

function CompanyIdentityHeader({
  symbol,
  name,
  industry,
}: {
  symbol: string
  name: string
  industry: string
}) {
  return (
    <div className="border-b bg-background px-4 py-3.5 lg:px-6">
      {/* Keyed on symbol so a company switch crossfades the identity in
          place instead of popping — the same quiet-fade language as
          PanelReveal, just applied to who you're looking at rather than
          what tab you're on. */}
      <motion.div
        key={symbol}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="flex min-w-0 flex-wrap items-baseline gap-x-2.5 gap-y-1"
      >
        <h1 className="min-w-0 truncate text-lg font-semibold tracking-tight text-foreground">
          {name}
        </h1>
        <span className="shrink-0 rounded-md bg-foreground/[0.06] px-1.5 py-0.5 font-mono text-[11px] font-semibold tracking-wide text-foreground">
          {symbol}
        </span>
        <span className="shrink-0 text-xs text-muted-foreground">{industry}</span>
      </motion.div>
    </div>
  )
}

export function CompanyAnalysisTabs({
  symbol,
  companyName,
  industry,
}: {
  symbol: string
  companyName: string
  industry: string
}) {
  const [activeTab, setActiveTab] = useState("overview")
  const listRef = useRef<HTMLDivElement>(null)
  const state = useCompanyAnalysis(symbol)
  const isRefreshing = state.status === "ready" && state.isRefreshing

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>('[data-slot="tabs-trigger"][data-active]')
      ?.scrollIntoView({ behavior: "smooth", inline: "nearest", block: "nearest" })
  }, [activeTab])

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as string)}>
      <CompanyIdentityHeader symbol={symbol} name={companyName} industry={industry} />

      <div className="relative border-b bg-muted/30">
        <TabsList
          ref={listRef}
          variant="line"
          className="h-auto w-full justify-start overflow-x-auto px-4 py-2 lg:px-6"
        >
          {SECTION_TABS.map((tab) => (
            <TabTrigger
              key={tab.value}
              value={tab.value}
              isActive={activeTab === tab.value}
            >
              {tab.label}
            </TabTrigger>
          ))}
        </TabsList>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-linear-to-l from-muted/30 to-transparent" />
        {/* Company switch keeps the old numbers on screen; this is the only
            cue that a fetch is in flight, so it earns a real animation. */}
        {isRefreshing && (
          <div
            aria-hidden
            className="absolute inset-x-0 -bottom-px h-0.5 overflow-hidden bg-foreground/10"
          >
            <div className="h-full w-1/3 bg-foreground motion-safe:animate-[refresh-sweep_1.1s_ease-in-out_infinite]" />
          </div>
        )}
      </div>

      <div
        className={cn(
          "px-4 py-6 transition-opacity duration-300 lg:px-6",
          isRefreshing && "opacity-70"
        )}
      >
        {state.status === "loading" && <TabSkeleton />}

        {state.status === "error" && (
          <EmptyPanel
            icon={AlertTriangleIcon}
            title="Couldn't load company data"
            description={state.message}
          />
        )}

        {state.status === "ready" && <CompanyPanels data={state.data} />}
      </div>
    </Tabs>
  )
}

function PanelReveal({ children }: { children: React.ReactNode }) {
  // Deliberately quiet: this just acknowledges "new panel content arrived"
  // on every tab switch, so it stays a fast opacity fade rather than the
  // spatial rise that would compete with the ticking numbers and range-bar
  // draw-in that are this page's actual authored moments.
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  )
}

const QUARTERS_TABLE_FY_RANGE = [2022, 2027] as const

function CompanyPanels({ data }: { data: CompanyAnalysisData }) {
  const { annual, quarterly, priceStats } = data
  const periods = annual.map((row) => fiscalYearLabel(row.period_end))
  const quartersInRange = quarterly.filter((row) => {
    const fy = fiscalYearEndYear(row.period_end)
    return fy >= QUARTERS_TABLE_FY_RANGE[0] && fy <= QUARTERS_TABLE_FY_RANGE[1]
  })
  const quarterPeriods = quartersInRange.map((row) => fiscalQuarterLabel(row.period_end))

  return (
    <>
      <TabsContent value="overview">
        <PanelReveal>
          <OverviewPanel data={data} />
        </PanelReveal>
      </TabsContent>

      <TabsContent value="chart">
        <PanelReveal>
          <div className="flex flex-col gap-4">
            <p className="text-xs text-muted-foreground">
              Daily price history isn&apos;t tracked yet — showing the recorded high/low
              bands instead.
            </p>
            <RangeBar
              label="52-Week Range"
              low={priceStats.week52Low}
              high={priceStats.week52High}
              lowSub="Low"
              highSub="High"
            />
            <RangeBar
              label="All-Time Range"
              low={priceStats.allTimeLow}
              high={priceStats.allTimeHigh}
              lowSub={formatDate(priceStats.allTimeLowDate)}
              highSub={formatDate(priceStats.allTimeHighDate)}
            />
          </div>
        </PanelReveal>
      </TabsContent>

      <TabsContent value="analysis">
        <PanelReveal>
          {data.companyAnalysis ? (
            <AnalysisPanel record={data.companyAnalysis} />
          ) : (
            <EmptyPanel
              icon={SearchIcon}
              title="Analyst take"
              description="A summary of valuation, growth, and risk for this company will appear here once analysis data is available."
            />
          )}
        </PanelReveal>
      </TabsContent>

      <TabsContent value="peers">
        <PanelReveal>
          <div className="flex flex-col gap-4">
            <PeerNetProfitChart
              currentCompanyLabel={data.profile.name}
              currentNetProfit={latestAnnual(annual)?.net_profit ?? null}
              peers={data.peers}
              peerSnapshots={data.peerSnapshots}
            />
            <PeerTable data={data} />
          </div>
        </PanelReveal>
      </TabsContent>

      <TabsContent value="quarters">
        <PanelReveal>
          {quartersInRange.length > 0 ? (
            <div className="flex flex-col gap-4">
              <QuarterlyTrendChart quarters={quartersInRange} />
              <NetProfitMarginChart quarters={quartersInRange} />
              <YoyQuarterComparisonChart quarters={quartersInRange} />
              <PbtTaxSplitChart quarters={quartersInRange} />
              <StatementTable
                periods={quarterPeriods}
                rows={[
                  { label: "Revenue", values: quartersInRange.map((r) => formatCrore(r.revenue)) },
                  { label: "Other Income", values: quartersInRange.map((r) => formatCrore(r.other_income)) },
                  { label: "Interest", values: quartersInRange.map((r) => formatCrore(r.interest)) },
                  { label: "Depreciation", values: quartersInRange.map((r) => formatCrore(r.depreciation)) },
                  { label: "Total Expenses", values: quartersInRange.map((r) => formatCrore(r.expenses_total)) },
                  { label: "Profit before Tax", values: quartersInRange.map((r) => formatCrore(r.profit_before_tax)) },
                  { label: "Tax", values: quartersInRange.map((r) => formatCrore(r.tax_expense)) },
                  { label: "Net Profit", values: quartersInRange.map((r) => formatCrore(r.net_profit)) },
                  { label: "EPS", values: quartersInRange.map((r) => formatRupee(r.eps)) },
                ]}
              />
            </div>
          ) : (
            <EmptyPanel
              icon={AlertTriangleIcon}
              title="No quarterly data"
              description="Quarterly results haven't been extracted for FY22–FY27 for this company yet."
            />
          )}
        </PanelReveal>
      </TabsContent>

      <TabsContent value="profit-loss">
        <PanelReveal>
          {annual.length > 0 ? (
            <div className="flex flex-col gap-4">
              <RevenueExpenseProfitChart annual={annual} quarters={quartersInRange} />
              <MarginPayoutTrendChart annual={annual} />
              <InterestDepreciationBurdenChart annual={annual} />
              <AnnualPbtTaxSplitChart annual={annual} />
              <EpsPayoutChart annual={annual} />
              <StatementTable
                periods={periods}
                rows={[
                  { label: "Sales", values: annual.map((r) => formatCrore(r.sales)) },
                  { label: "Expenses", values: annual.map((r) => formatCrore(r.expenses)) },
                  { label: "Operating Profit", values: annual.map((r) => formatCrore(r.operating_profit)) },
                  { label: "OPM %", values: annual.map((r) => formatPercent(r.opm_pct)) },
                  { label: "Other Income", values: annual.map((r) => formatCrore(r.other_income)) },
                  { label: "Interest", values: annual.map((r) => formatCrore(r.interest)) },
                  { label: "Depreciation", values: annual.map((r) => formatCrore(r.depreciation)) },
                  { label: "Profit before Tax", values: annual.map((r) => formatCrore(r.profit_before_tax)) },
                  { label: "Tax %", values: annual.map((r) => formatPercent(r.tax_pct)) },
                  { label: "Net Profit", values: annual.map((r) => formatCrore(r.net_profit)) },
                  { label: "EPS", values: annual.map((r) => formatRupee(r.eps)) },
                  { label: "Dividend Payout %", values: annual.map((r) => formatPercent(r.dividend_payout_pct)) },
                ]}
              />
            </div>
          ) : (
            <EmptyPanel
              icon={AlertTriangleIcon}
              title="No annual data"
              description="Annual financials haven't been extracted for this company yet."
            />
          )}
        </PanelReveal>
      </TabsContent>

      <TabsContent value="balance-sheet">
        <PanelReveal>
          {annual.length > 0 ? (
            <div className="flex flex-col gap-4">
              <BalanceSheetCompositionChart annual={annual} />
              <ReservesTrendChart annual={annual} />
              <BorrowingsVsFixedAssetsChart annual={annual} />
              <DebtToEquityChart annual={annual} />
              <StatementTable
                periods={periods}
                rows={[
                  { label: "Equity Capital", values: annual.map((r) => formatCrore(r.equity_capital)) },
                  { label: "Reserves", values: annual.map((r) => formatCrore(r.reserves)) },
                  { label: "Borrowings", values: annual.map((r) => formatCrore(r.borrowings)) },
                  { label: "Other Liabilities", values: annual.map((r) => formatCrore(r.other_liabilities)) },
                  { label: "Total Liabilities", values: annual.map((r) => formatCrore(r.total_liabilities)) },
                  { label: "Fixed Assets", values: annual.map((r) => formatCrore(r.fixed_assets)) },
                  { label: "CWIP", values: annual.map((r) => formatCrore(r.cwip)) },
                  { label: "Investments", values: annual.map((r) => formatCrore(r.investments)) },
                  { label: "Other Assets", values: annual.map((r) => formatCrore(r.other_assets)) },
                  { label: "Total Assets", values: annual.map((r) => formatCrore(r.total_assets)) },
                ]}
              />
            </div>
          ) : (
            <EmptyPanel
              icon={AlertTriangleIcon}
              title="No balance sheet data"
              description="Annual financials haven't been extracted for this company yet."
            />
          )}
        </PanelReveal>
      </TabsContent>

      <TabsContent value="cash-flow">
        <PanelReveal>
          {annual.length > 0 ? (
            <div className="flex flex-col gap-4">
              <CashFlowMixChart annual={annual} />
              <FreeCashFlowTrendChart annual={annual} />
              <CashConversionChart annual={annual} />
              <InvestingFinancingChart annual={annual} />
              <StatementTable
                periods={periods}
                rows={[
                  { label: "Cash from Operating Activity", values: annual.map((r) => formatCrore(r.cfo)) },
                  { label: "Cash from Investing Activity", values: annual.map((r) => formatCrore(r.cfi)) },
                  { label: "Cash from Financing Activity", values: annual.map((r) => formatCrore(r.cff)) },
                  { label: "Net Cash Flow", values: annual.map((r) => formatCrore(r.net_cash_flow)) },
                  { label: "Free Cash Flow", values: annual.map((r) => formatCrore(r.free_cash_flow)) },
                ]}
              />
            </div>
          ) : (
            <EmptyPanel
              icon={AlertTriangleIcon}
              title="No cash flow data"
              description="Annual financials haven't been extracted for this company yet."
            />
          )}
        </PanelReveal>
      </TabsContent>

      <TabsContent value="ratios">
        <PanelReveal>
          <div className="flex flex-col gap-4">
            <RoceTrendChart annual={annual} />
            <RatiosPanel data={data} />
          </div>
        </PanelReveal>
      </TabsContent>

      <TabsContent value="investors">
        <PanelReveal>
          <ShareholdingPanel />
        </PanelReveal>
      </TabsContent>

      <TabsContent value="documents">
        <PanelReveal>
          <EmptyPanel
            icon={FileTextIcon}
            title="No documents available"
            description="Announcements and filings for this company haven't been synced from the exchange yet."
          />
        </PanelReveal>
      </TabsContent>
    </>
  )
}
