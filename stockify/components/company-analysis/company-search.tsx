"use client"

import { startTransition, useEffect, useMemo, useRef, useState } from "react"
import { CheckIcon, CommandIcon, SearchIcon, XIcon } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "cn"

import { Input } from "@/components/ui/input"
import type { Company } from "@/lib/companies"

const SPRING = { type: "spring", stiffness: 500, damping: 36, mass: 0.8 } as const

function matches(company: Company, query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    company.name.toLowerCase().includes(q) ||
    company.symbol.toLowerCase().includes(q)
  )
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border bg-background px-1 font-mono text-[10px] font-medium text-muted-foreground">
      {children}
    </kbd>
  )
}

function Highlighted({ text, query }: { text: string; query: string }) {
  const q = query.trim()
  if (!q) return <>{text}</>
  const start = text.toLowerCase().indexOf(q.toLowerCase())
  if (start === -1) return <>{text}</>
  const end = start + q.length
  return (
    <>
      {text.slice(0, start)}
      <span className="text-emerald-600 dark:text-emerald-400">
        {text.slice(start, end)}
      </span>
      {text.slice(end)}
    </>
  )
}

export function CompanySearch({
  companies,
  selected,
  onSelect,
}: {
  companies: Company[]
  selected: Company
  onSelect: (company: Company) => void
}) {
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const isBrowsing = query.trim().length === 0

  const results = useMemo(() => {
    const filtered = companies.filter((company) => matches(company, query))
    if (isBrowsing) {
      return [...filtered].sort(
        (a, b) => a.industry.localeCompare(b.industry) || a.name.localeCompare(b.name)
      )
    }
    return filtered.slice(0, 8)
  }, [companies, query, isBrowsing])

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" })
  }, [activeIndex])

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handlePointerDown)
    return () => document.removeEventListener("mousedown", handlePointerDown)
  }, [])

  useEffect(() => {
    function handleGlobalKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        containerRef.current?.querySelector("input")?.focus()
      }
    }
    document.addEventListener("keydown", handleGlobalKeyDown)
    return () => document.removeEventListener("keydown", handleGlobalKeyDown)
  }, [])

  function selectCompany(company: Company) {
    setQuery("")
    setIsOpen(false)
    // Defer: onSelect updates shared context and re-renders the whole page
    // (header + tab bar + content). Keeping that off the urgent path lets
    // the dropdown's close animation start on time instead of stalling
    // behind that heavier render.
    startTransition(() => {
      onSelect(company)
    })
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setIsOpen(false)
      event.currentTarget.blur()
      return
    }
    if (!isOpen && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      setIsOpen(true)
      return
    }
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setActiveIndex((index) => Math.min(index + 1, results.length - 1))
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, 0))
    } else if (event.key === "Enter") {
      event.preventDefault()
      const company = results[activeIndex]
      if (company) selectCompany(company)
    }
  }

  const showIdle = !isOpen && !query

  return (
    <div ref={containerRef} className="relative w-full max-w-lg">
      <div className="group relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-foreground" />
        <Input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setActiveIndex(0)
            setIsOpen(true)
          }}
          onFocus={() => {
            setActiveIndex(0)
            setIsOpen(true)
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search companies or tickers…"
          className={cn(
            "h-10 rounded-full border-transparent bg-muted pr-16 pl-10 shadow-none transition-colors selection:bg-emerald-500/20 selection:text-foreground hover:bg-muted focus-visible:border-input focus-visible:bg-background focus-visible:shadow-sm focus-visible:ring-2 focus-visible:ring-ring/40",
            showIdle && "text-transparent placeholder:text-transparent"
          )}
          aria-label="Search companies"
        />

        <div
          className={cn(
            "pointer-events-none absolute inset-y-0 left-10 right-16 flex items-center gap-2 transition-opacity duration-150",
            showIdle ? "opacity-100" : "opacity-0"
          )}
        >
          <span className="shrink-0 rounded-md bg-foreground/[0.06] px-1.5 py-0.5 font-mono text-[11px] font-semibold tracking-wide text-foreground">
            {selected.symbol}
          </span>
          <span className="truncate text-sm text-muted-foreground">
            {selected.name}
          </span>
        </div>

        <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center">
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
              aria-label="Clear search"
            >
              <XIcon className="size-3.5" />
            </button>
          ) : (
            <div className="hidden items-center gap-0.5 sm:flex">
              <Kbd>
                <CommandIcon className="size-2.5" />
              </Kbd>
              <Kbd>K</Kbd>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: -4, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: -4, scale: 0.98 }}
            transition={SPRING}
            className="absolute top-full z-50 mt-2 w-full origin-top will-change-transform overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-lg ring-1 ring-foreground/10"
          >
            {results.length > 0 ? (
              <>
                <div className="flex items-center justify-between px-3 pt-2.5 pb-1.5">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {isBrowsing ? "All companies" : "Results"}
                  </span>
                  <span className="text-[11px] tabular-nums text-muted-foreground">
                    {results.length}
                  </span>
                </div>
                <ul
                  ref={listRef}
                  role="listbox"
                  className="max-h-72 overflow-y-auto p-1 pt-0 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-foreground/10 [&::-webkit-scrollbar-track]:bg-transparent"
                >
                  {results.map((company, index) => {
                    const isSelected = company.symbol === selected.symbol
                    const isNewSector =
                      isBrowsing &&
                      (index === 0 || results[index - 1].industry !== company.industry)
                    return (
                      <li key={company.symbol}>
                        {isNewSector && (
                          <div
                            className={cn(
                              "px-2 pb-1 text-[10px] font-semibold tracking-wider text-muted-foreground/70 uppercase",
                              index !== 0 && "pt-2.5"
                            )}
                          >
                            {company.industry}
                          </div>
                        )}
                        <button
                          type="button"
                          role="option"
                          data-index={index}
                          aria-selected={isSelected}
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={() => selectCompany(company)}
                          className={cn(
                            "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors",
                            index === activeIndex
                              ? "bg-accent text-accent-foreground"
                              : "text-foreground"
                          )}
                        >
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold text-foreground">
                            {company.symbol.slice(0, 1)}
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-sm font-medium">
                              <Highlighted text={company.name} query={query} />
                            </span>
                            <span className="truncate font-mono text-[11px] text-muted-foreground">
                              <Highlighted text={company.symbol} query={query} />
                            </span>
                          </span>
                          {isSelected ? (
                            <CheckIcon className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            !isBrowsing && (
                              <span className="shrink-0 text-[11px] text-muted-foreground">
                                {company.industry}
                              </span>
                            )
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ul>
                <div className="flex items-center justify-between gap-3 border-t px-3 py-1.5">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Kbd>↑</Kbd>
                      <Kbd>↓</Kbd> navigate
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Kbd>↵</Kbd> select
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Kbd>esc</Kbd> close
                  </span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-1 px-4 py-6 text-center">
                <SearchIcon className="size-4 text-muted-foreground" />
                <p className="text-sm font-medium">No matches</p>
                <p className="text-xs text-muted-foreground">
                  Nothing found for &ldquo;{query}&rdquo;
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
