export type Holding = {
  id: string
  symbol: string
  name: string
  industry: string
  quantity: number
  avgPrice: number
}

export type Quote = {
  symbol: string
  price: number
  previousClose: number
  dayHigh: number | null
  dayLow: number | null
  asOf: number | null
}

export type Position = Holding & {
  quote: Quote | null
  invested: number
  value: number | null
  pnl: number | null
  pnlPct: number | null
  dayChange: number | null
  dayChangePct: number | null
}

export type PortfolioTotals = {
  invested: number
  value: number
  pnl: number
  pnlPct: number | null
  dayChange: number
  dayChangePct: number | null
  priced: number
  total: number
}

export function buildPosition(holding: Holding, quote: Quote | null): Position {
  const invested = holding.quantity * holding.avgPrice
  if (!quote) {
    return {
      ...holding,
      quote: null,
      invested,
      value: null,
      pnl: null,
      pnlPct: null,
      dayChange: null,
      dayChangePct: null,
    }
  }
  const value = holding.quantity * quote.price
  const pnl = value - invested
  const dayChange = holding.quantity * (quote.price - quote.previousClose)
  const previousValue = holding.quantity * quote.previousClose
  return {
    ...holding,
    quote,
    invested,
    value,
    pnl,
    pnlPct: invested > 0 ? (pnl / invested) * 100 : null,
    dayChange,
    dayChangePct: previousValue > 0 ? (dayChange / previousValue) * 100 : null,
  }
}

// Totals only cover holdings that have a live price, so an unpriced stock
// never shows up as a 100% loss.
export function summarize(positions: Position[]): PortfolioTotals {
  let invested = 0
  let value = 0
  let dayChange = 0
  let previousValue = 0
  let priced = 0
  for (const p of positions) {
    if (p.value === null || p.dayChange === null || !p.quote) continue
    priced += 1
    invested += p.invested
    value += p.value
    dayChange += p.dayChange
    previousValue += p.quantity * p.quote.previousClose
  }
  const pnl = value - invested
  return {
    invested,
    value,
    pnl,
    pnlPct: invested > 0 ? (pnl / invested) * 100 : null,
    dayChange,
    dayChangePct: previousValue > 0 ? (dayChange / previousValue) * 100 : null,
    priced,
    total: positions.length,
  }
}

// Adding to a stock you already hold blends the buy price into the average.
export function mergeBuy(
  existing: Holding,
  quantity: number,
  price: number
): Holding {
  const totalQty = existing.quantity + quantity
  const avgPrice =
    (existing.quantity * existing.avgPrice + quantity * price) / totalQty
  return { ...existing, quantity: totalQty, avgPrice }
}

export function formatSignedRupee(value: number | null): string {
  if (value === null) return "-"
  const sign = value > 0 ? "+" : value < 0 ? "-" : ""
  return `${sign}₹${Math.abs(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function formatSignedPercent(value: number | null): string {
  if (value === null) return "-"
  const sign = value > 0 ? "+" : value < 0 ? "-" : ""
  return `${sign}${Math.abs(value).toFixed(2)}%`
}

export function formatMoney(value: number | null): string {
  if (value === null) return "-"
  return `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function toneClass(value: number | null): string {
  if (value === null || Math.abs(value) < 0.005) return "text-muted-foreground"
  return value > 0
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-rose-600 dark:text-rose-400"
}

// Tinted pill, same recipe the company analysis badges use.
export function pillClass(value: number | null): string {
  if (value === null || Math.abs(value) < 0.005)
    return "border-border bg-muted text-muted-foreground"
  return value > 0
    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
    : "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400"
}
