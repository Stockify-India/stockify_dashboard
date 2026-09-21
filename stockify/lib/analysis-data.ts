import { supabase } from "@/lib/supabase"

export type RevenueSource = {
  name: string
  amount?: string | null
  percentage_pct?: number | null
  trend_3_5y?: string | null
  recurring_or_onetime?: string | null
  contracted_or_spot?: string | null
}

export type Segment = {
  name: string
  revenue?: string | null
  revenue_share_pct?: number | null
  profit_metric?: string | null
  profit_contribution?: string | null
  ebit_share_pct?: number | null
  pat_share_pct?: number | null
  revenue_growth?: string | null
  profit_growth?: string | null
  classification?: string | null
  classification_evidence?: string | null
  margin_profile?: string | null
}

export type GeographyEntry = {
  region: string
  revenue_share_pct?: number | null
  domestic_vs_international?: string | null
  country_concentration?: string | null
}

export type MarginEntry = {
  segment_name: string
  gross_margin_pct?: number | null
  ebitda_margin_pct?: number | null
  ebit_margin_pct?: number | null
  net_margin_pct?: number | null
  margin_trends_3_5y?: string | null
  margin_drivers?: string | null
  peer_comparison?: string | null
  sector_specific_margins?: string | null
}

export type RedFlagEntry = {
  status: string
  detail: string
  trend?: string | null
  financial_impact?: string | null
}

export type CompetitivePositioning = {
  moat_sources?: string[]
  moat_analysis?: string | null
  market_share?: string | null
  market_share_evidence?: string | null
  pricing_power?: string | null
  pricing_power_evidence?: string | null
  threat_map?: string[]
  threat_analysis?: string | null
}

export type InvestmentThesisAspect = {
  assessment?: string
  evidence?: string
  confidence?: string
  limitation?: string
}

export type InvestmentThesis = {
  business_quality?: InvestmentThesisAspect
  growth_quality?: InvestmentThesisAspect
  competitive_advantage?: InvestmentThesisAspect
  financial_quality?: InvestmentThesisAspect
  management_quality?: InvestmentThesisAspect
  balance_sheet_risk?: InvestmentThesisAspect
  key_risks?: string[]
  key_positives?: string[]
  thesis_breaking_factors?: string[]
  overall_verdict?: string
}

export type AnalysisPayload = {
  company_name?: string
  document_type?: string
  period?: string
  detected_sector?: string
  business_model?: Record<string, string | null>
  revenue_mix?: {
    sources?: RevenueSource[]
    mix_trend_3_5y?: string | null
    mix_change_drivers?: string | null
    mix_impact_on_margins?: string | null
  }
  segments?: Segment[]
  geography?: GeographyEntry[]
  margins?: MarginEntry[]
  competitive_positioning?: CompetitivePositioning
  management?: Record<string, unknown>
  balance_sheet?: Record<string, unknown>
  red_flags?: Record<string, RedFlagEntry | RedFlagEntry[] | undefined>
  regulatory?: Record<string, string | null>
  valuation?: Record<string, unknown>
  investment_thesis?: InvestmentThesis
  key_highlights?: string[]
  extraction_confidence?: number
}

export type AnalysisDocument = {
  success?: boolean
  document_id?: string
  analysis: AnalysisPayload
  detected_document_type?: string
  total_pages?: number
  pages_processed?: number
  sections_found?: string[]
  errors?: string[]
  processing_time_seconds?: number
  created_at?: string
}

export type AnalysisRecord = {
  id: number
  symbol: string
  documentId: string | null
  document: AnalysisDocument
  createdAt: string
}

export async function fetchCompanyAnalysis(symbol: string): Promise<AnalysisRecord | null> {
  const { data, error } = await supabase
    .from("analysis_table")
    .select("id, symbol, document_id, data, created_at")
    .eq("symbol", symbol)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return {
    id: data.id,
    symbol: data.symbol,
    documentId: data.document_id ?? null,
    document: data.data as AnalysisDocument,
    createdAt: data.created_at,
  }
}

// Pulls "FY18: 3.25%" / "FY2026: 4.32%" and "16.0% in FY2026" pairs out of a
// free-text trend sentence — the extraction pipeline writes trends as prose,
// not arrays, so this is the only way to chart them without fabricating data.
export function parseFyPercentSeries(text?: string | null): { fy: string; value: number }[] {
  if (!text) return []

  const results: { fy: string; value: number; sortKey: number }[] = []

  const patternFyFirst = /FY\s?(\d{2,4})\s*:?\s*(-?[\d.]+)%/gi
  const patternValueFirst = /(-?[\d.]+)%\s*in\s*FY\s?(\d{2,4})/gi

  let match: RegExpExecArray | null
  while ((match = patternFyFirst.exec(text))) {
    const year = normalizeFiscalYear(match[1])
    results.push({ fy: `FY${year}`, value: Number.parseFloat(match[2]), sortKey: year })
  }
  while ((match = patternValueFirst.exec(text))) {
    const year = normalizeFiscalYear(match[2])
    results.push({ fy: `FY${year}`, value: Number.parseFloat(match[1]), sortKey: year })
  }

  const seen = new Set<string>()
  return results
    .filter((r) => {
      if (seen.has(r.fy)) return false
      seen.add(r.fy)
      return true
    })
    .sort((a, b) => a.sortKey - b.sortKey)
    .map(({ fy, value }) => ({ fy, value }))
}

// Same idea as parseFyPercentSeries but for "₹12 in FY26" style rupee amounts.
export function parseFyRupeeSeries(text?: string | null): { fy: string; value: number }[] {
  if (!text) return []

  const pattern = /₹\s?(-?[\d,.]+)\s*(?:million|billion|cr|crore)?\s*in\s*FY\s?(\d{2,4})/gi
  const results: { fy: string; value: number; sortKey: number }[] = []

  let match: RegExpExecArray | null
  while ((match = pattern.exec(text))) {
    const year = normalizeFiscalYear(match[2])
    const value = Number.parseFloat(match[1].replace(/,/g, ""))
    if (Number.isFinite(value)) results.push({ fy: `FY${year}`, value, sortKey: year })
  }

  const seen = new Set<string>()
  return results
    .filter((r) => {
      if (seen.has(r.fy)) return false
      seen.add(r.fy)
      return true
    })
    .sort((a, b) => a.sortKey - b.sortKey)
    .map(({ fy, value }) => ({ fy, value }))
}

function normalizeFiscalYear(raw: string): number {
  const n = Number.parseInt(raw, 10)
  return n < 100 ? 2000 + n : n
}
