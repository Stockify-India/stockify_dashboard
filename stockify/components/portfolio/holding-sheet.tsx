"use client"

import { useState } from "react"

import { useCompany } from "@/components/company-context"
import { Button } from "@/components/ui/button"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { Company } from "@/lib/companies"
import { formatMoney, mergeBuy, type Holding } from "@/lib/portfolio"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  // When set, the sheet edits this holding instead of adding a new one.
  editing: Holding | null
  holdings: Holding[]
  onSave: (holding: Holding) => void
}

function matches(company: Company, query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    company.name.toLowerCase().includes(q) ||
    company.symbol.toLowerCase().includes(q)
  )
}

function HoldingForm({
  editing,
  holdings,
  onSave,
  onDone,
}: Pick<Props, "editing" | "holdings" | "onSave"> & { onDone: () => void }) {
  const { companies, isLoading, error: companiesError } = useCompany()
  const [company, setCompany] = useState<Company | null>(null)
  const [quantity, setQuantity] = useState(
    editing ? String(editing.quantity) : ""
  )
  const [price, setPrice] = useState(editing ? String(editing.avgPrice) : "")
  const [submitted, setSubmitted] = useState(false)

  const qty = Number(quantity)
  const buyPrice = Number(price)
  const symbol = editing?.symbol ?? company?.symbol ?? null
  const existing = editing
    ? null
    : (holdings.find((h) => h.symbol === symbol) ?? null)

  const errors = {
    stock: !symbol ? "Choose a stock from the list." : null,
    quantity:
      !Number.isInteger(qty) || qty < 1
        ? "Enter a whole number of shares, 1 or more."
        : null,
    price:
      !Number.isFinite(buyPrice) || buyPrice <= 0
        ? "Enter a price greater than 0."
        : null,
  }
  const hasErrors = Boolean(errors.stock || errors.quantity || errors.price)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitted(true)
    if (hasErrors) return

    if (editing) {
      onSave({ ...editing, quantity: qty, avgPrice: buyPrice })
    } else if (existing) {
      onSave(mergeBuy(existing, qty, buyPrice))
    } else if (company) {
      onSave({
        id: crypto.randomUUID(),
        symbol: company.symbol,
        name: company.name,
        industry: company.industry,
        quantity: qty,
        avgPrice: buyPrice,
      })
    }
    onDone()
  }

  const blended =
    existing && !errors.quantity && !errors.price
      ? mergeBuy(existing, qty, buyPrice)
      : null

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col" noValidate>
      <div className="flex flex-col gap-5 px-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="holding-stock">Stock</Label>
          {editing ? (
            <div className="flex h-9 items-center gap-2 rounded-lg border bg-muted/40 px-3 text-sm">
              <span className="font-mono font-semibold">{editing.symbol}</span>
              <span className="truncate text-muted-foreground">
                {editing.name}
              </span>
            </div>
          ) : (
            <Combobox
              items={companies}
              value={company}
              onValueChange={(next: Company | null) => setCompany(next)}
              itemToStringLabel={(c: Company) => `${c.symbol} - ${c.name}`}
              isItemEqualToValue={(a: Company, b: Company) =>
                a.symbol === b.symbol
              }
              filter={(c: Company, query: string) => matches(c, query)}
              limit={50}
              autoHighlight
              disabled={isLoading || Boolean(companiesError)}
            >
              <ComboboxInput
                id="holding-stock"
                placeholder={
                  companiesError
                    ? "Couldn't load companies"
                    : isLoading
                      ? "Loading companies..."
                      : "Search by name or NSE symbol"
                }
                aria-invalid={submitted && Boolean(errors.stock)}
              />
              <ComboboxContent>
                <ComboboxEmpty className="py-6">
                  No stocks match that search.
                </ComboboxEmpty>
                <ComboboxList className="max-h-72">
                  {(c: Company) => (
                    <ComboboxItem
                      key={c.symbol}
                      value={c}
                      className="gap-2.5 py-1.5"
                    >
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium">
                          {c.name}
                        </span>
                        <span className="truncate font-mono text-[11px] text-muted-foreground">
                          {c.symbol}
                        </span>
                      </span>
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          )}
          {submitted && errors.stock && (
            <p className="text-xs text-destructive">{errors.stock}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="holding-qty">
              {editing ? "Shares held" : "Shares bought"}
            </Label>
            <Input
              id="holding-qty"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              aria-invalid={submitted && Boolean(errors.quantity)}
              className="tabular-nums"
            />
            {submitted && errors.quantity && (
              <p className="text-xs text-destructive">{errors.quantity}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="holding-price">
              {editing ? "Average cost (₹)" : "Buy price (₹)"}
            </Label>
            <Input
              id="holding-price"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              aria-invalid={submitted && Boolean(errors.price)}
              className="tabular-nums"
            />
            {submitted && errors.price && (
              <p className="text-xs text-destructive">{errors.price}</p>
            )}
          </div>
        </div>

        {existing && (
          <p className="rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            You already hold {existing.quantity} shares of{" "}
            <span className="font-mono font-semibold text-foreground">
              {existing.symbol}
            </span>{" "}
            at {formatMoney(existing.avgPrice)}. This buy is added to that
            position
            {blended ? (
              <>
                , making it {blended.quantity} shares at an average of{" "}
                <span className="font-medium text-foreground">
                  {formatMoney(blended.avgPrice)}
                </span>
              </>
            ) : null}
            .
          </p>
        )}
      </div>

      <SheetFooter className="mt-auto flex-row justify-end gap-2 border-t">
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit">
          {editing
            ? "Save changes"
            : existing
              ? "Add to position"
              : "Add stock"}
        </Button>
      </SheetFooter>
    </form>
  )
}

export function HoldingSheet({
  open,
  onOpenChange,
  editing,
  holdings,
  onSave,
}: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            {editing ? `Edit ${editing.symbol}` : "Add a stock"}
          </SheetTitle>
          <SheetDescription>
            {editing
              ? "Correct the share count or your average cost."
              : "Enter what you bought and at what price. Live prices are filled in for you."}
          </SheetDescription>
        </SheetHeader>
        {/* Keyed so each open starts from a clean form instead of stale input. */}
        {open && (
          <HoldingForm
            key={editing?.id ?? "new"}
            editing={editing}
            holdings={holdings}
            onSave={onSave}
            onDone={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}
