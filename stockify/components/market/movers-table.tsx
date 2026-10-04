"use client"

import { cn } from "cn"

import type { Mover } from "@/components/market/use-market"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TrendingDownIcon, TrendingUpIcon } from "lucide-react"

import { formatMoney, formatSignedPercent, pillClass } from "@/lib/portfolio"

function MoversList({
  title,
  direction,
  movers,
  loading,
}: {
  title: string
  direction: "up" | "down"
  movers: Mover[]
  loading: boolean
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <h3 className="flex items-center gap-2 text-sm font-medium">
        <span
          className={cn(
            "flex size-6 items-center justify-center rounded-md border",
            pillClass(direction === "up" ? 1 : -1)
          )}
        >
          {direction === "up" ? (
            <TrendingUpIcon className="size-3.5" />
          ) : (
            <TrendingDownIcon className="size-3.5" />
          )}
        </span>
        {title}
      </h3>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-xs font-medium text-muted-foreground">
              Stock
            </TableHead>
            <TableHead className="text-right text-xs font-medium text-muted-foreground">
              Price
            </TableHead>
            <TableHead className="text-right text-xs font-medium text-muted-foreground">
              Change
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading
            ? Array.from({ length: 8 }, (_, i) => (
                <TableRow key={i} className="hover:bg-transparent">
                  <TableCell>
                    <Skeleton className="h-8 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="ml-auto h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="ml-auto h-4 w-14" />
                  </TableCell>
                </TableRow>
              ))
            : movers.map((m) => (
                <TableRow key={m.symbol}>
                  <TableCell className="max-w-0 py-2">
                    <div className="flex min-w-0 flex-col">
                      <span className="font-mono text-sm font-semibold">
                        {m.symbol}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {m.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(m.price)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={cn(
                        "inline-block min-w-16 rounded-md border px-1.5 py-0.5 text-center text-xs font-medium tabular-nums",
                        pillClass(m.changePct)
                      )}
                    >
                      {formatSignedPercent(m.changePct)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function MoversTable({
  gainers,
  losers,
  loading,
  error,
}: {
  gainers: Mover[]
  losers: Mover[]
  loading: boolean
  error: string | null
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top movers</CardTitle>
        <CardDescription>
          Nifty 50 stocks ranked by change from previous close.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <p role="alert" className="py-8 text-center text-sm text-destructive">
            Couldn&apos;t load the company list. Refresh the page to try again.
          </p>
        ) : (
          <div className="grid gap-6 @3xl/main:grid-cols-2 @3xl/main:gap-8">
            <MoversList
              title="Top gainers"
              direction="up"
              movers={gainers}
              loading={loading}
            />
            <MoversList
              title="Top losers"
              direction="down"
              movers={losers}
              loading={loading}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
