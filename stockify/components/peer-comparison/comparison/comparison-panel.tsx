"use client"

import { AlertTriangleIcon } from "lucide-react"
import { cn } from "cn"

import { Skeleton } from "@/components/ui/skeleton"
import { EmptyPanel } from "@/components/company-analysis/company-tab-nav"
import { useComparisonData } from "@/components/peer-comparison/comparison/use-comparison-data"
import {
  COMPANY_PALETTE,
  LatestSnapshotChart,
  MarginTrendChart,
  NetProfitTrendChart,
  ProfitGrowthChart,
  QuarterlyRevenueTrendChart,
  RevenueGrowthChart,
  RevenueTrendChart,
  RoceTrendComparisonChart,
  latestAnnual,
} from "@/components/peer-comparison/comparison/comparison-charts"
import type { ComparisonCompany } from "@/lib/comparison/data"
import type { Company } from "@/lib/companies"

function ComparisonSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-10 rounded-xl" />
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}

function CompanyLegend({ companies }: { companies: ComparisonCompany[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 rounded-xl border bg-muted/30 px-3.5 py-2.5">
      {companies.map((company, index) => (
        <span key={company.symbol} className="inline-flex min-w-0 items-center gap-1.5 text-xs">
          <span
            aria-hidden
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: COMPANY_PALETTE[index % COMPANY_PALETTE.length] }}
          />
          <span className="font-mono font-semibold">{company.symbol}</span>
          <span className="max-w-40 truncate text-muted-foreground">{company.name}</span>
        </span>
      ))}
    </div>
  )
}

export function ComparisonChartsPanel({ selection }: { selection: Company[] }) {
  const state = useComparisonData(selection)

  if (state.status === "loading") return <ComparisonSkeleton />
  if (state.status === "error") {
    return <EmptyPanel icon={AlertTriangleIcon} title="Couldn't load financials" description={state.message} />
  }

  const { companies } = state.data
  const hasAnyData = companies.some((c) => c.annual.length > 0 || c.quarterly.length > 0)

  if (!hasAnyData) {
    return (
      <EmptyPanel
        icon={AlertTriangleIcon}
        title="No financials available"
        description="None of the selected stocks have annual or quarterly figures extracted yet."
      />
    )
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-6 transition-opacity duration-300",
        state.isRefreshing && "opacity-70"
      )}
    >
      <CompanyLegend companies={companies} />

      <div className="grid gap-4 lg:grid-cols-2">
        <RevenueTrendChart companies={companies} />
        <NetProfitTrendChart companies={companies} />
        <RevenueGrowthChart companies={companies} />
        <ProfitGrowthChart companies={companies} />
        <MarginTrendChart companies={companies} />
        <RoceTrendComparisonChart companies={companies} />
      </div>

      <QuarterlyRevenueTrendChart companies={companies} />

      <div className="grid gap-4 lg:grid-cols-2">
        <LatestSnapshotChart
          title="Revenue, latest year"
          sub="₹ Cr, most recent reported annual figures"
          companies={companies}
          value={(c) => latestAnnual(c)?.sales ?? null}
          format="crore"
        />
        <LatestSnapshotChart
          title="Net profit, latest year"
          sub="₹ Cr, most recent reported annual figures"
          companies={companies}
          value={(c) => latestAnnual(c)?.net_profit ?? null}
          format="crore"
        />
        <LatestSnapshotChart
          title="ROCE, latest year"
          sub="% return on capital employed"
          companies={companies}
          value={(c) => latestAnnual(c)?.roce_pct ?? null}
          format="percent"
        />
        <LatestSnapshotChart
          title="EPS, latest year"
          sub="₹ per share"
          companies={companies}
          value={(c) => latestAnnual(c)?.eps ?? null}
          format="rupee"
        />
      </div>

      <p className="border-t pt-4 text-[11px] text-muted-foreground">
        Figures compare reported filing data across the stocks you selected. A missing year or quarter for a
        company simply breaks its line rather than being guessed. Past results only, not investment advice.
      </p>
    </div>
  )
}
