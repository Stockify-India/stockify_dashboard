"use client"

import { useCallback, useEffect, useState } from "react"

export type SessionMessage =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "agent"; report: unknown } // raw agent JSON, validated at render
  | { id: string; role: "error"; text: string }

export type AgentSession = {
  id: string
  title: string
  symbols: string[]
  createdAt: number
  updatedAt: number
  messages: SessionMessage[]
}

const STORAGE_KEY = "stockify.agentic.sessions.v1"

function load(): AgentSession[] {
  if (typeof window === "undefined") return []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]")
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function newId() {
  return crypto.randomUUID()
}

// Sessions live in localStorage until the backend stores them. Newest first.
export function useAgentSessions() {
  const [sessions, setSessions] = useState<AgentSession[]>(load)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
  }, [sessions])

  const create = useCallback((symbols: string[]) => {
    const now = Date.now()
    const session: AgentSession = { id: newId(), title: "New session", symbols, createdAt: now, updatedAt: now, messages: [] }
    setSessions((current) => [session, ...current])
    return session
  }, [])

  const update = useCallback((id: string, change: (session: AgentSession) => AgentSession) => {
    setSessions((current) =>
      current
        .map((s) => (s.id === id ? { ...change(s), updatedAt: Date.now() } : s))
        .sort((a, b) => b.updatedAt - a.updatedAt)
    )
  }, [])

  const remove = useCallback((id: string) => {
    setSessions((current) => current.filter((s) => s.id !== id))
  }, [])

  return { sessions, create, update, remove }
}
