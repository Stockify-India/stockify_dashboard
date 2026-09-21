"use client"

import { cn } from "cn"

import { Skeleton } from "@/components/ui/skeleton"

const STAGGER_ITEM =
  "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 fill-mode-backwards duration-300"

function staggerDelay(index: number) {
  return { animationDelay: `${index * 40}ms` }
}

// Widths only, standing in for the real tab labels (Overview, Chart,
// Analysis, Peers, ...) before any company has loaded.
const TAB_WIDTHS = [
  "w-16",
  "w-12",
  "w-14",
  "w-12",
  "w-16",
  "w-20",
  "w-24",
  "w-14",
  "w-16",
] as const

/**
 * What a visitor sees while the company list is still loading, before the
 * real CompanyAnalysisTabs can render. Rehearses the exact shape the real
 * page settles into (identity row, tab row, metric bento, chart card) so
 * nothing jumps once data lands, cascading in with the same 40ms-per-row
 * stagger the statement table uses for "new data arrived."
 *
 * The one moving element is the sweep bar under the tab row - the same
 * signal company-tab-nav's `isRefreshing` cue uses for "a real fetch is
 * in flight." A cold boot is that same fact, so it earns the same cue
 * rather than a second one (the One Signal Rule: this sweep means
 * confirmed/live and nothing else).
 */
export function AnalysisBootGraphic() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b bg-background px-4 py-3.5 lg:px-6">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2.5 gap-y-1">
          <Skeleton className="h-5 w-40 rounded" />
          <Skeleton className="h-4 w-14 rounded-md" />
          <Skeleton className="h-3.5 w-24 rounded" />
        </div>
      </div>

      <div className="relative border-b bg-muted/30">
        <div className="flex items-center gap-4 overflow-hidden px-4 py-3.5 lg:px-6">
          {TAB_WIDTHS.map((width, i) => (
            <Skeleton key={i} className={cn("h-4 shrink-0 rounded-full", width)} />
          ))}
        </div>
        <div
          aria-hidden
          className="absolute inset-x-0 -bottom-px h-0.5 overflow-hidden bg-foreground/10"
        >
          <div className="h-full w-1/3 bg-foreground motion-safe:animate-[refresh-sweep_1.1s_ease-in-out_infinite]" />
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 py-6 lg:px-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:[grid-auto-flow:dense]">
          <div
            className={cn(
              "col-span-2 row-span-2 flex flex-col justify-between gap-3 rounded-2xl bg-foreground/[0.03] px-5 py-4 dark:bg-foreground/[0.06]",
              STAGGER_ITEM
            )}
            style={staggerDelay(0)}
          >
            <Skeleton className="h-3 w-20 rounded bg-foreground/10" />
            <Skeleton className="h-7 w-28 rounded bg-foreground/10" />
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={cn("flex flex-col gap-2 rounded-2xl border bg-card px-4 py-3.5", STAGGER_ITEM)}
              style={staggerDelay(i)}
            >
              <Skeleton className="h-2.5 w-14 rounded" />
              <Skeleton className="h-4 w-16 rounded" />
            </div>
          ))}
        </div>

        <div className={cn("rounded-2xl border bg-card p-4", STAGGER_ITEM)} style={staggerDelay(5)}>
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="mt-4 h-56 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}
