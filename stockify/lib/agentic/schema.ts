import { z } from "zod"

// Contract between the comparison agent and the Agentic tab. The agent returns
// one AgentReport; the frontend renders `blocks` top to bottom. Each block is
// validated on its own (see parseAgentReport) so a malformed chart is skipped
// with a warning instead of blanking the whole report.

const tone = z.enum(["neutral", "positive", "negative", "warning"])
export type Tone = z.infer<typeof tone>

// Cells and chart values may be null when the agent has no data for a point.
const cell = z.union([z.string(), z.number(), z.null()])

const headingBlock = z.object({
  type: z.literal("heading"),
  text: z.string(),
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(2),
})

const textBlock = z.object({
  type: z.literal("text"),
  // Plain paragraphs. A blank line starts a new paragraph, "**bold**" is supported.
  text: z.string(),
})

const bulletsBlock = z.object({
  type: z.literal("bullets"),
  title: z.string().optional(),
  items: z.array(z.string()),
})

const calloutBlock = z.object({
  type: z.literal("callout"),
  tone: tone.default("neutral"),
  title: z.string().optional(),
  text: z.string(),
})

const statsBlock = z.object({
  type: z.literal("stats"),
  items: z.array(
    z.object({
      label: z.string(),
      value: z.union([z.string(), z.number()]),
      sub: z.string().optional(),
      tone: tone.optional(),
    })
  ),
})

const tableBlock = z.object({
  type: z.literal("table"),
  title: z.string().optional(),
  columns: z.array(z.string()),
  rows: z.array(z.array(cell)),
})

const series = z.object({
  key: z.string(), // field name in each data row
  label: z.string().optional(), // legend text, defaults to key
  color: z.string().optional(), // CSS colour, defaults to the palette
})

const chartBase = {
  title: z.string(),
  sub: z.string().optional(),
  unit: z.string().optional(), // appended in tooltips/labels, e.g. "%" or "Cr"
}

// Bar and line share one shape: `data` is an array of rows, `x` names the
// category field, each `series[].key` names a numeric field.
const barChartBlock = z.object({
  type: z.literal("bar_chart"),
  ...chartBase,
  x: z.string(),
  series: z.array(series).min(1),
  data: z.array(z.record(z.string(), cell)),
  stacked: z.boolean().default(false),
  horizontal: z.boolean().default(false),
})

const lineChartBlock = z.object({
  type: z.literal("line_chart"),
  ...chartBase,
  x: z.string(),
  series: z.array(series).min(1),
  data: z.array(z.record(z.string(), cell)),
})

const pieChartBlock = z.object({
  type: z.literal("pie_chart"),
  ...chartBase,
  donut: z.boolean().default(true),
  data: z.array(z.object({ label: z.string(), value: z.number(), color: z.string().optional() })),
})

const dividerBlock = z.object({ type: z.literal("divider") })

export const blockSchema = z.discriminatedUnion("type", [
  headingBlock,
  textBlock,
  bulletsBlock,
  calloutBlock,
  statsBlock,
  tableBlock,
  barChartBlock,
  lineChartBlock,
  pieChartBlock,
  dividerBlock,
])

export type AgentBlock = z.infer<typeof blockSchema>
export type BarChartBlock = z.infer<typeof barChartBlock>
export type LineChartBlock = z.infer<typeof lineChartBlock>
export type PieChartBlock = z.infer<typeof pieChartBlock>

const reportEnvelope = z.object({
  version: z.literal(1),
  title: z.string(),
  summary: z.string().optional(),
  symbols: z.array(z.string()).optional(), // companies the report covers
  generated_at: z.string().optional(), // ISO 8601
  blocks: z.array(z.unknown()),
})

export type AgentReport = {
  title: string
  summary?: string
  symbols?: string[]
  generatedAt?: string
  blocks: AgentBlock[]
  warnings: string[]
}

export type ParseResult = { ok: true; report: AgentReport } | { ok: false; error: string }

export function parseAgentReport(input: unknown): ParseResult {
  const envelope = reportEnvelope.safeParse(input)
  if (!envelope.success) {
    const issue = envelope.error.issues[0]
    return { ok: false, error: `Invalid report: ${issue.path.join(".") || "root"} - ${issue.message}` }
  }

  const blocks: AgentBlock[] = []
  const warnings: string[] = []
  envelope.data.blocks.forEach((raw, index) => {
    const parsed = blockSchema.safeParse(raw)
    if (parsed.success) {
      blocks.push(parsed.data)
      return
    }
    const type = typeof raw === "object" && raw && "type" in raw ? String((raw as { type: unknown }).type) : "unknown"
    const issue = parsed.error.issues[0]
    warnings.push(`Block ${index + 1} (${type}) skipped: ${issue.path.join(".") || "root"} - ${issue.message}`)
  })

  const { title, summary, symbols, generated_at } = envelope.data
  return { ok: true, report: { title, summary, symbols, generatedAt: generated_at, blocks, warnings } }
}
