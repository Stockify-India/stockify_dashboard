import { supabase } from "@/lib/supabase"

export type ShareholdingCategory =
  | "promoters"
  | "foreign_institutions"
  | "domestic_institutions"
  | "government"
  | "public"

export type ShareholdingPoint = {
  quarter: string
  promoters: number | null
  foreign_institutions: number | null
  domestic_institutions: number | null
  government: number | null
  public: number | null
  numShareholders: number | null
}

export type ShareholdingHistory = {
  quarterly: ShareholdingPoint[]
  yearly: ShareholdingPoint[]
}

type ShareholdingRow = {
  period: "quarterly" | "yearly"
  quarter: string
  data: Partial<Record<ShareholdingCategory, number>> | null
  num_shareholders: number | null
}

function toPoint(row: ShareholdingRow): ShareholdingPoint {
  const d = row.data ?? {}
  return {
    quarter: row.quarter,
    promoters: d.promoters ?? null,
    foreign_institutions: d.foreign_institutions ?? null,
    domestic_institutions: d.domestic_institutions ?? null,
    government: d.government ?? null,
    public: d.public ?? null,
    numShareholders: row.num_shareholders ?? null,
  }
}

// Quarter labels are free text like "Dec 2023" or "Mar 2026" — parseable as
// "1 <label>" but not guaranteed monotonic in the source table, so we sort
// client-side rather than trusting insertion order.
function quarterSortKey(label: string): number {
  const parsed = Date.parse(`1 ${label}`)
  return Number.isNaN(parsed) ? 0 : parsed
}

function byQuarterAsc(a: ShareholdingPoint, b: ShareholdingPoint): number {
  return quarterSortKey(a.quarter) - quarterSortKey(b.quarter)
}

export async function fetchShareholdingHistory(symbol: string): Promise<ShareholdingHistory> {
  const { data, error } = await supabase
    .from("shareholding_history")
    .select("period, quarter, data, num_shareholders")
    .eq("symbol", symbol)

  if (error) throw error

  const rows = (data ?? []) as ShareholdingRow[]
  const quarterly = rows.filter((r) => r.period === "quarterly").map(toPoint).sort(byQuarterAsc)
  const yearly = rows.filter((r) => r.period === "yearly").map(toPoint).sort(byQuarterAsc)

  return { quarterly, yearly }
}
