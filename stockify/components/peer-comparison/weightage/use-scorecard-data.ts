"use client"

import { useEffect, useRef, useState } from "react"

import type { Company } from "@/lib/companies"
import { METRICS } from "@/lib/scorecard/config"
import { fetchScorecardInputs, type ScorecardData } from "@/lib/scorecard/data"

export type ScorecardDataState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: ScorecardData; isRefreshing: boolean }

export function useScorecardData(selection: Company[]): ScorecardDataState {
  const [state, setState] = useState<ScorecardDataState>({ status: "loading" })
  const latestData = useRef<ScorecardData | null>(null)
  const key = selection.map((c) => c.symbol).join(",")

  useEffect(() => {
    if (!key) return
    let cancelled = false

    async function run() {
      // Keep the previous scorecard on screen while a changed selection loads,
      // same as the company-analysis refresh: no drop back to a skeleton.
      if (latestData.current) {
        setState({ status: "ready", data: latestData.current, isRefreshing: true })
      } else {
        setState({ status: "loading" })
      }
      try {
        const data = await fetchScorecardInputs(selection, METRICS)
        if (cancelled) return
        latestData.current = data
        setState({ status: "ready", data, isRefreshing: false })
      } catch (err) {
        if (!cancelled)
          setState({ status: "error", message: err instanceof Error ? err.message : "Failed to load financials" })
      }
    }
    run()

    return () => {
      cancelled = true
    }
    // `key` captures the selection's identity; the array itself changes on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return state
}
