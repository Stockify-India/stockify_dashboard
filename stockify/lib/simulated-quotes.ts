import { toNumber } from "@/lib/format"
import { supabase } from "@/lib/supabase"
import type { Quote } from "@/lib/portfolio"

// Placeholder until a real market-data source is wired in. The site is a
// static export, so there is no server to proxy a live quote API through.
// Base price is the midpoint of the stored 52-week range; the price then
// random-walks within +/-MAX_MOVE_PCT of the previous close.
export const MAX_MOVE_PCT = 3
const STEP_PCT = 0.35

type SymbolState = { previousClose: number; movePct: number; dayHigh: number; dayLow: number }

const states = new Map<string, SymbolState>()

function between(min: number, max: number) {
  return min + Math.random() * (max - min)
}

// One query for every symbol; per-symbol requests would fan out to 50 calls
// on the home page.
let allBases: Promise<Map<string, number>> | null = null

function loadBase(symbol: string) {
  if (!allBases) {
    allBases = Promise.resolve(
      supabase.from("price_stats").select("symbol, hl_52week")
    ).then(({ data, error }) => {
      if (error) throw error
      const map = new Map<string, number>()
      for (const row of data ?? []) {
        const record = row.hl_52week?.Records?.[0]
        const high = toNumber(record?.[0])
        const low = toNumber(record?.[1])
        if (high !== null && low !== null) map.set(row.symbol, (high + low) / 2)
      }
      return map
    })
    allBases.catch(() => {
      allBases = null
    })
  }
  return allBases.then((map) => map.get(symbol) ?? null)
}

export async function fetchSimulatedQuotes(symbols: string[]) {
  const quotes: Record<string, Quote> = {}
  const failed: string[] = []

  await Promise.all(
    symbols.map(async (symbol) => {
      const base = await loadBase(symbol).catch(() => null)
      if (base === null) {
        failed.push(symbol)
        return
      }

      let state = states.get(symbol)
      if (!state) {
        // Previous close sits a little off the midpoint so symbols differ.
        const previousClose = base * (1 + between(-0.02, 0.02))
        state = { previousClose, movePct: between(-MAX_MOVE_PCT, MAX_MOVE_PCT), dayHigh: 0, dayLow: Infinity }
        states.set(symbol, state)
      } else {
        const next = state.movePct + between(-STEP_PCT, STEP_PCT)
        state.movePct = Math.max(-MAX_MOVE_PCT, Math.min(MAX_MOVE_PCT, next))
      }

      const price = Math.round(state.previousClose * (1 + state.movePct / 100) * 100) / 100
      state.dayHigh = Math.max(state.dayHigh, price)
      state.dayLow = Math.min(state.dayLow, price)

      quotes[symbol] = {
        symbol,
        price,
        previousClose: Math.round(state.previousClose * 100) / 100,
        dayHigh: state.dayHigh,
        dayLow: state.dayLow,
        asOf: Date.now(),
      }
    })
  )

  return { quotes, failed }
}
