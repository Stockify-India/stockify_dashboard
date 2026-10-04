import { MAX_MOVE_PCT } from "@/lib/simulated-quotes"

// Simulated index data, same rules as the stock quotes: no market-data feed
// is connected, so each index random-walks within +/-MAX_MOVE_PCT of a
// previous close that sits near a realistic base level.

export type IndexId =
  | "nifty50"
  | "sensex"
  | "banknifty"
  | "niftyit"
  | "auto"
  | "pharma"
  | "fmcg"
  | "metal"
  | "energy"
  | "finserv"
  | "realty"
  | "infra"

export type IndexDef = { id: IndexId; name: string; short: string; base: number }

export const INDICES: IndexDef[] = [
  { id: "nifty50", name: "Nifty 50", short: "Nifty 50", base: 24812.35 },
  { id: "sensex", name: "Sensex", short: "Sensex", base: 81245.6 },
  { id: "banknifty", name: "Bank Nifty", short: "Bank", base: 53640.2 },
  { id: "niftyit", name: "Nifty IT", short: "IT", base: 35420.75 },
  { id: "auto", name: "Nifty Auto", short: "Auto", base: 23980.1 },
  { id: "pharma", name: "Nifty Pharma", short: "Pharma", base: 21350.4 },
  { id: "fmcg", name: "Nifty FMCG", short: "FMCG", base: 56720.85 },
  { id: "metal", name: "Nifty Metal", short: "Metal", base: 9540.3 },
  { id: "energy", name: "Nifty Energy", short: "Energy", base: 36880.55 },
  { id: "finserv", name: "Nifty Financial Services", short: "Fin Services", base: 25960.7 },
  { id: "realty", name: "Nifty Realty", short: "Realty", base: 910.45 },
  { id: "infra", name: "Nifty Infrastructure", short: "Infra", base: 8870.25 },
]

export const HEADLINE_INDICES: IndexId[] = ["nifty50", "sensex", "banknifty", "niftyit"]

export type IndexQuote = {
  id: IndexId
  level: number
  previousClose: number
  change: number
  changePct: number
  dayHigh: number
  dayLow: number
}

type WalkState = { previousClose: number; movePct: number; high: number; low: number }

const STEP_PCT = 0.25

// Heatmap tiles reach full tint at this absolute move.
export const MAX_HEAT_PCT = MAX_MOVE_PCT

function between(min: number, max: number) {
  return min + Math.random() * (max - min)
}

export function createWalk(): Map<IndexId, WalkState> {
  const walk = new Map<IndexId, WalkState>()
  for (const index of INDICES) {
    const previousClose = index.base * (1 + between(-0.006, 0.006))
    const movePct = between(-MAX_MOVE_PCT, MAX_MOVE_PCT)
    const level = previousClose * (1 + movePct / 100)
    walk.set(index.id, { previousClose, movePct, high: level, low: level })
  }
  return walk
}

// Advances every index one step and returns a fresh snapshot.
export function stepWalk(walk: Map<IndexId, WalkState>): IndexQuote[] {
  return INDICES.map((index) => {
    const state = walk.get(index.id)!
    const next = state.movePct + between(-STEP_PCT, STEP_PCT)
    state.movePct = Math.max(-MAX_MOVE_PCT, Math.min(MAX_MOVE_PCT, next))
    const level = state.previousClose * (1 + state.movePct / 100)
    state.high = Math.max(state.high, level)
    state.low = Math.min(state.low, level)
    return {
      id: index.id,
      level,
      previousClose: state.previousClose,
      change: level - state.previousClose,
      changePct: state.movePct,
      dayHigh: state.high,
      dayLow: state.low,
    }
  })
}

export type ChartRange = "1D" | "1W" | "1M" | "3M"

export const CHART_RANGES: { value: ChartRange; label: string; points: number }[] = [
  { value: "1D", label: "1 day", points: 75 },
  { value: "1W", label: "1 week", points: 35 },
  { value: "1M", label: "1 month", points: 22 },
  { value: "3M", label: "3 months", points: 66 },
]

function hashSeed(text: string) {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// mulberry32: tiny seeded PRNG so a given index and range always draw the
// same history shape.
function seeded(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type SeriesPoint = { label: string; value: number }

// History ends exactly at the current level. A seeded walk is generated and
// then tilted linearly so the last point lands on `level`.
export function buildSeries(index: IndexQuote, range: ChartRange): SeriesPoint[] {
  const def = CHART_RANGES.find((r) => r.value === range)!
  const rand = seeded(hashSeed(`${index.id}:${range}`))
  const volatility = range === "1D" ? 0.0006 : range === "1W" ? 0.0018 : 0.006

  const walk: number[] = [0]
  for (let i = 1; i < def.points; i++) walk.push(walk[i - 1] + (rand() - 0.5) * 2 * volatility)

  const start = range === "1D" ? index.previousClose : index.level / (1 + (rand() - 0.45) * 0.08)
  const raw = walk.map((w) => start * (1 + w))
  const tilt = index.level - raw[raw.length - 1]

  const now = new Date()
  return raw.map((value, i) => {
    const t = i / (raw.length - 1)
    const date = new Date(now)
    if (range === "1D") {
      date.setHours(9, 15 + Math.round(t * 375), 0, 0)
      return { label: date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }), value: value + tilt * t }
    }
    const spanDays = range === "1W" ? 7 : range === "1M" ? 30 : 90
    date.setDate(date.getDate() - Math.round((1 - t) * spanDays))
    return { label: date.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), value: value + tilt * t }
  })
}

export function formatLevel(value: number) {
  return value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
