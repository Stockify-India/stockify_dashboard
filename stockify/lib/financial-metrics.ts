import { supabase } from "@/lib/supabase"
import { toNumber } from "@/lib/format"
import type { AnnualFinancials } from "@/lib/company-data"

// ---------- Raw XBRL line items from financial_statements.items ----------
//
// annual_financials only carries P&L/cash-flow/a few balance-sheet totals.
// Ratios that need balance-sheet detail (current assets, inventory,
// receivables, payables, cash, split borrowings, capex, per-share data)
// have to come from the raw NSE/XBRL "Records" blob in financial_statements,
// which is only populated on yearly filings (quarterly filings carry mostly
// null balance-sheet fields). Coverage isn't universal: banks/NBFCs report
// under a different taxonomy (Advances/Deposits, not Current Assets), so
// those fields come back null for them - that's real, not a bug.

export type RawAnnualLine = {
  period_end: string
  currentAssets: number | null
  currentLiabilities: number | null
  inventories: number | null
  tradeReceivables: number | null
  tradePayables: number | null
  cash: number | null
  borrowingsCurrent: number | null
  borrowingsNoncurrent: number | null
  paidUpCapital: number | null
  faceValue: number | null
  capex: number | null
  basicEps: number | null
  dilutedEps: number | null
  costOfMaterials: number | null
  purchasesStockInTrade: number | null
  changesInInventories: number | null
}

type RawRecord = Record<string, unknown>

function pick(record: RawRecord, ...keys: string[]): number | null {
  for (const key of keys) {
    const value = record[key]
    if (value !== null && value !== undefined) {
      const num = toNumber(value)
      if (num !== null) return num
    }
  }
  return null
}

function extractLine(record: RawRecord, periodEnd: string): RawAnnualLine {
  return {
    period_end: periodEnd,
    currentAssets: pick(record, "CurrentAssets"),
    currentLiabilities: pick(record, "CurrentLiabilities"),
    inventories: pick(record, "Inventories"),
    tradeReceivables: pick(record, "TradeReceivablesCurrent", "TradeReceivables"),
    tradePayables: pick(record, "TradePayablesCurrent", "TradePayables"),
    cash: pick(record, "CashAndCashEquivalents"),
    borrowingsCurrent: pick(record, "BorrowingsCurrent", "ShortTermBorrowings"),
    borrowingsNoncurrent: pick(record, "BorrowingsNoncurrent", "LongTermBorrowings"),
    paidUpCapital: pick(record, "PaidUpValueOfEquityShareCapital"),
    faceValue: pick(record, "FaceValueOfEquityShareCapital"),
    // Cash-flow-statement items (capex) have no quarter/cumulative split:
    // Ind-AS doesn't mandate a quarterly cash flow statement, so the plain
    // field on a yearly filing is already the full-year figure.
    capex: pick(record, "PurchaseOfPropertyPlantAndEquipmentClassifiedAsInvestingActivities"),
    // P&L items DO get reported every quarter, so on a Q4-tagged-as-yearly
    // filing the plain field is Q4 alone - the "...Cumulative" field is the
    // full-year (YTD) figure, which is what an annual ratio needs.
    basicEps: pick(
      record,
      "BasicEarningsLossPerShareFromContinuingAndDiscontinuedOperationsCumulative",
      "BasicEarningsLossPerShareFromContinuingAndDiscontinuedOperations",
      "BasicEarningsPerShareBeforeExtraordinaryItemsCumulative",
      "BasicEarningsPerShareBeforeExtraordinaryItems"
    ),
    dilutedEps: pick(
      record,
      "DilutedEarningsLossPerShareFromContinuingAndDiscontinuedOperationsCumulative",
      "DilutedEarningsLossPerShareFromContinuingAndDiscontinuedOperations",
      "DilutedEarningsPerShareBeforeExtraordinaryItemsCumulative",
      "DilutedEarningsPerShareBeforeExtraordinaryItems"
    ),
    costOfMaterials: pick(record, "CostOfMaterialsConsumedCumulative", "CostOfMaterialsConsumed"),
    purchasesStockInTrade: pick(
      record,
      "PurchasesOfStockInTradeCumulative",
      "PurchasesOfStockInTrade"
    ),
    changesInInventories: pick(
      record,
      "ChangesInInventoriesOfFinishedGoodsWorkInProgressAndStockInTradeCumulative",
      "ChangesInInventoriesOfFinishedGoodsWorkInProgressAndStockInTrade"
    ),
  }
}

