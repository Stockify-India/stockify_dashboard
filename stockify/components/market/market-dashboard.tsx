"use client"

import { useState } from "react"
import { MotionConfig } from "framer-motion"

import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { IndexHeatmap } from "@/components/market/index-heatmap"
import { Reveal } from "@/components/market/reveal"
import { MoversTable } from "@/components/market/movers-table"
import { useMarket } from "@/components/market/use-market"
import { SectionCards } from "@/components/section-cards"
import type { IndexId } from "@/lib/market"

export function MarketDashboard() {
  const [selected, setSelected] = useState<IndexId>("nifty50")
  const { byId, updatedAt, gainers, losers, stocksLoading, stocksError } =
    useMarket()

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <Reveal index={0} className="flex items-center gap-2 px-4 lg:px-6">
          <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
            Simulated data
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {updatedAt
              ? `Updated ${new Date(updatedAt).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}`
              : "Loading"}
          </span>
        </Reveal>

        <SectionCards byId={byId} selected={selected} onSelect={setSelected} />

        <div className="grid gap-4 px-4 lg:px-6 @5xl/main:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Reveal index={5} className="min-w-0">
            <ChartAreaInteractive
              quote={byId.get(selected)}
              selected={selected}
              onSelect={setSelected}
            />
          </Reveal>
          <Reveal index={6} className="flex min-w-0 flex-col *:flex-1">
            <IndexHeatmap
              byId={byId}
              selected={selected}
              onSelect={setSelected}
            />
          </Reveal>
        </div>

        <Reveal index={7} className="px-4 lg:px-6">
          <MoversTable
            gainers={gainers}
            losers={losers}
            loading={stocksLoading}
            error={stocksError}
          />
        </Reveal>
      </div>
    </MotionConfig>
  )
}
