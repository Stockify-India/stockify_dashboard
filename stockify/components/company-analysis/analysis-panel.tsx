"use client"

import {
  AlertTriangleIcon,
  BuildingIcon,
  ShieldAlertIcon,
  SparklesIcon,
} from "lucide-react"
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, XAxis, YAxis } from "recharts"
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
import {
  ChartContainer,
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
  axisTick,
} from "@/components/company-analysis/company-charts"
import {
  parseFyPercentSeries,
  parseFyRupeeSeries,
  type AnalysisRecord,
  type GeographyEntry,
  type RedFlagEntry,
  type RevenueSource,
  type Segment,
} from "@/lib/analysis-data"
import { formatDate } from "@/lib/format"

const SERIES_COLORS = [EMERALD, SKY, VIOLET, AMBER, ROSE]

const NO_EVIDENCE = new Set([
  "insufficient evidence from annual report",
  "n/a",
  "none",
  "none identified.",
])

function isMeaningful(value: unknown): value is string {
  if (typeof value !== "string") return false
  const trimmed = value.trim()
  if (!trimmed) return false
  return !NO_EVIDENCE.has(trimmed.toLowerCase())
}

function asString(value: unknown): string | undefined {
  return isMeaningful(value) ? value : undefined
}

function humanizeKey(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function DefinitionGrid({ items }: { items: { label: string; value: string }[] }) {
  if (items.length === 0) return null
  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border bg-background px-3 py-2.5">
          <p className="text-[11px] font-medium text-muted-foreground">{item.label}</p>
          <p className="mt-0.5 text-sm text-foreground/90">{item.value}</p>
        </div>
      ))}
    </div>
  )
}

const STATUS_STYLES: Record<string, string> = {
  green: "bg-emerald-500 dark:bg-emerald-400",
  amber: "bg-amber-500 dark:bg-amber-400",
  red: "bg-destructive",
}

function StatusDot({ status }: { status: string }) {
  const key = status.trim().toLowerCase()
  const className = STATUS_STYLES[key] ?? "bg-muted-foreground/30"
  return <span className={cn("mt-1 block size-2 shrink-0 rounded-full", className)} />
}

function RedFlagRow({ label, flag }: { label: string; flag: RedFlagEntry }) {
  return (
    <div className="flex gap-2.5 border-b py-2.5 last:border-0">
      <div className="pt-1">
        <StatusDot status={flag.status} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground/90">{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{flag.detail}</p>
      </div>
    </div>
  )
}

const CLASSIFICATION_COLORS: Record<string, string> = {
  "growth engine": "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  "cash cow": "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  declining: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400",
}

function ClassificationBadge({ classification }: { classification?: string | null }) {
  if (!isMeaningful(classification)) return null
  const key = classification.trim().toLowerCase()
  const className = CLASSIFICATION_COLORS[key] ?? "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-400"
  return (
    <Badge variant="outline" className={cn("capitalize", className)}>
      {classification}
    </Badge>
  )
}

// ---------- Revenue mix (horizontal bar + trend notes) ----------

