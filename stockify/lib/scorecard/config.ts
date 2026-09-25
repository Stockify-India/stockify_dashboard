// =============================================================================
// SCORECARD CONFIG
//
// To reuse the scorecard for another sector or dataset, change only this file:
//   1. METRICS           – which metrics are scored, and which way is "better"
//   2. DATA_SOURCE       – where the per-company figures are read from
//   3. EXTERNAL_METRICS  – hand-maintained per-company values that aren't in
//                          the data source (the Streamlit spec's NIM lookup)
//
// The scoring engine (engine.ts) never refers to a metric by name, so a metric
// counts toward the total if and only if it is listed here. To stop a metric
// counting, delete it from the list; don't filter it out downstream.
// =============================================================================

export type Direction = "higher" | "lower"

export type MetricConfig = {
  /** Stable key: also the weight key, the score-column key and the derivation key. */
  name: string
  label: string
  direction: Direction
  /** How the raw value is displayed. */
  unit: "%" | "x"
  /** One line shown under the metric's chart. */
  description: string
}

// ---------------------------------------------------------------------------
// 1. METRICS: one weight slider, one score column and one chart each.
// ---------------------------------------------------------------------------
export const METRICS: readonly MetricConfig[] = [
  { name: "roa", label: "ROA", direction: "higher", unit: "%", description: "Net profit ÷ total assets, latest year" },
  { name: "roe", label: "ROE", direction: "higher", unit: "%", description: "Net profit ÷ shareholders' equity, latest year" },
  { name: "roce", label: "ROCE", direction: "higher", unit: "%", description: "Return on capital employed, latest year" },
  { name: "roce_growth", label: "ROCE Growth", direction: "higher", unit: "%", description: "YoY change in ROCE" },
  { name: "roe_growth", label: "ROE Growth", direction: "higher", unit: "%", description: "YoY change in ROE" },
  { name: "net_profit_margin", label: "Net Profit Margin", direction: "higher", unit: "%", description: "Net profit ÷ revenue, latest year" },
  { name: "revenue_growth", label: "Revenue Growth", direction: "higher", unit: "%", description: "YoY revenue growth, latest year" },
  { name: "profit_growth", label: "Profit Growth", direction: "higher", unit: "%", description: "YoY net profit growth, latest year" },
  { name: "qtr_sales_yoy", label: "Qtr Sales YoY", direction: "higher", unit: "%", description: "Latest quarter's revenue vs. the same quarter last year" },
  { name: "qtr_profit_yoy", label: "Qtr Profit YoY", direction: "higher", unit: "%", description: "Latest quarter's net profit vs. the same quarter last year" },
  { name: "dividend_payout", label: "Dividend Payout", direction: "higher", unit: "%", description: "Share of profit paid out as dividend (dividend yield needs market price)" },
  { name: "debt_to_equity", label: "Debt to Equity", direction: "lower", unit: "x", description: "Borrowings ÷ equity, latest year (for banks, deposits aren't included)" },
  { name: "gross_npa", label: "Gross NPA", direction: "lower", unit: "%", description: "Gross non-performing assets, latest quarter (banks only)" },
  { name: "net_npa", label: "Net NPA", direction: "lower", unit: "%", description: "Net non-performing assets, latest quarter (banks only)" },
]

export const DEFAULT_WEIGHT = 5
export const WEIGHT_MIN = 0
export const WEIGHT_MAX = 10

// Metrics the original spec asks for that can't be derived from the data
// source. They are listed so the UI can say so, and are deliberately absent
// from METRICS so they can never enter a total.
export const UNAVAILABLE_METRICS: readonly { label: string; reason: string }[] = [
  { label: "Market Cap", reason: "needs live share price" },
  { label: "RSI (14)", reason: "needs daily price history" },
  { label: "PE Ratio", reason: "needs live share price" },
  { label: "EV/EBITDA", reason: "needs live share price" },
  { label: "Dividend Yield", reason: "needs live share price" },
  { label: "NIM", reason: "not in the filings data; add values to EXTERNAL_METRICS" },
]

// ---------------------------------------------------------------------------
// Auto-components: same engine, fixed weights instead of sliders.
// ---------------------------------------------------------------------------
const byName = (name: string) => {
  const metric = METRICS.find((m) => m.name === name)
  if (!metric) throw new Error(`Auto-component metric "${name}" is not defined in METRICS`)
  return metric
}

export const AUTO_COMPONENT_METRICS: readonly MetricConfig[] = [
  byName("roe"),
  byName("roce"),
  byName("roa"),
  byName("net_profit_margin"),
  byName("revenue_growth"),
  byName("profit_growth"),
  byName("qtr_sales_yoy"),
  byName("qtr_profit_yoy"),
  byName("debt_to_equity"),
]

export const AUTO_COMPONENT_WEIGHTS: Readonly<Record<string, number>> = {
  roe: 10,
  roce: 8,
  roa: 8,
  net_profit_margin: 6,
  revenue_growth: 6,
  profit_growth: 6,
  qtr_sales_yoy: 4,
  qtr_profit_yoy: 4,
  debt_to_equity: 8,
}

// ---------------------------------------------------------------------------
// 2. DATA_SOURCE: Supabase tables the raw figures come from.
// ---------------------------------------------------------------------------
export const DATA_SOURCE = {
  annualTable: "annual_financials",
  quarterlyTable: "quarterly_results",
} as const

// ---------------------------------------------------------------------------
// 3. EXTERNAL_METRICS: metric name -> NSE symbol -> value.
//
// Values here override anything derived from DATA_SOURCE. To score NIM, add
//   { name: "nim", label: "NIM", direction: "higher", unit: "%", ... }
// to METRICS and fill in real figures below, e.g. nim: { HDFCBANK: <value> }.
// Left empty on purpose: no figures have been supplied, and none are invented.
// ---------------------------------------------------------------------------
export const EXTERNAL_METRICS: Readonly<Record<string, Readonly<Record<string, number>>>> = {}
