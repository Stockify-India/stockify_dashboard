export type AgentRequest = {
  sessionId: string
  symbols: string[]
  prompt: string
}

type StreamMessage =
  | { type: "status"; text: string }
  | { type: "report"; report: unknown }
  | { type: "error"; message: string }

// Calls /api/agentic, which streams newline-delimited JSON from the ADK
// api_server. `onStatus` receives progress text; the resolved value is the raw
// report JSON, which the caller validates against the schema.
export async function askAgent(request: AgentRequest, onStatus?: (text: string) => void): Promise<unknown> {
  const res = await fetch("/api/agentic", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  })
  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => null)
    throw new Error(data?.error ?? `Agent request failed (${res.status}).`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  let report: unknown

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() ?? ""
    for (const line of lines) {
      if (!line.trim()) continue
      const message = JSON.parse(line) as StreamMessage
      if (message.type === "status") onStatus?.(message.text)
      else if (message.type === "error") throw new Error(message.message)
      else report = message.report
    }
  }

  if (report === undefined) throw new Error("The agent returned no report.")
  return report
}
