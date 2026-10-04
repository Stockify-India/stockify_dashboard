"use client"

import { useMemo, useState } from "react"
import { ArrowUpIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  formatMoney,
  formatSignedPercent,
  formatSignedRupee,
  toneClass,
  type Position,
} from "@/lib/portfolio"

type SortKey = "symbol" | "dayChangePct" | "invested" | "value" | "pnl"

const SORTABLE: Record<SortKey, (p: Position) => number | string | null> = {
  symbol: (p) => p.symbol,
  dayChangePct: (p) => p.dayChangePct,
  invested: (p) => p.invested,
  value: (p) => p.value,
  pnl: (p) => p.pnl,
}

function SortHead({
  label,
  sortKey,
  active,
  direction,
  onSort,
  align = "right",
}: {
  label: string
  sortKey: SortKey
  active: SortKey
  direction: "asc" | "desc"
  onSort: (key: SortKey) => void
  align?: "left" | "right"
}) {
  const isActive = active === sortKey
  return (
    <TableHead
      className={align === "right" ? "text-right" : undefined}
      aria-sort={
        isActive ? (direction === "asc" ? "ascending" : "descending") : "none"
      }
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-xs font-medium transition-colors hover:text-foreground",
          align === "right" && "flex-row-reverse",
          isActive ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {label}
        <ArrowUpIcon
          className={cn(
            "size-3 transition-[opacity,transform] duration-150 ease-out motion-reduce:transition-none",
            isActive ? "opacity-100" : "opacity-0",
            direction === "desc" && "rotate-180"
          )}
        />
      </button>
    </TableHead>
  )
}

export function HoldingsTable({
  positions,
  loading,
  failed,
  onEdit,
  onRemove,
}: {
  positions: Position[]
  loading: boolean
  failed: string[]
  onEdit: (position: Position) => void
  onRemove: (id: string) => void
}) {
  const [sortKey, setSortKey] = useState<SortKey>("value")
  const [direction, setDirection] = useState<"asc" | "desc">("desc")
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  // Rows present on first render stay still; only rows added later enter.
  const [initialIds] = useState(() => new Set(positions.map((p) => p.id)))

  function handleRemove(id: string) {
    setConfirmingId(null)
    setRemovingId(id)
    window.setTimeout(() => {
      onRemove(id)
      setRemovingId(null)
    }, 160)
  }

  const sorted = useMemo(() => {
    const pick = SORTABLE[sortKey]
    const factor = direction === "asc" ? 1 : -1
    return [...positions].sort((a, b) => {
      const av = pick(a)
      const bv = pick(b)
      // Unpriced rows always sink to the bottom regardless of direction.
      if (av === null && bv === null) return 0
      if (av === null) return 1
      if (bv === null) return -1
      if (typeof av === "string" && typeof bv === "string")
        return av.localeCompare(bv) * factor
      return ((av as number) - (bv as number)) * factor
    })
  }, [positions, sortKey, direction])

  function handleSort(key: SortKey) {
    if (key === sortKey) setDirection((d) => (d === "asc" ? "desc" : "asc"))
    else {
      setSortKey(key)
      setDirection(key === "symbol" ? "asc" : "desc")
    }
  }

  const sortProps = { active: sortKey, direction, onSort: handleSort }

  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <Table className="min-w-[920px]">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <SortHead
              label="Stock"
              sortKey="symbol"
              align="left"
              {...sortProps}
            />
            <TableHead className="text-right text-xs font-medium text-muted-foreground">
              Qty
            </TableHead>
            <TableHead className="text-right text-xs font-medium text-muted-foreground">
              Avg cost
            </TableHead>
            <TableHead className="text-right text-xs font-medium text-muted-foreground">
              Last price
            </TableHead>
            <SortHead label="Today" sortKey="dayChangePct" {...sortProps} />
            <SortHead label="Invested" sortKey="invested" {...sortProps} />
            <SortHead label="Value" sortKey="value" {...sortProps} />
            <SortHead label="Profit and loss" sortKey="pnl" {...sortProps} />
            <TableHead className="w-20">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((p) => {
            const waiting = loading && !p.quote && !failed.includes(p.symbol)
            const unavailable = !p.quote && !waiting
            const confirming = confirmingId === p.id
            const isNew = !initialIds.has(p.id)
            return (
              <TableRow
                key={p.id}
                style={
                  isNew
                    ? {
                        animationTimingFunction:
                          "cubic-bezier(0.23, 1, 0.32, 1)",
                      }
                    : undefined
                }
                className={cn(
                  "group",
                  isNew &&
                    "animate-in duration-300 fade-in-0 slide-in-from-top-1 motion-reduce:animate-none",
                  removingId === p.id &&
                    "pointer-events-none opacity-0 transition-opacity duration-150 ease-out"
                )}
              >
                <TableCell className="py-3 pl-4">
                  <div className="flex flex-col">
                    <span className="font-mono text-sm font-semibold">
                      {p.symbol}
                    </span>
                    <span className="max-w-48 truncate text-xs text-muted-foreground">
                      {p.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {p.quantity.toLocaleString("en-IN")}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(p.avgPrice)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {waiting ? (
                    <Skeleton className="ml-auto h-4 w-16" />
                  ) : unavailable ? (
                    <span className="text-xs text-muted-foreground">
                      No price
                    </span>
                  ) : (
                    formatMoney(p.quote!.price)
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {waiting ? (
                    <Skeleton className="ml-auto h-4 w-20" />
                  ) : (
                    <div
                      className={cn("flex flex-col", toneClass(p.dayChange))}
                    >
                      <span className="text-sm font-medium">
                        {formatSignedPercent(p.dayChangePct)}
                      </span>
                      <span className="text-xs">
                        {formatSignedRupee(p.dayChange)}
                      </span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(p.invested)}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {waiting ? (
                    <Skeleton className="ml-auto h-4 w-20" />
                  ) : (
                    formatMoney(p.value)
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {waiting ? (
                    <Skeleton className="ml-auto h-4 w-24" />
                  ) : (
                    <div className={cn("flex flex-col", toneClass(p.pnl))}>
                      <span className="text-sm font-medium">
                        {formatSignedRupee(p.pnl)}
                      </span>
                      <span className="text-xs">
                        {formatSignedPercent(p.pnlPct)}
                      </span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="pr-3">
                  <div className="flex justify-end gap-1">
                    {confirming ? (
                      <Button
                        size="xs"
                        variant="destructive"
                        autoFocus
                        className="animate-in duration-150 fade-in-0 zoom-in-95 motion-reduce:animate-none"
                        onClick={() => handleRemove(p.id)}
                        onBlur={() => setConfirmingId(null)}
                      >
                        Remove
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label={`Edit ${p.symbol}`}
                          onClick={() => onEdit(p)}
                        >
                          <PencilIcon />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label={`Remove ${p.symbol}`}
                          onClick={() => setConfirmingId(p.id)}
                        >
                          <Trash2Icon />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
