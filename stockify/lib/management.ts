import { fetchDirectors, type Director } from "@/lib/companies"

export type ManagementTier = "chairperson" | "executive" | "non-executive" | "kmp" | "other"

export type ManagementPerson = Director & { tier: ManagementTier }

export type ManagementGroup = {
  tier: ManagementTier
  label: string
  description: string
  people: ManagementPerson[]
}

export type ManagementHierarchy = {
  totalCount: number
  asOf: string | null
  groups: ManagementGroup[]
}

const TIER_ORDER: ManagementTier[] = ["chairperson", "executive", "non-executive", "kmp", "other"]

const TIER_META: Record<ManagementTier, { label: string; description: string }> = {
  chairperson: {
    label: "Chairperson",
    description: "Chairs the board",
  },
  executive: {
    label: "Executive Management",
    description: "Managing director, CEO, and whole-time / executive directors",
  },
  "non-executive": {
    label: "Non-Executive & Independent Directors",
    description: "Board oversight, not involved in day-to-day operations",
  },
  kmp: {
    label: "Key Managerial Personnel",
    description: "CFO, company secretary, and compliance roles",
  },
  other: {
    label: "Other",
    description: "Role not classified from the designation on file",
  },
}

// Classified from the free-text `Designation` string in the filing — there is
// no explicit reporting-line field in the source data, so this groups people
// by disclosed board/governance role rather than asserting who reports to
// whom.
function classify(designation: string): ManagementTier {
  const d = designation.toLowerCase()
  if (d.includes("chairperson") || d.includes("chairman")) return "chairperson"
  if (
    d.includes("company secretary") ||
    d.includes("compliance officer") ||
    d.includes("chief financial officer") ||
    d.includes("chief finance officer") ||
    d.includes("vice president") ||
    /\bcfo\b/.test(d)
  ) {
    return "kmp"
  }
  if (d.includes("non-executive") || d.includes("non executive") || d.includes("independent director")) {
    return "non-executive"
  }
  if (
    d.includes("executive director") ||
    d.includes("managing director") ||
    d.includes("chief executive") ||
    d.includes("whole-time") ||
    d.includes("whole time") ||
    /\bmd\b/.test(d) ||
    /\bceo\b/.test(d)
  ) {
    return "executive"
  }
  return "other"
}

export async function fetchManagementHierarchy(symbol: string): Promise<ManagementHierarchy> {
  const { directors, asOf } = await fetchDirectors(symbol)
  const people: ManagementPerson[] = directors.map((d) => ({ ...d, tier: classify(d.designation) }))

  const groups: ManagementGroup[] = TIER_ORDER.map((tier) => ({
    tier,
    label: TIER_META[tier].label,
    description: TIER_META[tier].description,
    people: people.filter((p) => p.tier === tier),
  })).filter((group) => group.people.length > 0)

  return { totalCount: people.length, asOf, groups }
}
