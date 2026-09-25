import { supabase } from "@/lib/supabase"
import { toNumber } from "@/lib/format"
import type { Company } from "@/lib/companies"
import type { AnnualFinancials, QuarterlyResult, StatementType } from "@/lib/company-data"

export type ComparisonCompany = {
  symbol: string
  name: string
  industry: string
  /** Oldest -> newest, preferred statement type only (consolidated over standalone). */
  annual: AnnualFinancials[]
  quarterly: QuarterlyResult[]
}

export type ComparisonData = {
  companies: ComparisonCompany[]
}

const ANNUAL_COLUMNS =
  "symbol, statement_type, period_end, sales, net_profit, opm_pct, roce_pct, eps, dividend_payout_pct"
const QUARTERLY_COLUMNS = "symbol, statement_type, period_end, revenue, net_profit, eps"

const TEXT_KEYS = new Set(["symbol", "statement_type", "period_end"])

function coerceNumeric<T extends Record<string, unknown>>(row: T): T {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) {
    result[key] = TEXT_KEYS.has(key) ? value : toNumber(value)
  }
  return result as T
}

function groupBySymbol<T extends { symbol: string }>(rows: T[]) {
  const map = new Map<string, T[]>()
  for (const row of rows) {
    const list = map.get(row.symbol) ?? []
    list.push(row)
    map.set(row.symbol, list)
  }
  return map
}

function preferConsolidated<T extends { statement_type: StatementType }>(rows: T[]): T[] {
  const consolidated = rows.filter((r) => r.statement_type === "consolidated")
  return consolidated.length > 0 ? consolidated : rows.filter((r) => r.statement_type === "standalone")
}

const ANNUAL_YEARS = 6
const QUARTERLY_QUARTERS = 8

export async function fetchComparisonData(selection: Company[]): Promise<ComparisonData> {
  const symbols = selection.map((c) => c.symbol)
  if (symbols.length === 0) return { companies: [] }

  const [annualRes, quarterlyRes] = await Promise.all([
    supabase
      .from("annual_financials")
      .select(ANNUAL_COLUMNS)
      .in("symbol", symbols)
      .order("period_end", { ascending: false }),
    supabase
      .from("quarterly_results")
      .select(QUARTERLY_COLUMNS)
      .in("symbol", symbols)
      .order("period_end", { ascending: false }),
  ])
  if (annualRes.error) throw annualRes.error
  if (quarterlyRes.error) throw quarterlyRes.error

  const annualBySymbol = groupBySymbol(
    ((annualRes.data ?? []) as unknown as Record<string, unknown>[]).map(
      (row) => coerceNumeric(row) as AnnualFinancials & { symbol: string }
    )
  )
  const quarterlyBySymbol = groupBySymbol(
    ((quarterlyRes.data ?? []) as unknown as Record<string, unknown>[]).map(
      (row) => coerceNumeric(row) as QuarterlyResult & { symbol: string }
    )
  )

  const companies = selection.map((company) => {
    const annual = preferConsolidated(annualBySymbol.get(company.symbol) ?? [])
      .slice(0, ANNUAL_YEARS)
      .reverse()
    const quarterly = preferConsolidated(quarterlyBySymbol.get(company.symbol) ?? [])
      .slice(0, QUARTERLY_QUARTERS)
      .reverse()
    return { symbol: company.symbol, name: company.name, industry: company.industry, annual, quarterly }
  })

  return { companies }
}
