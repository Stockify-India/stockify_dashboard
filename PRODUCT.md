# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Indian retail investors and independent analysts doing fundamental research on NSE-listed companies before making an investment decision — the same audience currently served by Screener.in, Tickertape, and Trendlyne. Their job: pull up a company, read its financial history (P&L, balance sheet, cash flow, ratios, shareholding, peers) quickly and trust the numbers, then compare it against peers or track it over time.

## Product Purpose

Stockify is a fundamental-analysis platform for Indian equities. It ingests real filings data (NSE/XBRL, via Supabase) and presents it as per-company deep dives — Overview, Chart, Quarters, Profit & Loss, Balance Sheet, Cash Flow, Ratios (~60 metrics across 9 categories), Shareholding, Peers — plus auto-generated insight strings computed live from the underlying data (e.g. leverage/payout-smoothing flags, FII/DII crossover signals). Success means an investor gets a faster, clearer, more trustworthy read of a company's fundamentals than manually parsing filings or spreadsheets.

## Positioning

Confirmed direction: Stockify is meant to grow into a broader **data intelligence platform**, not stay a fundamentals-table clone. The stated differentiators, in order of how concretely they exist today:

- **Auto-generated, data-grounded insight signals** (built and shipping today) — short flags computed live from real filings, only surfaced when a real condition is true (e.g. "DII holding overtook FII holding for the first time this window"). This is the one differentiator with working code behind it right now.
- **AI-agent-driven research** — an "Agent Discussion" surface is scaffolded in the nav but not yet built.
- **Advanced comparison tooling and frameworks** — Peer Comparison and Industry Research are scaffolded in the nav but not yet built.
- **Personal data storage** (watchlists / personal tracking) — "Personal Data Tracking" is scaffolded in the nav but not yet built.
- **Community / a space for well-known investors or commentators** — not scaffolded anywhere yet; pure intent, no implementation, no spec. Do not invent a feature shape for this — treat it as an open product decision until the user specifies one.

Record this list honestly by build status when doing product work — "positioning" and "what's shipped" are not the same thing here, and conflating them would overstate the product to itself.

## Operating Context

- Covers NSE-listed Indian companies; fiscal year runs Apr–Mar (FY labels, quarter labels, and crore-denominated amounts follow this convention throughout).
- Data lives in Supabase Postgres (`companies`, `price_stats`, `annual_financials`, `quarterly_results`, `financial_statements` [raw XBRL JSON], `shareholding`, `announcements`, `announcement_files`), RLS-gated with public SELECT policies, read client-side via the anon/publishable key.
- The app is a fully static export (`output: "export"`) deployed to GitHub Pages — there is no server runtime, so every data fetch must work from the browser.
- Filings source data (XBRL) has known quirks already handled in code: a Q4-tagged-as-yearly filing's plain field names are quarter-only, while the sibling `...Cumulative` field holds the true annual figure; Consolidated statements are preferred over Standalone when both exist at the same period.

## Capabilities and Constraints

- **Built today:** Company Analysis is the one fully real surface — Overview, Chart (52-week/all-time range, no fabricated price history), Peers, Quarters, Profit & Loss, Balance Sheet, Cash Flow, Ratios, Shareholding, Documents, all wired to live Supabase data except where explicitly noted below.
- **Not built yet (nav placeholders only):** Dashboard (partial), Peer Comparison, Industry Research, Formulas & Template Analysis, Personal Data Tracking, Agent Discussion.
- **Known data gaps, shown honestly rather than guessed:** Valuation ratios (P/E, P/B, EV/EBITDA, etc.) are not computed — they need live market price/cap data not present in the `financial_statements` record. Liquidity and Efficiency ratios show "not available" for companies (e.g. banks/NBFCs) whose filing taxonomy doesn't populate the needed fields. The Shareholding tab currently renders hardcoded example figures, not a live per-company query, pending confirmation that the `shareholding` table has synced rows for arbitrary companies.
- **Compliance constraint (confirmed, wording not yet drafted):** a "not investment advice" / data-accuracy disclaimer is required wherever analysis or insight content is shown. Future work must add real disclaimer copy, not fabricate or omit it, and must not phrase auto-generated insights as recommendations or predictions.
- **Undecided:** how "AI agent research" and the "community / space for popular people" differentiators will actually work — no feature shape has been specified. Do not design or build these from assumption.

## Brand Commitments

Name: **Stockify**. No logo, locked color palette, or typography system has been confirmed yet beyond whatever shadcn/ui defaults the build has used so far — there is no locked visual identity to preserve. Treat this as a real gap for `new-work`/`document` to resolve deliberately, not as license to invent one during unrelated feature work.

## Evidence on Hand

Real Supabase data for actual NSE-listed companies (financial statements, annual/quarterly results, price stats) is on hand and is the only content this product should ever display as fact. There are no testimonials, case studies, press mentions, or real user accounts — none exist, and none should be fabricated. The Shareholding tab's current hardcoded figures are a known, temporary exception (see Capabilities and Constraints) and should be replaced with live per-company data rather than treated as evidence of real shareholding for any company shown.

## Product Principles

1. Every number and every auto-generated insight must be grounded in real Supabase data — never fabricated, and never silently adjusted to match a stated hypothesis. When the data contradicts an assumption, say so.
2. Degrade honestly: when data for a company or metric category isn't available (wrong taxonomy, missing market price, unsynced table), show a clear note instead of guessing, hiding the gap, or defaulting to zero.
3. Match the informational conventions Indian fundamental investors already expect (Apr–Mar fiscal labels, crore units, Consolidated-preferred statements) so the product feels familiar rather than foreign.
4. Ship compliance-first: a not-investment-advice disclaimer is a durable, non-optional element wherever analysis or insight content appears — never trade it away for a cleaner layout.
5. Grow deliberately from a fundamentals viewer into a wider data-intelligence platform (AI-agent research, comparison frameworks, personal watchlists, a community/creator space) without ever undermining the trust the fundamentals core is built on.
