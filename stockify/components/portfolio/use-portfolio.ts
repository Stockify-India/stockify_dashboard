"use client"

import { useCallback, useSyncExternalStore } from "react"

import type { Holding } from "@/lib/portfolio"

const STORAGE_KEY = "stockify.portfolio.v1"
const EMPTY: Holding[] = []

const listeners = new Set<() => void>()
let cache: { raw: string | null; value: Holding[] } = {
  raw: null,
  value: EMPTY,
}

function parse(raw: string | null): Holding[] {
  if (!raw) return EMPTY
  try {
    const data = JSON.parse(raw)
    if (!Array.isArray(data)) return EMPTY
    return data.filter(
      (h): h is Holding =>
        typeof h?.id === "string" &&
        typeof h?.symbol === "string" &&
        Number.isFinite(h?.quantity) &&
        Number.isFinite(h?.avgPrice)
    )
  } catch {
    return EMPTY
  }
}

function getSnapshot(): Holding[] {
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (raw !== cache.raw) cache = { raw, value: parse(raw) }
  return cache.value
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener()
  }
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", onStorage)
  }
}

function write(next: Holding[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  listeners.forEach((listener) => listener())
}

const subscribeNoop = () => () => {}

// Holdings live in this browser's localStorage; there is no account system yet.
export function usePortfolio() {
  const holdings = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY)
  const isReady = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  )

  const upsert = useCallback((holding: Holding) => {
    const current = getSnapshot()
    const exists = current.some((h) => h.id === holding.id)
    write(
      exists
        ? current.map((h) => (h.id === holding.id ? holding : h))
        : [...current, holding]
    )
  }, [])

  const remove = useCallback((id: string) => {
    write(getSnapshot().filter((h) => h.id !== id))
  }, [])

  return { holdings, isReady, upsert, remove }
}
