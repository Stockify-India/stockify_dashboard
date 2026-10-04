"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2Icon, MessageSquareIcon, PlusIcon, SendIcon, Trash2Icon } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { AgentReportView } from "@/components/peer-comparison/agentic/agent-report"
import { useCompany } from "@/components/company-context"
import { StockPicker } from "@/components/peer-comparison/stock-picker"
import { askAgent } from "@/lib/agentic/client"
import { parseAgentReport } from "@/lib/agentic/schema"
import { newId, useAgentSessions, type AgentSession, type SessionMessage } from "@/lib/agentic/sessions"
import type { Company } from "@/lib/companies"

function formatWhen(timestamp: number) {
  return new Date(timestamp).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })
}

// `live` marks a message that arrived this session, so reopening a saved
// conversation shows it still instead of replaying every message.
function MessageView({ message, live }: { message: SessionMessage; live: boolean }) {
  const enter = live ? "agent-enter" : ""
  if (message.role === "user") {
    return (
      <div
        className={cn(
          "ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground",
          enter
        )}
      >
        {message.text}
      </div>
    )
  }
  if (message.role === "error") {
    return <p className={cn("rounded-xl bg-rose-500/10 px-4 py-2.5 text-sm text-rose-700 dark:text-rose-400", enter)}>{message.text}</p>
  }
  const result = parseAgentReport(message.report)
  if (!result.ok) {
    return <p className="rounded-xl bg-rose-500/10 px-4 py-2.5 text-sm text-rose-700 dark:text-rose-400">{result.error}</p>
  }
  return <AgentReportView report={result.report} animate={live} />
}

