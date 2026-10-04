"use client"

import { useCallback, useEffect, useState } from "react"

import type { Quote } from "@/lib/portfolio"
import { fetchSimulatedQuotes } from "@/lib/simulated-quotes"

const REFRESH_MS = 5_000

type QuoteState = {
  quotes: Record<string, Quote>
  failed: string[]
  error: string | null
  updatedAt: number | null
  isFetching: boolean
}

const INITIAL: QuoteState = {
  quotes: {},
  failed: [],
  error: null,
  updatedAt: null,
  isFetching: false,
}

export function useQuotes(symbols: string[]) {
  const [state, setState] = useState<QuoteState>(INITIAL)
  const [tick, setTick] = useState(0)
  // Stable dependency: the symbol list changes identity on every render.
  const key = Array.from(new Set(symbols)).sort().join(",")

  useEffect(() => {
    if (!key) return
    const controller = new AbortController()

    async function load() {
      setState((s) => ({ ...s, isFetching: true }))
      try {
        const data = await fetchSimulatedQuotes(key.split(","))
        if (controller.signal.aborted) return
        setState({
          quotes: data.quotes,
          failed: data.failed,
          error: null,
          updatedAt: Date.now(),
          isFetching: false,
        })
      } catch (err) {
        if (controller.signal.aborted) return
        setState((s) => ({
          ...s,
          error: err instanceof Error ? err.message : "Couldn't load prices",
          isFetching: false,
        }))
      }
    }

    load()
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") load()
    }, REFRESH_MS)

    return () => {
      controller.abort()
      window.clearInterval(interval)
    }
  }, [key, tick])

  const refresh = useCallback(() => setTick((t) => t + 1), [])

  return { ...state, hasSymbols: key.length > 0, refresh }
}
