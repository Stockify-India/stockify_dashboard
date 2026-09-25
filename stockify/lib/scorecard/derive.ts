// How each metric in METRICS is derived from raw filing figures. Kept free of
// Supabase/React imports so it can be unit-tested with plain `node --test`.

export type AnnualFigures = {
  period_end: string
  sales: number | null
  net_profit: number | null
  total_assets: number | null
  equity_capital: number | null
  reserves: number | null
  borrowings: number | null
  roce_pct: number | null
  dividend_payout_pct: number | null
}

export type QuarterFigures = {
  period_end: string
  revenue: number | null
  net_profit: number | null
  gross_npa_pct: number | null
  net_npa_pct: number | null
}

export type DerivationContext = {
  latestYear: AnnualFigures | null
  previousYear: AnnualFigures | null
  latestQuarter: QuarterFigures | null
  yearAgoQuarter: QuarterFigures | null
  /** Asset quality is only disclosed in standalone bank filings. */
  latestStandaloneQuarter: QuarterFigures | null
}

type Derivation = (ctx: DerivationContext) => number | null

function ratioPct(numerator: number | null | undefined, denominator: number | null | undefined) {
  if (numerator === null || numerator === undefined) return null
  if (denominator === null || denominator === undefined || denominator === 0) return null
  return (numerator / denominator) * 100
}

/** YoY % change, measured against the size of the earlier value. */
function growthPct(current: number | null | undefined, previous: number | null | undefined) {
  if (current === null || current === undefined || previous === null || previous === undefined) return null
  if (previous === 0) return null
  return ((current - previous) / Math.abs(previous)) * 100
}

function equity(year: AnnualFigures | null) {
  if (!year || year.equity_capital === null || year.reserves === null) return null
  return year.equity_capital + year.reserves
}

const roe = (year: AnnualFigures | null) => (year ? ratioPct(year.net_profit, equity(year)) : null)

export const DERIVATIONS: Readonly<Record<string, Derivation>> = {
  roa: ({ latestYear: y }) => (y ? ratioPct(y.net_profit, y.total_assets) : null),
  roe: ({ latestYear }) => roe(latestYear),
  roce: ({ latestYear }) => latestYear?.roce_pct ?? null,
  roce_growth: ({ latestYear, previousYear }) => growthPct(latestYear?.roce_pct, previousYear?.roce_pct),
  roe_growth: ({ latestYear, previousYear }) => growthPct(roe(latestYear), roe(previousYear)),
  net_profit_margin: ({ latestYear: y }) => (y ? ratioPct(y.net_profit, y.sales) : null),
  revenue_growth: ({ latestYear, previousYear }) => growthPct(latestYear?.sales, previousYear?.sales),
  profit_growth: ({ latestYear, previousYear }) => growthPct(latestYear?.net_profit, previousYear?.net_profit),
  qtr_sales_yoy: ({ latestQuarter, yearAgoQuarter }) => growthPct(latestQuarter?.revenue, yearAgoQuarter?.revenue),
  qtr_profit_yoy: ({ latestQuarter, yearAgoQuarter }) =>
    growthPct(latestQuarter?.net_profit, yearAgoQuarter?.net_profit),
  dividend_payout: ({ latestYear }) => latestYear?.dividend_payout_pct ?? null,
  debt_to_equity: ({ latestYear: y }) => {
    const eq = equity(y)
    if (!y || y.borrowings === null || eq === null || eq <= 0) return null
    return y.borrowings / eq
  },
  // Non-banks file no NPA figures (null), and a reported 0 from a bank's
  // filing means "not disclosed in this statement", not a spotless book.
  gross_npa: ({ latestStandaloneQuarter: q }) => (q?.gross_npa_pct ? q.gross_npa_pct : null),
  net_npa: ({ latestStandaloneQuarter: q }) => (q?.net_npa_pct ? q.net_npa_pct : null),
}
