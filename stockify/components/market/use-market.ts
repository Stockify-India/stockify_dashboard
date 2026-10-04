"use client"

import { useEffect, useMemo, useState } from "react"

import { useCompany } from "@/components/company-context"
import { useQuotes } from "@/components/portfolio/use-quotes"
import {
  createWalk,
  stepWalk,
  type IndexId,
  type IndexQuote,
} from "@/lib/market"

const TICK_MS = 5_000

export type Mover = {
  symbol: string
  name: string
  industry: string
  price: number
  changePct: number
}

const MOVER_COUNT = 8

export function useMarket() {
  const [indices, setIndices] = useState<IndexQuote[] | null>(null)
  const [updatedAt, setUpdatedAt] = useState<number | null>(null)

  useEffect(() => {
    const walk = createWalk()
    const tick = () => {
      setIndices(stepWalk(walk))
      setUpdatedAt(Date.now())
    }
    // Deferred so the first random values are drawn on the client only and
    // never mismatch the server-rendered markup.
    const first = window.setTimeout(tick, 0)
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") tick()
    }, TICK_MS)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(interval)
    }
  }, [])

  const {
    companies,
    isLoading: companiesLoading,
    error: companiesError,
  } = useCompany()
  const symbols = useMemo(() => companies.map((c) => c.symbol), [companies])
  const { quotes } = useQuotes(symbols)

  const byId = useMemo(() => {
    const map = new Map<IndexId, IndexQuote>()
    for (const q of indices ?? []) map.set(q.id, q)
    return map
  }, [indices])

  const { gainers, losers, hasStocks } = useMemo(() => {
    const movers: Mover[] = []
    for (const company of companies) {
      const quote = quotes[company.symbol]
      if (!quote || quote.previousClose <= 0) continue
      movers.push({
        symbol: company.symbol,
        name: company.name,
        industry: company.industry,
        price: quote.price,
        changePct:
          ((quote.price - quote.previousClose) / quote.previousClose) * 100,
      })
    }
    movers.sort((a, b) => b.changePct - a.changePct)
    return {
      gainers: movers.slice(0, MOVER_COUNT),
      losers: movers.slice(-MOVER_COUNT).reverse(),
      hasStocks: movers.length > 0,
    }
  }, [companies, quotes])

  return {
    indices,
    byId,
    updatedAt,
    gainers,
    losers,
    stocksLoading: !hasStocks && !companiesError,
    stocksError: companiesError,
    companiesLoading,
  }
}