function RevenueMixSection({ sources }: { sources: RevenueSource[] }) {
  const data = sources
    .filter((s) => typeof s.percentage_pct === "number")
    .map((s, i) => ({ name: s.name, value: s.percentage_pct as number, fill: SERIES_COLORS[i % SERIES_COLORS.length] }))

  if (data.length === 0) return null

  const config: ChartConfig = Object.fromEntries(
    data.map((d, i) => [d.name, { label: d.name, color: SERIES_COLORS[i % SERIES_COLORS.length] }])
  )

  return (
    <ChartCard
      title="Revenue mix"
      sub="Share of revenue by source, as extracted from the filing (bases may differ between rows — see amounts)"
    >
      <ChartContainer config={config} className="aspect-auto h-64 w-full">
        <BarChart data={data} layout="vertical" margin={{ left: 4, right: 24, top: 4 }}>
          <CartesianGrid horizontal={false} strokeDasharray="3 3" />
          <XAxis type="number" tickFormatter={(v) => `${v}%`} tickLine={false} axisLine={false} tick={axisTick} />
          <YAxis
            type="category"
            dataKey="name"
            width={160}
            tickLine={false}
            axisLine={false}
            tick={axisTick}
          />
          <ChartTooltip content={<ChartTooltipContent />} formatter={(value) => `${value}%`} />
          <Bar dataKey="value" radius={4}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.fill} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {sources
          .filter((s) => isMeaningful(s.trend_3_5y) || isMeaningful(s.amount))
          .map((s) => (
            <div key={s.name} className="rounded-xl border bg-background px-3 py-2.5">
              <p className="text-[11px] font-medium text-muted-foreground">
                {s.name}
                {isMeaningful(s.amount) && <span className="ml-1 font-mono">· {s.amount}</span>}
              </p>
              {isMeaningful(s.trend_3_5y) && (
                <p className="mt-0.5 text-xs text-foreground/80">{s.trend_3_5y}</p>
              )}
            </div>
          ))}
      </div>
    </ChartCard>
  )
}

// ---------- Segments (table + grouped bar) ----------

const segmentConfig: ChartConfig = {
  revenue_share_pct: { label: "Revenue share", color: SKY },
  ebit_share_pct: { label: "Profit share", color: EMERALD },
}

