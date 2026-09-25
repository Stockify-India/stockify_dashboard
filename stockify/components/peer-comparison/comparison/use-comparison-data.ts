"use client"

import { useEffect, useRef, useState } from "react"

import type { Company } from "@/lib/companies"
import { fetchComparisonData, type ComparisonData } from "@/lib/comparison/data"

export type ComparisonDataState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: ComparisonData; isRefreshing: boolean }

export function useComparisonData(selection: Company[]): ComparisonDataState {
  const [state, setState] = useState<ComparisonDataState>({ status: "loading" })
  const latestData = useRef<ComparisonData | null>(null)
  const key = selection.map((c) => c.symbol).join(",")

  useEffect(() => {
    if (!key) return
    let cancelled = false

    async function run() {
      // Keep the previous comparison on screen while a changed selection
      // loads, same pattern as the weightage scorecard and company-analysis.
      if (latestData.current) {
        setState({ status: "ready", data: latestData.current, isRefreshing: true })
      } else {
        setState({ status: "loading" })
      }
      try {
        const data = await fetchComparisonData(selection)
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
