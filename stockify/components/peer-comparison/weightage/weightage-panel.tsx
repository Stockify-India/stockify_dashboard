"use client"

import { useMemo, useRef, useState } from "react"
import {
  AlertTriangleIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronDownIcon,
  RotateCcwIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Skeleton } from "@/components/ui/skeleton"
import { Slider } from "@/components/ui/slider"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyPanel } from "@/components/company-analysis/company-tab-nav"
import {
  MetricBarChart,
  TotalScoreChart,
  formatMetricValue,
  formatScore,
} from "@/components/peer-comparison/weightage/scorecard-charts"
import { useScorecardData } from "@/components/peer-comparison/weightage/use-scorecard-data"
import type { Company } from "@/lib/companies"
import {
  AUTO_COMPONENT_METRICS,
  AUTO_COMPONENT_WEIGHTS,
  DEFAULT_WEIGHT,
  METRICS,
  UNAVAILABLE_METRICS,
  WEIGHT_MAX,
  WEIGHT_MIN,
  type MetricConfig,
} from "@/lib/scorecard/config"
import {
  rankProgression,
  ranksBySymbol,
  scoreCompanies,
  scoreKey,
  weightKey,
  type ScorecardResult,
  type ScoredCompany,
} from "@/lib/scorecard/engine"
import { fiscalQuarterLabel, fiscalYearLabel } from "@/lib/format"

type Weights = Record<string, number>

const DEFAULT_WEIGHTS: Weights = Object.fromEntries(METRICS.map((m) => [weightKey(m), DEFAULT_WEIGHT]))

// ---------- Small pieces ----------

function Section({
  title,
  sub,
  action,
  children,
}: {
  title: string
  sub?: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function RankDelta({ delta }: { delta: number }) {
  if (delta === 0) return <span className="text-[11px] text-muted-foreground/60">–</span>
  const up = delta > 0
  const Icon = up ? ArrowUpIcon : ArrowDownIcon
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 font-mono text-[11px] font-semibold tabular-nums",
        up ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
      )}
      aria-label={up ? `Up ${delta}` : `Down ${-delta}`}
    >
      <Icon className="size-3" />
      {Math.abs(delta)}
    </span>
  )
}

function CompanyCell({ company }: { company: Pick<ScoredCompany, "symbol" | "name"> }) {
  return (
    <div className="flex min-w-0 flex-col">
      <span className="font-mono text-xs font-semibold">{company.symbol}</span>
      <span className="max-w-48 truncate text-[11px] text-muted-foreground">{company.name}</span>
    </div>
  )
}

function TableFrame({ children }: { children: React.ReactNode }) {
  return <div className="overflow-hidden rounded-xl border">{children}</div>
}

const stickyCell =
  "sticky left-0 z-10 bg-background shadow-[6px_0_8px_-6px_rgba(0,0,0,0.12)] dark:shadow-[6px_0_8px_-6px_rgba(0,0,0,0.5)]"

// ---------- Weights ----------

function WeightControls({
  weights,
  onChange,
  onCommit,
  onReset,
}: {
  weights: Weights
  onChange: (key: string, value: number) => void
  onCommit: () => void
  onReset: () => void
}) {
  const totalWeight = METRICS.reduce((sum, m) => sum + (weights[weightKey(m)] ?? 0), 0)
  return (
    <div className="rounded-2xl border bg-card">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <div>
          <p className="text-sm font-medium">Weights</p>
          <p className="text-xs text-muted-foreground">0 removes a metric&apos;s effect on the total</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onReset} className="text-muted-foreground">
          <RotateCcwIcon />
          Reset
        </Button>
      </div>
      <ul className="flex flex-col px-4 py-2">
        {METRICS.map((metric) => {
          const key = weightKey(metric)
          const value = weights[key] ?? 0
          const DirectionIcon = metric.direction === "higher" ? TrendingUpIcon : TrendingDownIcon
          return (
            <li key={key} className="flex flex-col gap-2 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1.5 text-xs font-medium">
                  <span className="truncate">{metric.label}</span>
                  <DirectionIcon
                    className="size-3 shrink-0 text-muted-foreground"
                    aria-label={metric.direction === "higher" ? "Higher is better" : "Lower is better"}
                  />
                </span>
                <span
                  className={cn(
                    "w-5 text-right font-mono text-xs tabular-nums",
                    value === 0 ? "text-muted-foreground" : "text-foreground"
                  )}
                >
                  {value}
                </span>
              </div>
              <Slider
                getAriaLabel={() => `${metric.label} weight`}
                min={WEIGHT_MIN}
                max={WEIGHT_MAX}
                step={1}
                value={[value]}
                onValueChange={(next) => onChange(key, Array.isArray(next) ? next[0] : next)}
                onValueCommitted={onCommit}
              />
            </li>
          )
        })}
      </ul>
      <div className="flex items-center justify-between border-t px-4 py-2.5 text-xs text-muted-foreground">
        <span>Total weight</span>
        <span className="font-mono tabular-nums text-foreground">{totalWeight}</span>
      </div>
    </div>
  )
}

