const CRORE = 1e7

export function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null
  const num = typeof value === "number" ? value : Number(value)
  return Number.isFinite(num) ? num : null
}

export function formatCrore(value: unknown): string {
  const num = toNumber(value)
  if (num === null) return "—"
  return `₹${(num / CRORE).toLocaleString("en-IN", { maximumFractionDigits: 0 })} Cr`
}

// Raw crore value for chart data (formatCrore returns the display string).
export function toCrore(value: unknown): number {
  const num = toNumber(value)
  return num === null ? 0 : Math.round(num / CRORE)
}

export function formatRupee(value: unknown): string {
  const num = toNumber(value)
  if (num === null) return "—"
  return `₹${num.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
}

export function formatPercent(value: unknown, digits = 1): string {
  const num = toNumber(value)
  if (num === null) return "—"
  return `${num.toFixed(digits)}%`
}

export function formatDays(value: unknown): string {
  const num = toNumber(value)
  if (num === null) return "—"
  return `${num.toFixed(0)} days`
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

// Indian fiscal year runs Apr–Mar. period_end 2025-03-31 -> ends in FY 2025.
export function fiscalYearEndYear(periodEnd: string): number {
  const date = new Date(periodEnd)
  const month = date.getMonth() // 0-indexed
  return month >= 3 ? date.getFullYear() + 1 : date.getFullYear()
}

// period_end 2025-03-31 -> "FY25".
export function fiscalYearLabel(periodEnd: string): string {
  return `FY${String(fiscalYearEndYear(periodEnd)).slice(-2)}`
}

// period_end 2025-12-31 -> "Q3 FY26" (Oct-Dec sits in the FY ending next March).
export function fiscalQuarterLabel(periodEnd: string): string {
  const date = new Date(periodEnd)
  const month = date.getMonth()
  const quarter = Math.floor(((month + 9) % 12) / 3) + 1
  return `Q${quarter} ${fiscalYearLabel(periodEnd)}`
}
