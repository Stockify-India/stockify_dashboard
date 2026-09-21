"use client"

import { useEffect, useRef, useState } from "react"

import { fetchCompanyProfile, fetchPeers } from "@/lib/companies"
import {
  fetchAnnualFinancials,
  fetchPeerSnapshots,
  fetchPriceStats,
  fetchQuarterlyResults,
  type AnnualFinancials,
  type PriceStats,
  type QuarterlyResult,
} from "@/lib/company-data"
import { fetchRawFinancials, type RawAnnualLine } from "@/lib/financial-metrics"
import { fetchCompanyAnalysis, type AnalysisRecord } from "@/lib/analysis-data"
import type { Company } from "@/lib/companies"

type CompanyProfile = Awaited<ReturnType<typeof fetchCompanyProfile>>

export type CompanyAnalysisData = {
  profile: CompanyProfile
  priceStats: PriceStats
  annual: AnnualFinancials[]
  quarterly: QuarterlyResult[]
  rawFinancials: RawAnnualLine[]
  companyAnalysis: AnalysisRecord | null
  peers: Company[]
  peerSnapshots: Map<string, AnnualFinancials>
}

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: CompanyAnalysisData; isRefreshing: boolean }

// Switching companies keeps the previous company's numbers on screen
// (isRefreshing: true) instead of dropping to a skeleton every time — the
// headline metrics then tick from the old reading to the new one instead of
// popping, and the rest of the panel only swaps once the new data lands.
export function useCompanyAnalysis(symbol: string | null): State {
  const [state, setState] = useState<State>({ status: "loading" })
  const latestData = useRef<CompanyAnalysisData | null>(null)

  useEffect(() => {
    if (!symbol) return
    const activeSymbol = symbol

    let cancelled = false

    async function run() {
      if (latestData.current) {
        setState({ status: "ready", data: latestData.current, isRefreshing: true })
      } else {
        setState({ status: "loading" })
      }

      const [profile, priceStats, annual, quarterly, rawFinancials, companyAnalysis] =
        await Promise.all([
          fetchCompanyProfile(activeSymbol),
          fetchPriceStats(activeSymbol),
          fetchAnnualFinancials(activeSymbol),
          fetchQuarterlyResults(activeSymbol, 28),
          fetchRawFinancials(activeSymbol),
          fetchCompanyAnalysis(activeSymbol),
        ])

      const peers = await fetchPeers(profile.industry, activeSymbol)
      const peerSnapshots = await fetchPeerSnapshots(peers.map((p) => p.symbol))

      if (cancelled) return
      const data: CompanyAnalysisData = {
        profile,
        priceStats,
        annual,
        quarterly,
        rawFinancials,
        companyAnalysis,
        peers,
        peerSnapshots,
      }
      latestData.current = data
      setState({ status: "ready", data, isRefreshing: false })
    }

    run().catch((err) => {
      if (cancelled) return
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Failed to load company data",
      })
    })

    return () => {
      cancelled = true
    }
  }, [symbol])

  return state
}
