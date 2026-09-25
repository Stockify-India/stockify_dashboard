"use client"

import { useMemo } from "react"
import { PlusIcon, SearchIcon } from "lucide-react"
import { cn } from "cn"

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from "@/components/ui/combobox"
import { useCompany } from "@/components/company-context"
import type { Company } from "@/lib/companies"

export const MAX_COMPARE = 6
const SUGGESTION_COUNT = 4

function matchesQuery(company: Company, query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return company.name.toLowerCase().includes(q) || company.symbol.toLowerCase().includes(q)
}

function Monogram({ symbol }: { symbol: string }) {
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted font-mono text-[11px] font-semibold text-foreground">
      {symbol.slice(0, 2)}
    </span>
  )
}

export function StockPicker({
  value,
  onChange,
  max = MAX_COMPARE,
}: {
  value: Company[]
  onChange: (companies: Company[]) => void
  max?: number
}) {
  const { companies, isLoading, error } = useCompany()
  const anchor = useComboboxAnchor()
  const isFull = value.length >= max
  const selectedSymbols = useMemo(() => new Set(value.map((c) => c.symbol)), [value])

  // Industry peers of the most recently added stock, so a first pick can be
  // turned into a real comparison set in one or two clicks.
  const anchorCompany = value.at(-1)
  const industryPeers = useMemo(() => {
    if (!anchorCompany || isFull) return []
    return companies.filter(
      (c) => c.industry === anchorCompany.industry && !selectedSymbols.has(c.symbol)
    )
  }, [anchorCompany, companies, isFull, selectedSymbols])
  const suggestions = industryPeers.slice(0, SUGGESTION_COUNT)
  const addable = industryPeers.slice(0, max - value.length)

  const placeholder = error
    ? "Couldn't load companies"
    : isLoading
      ? "Loading companies…"
      : isFull
        ? `Limit of ${max} reached`
        : value.length === 0
          ? "Search stocks by name or NSE symbol"
          : "Add another stock"

  return (
    <div className="flex flex-col gap-2">
      <Combobox
        multiple
        items={companies}
        value={value}
        onValueChange={(next: Company[], details) => {
          // Base UI clears the whole value on Escape; for a comparison
          // basket that's a destructive surprise, so Escape only closes.
          if (details.reason === "escape-key") return
          onChange(next.slice(0, max))
        }}
        itemToStringLabel={(company: Company) => company.name}
        isItemEqualToValue={(a: Company, b: Company) => a.symbol === b.symbol}
        filter={(company: Company, query: string) => matchesQuery(company, query)}
        limit={50}
        autoHighlight
        disabled={isLoading || Boolean(error)}
      >
        <ComboboxChips
          ref={anchor}
          className={cn(
            "min-h-11 gap-1.5 rounded-xl bg-card py-1.5 pr-3 pl-3 shadow-none focus-within:ring-2 focus-within:ring-ring/30",
            "has-data-[slot=combobox-chip]:pl-3"
          )}
        >
          <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
          {value.map((company) => (
            <ComboboxChip
              key={company.symbol}
              className="h-7 gap-1.5 rounded-md pl-2 text-xs animate-in duration-150 fade-in-0 zoom-in-95 motion-reduce:animate-none"
            >
              <span className="font-mono font-semibold tracking-wide">{company.symbol}</span>
              <span className="hidden max-w-36 truncate font-normal text-muted-foreground md:inline">
                {company.name}
              </span>
            </ComboboxChip>
          ))}
          <ComboboxChipsInput
            placeholder={placeholder}
            disabled={isFull}
            aria-label="Search stocks to compare"
            className="h-7 min-w-40 bg-transparent text-sm placeholder:text-muted-foreground disabled:cursor-not-allowed"
          />
          <span
            className={cn(
              "ml-auto shrink-0 pl-2 font-mono text-[11px] tabular-nums transition-colors",
              isFull ? "text-foreground" : "text-muted-foreground"
            )}
            aria-label={`${value.length} of ${max} stocks selected`}
          >
            {value.length}/{max}
          </span>
        </ComboboxChips>

        <ComboboxContent anchor={anchor} className="rounded-xl">
          <ComboboxEmpty className="py-6">No stocks match that search.</ComboboxEmpty>
          <ComboboxList className="max-h-80">
            {(company: Company) => (
              <ComboboxItem
                key={company.symbol}
                value={company}
                disabled={isFull && !selectedSymbols.has(company.symbol)}
                className="gap-2.5 rounded-lg py-1.5 pl-1.5"
              >
                <Monogram symbol={company.symbol} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">{company.name}</span>
                  <span className="truncate font-mono text-[11px] text-muted-foreground">
                    {company.symbol}
                  </span>
                </span>
                <span className="hidden max-w-40 shrink-0 truncate text-[11px] text-muted-foreground sm:block">
                  {company.industry}
                </span>
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>

      {(suggestions.length > 0 || value.length > 0) && (
        <div className="flex min-h-7 flex-wrap items-center gap-x-1.5 gap-y-1 text-xs">
          {suggestions.length > 0 && (
            <>
              <span className="mr-0.5 text-muted-foreground">
                Same industry as{" "}
                <span className="font-mono font-semibold text-foreground">
                  {anchorCompany?.symbol}
                </span>
              </span>
              {suggestions.map((company) => (
                <button
                  key={company.symbol}
                  type="button"
                  title={company.name}
                  onClick={() => onChange([...value, company])}
                  className="inline-flex h-6 items-center gap-1 rounded-md border border-dashed px-1.5 font-mono text-[11px] font-medium text-muted-foreground transition-colors hover:border-solid hover:bg-muted hover:text-foreground active:translate-y-px"
                >
                  <PlusIcon className="size-3" />
                  {company.symbol}
                </button>
              ))}
              {industryPeers.length > 1 && (
                <button
                  type="button"
                  onClick={() => onChange([...value, ...addable])}
                  className="inline-flex h-6 items-center rounded-md px-1.5 font-medium text-foreground underline-offset-4 transition-colors hover:bg-muted active:translate-y-px"
                >
                  Add all {addable.length}
                </button>
              )}
            </>
          )}
          {value.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="ml-auto rounded-md px-1.5 py-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  )
}
