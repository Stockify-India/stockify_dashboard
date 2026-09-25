// Scoring engine. Pure functions only: no data fetching, no React, and no
// knowledge of any particular metric. Everything it scores comes in through
// the `metrics` argument, so the config file is the only thing that decides
// what counts.

import type { MetricConfig } from "./config"

export type CompanyInput = {
  symbol: string
  name: string
  industry: string
  /** Raw metric values keyed by metric name; null = not available. */
  values: Record<string, number | null>
}

export type ScoredCompany = CompanyInput & {
  /** Per-metric score keyed by metric name (0 when the value is missing). */
  scores: Record<string, number>
  totalScore: number
  rank: number
}

export type MetricStat = {
  name: string
  sectorMean: number | null
  /** Why the metric contributes nothing for this set, if it doesn't. */
  unscorable: string | null
}

export type DataGap = { symbol: string; name: string; missing: string[] }

export type ScorecardResult = {
  companies: ScoredCompany[] // ranked, best first
  metricStats: Record<string, MetricStat>
  gaps: DataGap[]
}

/**
 * A company's value ÷ the sector mean (or the inverse for "lower") can blow up
 * when a denominator is near zero (e.g. a debt-free company's D/E of 0). The
 * ratio is clamped so one outlier can't swamp every other metric.
 */
export const MAX_RATIO = 3

export function weightKey(metric: MetricConfig) {
  return metric.name
}

export function scoreKey(metric: MetricConfig) {
  return metric.name
}

function mean(values: number[]) {
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

function clamp(value: number) {
  return Math.max(-MAX_RATIO, Math.min(MAX_RATIO, value))
}

/**
 * The spec's formula:
 *   higher: (value / sector_mean) * weight
 *   lower:  (sector_mean / value) * weight
 * Returns the unweighted ratio, or null if this value can't be scored.
 */
export function metricRatio(value: number, sectorMean: number, direction: MetricConfig["direction"]) {
  if (direction === "higher") return clamp(value / sectorMean)
  // Zero or negative on a lower-is-better metric (e.g. no debt) is the best
  // possible reading, so it takes the ceiling rather than dividing by it.
  if (value <= 0) return MAX_RATIO
  return clamp(sectorMean / value)
}

export function computeMetricStats(companies: CompanyInput[], metrics: readonly MetricConfig[]) {
  const stats: Record<string, MetricStat> = {}
  for (const metric of metrics) {
    const present = companies
      .map((c) => c.values[metric.name])
      .filter((v): v is number => v !== null && v !== undefined && Number.isFinite(v))

    if (present.length === 0) {
      stats[metric.name] = { name: metric.name, sectorMean: null, unscorable: "No company has this figure" }
      continue
    }
    const sectorMean = mean(present)
    // With a zero or negative mean the ratio flips sign, so a better company
    // would score worse. Rather than silently rank backwards, skip the metric.
    stats[metric.name] = {
      name: metric.name,
      sectorMean,
      unscorable: sectorMean <= 0 ? "Sector average is zero or negative, so ratio-to-average can't rank it" : null,
    }
  }
  return stats
}

function rankByTotal<T extends { symbol: string; totalScore: number }>(rows: T[]) {
  return [...rows].sort((a, b) => b.totalScore - a.totalScore || a.symbol.localeCompare(b.symbol))
}

export function scoreCompanies(
  companies: CompanyInput[],
  metrics: readonly MetricConfig[],
  weights: Readonly<Record<string, number>>
): ScorecardResult {
  const metricStats = computeMetricStats(companies, metrics)

  // Pass 1: build every per-metric score column.
  const withScores = companies.map((company) => {
    const scores: Record<string, number> = {}
    for (const metric of metrics) {
      const value = company.values[metric.name]
      const { sectorMean, unscorable } = metricStats[metric.name]
      const weight = weights[weightKey(metric)] ?? 0
      scores[scoreKey(metric)] =
        value === null || value === undefined || sectorMean === null || unscorable
          ? 0
          : metricRatio(value, sectorMean, metric.direction) * weight
    }
    return { ...company, scores }
  })

  // Pass 2: only once every column exists, total them in a single step, and
  // only over the metrics passed in, so nothing stale can leak into the sum.
  const totalled = withScores.map((company) => ({
    ...company,
    totalScore: metrics.reduce((sum, metric) => sum + company.scores[scoreKey(metric)], 0),
  }))

  const ranked = rankByTotal(totalled).map((company, index) => ({ ...company, rank: index + 1 }))

  const gaps = companies
    .map((company) => ({
      symbol: company.symbol,
      name: company.name,
      missing: metrics
        .filter((m) => company.values[m.name] === null || company.values[m.name] === undefined)
        .map((m) => m.label),
    }))
    .filter((gap) => gap.missing.length > 0)

  return { companies: ranked, metricStats, gaps }
}

/**
 * Rank after each metric: the ranking you'd get if the total only included
 * the first k metrics (in config order), for every k. Metrics with zero
 * weight are skipped since they can't move anyone.
 */
export function rankProgression(result: ScorecardResult, metrics: readonly MetricConfig[], weights: Readonly<Record<string, number>>) {
  const active = metrics.filter((m) => (weights[weightKey(m)] ?? 0) > 0)
  const running = new Map(result.companies.map((c) => [c.symbol, 0]))
  const steps = active.map((metric) => {
    for (const company of result.companies) {
      running.set(company.symbol, (running.get(company.symbol) ?? 0) + company.scores[scoreKey(metric)])
    }
    const ranked = rankByTotal(
      result.companies.map((c) => ({ symbol: c.symbol, totalScore: running.get(c.symbol) ?? 0 }))
    )
    return {
      metric,
      ranks: Object.fromEntries(ranked.map((c, index) => [c.symbol, index + 1])) as Record<string, number>,
    }
  })
  return steps
}

export function ranksBySymbol(result: ScorecardResult) {
  return Object.fromEntries(result.companies.map((c) => [c.symbol, c.rank])) as Record<string, number>
}
