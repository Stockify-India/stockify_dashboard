import { supabase } from "@/lib/supabase"
import { toNumber } from "@/lib/format"
import type { Company } from "@/lib/companies"
import { DATA_SOURCE, EXTERNAL_METRICS, type MetricConfig } from "@/lib/scorecard/config"
import {
  DERIVATIONS,
  type AnnualFigures,
  type DerivationContext,
  type QuarterFigures,
} from "@/lib/scorecard/derive"
import type { CompanyInput } from "@/lib/scorecard/engine"

type StatementType = "consolidated" | "standalone"
type Row<T> = T & { symbol: string; statement_type: StatementType }

const ANNUAL_COLUMNS =
  "symbol, statement_type, period_end, sales, net_profit, total_assets, equity_capital, reserves, borrowings, roce_pct, dividend_payout_pct"
const QUARTERLY_COLUMNS = "symbol, statement_type, period_end, revenue, net_profit, gross_npa_pct, net_npa_pct"

function coerce<T>(row: Record<string, unknown>): T {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) {
    result[key] = key === "symbol" || key === "statement_type" || key === "period_end" ? value : toNumber(value)
  }
  return result as T
}

function groupBy<T extends { symbol: string }>(rows: T[]) {
  const map = new Map<string, T[]>()
  for (const row of rows) {
    const list = map.get(row.symbol) ?? []
    list.push(row)
    map.set(row.symbol, list)
  }
  return map
}

// Consolidated is preferred, as everywhere else in the app, but only when its
// latest filing is complete enough to score. Some consolidated filings (e.g.
// SBIN in older years) omit balance-sheet totals that the standalone has.
function isCompleteYear(row: AnnualFigures | undefined) {
  return Boolean(row && row.net_profit !== null && row.sales !== null && row.total_assets !== null && row.reserves !== null)
}

function pickAnnual(rows: Row<AnnualFigures>[]) {
  const byType = (type: StatementType) =>
    rows.filter((r) => r.statement_type === type).sort((a, b) => b.period_end.localeCompare(a.period_end))
  const consolidated = byType("consolidated")
  const chosen = isCompleteYear(consolidated[0]) ? consolidated : byType("standalone")
  return { latestYear: chosen[0] ?? null, previousYear: chosen[1] ?? null }
}

function yearEarlier(periodEnd: string) {
  const date = new Date(periodEnd)
  date.setUTCFullYear(date.getUTCFullYear() - 1)
  return date.toISOString().slice(0, 10)
}

function pickQuarters(rows: Row<QuarterFigures>[]) {
  const pair = (type: StatementType) => {
    const list = rows.filter((r) => r.statement_type === type).sort((a, b) => b.period_end.localeCompare(a.period_end))
    const latest = list[0]
    if (!latest) return null
    const yearAgo = list.find((r) => r.period_end === yearEarlier(latest.period_end)) ?? null
    return { latest, yearAgo }
  }
  const consolidated = pair("consolidated")
  const standalone = pair("standalone")
  const chosen = consolidated?.yearAgo ? consolidated : (standalone ?? consolidated)
  return {
    latestQuarter: chosen?.latest ?? null,
    yearAgoQuarter: chosen?.yearAgo ?? null,
    latestStandaloneQuarter: standalone?.latest ?? null,
  }
}

export type ScorecardData = {
  companies: CompanyInput[]
  /** Latest fiscal-year end and quarter end actually used, for captions. */
  asOf: { year: string | null; quarter: string | null }
}

export async function fetchScorecardInputs(
  selection: Company[],
  metrics: readonly MetricConfig[]
): Promise<ScorecardData> {
  const symbols = selection.map((c) => c.symbol)
  if (symbols.length === 0) return { companies: [], asOf: { year: null, quarter: null } }

  const [annual, quarterly] = await Promise.all([
    supabase
      .from(DATA_SOURCE.annualTable)
      .select(ANNUAL_COLUMNS)
      .in("symbol", symbols)
      .order("period_end", { ascending: false }),
    supabase
      .from(DATA_SOURCE.quarterlyTable)
      .select(QUARTERLY_COLUMNS)
      .in("symbol", symbols)
      .gte("period_end", yearEarlier(yearEarlier(new Date().toISOString().slice(0, 10))))
      .order("period_end", { ascending: false }),
  ])
  if (annual.error) throw annual.error
  if (quarterly.error) throw quarterly.error

  const annualBySymbol = groupBy(
    ((annual.data ?? []) as unknown as Record<string, unknown>[]).map((r) => coerce<Row<AnnualFigures>>(r))
  )
  const quarterlyBySymbol = groupBy(
    ((quarterly.data ?? []) as unknown as Record<string, unknown>[]).map((r) => coerce<Row<QuarterFigures>>(r))
  )

  let latestYear: string | null = null
  let latestQuarter: string | null = null

  const companies = selection.map((company) => {
    const ctx: DerivationContext = {
      ...pickAnnual(annualBySymbol.get(company.symbol) ?? []),
      ...pickQuarters(quarterlyBySymbol.get(company.symbol) ?? []),
    }
    if (ctx.latestYear && (!latestYear || ctx.latestYear.period_end > latestYear)) latestYear = ctx.latestYear.period_end
    if (ctx.latestQuarter && (!latestQuarter || ctx.latestQuarter.period_end > latestQuarter))
      latestQuarter = ctx.latestQuarter.period_end

    const values: Record<string, number | null> = {}
    for (const metric of metrics) {
      const external = EXTERNAL_METRICS[metric.name]?.[company.symbol]
      const derive = DERIVATIONS[metric.name]
      const value = external ?? (derive ? derive(ctx) : null)
      values[metric.name] = value !== null && Number.isFinite(value) ? value : null
    }
    return { symbol: company.symbol, name: company.name, industry: company.industry, values }
  })

  return { companies, asOf: { year: latestYear, quarter: latestQuarter } }
}
