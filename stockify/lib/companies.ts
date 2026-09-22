import { supabase } from "@/lib/supabase"

export type Company = {
  symbol: string
  name: string
  industry: string
}

type CorporateInfo = {
  Company?: Array<{
    CompanyName?: string
    Industry?: string
    ISIN?: string
    ListingDate?: string
    website?: string
    Auditor?: string
    CIN?: string
    email?: string
    scripcode?: number
  }>
  Indices?: Array<{ Index_name?: string }>
  Directors?: Array<{ Director_Name?: string; Designation?: string }>
}

export type CompanyRow = {
  symbol: string
  corporate_info: CorporateInfo | null
  fetched_at: string | null
}

function toCompany(row: CompanyRow): Company {
  const info = row.corporate_info?.Company?.[0]
  return {
    symbol: row.symbol,
    name: info?.CompanyName?.trim() || row.symbol,
    industry: info?.Industry?.trim() || "Uncategorized",
  }
}

let cachedCompanies: Promise<{ companies: Company[]; rows: CompanyRow[] }> | null = null

async function loadCompanies() {
  const { data, error } = await supabase
    .from("companies")
    .select("symbol, corporate_info, fetched_at")
    .order("symbol")

  if (error) throw error

  const rows = (data ?? []) as CompanyRow[]
  const companies = rows.map(toCompany).sort((a, b) => a.name.localeCompare(b.name))
  return { companies, rows }
}

export function fetchCompanies(): Promise<Company[]> {
  if (!cachedCompanies) cachedCompanies = loadCompanies()
  return cachedCompanies.then((result) => result.companies)
}

export async function fetchCompanyProfile(symbol: string) {
  if (!cachedCompanies) cachedCompanies = loadCompanies()
  const { rows } = await cachedCompanies
  const row = rows.find((r) => r.symbol === symbol)
  const info = row?.corporate_info?.Company?.[0]
  return {
    symbol,
    name: info?.CompanyName?.trim() || symbol,
    industry: info?.Industry?.trim() || "Uncategorized",
    isin: info?.ISIN ?? null,
    listingDate: info?.ListingDate?.split(" ")[0]?.split("-").reverse().join("-") ?? null,
    website: info?.website ?? null,
    auditor: info?.Auditor ?? null,
    indices: Array.from(
      new Set(
        (row?.corporate_info?.Indices ?? [])
          .map((i) => i.Index_name)
          .filter((name): name is string => Boolean(name))
      )
    ),
  }
}

export async function fetchPeers(industry: string, excludeSymbol: string, limit = 8) {
  if (!cachedCompanies) cachedCompanies = loadCompanies()
  const { companies } = await cachedCompanies
  return companies
    .filter((c) => c.industry === industry && c.symbol !== excludeSymbol)
    .slice(0, limit)
}

export type Director = {
  name: string
  designation: string
}

// Exchange filings paste titles directly onto names with no separating
// space ("Mr.Gautam S. Adani", " JatinJalundhwala") — strip the honorific,
// not the name itself, so we don't guess at word boundaries we can't verify.
function cleanDirectorName(raw: string | undefined): string {
  if (!raw) return ""
  return raw
    .replace(/^(Mrs|Mr|Ms|Dr)\.?\s*/i, "")
    .replace(/\s+/g, " ")
    .trim()
}

export async function fetchDirectors(symbol: string): Promise<{ directors: Director[]; asOf: string | null }> {
  if (!cachedCompanies) cachedCompanies = loadCompanies()
  const { rows } = await cachedCompanies
  const row = rows.find((r) => r.symbol === symbol)
  const directors = (row?.corporate_info?.Directors ?? [])
    .map((d) => ({
      name: cleanDirectorName(d.Director_Name),
      designation: d.Designation?.trim() || "Director",
    }))
    .filter((d) => d.name.length > 0)

  return { directors, asOf: row?.fetched_at ?? null }
}
