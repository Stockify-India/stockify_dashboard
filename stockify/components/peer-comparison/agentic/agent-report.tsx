"use client"

import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, XAxis, YAxis } from "recharts"
import { cn } from "cn"

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChartCard, InsightNote, axisTick } from "@/components/company-analysis/company-charts"
import { COMPANY_PALETTE } from "@/components/peer-comparison/comparison/comparison-charts"
import type {
  AgentBlock,
  AgentReport,
  BarChartBlock,
  LineChartBlock,
  PieChartBlock,
  Tone,
} from "@/lib/agentic/schema"

const TONE_TEXT: Record<Tone, string> = {
  neutral: "text-foreground",
  positive: "text-emerald-600 dark:text-emerald-400",
  negative: "text-rose-600 dark:text-rose-400",
  warning: "text-amber-600 dark:text-amber-400",
}

const TONE_BOX: Record<Tone, string> = {
  neutral: "border bg-muted/30",
  positive: "border-emerald-500/30 bg-emerald-500/10",
  negative: "border-rose-500/30 bg-rose-500/10",
  warning: "border-amber-500/30 bg-amber-500/10",
}

function withUnit(value: unknown, unit?: string) {
  if (typeof value !== "number") return String(value ?? "")
  const formatted = value.toLocaleString("en-IN", { maximumFractionDigits: 2 })
  return unit ? `${formatted} ${unit}` : formatted
}

function seriesConfig(series: BarChartBlock["series"]): ChartConfig {
  const config: ChartConfig = {}
  series.forEach((s, i) => {
    config[s.key] = { label: s.label ?? s.key, color: s.color ?? COMPANY_PALETTE[i % COMPANY_PALETTE.length] }
  })
  return config
}

function tooltipFor(unit?: string) {
  return (
    <ChartTooltip
      content={<ChartTooltipContent formatter={(value, name) => `${name}: ${withUnit(value, unit)}`} />}
    />
  )
}

function AgentBarChart({ block }: { block: BarChartBlock }) {
  const config = seriesConfig(block.series)
  return (
    <ChartCard title={block.title} sub={block.sub}>
      <ChartContainer config={config} className="h-64 w-full">
        <BarChart data={block.data} layout={block.horizontal ? "vertical" : "horizontal"} accessibilityLayer>
          <CartesianGrid vertical={block.horizontal} horizontal={!block.horizontal} strokeDasharray="3 3" />
          {block.horizontal ? (
            <>
              <XAxis type="number" tickLine={false} axisLine={false} tick={axisTick} />
              <YAxis type="category" dataKey={block.x} tickLine={false} axisLine={false} width={80} tick={axisTick} />
            </>
          ) : (
            <>
              <XAxis dataKey={block.x} tickLine={false} axisLine={false} tick={axisTick} />
              <YAxis tickLine={false} axisLine={false} width={48} tick={axisTick} />
            </>
          )}
          {tooltipFor(block.unit)}
          {block.series.length > 1 && <ChartLegend content={<ChartLegendContent />} />}
          {block.series.map((s) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              fill={`var(--color-${s.key})`}
              radius={block.stacked ? 0 : 4}
              stackId={block.stacked ? "stack" : undefined}
            />
          ))}
        </BarChart>
      </ChartContainer>
    </ChartCard>
  )
}

