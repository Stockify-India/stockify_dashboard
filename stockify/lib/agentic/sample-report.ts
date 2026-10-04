// Example payload in the exact shape the agent must send. Also used as the
// demo content in the Agentic tab until the agent endpoint is wired in.
export const SAMPLE_REPORT = {
  version: 1,
  title: "TCS vs INFY: quality and growth",
  summary: "TCS leads on returns and margins; INFY has grown revenue slightly faster.",
  symbols: ["TCS", "INFY"],
  generated_at: "2026-10-02T09:30:00Z",
  blocks: [
    { type: "heading", level: 2, text: "Verdict" },
    {
      type: "callout",
      tone: "positive",
      title: "TCS ranks first",
      text: "Higher ROE and operating margin with comparable debt-free balance sheets.",
    },
    {
      type: "stats",
      items: [
        { label: "TCS ROE", value: "51.2%", sub: "FY25", tone: "positive" },
        { label: "INFY ROE", value: "31.8%", sub: "FY25" },
        { label: "Margin gap", value: "5.4 pp", tone: "neutral" },
      ],
    },
    { type: "text", text: "Both are large-cap IT services names.\n\nTCS converts **more of its revenue into profit**." },
    {
      type: "bar_chart",
      title: "Return ratios",
      unit: "%",
      x: "metric",
      series: [
        { key: "TCS", label: "TCS" },
        { key: "INFY", label: "INFY" },
      ],
      data: [
        { metric: "ROE", TCS: 51.2, INFY: 31.8 },
        { metric: "ROCE", TCS: 64.1, INFY: 40.2 },
      ],
    },
    {
      type: "line_chart",
      title: "Revenue trend",
      sub: "Rs crore",
      unit: "Cr",
      x: "year",
      series: [{ key: "TCS" }, { key: "INFY" }],
      data: [
        { year: "FY23", TCS: 225458, INFY: 146767 },
        { year: "FY24", TCS: 240893, INFY: 153670 },
        { year: "FY25", TCS: 255324, INFY: 162990 },
      ],
    },
    {
      type: "pie_chart",
      title: "Combined revenue share",
      unit: "%",
      data: [
        { label: "TCS", value: 61 },
        { label: "INFY", value: 39 },
      ],
    },
    {
      type: "table",
      title: "Key ratios",
      columns: ["Metric", "TCS", "INFY"],
      rows: [
        ["P/E", 29.4, 24.1],
        ["Debt / Equity", 0.02, 0.08],
        ["Dividend yield", "1.6%", "2.4%"],
      ],
    },
    { type: "divider" },
    { type: "bullets", title: "Risks", items: ["Currency swings", "Slower discretionary spend in the US"] },
  ],
}