// ---------- Result tables ----------

function strongestMetric(company: ScoredCompany, metrics: readonly MetricConfig[]) {
  let best: MetricConfig | null = null
  for (const metric of metrics) {
    if (!best || company.scores[scoreKey(metric)] > company.scores[scoreKey(best)]) best = metric
  }
  return best && company.scores[scoreKey(best)] > 0 ? best : null
}

function TopFiveTable({ result, deltas }: { result: ScorecardResult; deltas: Record<string, number> }) {
  return (
    <TableFrame>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">Rank</TableHead>
            <TableHead className="w-10" />
            <TableHead>Company</TableHead>
            <TableHead className="text-right">Score</TableHead>
            <TableHead className="hidden sm:table-cell">Biggest contributor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {result.companies.slice(0, 5).map((company) => {
            const strongest = strongestMetric(company, METRICS)
            return (
              <TableRow key={company.symbol}>
                <TableCell className="font-mono text-sm font-semibold tabular-nums">{company.rank}</TableCell>
                <TableCell>
                  <RankDelta delta={deltas[company.symbol] ?? 0} />
                </TableCell>
                <TableCell>
                  <CompanyCell company={company} />
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">{formatScore(company.totalScore)}</TableCell>
                <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">
                  {strongest ? strongest.label : "—"}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableFrame>
  )
}

function RankProgressionTable({ result, weights }: { result: ScorecardResult; weights: Weights }) {
  const steps = rankProgression(result, METRICS, weights)
  if (steps.length === 0) {
    return <p className="text-xs text-muted-foreground">Give at least one metric a weight above 0.</p>
  }
  return (
    <TableFrame>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className={cn(stickyCell, "min-w-40")}>Company</TableHead>
              {steps.map((step, index) => (
                <TableHead key={step.metric.name} className="text-center text-[11px] whitespace-nowrap">
                  {index === 0 ? step.metric.label : `+ ${step.metric.label}`}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.companies.map((company) => (
              <TableRow key={company.symbol}>
                <TableCell className={stickyCell}>
                  <CompanyCell company={company} />
                </TableCell>
                {steps.map((step, index) => {
                  const rank = step.ranks[company.symbol]
                  const previous = index > 0 ? steps[index - 1].ranks[company.symbol] : rank
                  const isFinal = index === steps.length - 1
                  return (
                    <TableCell key={step.metric.name} className="text-center">
                      <div className="inline-flex items-center gap-1">
                        <span
                          className={cn(
                            "font-mono text-xs tabular-nums",
                            isFinal ? "font-semibold text-foreground" : "text-muted-foreground",
                            rank === 1 && "text-emerald-600 dark:text-emerald-400"
                          )}
                        >
                          {rank}
                        </span>
                        {index > 0 && previous !== rank && <RankDelta delta={previous - rank} />}
                      </div>
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TableFrame>
  )
}

function TopTenPivot({ result, weights }: { result: ScorecardResult; weights: Weights }) {
  const active = METRICS.filter((m) => (weights[weightKey(m)] ?? 0) > 0)
  return (
    <TableFrame>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className={cn(stickyCell, "min-w-40")}>Company</TableHead>
              {active.map((metric) => (
                <TableHead key={metric.name} className="text-right text-[11px] whitespace-nowrap">
                  {metric.label}
                </TableHead>
              ))}
              <TableHead className="text-right whitespace-nowrap">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.companies.slice(0, 10).map((company) => (
              <TableRow key={company.symbol}>
                <TableCell className={stickyCell}>
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 font-mono text-xs text-muted-foreground tabular-nums">{company.rank}</span>
                    <CompanyCell company={company} />
                  </div>
                </TableCell>
                {active.map((metric) => {
                  const missing = company.values[metric.name] === null
                  return (
                    <TableCell
                      key={metric.name}
                      className="text-right text-xs tabular-nums"
                      title={`${metric.label}: ${formatMetricValue(company.values[metric.name], metric.unit)}`}
                    >
                      {missing ? (
                        <span className="text-muted-foreground">n/a</span>
                      ) : (
                        formatScore(company.scores[scoreKey(metric)])
                      )}
                    </TableCell>
                  )
                })}
                <TableCell className="text-right text-sm font-semibold tabular-nums">
                  {formatScore(company.totalScore)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TableFrame>
  )
}

function MarketCapBuckets() {
  return (
    <div className="rounded-2xl border border-dashed p-4">
      <p className="text-sm font-medium">Large, mid and small cap buckets aren&apos;t available yet</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Buckets split companies at the 75th and 25th percentile of market cap. Market cap needs a live share
        price, which isn&apos;t in the data yet, so no buckets are shown rather than guessed ones.
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {UNAVAILABLE_METRICS.map((metric) => (
          <span
            key={metric.label}
            title={metric.reason}
            className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
          >
            {metric.label}
          </span>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        These metrics from the original scorecard are left out of every score for the same reason.
      </p>
    </div>
  )
}

function DataGaps({ result }: { result: ScorecardResult }) {
  const unscorable = METRICS.filter((m) => result.metricStats[m.name]?.unscorable)
  if (result.gaps.length === 0 && unscorable.length === 0) {
    return <p className="text-xs text-muted-foreground">Every company has every metric. Nothing was skipped.</p>
  }
  return (
    <div className="flex flex-col gap-3">
      {unscorable.length > 0 && (
        <p className="flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          <AlertTriangleIcon className="mt-px size-3.5 shrink-0" />
          <span>
            Scored 0 for everyone:{" "}
            {unscorable.map((m) => `${m.label} (${result.metricStats[m.name].unscorable?.toLowerCase()})`).join("; ")}.
          </span>
        </p>
      )}
      {result.gaps.length > 0 && (
        <TableFrame>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-44">Company</TableHead>
                <TableHead>Missing, scored as 0</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.gaps.map((gap) => (
                <TableRow key={gap.symbol}>
                  <TableCell>
                    <CompanyCell company={gap} />
                  </TableCell>
                  <TableCell className="text-xs whitespace-normal text-muted-foreground">{gap.missing.join(", ")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableFrame>
      )}
    </div>
  )
}

function AutoComponents({ inputs, sliderRanks }: { inputs: Parameters<typeof scoreCompanies>[0]; sliderRanks: Record<string, number> }) {
  const [open, setOpen] = useState(false)
  const finalRank = useMemo(
    () => scoreCompanies(inputs, AUTO_COMPONENT_METRICS, AUTO_COMPONENT_WEIGHTS),
    [inputs]
  )
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-2xl border bg-card">
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
        <div>
          <p className="text-sm font-medium">Auto-components</p>
          <p className="text-xs text-muted-foreground">
            Same engine, {AUTO_COMPONENT_METRICS.length} metrics with fixed weights instead of sliders
          </p>
        </div>
        <ChevronDownIcon
          className={cn("size-4 text-muted-foreground transition-transform duration-200", open && "rotate-180")}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t px-4 py-4">
        <div className="mb-4 flex flex-wrap gap-1.5">
          {AUTO_COMPONENT_METRICS.map((metric) => (
            <span key={metric.name} className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[11px]">
              {metric.label}
              {metric.direction === "lower" && <TrendingDownIcon className="size-3 text-muted-foreground" />}
              <span className="font-mono text-muted-foreground">×{AUTO_COMPONENT_WEIGHTS[weightKey(metric)]}</span>
            </span>
          ))}
        </div>
        <TableFrame>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">final_rank</TableHead>
                <TableHead>Company</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead className="text-right">Slider rank</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {finalRank.companies.map((company) => (
                <TableRow key={company.symbol}>
                  <TableCell className="font-mono text-sm font-semibold tabular-nums">{company.rank}</TableCell>
                  <TableCell>
                    <CompanyCell company={company} />
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">{formatScore(company.totalScore)}</TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="font-mono text-xs text-muted-foreground tabular-nums">
                        {sliderRanks[company.symbol]}
                      </span>
                      <RankDelta delta={(sliderRanks[company.symbol] ?? company.rank) - company.rank} />
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableFrame>
        <p className="mt-2 text-[11px] text-muted-foreground">
          The arrow shows where each company sits here relative to your slider-weighted ranking. EV/EBITDA is left
          out: it needs a live share price.
        </p>
      </CollapsibleContent>
    </Collapsible>
  )
}

// ---------- Panel ----------

function ScorecardSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
      <Skeleton className="h-[36rem] rounded-2xl" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    </div>
  )
}

export function WeightagePanel({ selection }: { selection: Company[] }) {
  const state = useScorecardData(selection)
  const [weights, setWeights] = useState<Weights>(DEFAULT_WEIGHTS)
  // Live rank change: ranks are compared against the weights as they were
  // before the current adjustment began, so the arrows stay put after the
  // slider is released and reset when the next adjustment starts.
  const [baselineWeights, setBaselineWeights] = useState<Weights>(DEFAULT_WEIGHTS)
  const committedRef = useRef<Weights>(DEFAULT_WEIGHTS)
  const adjustingRef = useRef(false)

  const inputs = useMemo(() => (state.status === "ready" ? state.data.companies : []), [state])
  const result = useMemo(() => scoreCompanies(inputs, METRICS, weights), [inputs, weights])
  const baseline = useMemo(() => scoreCompanies(inputs, METRICS, baselineWeights), [inputs, baselineWeights])

  const currentRanks = ranksBySymbol(result)
  const baselineRanks = ranksBySymbol(baseline)
  const deltas = Object.fromEntries(
    result.companies.map((c) => [c.symbol, (baselineRanks[c.symbol] ?? c.rank) - c.rank])
  )
  const moved = result.companies.filter((c) => deltas[c.symbol] !== 0).length

  function handleChange(key: string, value: number) {
    if (!adjustingRef.current) {
      adjustingRef.current = true
      setBaselineWeights(committedRef.current)
    }
    setWeights((current) => {
      const next = { ...current, [key]: value }
      committedRef.current = next
      return next
    })
  }

  function handleCommit() {
    adjustingRef.current = false
  }

  function handleReset() {
    setBaselineWeights(weights)
    setWeights(DEFAULT_WEIGHTS)
    committedRef.current = DEFAULT_WEIGHTS
    adjustingRef.current = false
  }

  if (state.status === "loading") return <ScorecardSkeleton />
  if (state.status === "error") {
    return <EmptyPanel icon={AlertTriangleIcon} title="Couldn't load financials" description={state.message} />
  }

  const { asOf } = state.data
  const industries = Array.from(new Set(result.companies.map((c) => c.industry)))
  const asOfLabel = [
    asOf.year && `${fiscalYearLabel(asOf.year)} annual`,
    asOf.quarter && `${fiscalQuarterLabel(asOf.quarter)} quarterly`,
  ]
    .filter(Boolean)
    .join(", ")

  return (
    <div
      className={cn(
        "grid gap-6 transition-opacity duration-300 xl:grid-cols-[18rem_minmax(0,1fr)]",
        state.isRefreshing && "opacity-70"
      )}
    >
      <aside className="xl:sticky xl:top-4 xl:self-start">
        <WeightControls weights={weights} onChange={handleChange} onCommit={handleCommit} onReset={handleReset} />
      </aside>

      <div className="flex min-w-0 flex-col gap-8">
        <p className="text-xs text-muted-foreground">
          Scoring <span className="font-medium text-foreground">{result.companies.length} stocks</span> against the
          average of this set{asOfLabel && <> using {asOfLabel} figures</>}. Each metric scores (value ÷ average) ×
          weight, inverted for lower-is-better metrics.
        </p>

        {industries.length > 1 && (
          <p className="flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
            <AlertTriangleIcon className="mt-px size-3.5 shrink-0" />
            <span>
              This set mixes {industries.length} industries ({industries.join(", ")}), so the averages blend
              businesses that report very differently. Bank-only metrics like NPA score 0 for everyone else.
            </span>
          </p>
        )}

        <div className="grid gap-6 2xl:grid-cols-2">
          <Section
            title="Top 5 Companies"
            sub={moved > 0 ? `${moved} rank ${moved === 1 ? "change" : "changes"} from your last adjustment` : "Arrows show rank changes as you adjust weights"}
          >
            <TopFiveTable result={result} deltas={deltas} />
          </Section>
          <Section title="Ranking" sub="All companies by total score">
            <TotalScoreChart companies={result.companies} />
          </Section>
        </div>

        <Section title="Rank after each metric" sub="How the ranking builds as each weighted metric is added, in order">
          <RankProgressionTable result={result} weights={weights} />
        </Section>

        <Section title="Top 10 score breakdown" sub="Weighted score per metric. Hover a cell for the raw value.">
          <TopTenPivot result={result} weights={weights} />
        </Section>

        <Section title="Metric by metric" sub="Raw values, best reading on top">
          <div className="grid gap-4 lg:grid-cols-2">
            {METRICS.map((metric) => (
              <MetricBarChart key={metric.name} metric={metric} companies={result.companies} />
            ))}
          </div>
        </Section>

        <Section title="Best by market cap">
          <MarketCapBuckets />
        </Section>

        <Section title="Data gaps" sub="Missing figures are reported here, never silently dropped">
          <DataGaps result={result} />
        </Section>

        <AutoComponents inputs={inputs} sliderRanks={currentRanks} />

        <p className="border-t pt-4 text-[11px] text-muted-foreground">
          Scores compare reported filing figures across the stocks you selected. They describe past results and
          are not investment advice or a recommendation to buy or sell.
        </p>
      </div>
    </div>
  )
}