function AgentLineChart({ block }: { block: LineChartBlock }) {
  const config = seriesConfig(block.series)
  return (
    <ChartCard title={block.title} sub={block.sub}>
      <ChartContainer config={config} className="h-64 w-full">
        <LineChart data={block.data} accessibilityLayer>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey={block.x} tickLine={false} axisLine={false} tick={axisTick} />
          <YAxis tickLine={false} axisLine={false} width={48} tick={axisTick} />
          {tooltipFor(block.unit)}
          {block.series.length > 1 && <ChartLegend content={<ChartLegendContent />} />}
          {block.series.map((s) => (
            <Line
              key={s.key}
              dataKey={s.key}
              type="monotone"
              stroke={`var(--color-${s.key})`}
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ChartContainer>
    </ChartCard>
  )
}

function AgentPieChart({ block }: { block: PieChartBlock }) {
  const slices = block.data.map((d, i) => ({
    ...d,
    fill: d.color ?? COMPANY_PALETTE[i % COMPANY_PALETTE.length],
  }))
  const config: ChartConfig = {}
  slices.forEach((s) => {
    config[s.label] = { label: s.label, color: s.fill }
  })
  return (
    <ChartCard title={block.title} sub={block.sub}>
      <ChartContainer config={config} className="mx-auto h-64 w-full">
        <PieChart>
          <ChartTooltip
            content={<ChartTooltipContent hideLabel formatter={(value, name) => `${name}: ${withUnit(value, block.unit)}`} />}
          />
          <Pie data={slices} dataKey="value" nameKey="label" innerRadius={block.donut ? 55 : 0} strokeWidth={2}>
            {slices.map((s) => (
              <Cell key={s.label} fill={s.fill} />
            ))}
          </Pie>
          <ChartLegend content={<ChartLegendContent nameKey="label" />} />
        </PieChart>
      </ChartContainer>
    </ChartCard>
  )
}

function Inline({ text }: { text: string }) {
  return <>{text.split(/\*\*(.+?)\*\*/g).map((part, j) => (j % 2 ? <strong key={j}>{part}</strong> : part))}</>
}

function Paragraphs({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2 text-sm leading-relaxed", className)}>
      {text.split(/\n{2,}|\n/).map((para, i) => (
        <p key={i}>
          <Inline text={para} />
        </p>
      ))}
    </div>
  )
}

const HEADING_CLASS = {
  1: "text-xl font-semibold",
  2: "text-base font-semibold",
  3: "text-sm font-medium text-muted-foreground",
} as const

function Block({ block }: { block: AgentBlock }) {
  switch (block.type) {
    case "heading": {
      const Tag = (`h${block.level + 1}`) as "h2" | "h3" | "h4"
      return <Tag className={cn("mt-2", HEADING_CLASS[block.level])}>{block.text}</Tag>
    }
    case "text":
      return <Paragraphs text={block.text} />
    case "bullets":
      return (
        <div className="text-sm">
          {block.title && <p className="mb-1 font-medium">{block.title}</p>}
          <ul className="list-disc space-y-1 pl-5">
            {block.items.map((item, i) => (
              <li key={i}>
                <Inline text={item} />
              </li>
            ))}
          </ul>
        </div>
      )
    case "callout":
      return (
        <div className={cn("rounded-xl px-4 py-3", TONE_BOX[block.tone])}>
          {block.title && <p className={cn("mb-1 text-sm font-medium", TONE_TEXT[block.tone])}>{block.title}</p>}
          <Paragraphs text={block.text} />
        </div>
      )
    case "stats":
      return (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {block.items.map((item, i) => (
            <div key={i} className="rounded-2xl border bg-card p-4">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className={cn("mt-1 text-xl font-semibold tabular-nums", TONE_TEXT[item.tone ?? "neutral"])}>
                {typeof item.value === "number" ? item.value.toLocaleString("en-IN") : item.value}
              </p>
              {item.sub && <p className="text-xs text-muted-foreground">{item.sub}</p>}
            </div>
          ))}
        </div>
      )
    case "table":
      return (
        <div className="overflow-hidden rounded-xl border">
          {block.title && <p className="border-b bg-muted/30 px-3 py-2 text-sm font-medium">{block.title}</p>}
          <Table>
            <TableHeader>
              <TableRow>
                {block.columns.map((col, i) => (
                  <TableHead key={i} className={i ? "text-right" : undefined}>
                    {col}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {block.rows.map((row, r) => (
                <TableRow key={r}>
                  {row.map((value, c) => (
                    <TableCell key={c} className={cn(c ? "text-right tabular-nums" : "font-medium")}>
                      {typeof value === "number" ? value.toLocaleString("en-IN") : <Inline text={value ?? "-"} />}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )
    case "bar_chart":
      return <AgentBarChart block={block} />
    case "line_chart":
      return <AgentLineChart block={block} />
    case "pie_chart":
      return <AgentPieChart block={block} />
    case "divider":
      return <hr className="my-1" />
  }
}

const CHART_TYPES = new Set<AgentBlock["type"]>(["bar_chart", "line_chart", "pie_chart"])

// Charts sit two-up on wide screens, paired within a run of consecutive charts.
// An unpaired chart (a run of one, or the odd one out) spans the full width.
function fullWidthFlags(blocks: AgentBlock[]) {
  const flags = blocks.map(() => true)
  let i = 0
  while (i < blocks.length) {
    if (!CHART_TYPES.has(blocks[i].type)) {
      i++
      continue
    }
    let end = i
    while (end < blocks.length && CHART_TYPES.has(blocks[end].type)) end++
    for (let j = i; j + 1 < end; j += 2) flags[j] = flags[j + 1] = false
    i = end
  }
  return flags
}

// Blocks rise in 40ms apart; the delay stops growing after the 8th so a long
// report finishes entering in about half a second.
const STAGGER_MS = 40
const STAGGER_CAP = 8

export function AgentReportView({ report, animate = false }: { report: AgentReport; animate?: boolean }) {
  const fullWidth = fullWidthFlags(report.blocks)
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">{report.title}</h2>
        {report.summary && <p className="text-sm text-muted-foreground">{report.summary}</p>}
      </div>
      {report.warnings.length > 0 && (
        <InsightNote>
          {report.warnings.map((w) => (
            <span key={w} className="block">
              {w}
            </span>
          ))}
        </InsightNote>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {report.blocks.map((block, i) => (
          <div
            key={i}
            className={cn(fullWidth[i] && "lg:col-span-2", animate && "agent-enter")}
            style={animate ? { animationDelay: `${Math.min(i, STAGGER_CAP) * STAGGER_MS}ms` } : undefined}
          >
            <Block block={block} />
          </div>
        ))}
      </div>
    </div>
  )
}