export function AgenticPanel() {
  const { companies } = useCompany()
  const { sessions, create, update, remove } = useAgentSessions()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [prompt, setPrompt] = useState("")
  const [pending, setPending] = useState<string | null>(null) // id of the session awaiting the agent
  const [status, setStatus] = useState("Agent is analysing...")
  const thread = useRef<HTMLDivElement>(null)
  const [liveIds, setLiveIds] = useState<ReadonlySet<string>>(new Set()) // ids of messages that arrived since this page loaded

  // Stocks belong to the session. Before the first message there is no session
  // yet, so the picker edits a draft that the first message turns into one.
  const [draftSymbols, setDraftSymbols] = useState<string[]>([])
  const active = sessions.find((s) => s.id === activeId) ?? null
  const symbols = active?.symbols ?? draftSymbols
  const selection = symbols.flatMap((symbol) => companies.find((c) => c.symbol === symbol) ?? [])
  const canSend = symbols.length >= 2
  const messageCount = active?.messages.length ?? 0

  useEffect(() => {
    // Scroll the thread itself, never the page (scrollIntoView would move both).
    const el = thread.current
    if (!el) return
    const last = active?.messages.at(-1)
    const lastEl = el.children[messageCount - 1] as HTMLElement | undefined
    // A finished report is long: land on its first line, not its last.
    const top = last?.role === "agent" && lastEl ? lastEl.offsetTop - 8 : el.scrollHeight
    // Landing on a report is instant: it grows while charts mount and a smooth
    // scroll gets overtaken. Own messages scroll down smoothly.
    el.scrollTo({ top, behavior: last?.role === "agent" ? "instant" : "smooth" })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, messageCount, pending])

  function startSession() {
    setActiveId(null)
    setDraftSymbols([])
    setPrompt("")
  }

  function changeStocks(next: Company[]) {
    const nextSymbols = next.map((c) => c.symbol)
    if (active) update(active.id, (s) => ({ ...s, symbols: nextSymbols }))
    else setDraftSymbols(nextSymbols)
  }

  function deleteSession(id: string) {
    remove(id)
    if (id === activeId) setActiveId(null)
  }

  function markLive(id: string) {
    setLiveIds((current) => new Set(current).add(id))
  }

  async function send() {
    const text = prompt.trim()
    if (!text || pending || !canSend) return

    // First message creates the session so an empty one never lingers in the list.
    const session: AgentSession = active ?? create(symbols)
    setActiveId(session.id)
    setDraftSymbols([])
    setPrompt("")
    const userMessage: SessionMessage = { id: newId(), role: "user", text }
    markLive(userMessage.id)
    update(session.id, (s) => ({
      ...s,
      title: s.messages.length === 0 ? text.slice(0, 48) : s.title,
      messages: [...s.messages, userMessage],
    }))

    setPending(session.id)
    setStatus("Agent is analysing...")
    let reply: SessionMessage
    try {
      const report = await askAgent({ sessionId: session.id, symbols: session.symbols, prompt: text }, setStatus)
      reply = { id: newId(), role: "agent", report }
    } catch (err) {
      reply = { id: newId(), role: "error", text: err instanceof Error ? err.message : "The agent request failed." }
    }
    markLive(reply.id)
    update(session.id, (s) => ({ ...s, messages: [...s.messages, reply] }))
    setPending(null)
  }

  return (
    // Desktop: the panel fills the viewport below the page chrome, so only the
    // session list and the thread scroll. Mobile stacks and gives the chat a fixed height.
    <div className="grid gap-4 lg:h-[calc(100dvh-13rem)] lg:min-h-[32rem] lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="flex flex-col gap-2 rounded-2xl border bg-card p-3 lg:min-h-0">
        <Button variant="outline" size="sm" onClick={startSession} className="justify-start gap-2">
          <PlusIcon className="size-4" />
          New session
        </Button>
        <ul className="flex max-h-40 flex-col gap-1 overflow-y-auto lg:max-h-none lg:min-h-0 lg:flex-1">
          {sessions.length === 0 && <li className="px-2 py-3 text-xs text-muted-foreground">No sessions yet.</li>}
          {sessions.map((s) => (
            <li key={s.id} className="group relative">
              <button
                type="button"
                onClick={() => setActiveId(s.id)}
                className={cn(
                  "flex w-full flex-col gap-0.5 rounded-lg px-2.5 py-2 pr-9 text-left transition-colors hover:bg-muted",
                  s.id === activeId && "bg-muted"
                )}
              >
                <span className="truncate text-sm font-medium">{s.title}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {s.symbols.join(", ")} · {formatWhen(s.updatedAt)}
                </span>
              </button>
              <button
                type="button"
                aria-label={`Delete session ${s.title}`}
                onClick={() => deleteSession(s.id)}
                className="absolute top-2 right-2 rounded p-1 text-muted-foreground opacity-0 hover:text-rose-600 focus-visible:opacity-100 group-hover:opacity-100"
              >
                <Trash2Icon className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="flex h-[80dvh] min-h-0 min-w-0 flex-col gap-4 rounded-2xl border bg-card p-4 lg:h-auto">
        <header className="flex shrink-0 items-center gap-2 border-b pb-3">
          <MessageSquareIcon className="size-4 text-muted-foreground" />
          <h2 className="truncate text-sm font-medium">{active?.title ?? "New session"}</h2>
        </header>

        <div className="shrink-0">
          <StockPicker value={selection} onChange={changeStocks} />
        </div>

        <div ref={thread} className="relative -mx-1 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-1 [overflow-anchor:none]">
          {messageCount === 0 && pending === null ? (
            <p className="m-auto max-w-sm text-center text-sm text-muted-foreground">
              {canSend
                ? <>Ask the agent to compare {symbols.join(", ")}, for example &ldquo;Which has better returns and lower risk?&rdquo;</>
                : "Add at least two stocks above to start comparing."}
            </p>
          ) : (
            active?.messages.map((m) => <MessageView key={m.id} message={m} live={liveIds.has(m.id)} />)
          )}
          {pending !== null && pending === activeId && (
            <p className="agent-enter flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2Icon className="size-4 animate-spin" />
              {status}
            </p>
          )}
        </div>

        <form
          className="flex shrink-0 items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            send()
          }}
        >
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            placeholder={canSend ? "Ask the agent about these stocks..." : "Add two or more stocks first"}
            className="min-h-10 resize-none"
            rows={2}
          />
          <Button type="submit" size="icon" disabled={!prompt.trim() || pending !== null || !canSend} aria-label="Send">
            <SendIcon className="size-4" />
          </Button>
        </form>
      </section>
    </div>
  )
}