function SegmentsSection({ segments }: { segments: Segment[] }) {
  const chartData = segments
    .filter((s) => typeof s.revenue_share_pct === "number" || typeof s.ebit_share_pct === "number")
    .map((s) => ({
      name: s.name,
      revenue_share_pct: s.revenue_share_pct ?? 0,
      ebit_share_pct: s.ebit_share_pct ?? 0,
    }))

  return (
    <ChartCard title="Segments" sub="Revenue share vs. profit share, by reporting segment">
      {chartData.length > 0 && (
        <ChartContainer config={segmentConfig} className="aspect-auto h-64 w-full">
          <BarChart data={chartData} margin={{ left: 4, right: 4, top: 4 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tick={axisTick} interval={0} />
            <YAxis tickFormatter={(v) => `${v}%`} tickLine={false} axisLine={false} width={40} tick={axisTick} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="revenue_share_pct" fill="var(--color-revenue_share_pct)" radius={4} />
            <Bar dataKey="ebit_share_pct" fill="var(--color-ebit_share_pct)" radius={4} />
          </BarChart>
        </ChartContainer>
      )}

      <div className="mt-4 rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Segment</TableHead>
              <TableHead>Revenue</TableHead>
              <TableHead>Profit (PBT/EBIT)</TableHead>
              <TableHead>Growth</TableHead>
              <TableHead>Read</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {segments.map((s) => (
              <TableRow key={s.name}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell className="text-sm">
                  {s.revenue ?? "—"}
                  {typeof s.revenue_share_pct === "number" && (
                    <span className="ml-1 text-xs text-muted-foreground">({s.revenue_share_pct}%)</span>
                  )}
                </TableCell>
                <TableCell className="text-sm">{s.profit_contribution ?? "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{s.revenue_growth ?? "—"}</TableCell>
                <TableCell>
                  <ClassificationBadge classification={s.classification} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </ChartCard>
  )
}

// ---------- Geography (split bar + notes) ----------

function GeographySection({ entries }: { entries: GeographyEntry[] }) {
  const withShare = entries.filter((e) => typeof e.revenue_share_pct === "number")

  return (
    <ChartCard title="Geographic mix" sub="Revenue by domestic vs. international operations">
      {withShare.length > 0 && (
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
          {withShare.map((e, i) => (
            <div
              key={e.region}
              style={{ width: `${e.revenue_share_pct}%`, backgroundColor: SERIES_COLORS[i % SERIES_COLORS.length] }}
              title={`${e.region}: ${e.revenue_share_pct}%`}
            />
          ))}
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-3">
        {withShare.map((e, i) => (
          <span key={e.region} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: SERIES_COLORS[i % SERIES_COLORS.length] }}
            />
            {e.region} — {e.revenue_share_pct}%
          </span>
        ))}
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {entries
          .filter((e) => isMeaningful(e.country_concentration))
          .map((e) => (
            <p key={e.region} className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground/80">{e.region}: </span>
              {e.country_concentration}
            </p>
          ))}
      </div>
    </ChartCard>
  )
}

// ---------- Parsed FY trend line (generic: margin / ROE / anything "X% in FYyy") ----------

function FyPercentTrendChart({
  title,
  sub,
  color,
  series,
}: {
  title: string
  sub?: string
  color: string
  series: { fy: string; value: number }[]
}) {
  if (series.length < 2) return null
  const config: ChartConfig = { value: { label: title, color } }
  return (
    <ChartCard title={title} sub={sub}>
      <ChartContainer config={config} className="aspect-auto h-56 w-full">
        <LineChart data={series} margin={{ left: 4, right: 4, top: 4 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="fy" tickLine={false} axisLine={false} tick={axisTick} />
          <YAxis tickFormatter={(v) => `${v}%`} tickLine={false} axisLine={false} width={44} tick={axisTick} />
          <ChartTooltip content={<ChartTooltipContent />} formatter={(value) => `${value}%`} />
          <Line type="monotone" dataKey="value" stroke="var(--color-value)" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ChartContainer>
    </ChartCard>
  )
}

function FyRupeeBarChart({
  title,
  sub,
  color,
  series,
}: {
  title: string
  sub?: string
  color: string
  series: { fy: string; value: number }[]
}) {
  if (series.length < 2) return null
  const config: ChartConfig = { value: { label: title, color } }
  return (
    <ChartCard title={title} sub={sub}>
      <ChartContainer config={config} className="aspect-auto h-56 w-full">
        <BarChart data={series} margin={{ left: 4, right: 4, top: 4 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="fy" tickLine={false} axisLine={false} tick={axisTick} />
          <YAxis tickFormatter={(v) => `₹${v}`} tickLine={false} axisLine={false} width={44} tick={axisTick} />
          <ChartTooltip content={<ChartTooltipContent />} formatter={(value) => `₹${value}`} />
          <Bar dataKey="value" fill="var(--color-value)" radius={4} />
        </BarChart>
      </ChartContainer>
    </ChartCard>
  )
}

export function AnalysisPanel({ record }: { record: AnalysisRecord }) {
  const { analysis } = record.document
  const business = analysis.business_model ?? {}
  const revenueSources = analysis.revenue_mix?.sources ?? []
  const segments = analysis.segments ?? []
  const geography = analysis.geography ?? []
  const margins = analysis.margins ?? []
  const competitive = analysis.competitive_positioning
  const management = analysis.management ?? {}
  const balanceSheet = analysis.balance_sheet ?? {}
  const redFlags = analysis.red_flags ?? {}
  const regulatory = analysis.regulatory ?? {}
  const valuation = analysis.valuation ?? {}
  const keyHighlights = analysis.key_highlights ?? []

  const businessItems = Object.entries(business)
    .filter(([, v]) => isMeaningful(v))
    .map(([k, v]) => ({ label: humanizeKey(k), value: v as string }))

  const marginSeries = margins
    .map((m) => ({ segment: m.segment_name, series: parseFyPercentSeries(m.margin_trends_3_5y) }))
    .filter((m) => m.series.length >= 2)
    .sort((a, b) => b.series.length - a.series.length)[0]

  const roeSeries = parseFyPercentSeries(asString(balanceSheet.roe_trend))
  const dpsSeries = parseFyRupeeSeries(
    asString(management.capital_allocation_consistency) ?? asString(management.dividend_buyback_policy)
  )

  const flagEntries = Object.entries(redFlags).filter(
    ([key, value]) => key !== "sector_specific_flags" && value && !Array.isArray(value)
  ) as [string, RedFlagEntry][]
  const sectorFlags = (redFlags.sector_specific_flags as RedFlagEntry[] | undefined) ?? []

  const managementItems = [
    ["promoter_background", management.promoter_background],
    ["promoter_shareholding_pct", management.promoter_shareholding_pct != null ? `${management.promoter_shareholding_pct}%` : undefined],
    ["promoter_pledging_pct", management.promoter_pledging_pct != null ? `${management.promoter_pledging_pct}%` : undefined],
    ["capex_history", management.capex_history],
    ["mna_history", management.mna_history],
    ["dividend_buyback_policy", management.dividend_buyback_policy],
    ["auditor_name", management.auditor_name],
    ["regulatory_actions", management.regulatory_actions],
  ]
    .filter(([, v]) => isMeaningful(v))
    .map(([k, v]) => ({ label: humanizeKey(k as string), value: v as string }))

  const balanceSheetItems = [
    ["roa_pct", balanceSheet.roa_pct != null ? `${balanceSheet.roa_pct}%` : undefined],
    ["roe_pct", balanceSheet.roe_pct != null ? `${balanceSheet.roe_pct}%` : undefined],
    ["ocf_vs_pat", balanceSheet.ocf_vs_pat],
    ["free_cash_flow", balanceSheet.free_cash_flow],
    ["dividend_coverage", balanceSheet.dividend_coverage],
    ["contingent_liabilities", balanceSheet.contingent_liabilities],
  ]
    .filter(([, v]) => isMeaningful(v))
    .map(([k, v]) => ({ label: humanizeKey(k as string), value: v as string }))

  const regulatoryItems = Object.entries(regulatory)
    .filter(([, v]) => isMeaningful(v))
    .map(([k, v]) => ({ label: humanizeKey(k), value: v as string }))

  const valuationItems = [
    ["sector_specific_valuation", valuation.sector_specific_valuation],
    ["dividend_yield", valuation.dividend_yield],
    ["peer_roe_roce_comparison", valuation.peer_roe_roce_comparison],
    ["peer_margin_comparison", valuation.peer_margin_comparison],
  ]
    .filter(([, v]) => isMeaningful(v))
    .map(([k, v]) => ({ label: humanizeKey(k as string), value: v as string }))

  const hasErrors = (record.document.errors ?? []).length > 0

  return (
    <div className="flex flex-col gap-4">
      {/* Meta strip */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-background px-3 py-2.5 text-xs text-muted-foreground">
        {analysis.detected_sector && <Badge variant="secondary">{analysis.detected_sector}</Badge>}
        {analysis.document_type && <span>{humanizeKey(analysis.document_type)}</span>}
        {analysis.period && <span>· {analysis.period}</span>}
        {typeof analysis.extraction_confidence === "number" && (
          <span className="ml-auto inline-flex items-center gap-1">
            <SparklesIcon className="size-3" />
            {Math.round(analysis.extraction_confidence * 100)}% extraction confidence
          </span>
        )}
        {record.createdAt && <span>· analyzed {formatDate(record.createdAt)}</span>}
      </div>

      {keyHighlights.length > 0 && (
        <ChartCard title="Key highlights" sub="Pulled directly from the filing">
          <ul className="flex flex-col gap-2">
            {keyHighlights.map((h) => (
              <li key={h} className="flex gap-2 text-sm text-foreground/90">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-500" />
                {h}
              </li>
            ))}
          </ul>
        </ChartCard>
      )}

      {businessItems.length > 0 && (
        <ChartCard
          title="Business model"
          sub="How the company sells and earns"
        >
          <DefinitionGrid items={businessItems} />
        </ChartCard>
      )}

      {revenueSources.length > 0 && <RevenueMixSection sources={revenueSources} />}

      {segments.length > 0 && <SegmentsSection segments={segments} />}

      {geography.length > 0 && <GeographySection entries={geography} />}

      {marginSeries && (
        <FyPercentTrendChart
          title="Margin trend"
          sub={`Parsed from the ${marginSeries.segment} margin narrative in the filing`}
          color={SKY}
          series={marginSeries.series}
        />
      )}

      {(managementItems.length > 0 || dpsSeries.length >= 2) && (
        <ChartCard title="Management & capital allocation">
          <FyRupeeBarChart
            title="Dividend per share"
            sub="Parsed from the capital allocation narrative"
            color={EMERALD}
            series={dpsSeries}
          />
          <div className={cn(dpsSeries.length >= 2 && "mt-4")}>
            <DefinitionGrid items={managementItems} />
          </div>
        </ChartCard>
      )}

      {(balanceSheetItems.length > 0 || roeSeries.length >= 2) && (
        <ChartCard title="Balance sheet & returns">
          <FyPercentTrendChart
            title="Return on Equity trend"
            color={VIOLET}
            series={roeSeries}
          />
          <div className={cn(roeSeries.length >= 2 && "mt-4")}>
            <DefinitionGrid items={balanceSheetItems} />
          </div>
        </ChartCard>
      )}

      {(flagEntries.length > 0 || sectorFlags.length > 0) && (
        <ChartCard title="Red flag checklist" sub="Auto-scanned from the filing — green means nothing notable was found">
          <div>
            {flagEntries.map(([key, flag]) => (
              <RedFlagRow key={key} label={humanizeKey(key)} flag={flag} />
            ))}
            {sectorFlags.map((flag, i) => (
              <RedFlagRow key={`sector-${i}`} label="Sector-specific" flag={flag} />
            ))}
          </div>
        </ChartCard>
      )}

      {competitive && (isMeaningful(competitive.moat_analysis) || (competitive.moat_sources?.length ?? 0) > 0) && (
        <ChartCard title="Competitive positioning">
          {(competitive.moat_sources?.length ?? 0) > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {competitive.moat_sources!.map((m) => (
                <Badge key={m} variant="outline" className="capitalize">
                  {m}
                </Badge>
              ))}
              {isMeaningful(competitive.pricing_power) && (
                <Badge variant="secondary" className="capitalize">
                  {competitive.pricing_power} pricing power
                </Badge>
              )}
            </div>
          )}
          {isMeaningful(competitive.moat_analysis) && (
            <p className="text-sm text-foreground/85">{competitive.moat_analysis}</p>
          )}
          {isMeaningful(competitive.market_share) && (
            <p className="mt-2 text-sm text-muted-foreground">{competitive.market_share}</p>
          )}
          {(competitive.threat_map?.length ?? 0) > 0 && (
            <div className="mt-3 border-t pt-3">
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <ShieldAlertIcon className="size-3.5" /> Threats flagged
              </p>
              <ul className="flex flex-col gap-1">
                {competitive.threat_map!.map((t) => (
                  <li key={t} className="text-xs text-muted-foreground">
                    · {t}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </ChartCard>
      )}

      {(regulatoryItems.length > 0 || valuationItems.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {regulatoryItems.length > 0 && (
            <ChartCard title="Regulatory">
              <DefinitionGrid items={regulatoryItems} />
            </ChartCard>
          )}
          {valuationItems.length > 0 && (
            <ChartCard title="Valuation">
              <DefinitionGrid items={valuationItems} />
            </ChartCard>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1.5 px-1 text-[11px] text-muted-foreground">
        <BuildingIcon className="size-3" />
        Extracted from {record.document.pages_processed ?? "—"} of {record.document.total_pages ?? "—"} pages
        {record.document.sections_found && record.document.sections_found.length > 0 && (
          <span>· {record.document.sections_found.map(humanizeKey).join(", ")}</span>
        )}
        {hasErrors && (
          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
            <AlertTriangleIcon className="size-3" /> {record.document.errors!.length} extraction warning
            {record.document.errors!.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {hasErrors && (
        <InsightNote>
          Some sections couldn&apos;t be fully extracted: {record.document.errors!.join(" ")}
        </InsightNote>
      )}
    </div>
  )
}
