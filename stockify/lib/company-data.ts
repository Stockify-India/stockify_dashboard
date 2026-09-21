import { supabase } from "@/lib/supabase"
import { toNumber } from "@/lib/format"

export type StatementType = "consolidated" | "standalone"

export type AnnualFinancials = {
  statement_type: StatementType
  period_end: string
  sales: number | null
  expenses: number | null
  operating_profit: number | null
  opm_pct: number | null
  other_income: number | null
  interest: number | null
  depreciation: number | null
  profit_before_tax: number | null
  tax_pct: number | null
  net_profit: number | null
  eps: number | null
  dividend_payout_pct: number | null
  equity_capital: number | null
  reserves: number | null
  borrowings: number | null
  other_liabilities: number | null
  total_liabilities: number | null
  fixed_assets: number | null
  cwip: number | null
  investments: number | null
  other_assets: number | null
  total_assets: number | null
  cfo: number | null
  cfi: number | null
  cff: number | null
  net_cash_flow: number | null
  free_cash_flow: number | null
  cfo_to_operating_profit_pct: number | null
  debtor_days: number | null
  inventory_days: number | null
  payable_days: number | null
  cash_conversion_cycle: number | null
  working_capital_days: number | null
  roce_pct: number | null
}

export type QuarterlyResult = {
  statement_type: StatementType
  period_end: string
  revenue: number | null
  interest: number | null
  expenses_total: number | null
  other_income: number | null
  depreciation: number | null
  profit_before_tax: number | null
  tax_expense: number | null
  net_profit: number | null
  eps: number | null
}

export type PriceStats = {
  week52High: number | null
  week52Low: number | null
  allTimeHigh: number | null
  allTimeLow: number | null
  allTimeHighDate: string | null
  allTimeLowDate: string | null
}

const ANNUAL_COLUMNS =
  "statement_type, period_end, sales, expenses, operating_profit, opm_pct, other_income, interest, depreciation, profit_before_tax, tax_pct, net_profit, eps, dividend_payout_pct, equity_capital, reserves, borrowings, other_liabilities, total_liabilities, fixed_assets, cwip, investments, other_assets, total_assets, cfo, cfi, cff, net_cash_flow, free_cash_flow, cfo_to_operating_profit_pct, debtor_days, inventory_days, payable_days, cash_conversion_cycle, working_capital_days, roce_pct"

const QUARTERLY_COLUMNS =
  "statement_type, period_end, revenue, interest, expenses_total, other_income, depreciation, profit_before_tax, tax_expense, net_profit, eps"

function preferConsolidated<T extends { statement_type: StatementType }>(rows: T[]): T[] {
  const consolidated = rows.filter((r) => r.statement_type === "consolidated")
  return consolidated.length > 0 ? consolidated : rows.filter((r) => r.statement_type === "standalone")
}

// Postgres `numeric` columns come back from PostgREST as strings to avoid
// float precision loss, so every non-key field needs coercing to a number.
function coerceNumeric<T extends Record<string, unknown>>(row: T, textKeys: string[]): T {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) {
    result[key] = textKeys.includes(key) ? value : toNumber(value)
  }
  return result as T
}

const ANNUAL_TEXT_KEYS = ["statement_type", "period_end", "symbol"]
const QUARTERLY_TEXT_KEYS = ["statement_type", "period_end", "symbol"]

export async function fetchAnnualFinancials(symbol: string, years = 5) {
  const { data, error } = await supabase
    .from("annual_financials")
    .select(ANNUAL_COLUMNS)
    .eq("symbol", symbol)
    .order("period_end", { ascending: false })
    .limit(years * 2)

  if (error) throw error

  const rows = ((data ?? []) as Record<string, unknown>[]).map((row) =>
    coerceNumeric(row, ANNUAL_TEXT_KEYS)
  ) as AnnualFinancials[]
  return preferConsolidated(rows).slice(0, years).reverse() // oldest -> newest for left-to-right tables
}

export async function fetchQuarterlyResults(symbol: string, quarters = 5) {
  const { data, error } = await supabase
    .from("quarterly_results")
    .select(QUARTERLY_COLUMNS)
    .eq("symbol", symbol)
    .order("period_end", { ascending: false })
    .limit(quarters * 2)

  if (error) throw error

  const rows = ((data ?? []) as Record<string, unknown>[]).map((row) =>
    coerceNumeric(row, QUARTERLY_TEXT_KEYS)
  ) as QuarterlyResult[]
  return preferConsolidated(rows).slice(0, quarters).reverse()
}

export async function fetchPriceStats(symbol: string): Promise<PriceStats> {
  const { data, error } = await supabase
    .from("price_stats")
    .select("hl_52week, hl_all_time")
    .eq("symbol", symbol)
    .maybeSingle()

  if (error) throw error

  const week52 = data?.hl_52week?.Records?.[0]
  const allTime = data?.hl_all_time?.Records?.[0]

  return {
    week52High: toNumber(week52?.[0]),
    week52Low: toNumber(week52?.[1]),
    allTimeHigh: toNumber(allTime?.[0]),
    allTimeLow: toNumber(allTime?.[1]),
    allTimeHighDate: allTime?.[2] ?? null,
    allTimeLowDate: allTime?.[3] ?? null,
  }
}

const PEER_TEXT_KEYS = ["statement_type", "period_end", "symbol"]

export async function fetchPeerSnapshots(symbols: string[]) {
  if (symbols.length === 0) return new Map<string, AnnualFinancials>()

  const { data, error } = await supabase
    .from("annual_financials")
    .select("symbol, " + ANNUAL_COLUMNS)
    .in("symbol", symbols)
    .order("period_end", { ascending: false })

  if (error) throw error

  const rows = ((data ?? []) as unknown as Record<string, unknown>[]).map((row) =>
    coerceNumeric(row, PEER_TEXT_KEYS)
  ) as (AnnualFinancials & { symbol: string })[]

  const bySymbol = new Map<string, (AnnualFinancials & { symbol: string })[]>()
  for (const row of rows) {
    const list = bySymbol.get(row.symbol) ?? []
    list.push(row)
    bySymbol.set(row.symbol, list)
  }

  const latest = new Map<string, AnnualFinancials>()
  for (const [symbol, rows] of bySymbol) {
    const preferred = preferConsolidated(rows)
    if (preferred[0]) latest.set(symbol, preferred[0])
  }
  return latest
}
