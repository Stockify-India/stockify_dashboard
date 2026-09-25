// Run with: npm test  (node --test, using Node's built-in TypeScript stripping)
import { test } from "node:test"
import assert from "node:assert/strict"

import {
  AUTO_COMPONENT_METRICS,
  AUTO_COMPONENT_WEIGHTS,
  DEFAULT_WEIGHT,
  METRICS,
  type MetricConfig,
} from "./config.ts"
import { DERIVATIONS } from "./derive.ts"
import { rankProgression, scoreCompanies, scoreKey, weightKey, type CompanyInput } from "./engine.ts"

const uniformWeights = (metrics: readonly MetricConfig[], weight = DEFAULT_WEIGHT) =>
  Object.fromEntries(metrics.map((m) => [weightKey(m), weight]))

// Three companies with moderate, positive values for every metric so no
// ratio hits the clamp. Company "LOW" holds the smallest raw value.
function fixture(metrics: readonly MetricConfig[]): CompanyInput[] {
  const values = (v: number) => Object.fromEntries(metrics.map((m) => [m.name, v]))
  return [
    { symbol: "LOW", name: "Low Co", industry: "Test", values: values(8) },
    { symbol: "MID", name: "Mid Co", industry: "Test", values: values(10) },
    { symbol: "HIGH", name: "High Co", industry: "Test", values: values(12) },
  ]
}

const approxEqual = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`)

for (const [label, metrics] of [
  ["METRICS", METRICS],
  ["AUTO_COMPONENT_METRICS", AUTO_COMPONENT_METRICS],
] as const) {
  test(`${label}: every metric has a unique weight key that matches its own score column`, () => {
    const weightKeys = metrics.map(weightKey)
    assert.equal(new Set(weightKeys).size, weightKeys.length, "two metrics share a weight key")
    for (const metric of metrics) {
      assert.equal(weightKey(metric), metric.name)
      assert.equal(scoreKey(metric), metric.name)
    }
  })

  test(`${label}: each score column responds to its own weight and no other`, () => {
    const companies = fixture(metrics)
    const base = scoreCompanies(companies, metrics, uniformWeights(metrics))
    for (const metric of metrics) {
      const bumped = scoreCompanies(companies, metrics, { ...uniformWeights(metrics), [weightKey(metric)]: 10 })
      for (const other of metrics) {
        const before = base.companies.find((c) => c.symbol === "HIGH")!.scores[scoreKey(other)]
        const after = bumped.companies.find((c) => c.symbol === "HIGH")!.scores[scoreKey(other)]
        if (other.name === metric.name) assert.notEqual(after, before, `${metric.name} ignores its own slider`)
        else approxEqual(after, before)
      }
    }
  })

  test(`${label}: total_score equals exactly the sum of the active metric scores`, () => {
    const companies = fixture(metrics)
    const weights = Object.fromEntries(metrics.map((m, i) => [weightKey(m), (i % 10) + 1]))
    const result = scoreCompanies(companies, metrics, weights)
    for (const company of result.companies) {
      assert.deepEqual(Object.keys(company.scores).sort(), metrics.map(scoreKey).sort(), "stale or missing score column")
      const expected = metrics.reduce((sum, m) => sum + company.scores[scoreKey(m)], 0)
      approxEqual(company.totalScore, expected)
    }
  })

  test(`${label}: every lower-is-better metric gives the lower raw value the higher score`, () => {
    const lowerMetrics = metrics.filter((m) => m.direction === "lower")
    const companies = fixture(metrics)
    const result = scoreCompanies(companies, metrics, uniformWeights(metrics))
    const score = (symbol: string, metric: MetricConfig) =>
      result.companies.find((c) => c.symbol === symbol)!.scores[scoreKey(metric)]
    for (const metric of lowerMetrics) {
      assert.ok(score("LOW", metric) > score("MID", metric), `${metric.name} is not inverted`)
      assert.ok(score("MID", metric) > score("HIGH", metric), `${metric.name} is not inverted`)
    }
    for (const metric of metrics.filter((m) => m.direction === "higher")) {
      assert.ok(score("HIGH", metric) > score("LOW", metric), `${metric.name} is inverted by mistake`)
    }
  })
}

test("valuation and leverage ratios are configured as lower-is-better", () => {
  const mustBeLower = /pe_ratio|ev_ebitda|debt_to_equity|price_to|npa/
  for (const metric of [...METRICS, ...AUTO_COMPONENT_METRICS].filter((m) => mustBeLower.test(m.name))) {
    assert.equal(metric.direction, "lower", `${metric.name} should be direction="lower"`)
  }
})

test("removing a metric from the list removes it from the total", () => {
  const companies = fixture(METRICS)
  const without = METRICS.filter((m) => m.name !== "roe_growth")
  const result = scoreCompanies(companies, without, uniformWeights(without))
  for (const company of result.companies) {
    assert.equal("roe_growth" in company.scores, false)
    approxEqual(
      company.totalScore,
      without.reduce((sum, m) => sum + company.scores[scoreKey(m)], 0)
    )
  }
})

test("every configured metric has a derivation", () => {
  for (const metric of METRICS) assert.ok(DERIVATIONS[metric.name], `no derivation for ${metric.name}`)
})

test("auto-component weights cover exactly the auto-component metrics", () => {
  assert.equal(AUTO_COMPONENT_METRICS.length, 9)
  assert.deepEqual(Object.keys(AUTO_COMPONENT_WEIGHTS).sort(), AUTO_COMPONENT_METRICS.map(weightKey).sort())
})

test("missing values score zero and are reported as gaps", () => {
  const companies = fixture(METRICS)
  companies[1].values.gross_npa = null
  const result = scoreCompanies(companies, METRICS, uniformWeights(METRICS))
  const mid = result.companies.find((c) => c.symbol === "MID")!
  assert.equal(mid.scores.gross_npa, 0)
  assert.deepEqual(result.gaps, [{ symbol: "MID", name: "Mid Co", missing: ["Gross NPA"] }])
})

test("rank after the last metric matches the final rank", () => {
  const companies = fixture(METRICS)
  const weights = uniformWeights(METRICS)
  const result = scoreCompanies(companies, METRICS, weights)
  const steps = rankProgression(result, METRICS, weights)
  const last = steps.at(-1)!
  for (const company of result.companies) assert.equal(last.ranks[company.symbol], company.rank)
})
