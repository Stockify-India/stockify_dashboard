"use client"

import { useMemo, useState } from "react"
import {
  BriefcaseBusinessIcon,
  PlusIcon,
  RefreshCwIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { cn } from "cn"

import { Reveal } from "@/components/market/reveal"
import { HoldingSheet } from "@/components/portfolio/holding-sheet"
import { HoldingsTable } from "@/components/portfolio/holdings-table"
import {
  AllocationPanel,
  PortfolioSummary,
} from "@/components/portfolio/portfolio-summary"
import { usePortfolio } from "@/components/portfolio/use-portfolio"
import { useQuotes } from "@/components/portfolio/use-quotes"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { buildPosition, summarize, type Holding } from "@/lib/portfolio"

function formatUpdated(timestamp: number | null) {
  if (!timestamp) return "Not updated yet"
  return `Simulated prices, updated ${new Date(timestamp).toLocaleTimeString(
    "en-IN",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  )}`
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed px-6 py-16 text-center">
      <span className="flex size-11 items-center justify-center rounded-xl bg-muted">
        <BriefcaseBusinessIcon className="size-5 text-muted-foreground" />
      </span>
      <div className="flex max-w-sm flex-col gap-1.5">
        <h2 className="text-base font-medium">Your portfolio is empty</h2>
        <p className="text-sm text-muted-foreground">
          Add the stocks you own with the quantity and your buy price. Profit,
          loss, and the change since the previous close are worked out from live
          prices.
        </p>
      </div>
      <Button onClick={onAdd}>
        <PlusIcon />
        Add your first stock
      </Button>
    </div>
  )
}

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden>
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Skeleton className="h-44 rounded-2xl" />
        <Skeleton className="h-44 rounded-2xl" />
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  )
}

export function PortfolioView() {
  const { holdings, isReady, upsert, remove } = usePortfolio()
  const symbols = useMemo(() => holdings.map((h) => h.symbol), [holdings])
  const { quotes, failed, error, updatedAt, isFetching, hasSymbols, refresh } =
    useQuotes(symbols)

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Holding | null>(null)

  const positions = useMemo(
    () => holdings.map((h) => buildPosition(h, quotes[h.symbol] ?? null)),
    [holdings, quotes]
  )
  const totals = useMemo(() => summarize(positions), [positions])
  const waitingForPrices = isFetching && totals.priced === 0 && !error

  function openAdd() {
    setEditing(null)
    setSheetOpen(true)
  }

  function openEdit(holding: Holding) {
    setEditing(holding)
    setSheetOpen(true)
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-lg font-semibold tracking-tight">
            Your holdings
          </h2>
          <p className="text-xs text-muted-foreground">
            {hasSymbols
              ? formatUpdated(updatedAt)
              : "Stored in this browser only"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasSymbols && (
            <Button variant="outline" onClick={refresh} disabled={isFetching}>
              <RefreshCwIcon
                className={cn(
                  isFetching && "animate-spin motion-reduce:animate-none"
                )}
              />
              Refresh prices
            </Button>
          )}
          <Button onClick={openAdd}>
            <PlusIcon />
            Add stock
          </Button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm"
        >
          <TriangleAlertIcon className="size-4 shrink-0 text-destructive" />
          <span className="flex-1">
            Live prices could not be loaded. Your holdings are safe.
          </span>
          <Button size="sm" variant="outline" onClick={refresh}>
            Try again
          </Button>
        </div>
      )}

      {!isReady ? (
        <PageSkeleton />
      ) : holdings.length === 0 ? (
        <Reveal index={0}>
          <EmptyState onAdd={openAdd} />
        </Reveal>
      ) : (
        <div className="flex flex-col gap-4 md:gap-6">
          <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
            <Reveal index={0} className="min-w-0 *:h-full">
              <PortfolioSummary totals={totals} loading={waitingForPrices} />
            </Reveal>
            <Reveal index={1} className="min-w-0 *:h-full">
              <AllocationPanel positions={positions} />
            </Reveal>
          </div>
          <Reveal index={2}>
            <HoldingsTable
              positions={positions}
              loading={isFetching}
              failed={failed}
              onEdit={openEdit}
              onRemove={remove}
            />
          </Reveal>
        </div>
      )}

      <HoldingSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        editing={editing}
        holdings={holdings}
        onSave={upsert}
      />
    </div>
  )
}