export async function fetchRawFinancials(symbol: string, years = 5): Promise<RawAnnualLine[]> {
  const { data, error } = await supabase
    .from("financial_statements")
    .select("filing_id, period, items")
    .eq("symbol", symbol)
    .ilike("period", "%yearly%")
    .order("filing_id", { ascending: false })
    .limit(years * 6)

  if (error) throw error

  type Row = { filing_id: string; period: string; items: { Records?: RawRecord[] } | null }
  const rows = (data ?? []) as Row[]

  const byPeriodEnd = new Map<string, { consolidated?: RawAnnualLine; standalone?: RawAnnualLine }>()

  for (const row of rows) {
    const record = row.items?.Records?.[0]
    if (!record) continue
    const periodEnd = record["DateOfEndOfReportingPeriod"]
    if (typeof periodEnd !== "string" || !periodEnd) continue

    const line = extractLine(record, periodEnd)
    const bucket = byPeriodEnd.get(periodEnd) ?? {}
    if (record["NatureOfReportStandaloneConsolidated"] === "Consolidated") {
      bucket.consolidated = line
    } else {
      bucket.standalone = line
    }
    byPeriodEnd.set(periodEnd, bucket)
  }

  return Array.from(byPeriodEnd.values())
    .map((bucket) => bucket.consolidated ?? bucket.standalone)
    .filter((line): line is RawAnnualLine => line !== undefined)
    .sort((a, b) => a.period_end.localeCompare(b.period_end))
    .slice(-years)
}

// ---------- Derived metric categories ----------

export type MetricRow = { label: string; value: string; sub?: string }
export type MetricCategory = { title: string; rows: MetricRow[]; note?: string }

function ratio(n: number | null, d: number | null): number | null {
  if (n === null || d === null || d === 0) return null
  return n / d
}

function pct(n: number | null, d: number | null): number | null {
  const r = ratio(n, d)
  return r === null ? null : r * 100
}

function avg(a: number | null, b: number | null): number | null {
  if (a === null) return b
  if (b === null) return a
  return (a + b) / 2
}

function growth(curr: number | null, prev: number | null): number | null {
  if (curr === null || prev === null || prev === 0) return null
  return ((curr - prev) / Math.abs(prev)) * 100
}

function sum(...values: (number | null)[]): number | null {
  if (values.every((v) => v === null)) return null
  return values.reduce((total: number, v) => total + (v ?? 0), 0)
}

const fCr = (v: number | null) => (v === null ? "—" : `₹${(v / 1e7).toLocaleString("en-IN", { maximumFractionDigits: 0 })} Cr`)
const fRupee = (v: number | null) => (v === null ? "—" : `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`)
const fPct = (v: number | null) => (v === null ? "—" : `${v.toFixed(1)}%`)
const fX = (v: number | null) => (v === null ? "—" : `${v.toFixed(2)}x`)
const fDays = (v: number | null) => (v === null ? "—" : `${v.toFixed(0)} days`)

function shareCount(raw: RawAnnualLine | undefined, annual: AnnualFinancials | undefined): number | null {
  if (raw?.paidUpCapital && raw.faceValue) {
    const shares = ratio(raw.paidUpCapital, raw.faceValue)
    if (shares !== null) return shares
  }
  if (annual?.net_profit && annual.eps) return ratio(annual.net_profit, annual.eps)
  return null
}

function cogsProxy(raw: RawAnnualLine | undefined): number | null {
  if (!raw) return null
  const parts = [raw.costOfMaterials, raw.purchasesStockInTrade, raw.changesInInventories]
  if (parts.every((p) => p === null)) return null
  return sum(...parts)
}

export function buildMetricCategories(
  annual: AnnualFinancials[],
  raw: RawAnnualLine[]
): MetricCategory[] {
  const latest = annual[annual.length - 1]
  const prev = annual[annual.length - 2]
  if (!latest) return []

  const rawLatest = raw.find((r) => r.period_end === latest.period_end)
  const rawPrev = prev ? raw.find((r) => r.period_end === prev.period_end) : undefined

  const ebit = sum(latest.profit_before_tax, latest.interest)
  const ebitda = sum(ebit, latest.depreciation)
  const prevEbit = prev ? sum(prev.profit_before_tax, prev.interest) : null
  const prevEbitda = prev ? sum(prevEbit, prev.depreciation) : null

  const equity = sum(latest.equity_capital, latest.reserves)
  const prevEquity = prev ? sum(prev.equity_capital, prev.reserves) : null

  const cogs = cogsProxy(rawLatest)
  const grossProfit = cogs !== null ? sum(latest.sales, -cogs) : null

  const borrowingsCurrent = rawLatest?.borrowingsCurrent ?? null
  const borrowingsNoncurrent = rawLatest?.borrowingsNoncurrent ?? null
  const totalDebt =
    borrowingsCurrent !== null || borrowingsNoncurrent !== null
      ? sum(borrowingsCurrent, borrowingsNoncurrent)
      : latest.borrowings

  const cash = rawLatest?.cash ?? null
  const netDebt = cash !== null ? sum(totalDebt, -cash) : null

  const rawCapex = rawLatest?.capex ?? null
  const capex = rawCapex !== null ? rawCapex : sum(latest.cfo, latest.free_cash_flow === null ? null : -latest.free_cash_flow)
  const shares = shareCount(rawLatest, latest)
  const dividendsPaid =
    latest.dividend_payout_pct !== null && latest.net_profit !== null
      ? (latest.dividend_payout_pct / 100) * latest.net_profit
      : null

  const profitability: MetricCategory = {
    title: "Profitability",
    rows: [
      { label: "Gross Profit", value: fCr(grossProfit) },
      { label: "Gross Margin", value: fPct(pct(grossProfit, latest.sales)) },
      { label: "Operating Profit", value: fCr(latest.operating_profit) },
      { label: "Operating Margin", value: fPct(latest.opm_pct) },
      { label: "Net Profit Margin", value: fPct(pct(latest.net_profit, latest.sales)) },
      { label: "ROE", value: fPct(pct(latest.net_profit, avg(equity, prevEquity))) },
      { label: "ROA", value: fPct(pct(latest.net_profit, avg(latest.total_assets, prev?.total_assets ?? null))) },
      { label: "ROCE", value: fPct(latest.roce_pct) },
      { label: "EBIT", value: fCr(ebit) },
      { label: "EBITDA", value: fCr(ebitda) },
    ],
  }

  const growthCategory: MetricCategory = {
    title: "Growth",
    rows: prev
      ? [
          { label: "Revenue Growth", value: fPct(growth(latest.sales, prev.sales)) },
          { label: "Net Profit Growth", value: fPct(growth(latest.net_profit, prev.net_profit)) },
          { label: "EPS Growth", value: fPct(growth(latest.eps, prev.eps)) },
          { label: "EBITDA Growth", value: fPct(growth(ebitda, prevEbitda)) },
          { label: "Operating Cash Flow Growth", value: fPct(growth(latest.cfo, prev.cfo)) },
          { label: "FCF Growth", value: fPct(growth(latest.free_cash_flow, prev.free_cash_flow)) },
        ]
      : [],
    note: prev ? undefined : "Needs at least two years of data.",
  }

  const liquidity: MetricCategory = {
    title: "Liquidity",
    rows: [
      { label: "Current Ratio", value: fX(ratio(rawLatest?.currentAssets ?? null, rawLatest?.currentLiabilities ?? null)) },
      {
        label: "Quick Ratio",
        value: fX(
          ratio(
            sum(rawLatest?.currentAssets ?? null, rawLatest?.inventories ? -rawLatest.inventories : null),
            rawLatest?.currentLiabilities ?? null
          )
        ),
      },
      { label: "Cash Ratio", value: fX(ratio(rawLatest?.cash ?? null, rawLatest?.currentLiabilities ?? null)) },
      { label: "Working Capital", value: fCr(sum(rawLatest?.currentAssets ?? null, rawLatest?.currentLiabilities ? -rawLatest.currentLiabilities : null)) },
    ],
    note: rawLatest?.currentAssets == null ? "Not reported under this company's taxonomy (typical for banks/NBFCs)." : undefined,
  }

  const leverage: MetricCategory = {
    title: "Debt & Leverage",
    rows: [
      { label: "Total Debt", value: fCr(totalDebt) },
      { label: "Net Debt", value: fCr(netDebt) },
      { label: "Debt to Equity", value: fX(ratio(totalDebt, equity)) },
      { label: "Debt Ratio", value: fPct(pct(totalDebt, latest.total_assets)) },
      { label: "Equity Ratio", value: fPct(pct(equity, latest.total_assets)) },
      { label: "Net Debt / EBITDA", value: fX(ratio(netDebt, ebitda)) },
      { label: "Interest Coverage", value: fX(ratio(ebit, latest.interest)) },
    ],
  }

  const cashFlow: MetricCategory = {
    title: "Cash Flow",
    rows: [
      { label: "Operating Cash Flow", value: fCr(latest.cfo) },
      { label: "Capital Expenditure", value: fCr(capex) },
      { label: "Free Cash Flow", value: fCr(latest.free_cash_flow) },
      { label: "OCF Margin", value: fPct(pct(latest.cfo, latest.sales)) },
      { label: "FCF Margin", value: fPct(pct(latest.free_cash_flow, latest.sales)) },
      { label: "Cash Conversion Ratio", value: fX(ratio(latest.cfo, latest.net_profit)) },
      { label: "FCF per Share", value: fRupee(ratio(latest.free_cash_flow, shares)) },
    ],
  }

  const efficiency: MetricCategory = {
    title: "Efficiency",
    rows: [
      { label: "Asset Turnover", value: fX(ratio(latest.sales, avg(latest.total_assets, prev?.total_assets ?? null))) },
      { label: "Inventory Turnover", value: fX(ratio(cogs, avg(rawLatest?.inventories ?? null, rawPrev?.inventories ?? null))) },
      { label: "Receivables Turnover", value: fX(ratio(latest.sales, avg(rawLatest?.tradeReceivables ?? null, rawPrev?.tradeReceivables ?? null))) },
      { label: "Payables Turnover", value: fX(ratio(cogs, avg(rawLatest?.tradePayables ?? null, rawPrev?.tradePayables ?? null))) },
    ],
    note: cogs === null ? "Cost of materials isn't tagged for this company (common for trading/services businesses)." : undefined,
  }

  const workingCapital: MetricCategory = {
    title: "Working Capital",
    rows: [
      { label: "DSO (Days Sales Outstanding)", value: fDays(latest.debtor_days) },
      { label: "DIO (Days Inventory Outstanding)", value: fDays(latest.inventory_days) },
      { label: "DPO (Days Payable Outstanding)", value: fDays(latest.payable_days) },
      { label: "Cash Conversion Cycle", value: fDays(latest.cash_conversion_cycle) },
    ],
  }

  const perShare: MetricCategory = {
    title: "Per-Share",
    rows: [
      { label: "Basic EPS", value: fRupee(rawLatest?.basicEps ?? latest.eps) },
      { label: "Diluted EPS", value: fRupee(rawLatest?.dilutedEps ?? null) },
      { label: "Book Value per Share", value: fRupee(ratio(equity, shares)) },
      { label: "FCF per Share", value: fRupee(ratio(latest.free_cash_flow, shares)) },
      { label: "Dividend per Share", value: fRupee(ratio(dividendsPaid, shares)) },
    ],
  }

  const valuation: MetricCategory = {
    title: "Valuation",
    rows: [],
    note: "Needs live market price / market cap, which isn't in the financial-statement record. P/E, P/B, P/S, EV, EV/EBITDA, EV/Sales, PEG, Dividend Yield, and FCF Yield are omitted rather than guessed.",
  }

  return [
    growthCategory,
    profitability,
    liquidity,
    leverage,
    cashFlow,
    efficiency,
    workingCapital,
    perShare,
    valuation,
  ]
}
