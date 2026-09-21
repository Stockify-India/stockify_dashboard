---
name: Stockify
description: A dense, data-trust dashboard for Indian equity fundamentals — neutral grayscale chrome, one emerald signal color, monospace ledger headers.
colors:
  paper: "oklch(1 0 0)"
  ink: "oklch(0.145 0 0)"
  graphite: "oklch(0.205 0 0)"
  mist: "oklch(0.97 0 0)"
  slate: "oklch(0.556 0 0)"
  hairline: "oklch(0.922 0 0)"
  focus-ring: "oklch(0.708 0 0)"
  alert: "oklch(0.577 0.245 27.325)"
  confirmation-green: "#10b981"
  signal-sky: "#0ea5e9"
  signal-violet: "#8b5cf6"
  signal-amber: "#f59e0b"
  signal-rose: "#f43f5e"
typography:
  headline:
    fontFamily: "Geist, ui-sans-serif, system-ui"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Geist, ui-sans-serif, system-ui"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.375
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Geist, ui-sans-serif, system-ui"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.3
  mono-label:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.6875rem"
    fontWeight: 400
    lineHeight: 1.3
rounded:
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.625rem"
  xl: "0.875rem"
  2xl: "1.125rem"
  3xl: "1.375rem"
  4xl: "1.625rem"
spacing:
  card-padding-sm: "0.75rem"
  card-padding: "1rem"
  tile-gap: "0.75rem"
  content-x: "1rem"
  content-x-lg: "1.5rem"
  content-y: "1.5rem"
components:
  button-primary:
    backgroundColor: "{colors.graphite}"
    textColor: "{colors.paper}"
    rounded: "{rounded.lg}"
    padding: "0 0.625rem"
    height: "2rem"
  button-primary-hover:
    backgroundColor: "color-mix(in oklch, {colors.graphite}, transparent 20%)"
  button-outline:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "0 0.625rem"
    height: "2rem"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "1rem"
  badge-secondary:
    backgroundColor: "{colors.mist}"
    textColor: "{colors.graphite}"
    rounded: "{rounded.4xl}"
    height: "1.25rem"
    padding: "0.125rem 0.5rem"
---

# Design System: Stockify

## Overview

**Creative North Star: "The Signal Room"**

Stockify's interface is deliberately quiet so that when it actually has something to say, it's unmistakable. The chrome is pure shadcn neutral — oklch grayscale, zero chroma, no brand color anywhere in the shell — and exactly one hue, emerald, is allowed to mean anything: "this is real, this is confirmed, look here." That single color does three jobs at once — the active tab, the live-refresh sweep, and the positive series in every chart — and never a fourth. Everything else (an amber-tinted insight note, a chart's muted qualitative palette) exists to flag something the underlying data actually proved true, never to decorate.

The voice is dense and technical, explicitly not a consumer fintech app: no rounded illustration blobs, no marketing whitespace, no gradient hero moments. It reads closer to a terminal or a ledger than an app — Geist Mono renders every statement-table period header (Sep 2023, Mar 2024, Q1 FY27) as if it were stamped from a machine feed, while Geist Sans carries the numbers themselves so they stay comfortable to actually read. Depth is almost entirely absent: surfaces are separated by 1px hairline rings, not shadows, and the few real box-shadows that exist are working parts (a scroll-continuation cue, an active-tab hairline) rather than atmosphere.

**Key Characteristics:**
- One accent (emerald / Confirmation Green), used for confirmation and live state only — never decoration.
- Monospace for machine-sourced labels (dates, periods), humanist sans for the numbers meant to be read.
- Flat, ring-bordered surfaces; shadow is functional, never ambient.
- A separate, muted five-color qualitative palette exists solely for chart series and never leaks into UI chrome.
- Motion is restrained and purposeful: numbers tick instead of pop, panels fade instead of slide, and the one continuous animation (the refresh sweep) exists only while data is actually stale.

## Colors

Grayscale-first with a single confirmed accent; the palette is intentionally boring everywhere except the one place it needs to speak.

### Primary
- **Confirmation Green** (`#10b981`, emerald-500 / `#34d399` emerald-400 in dark mode): the one color that means "real, live, confirmed." Used for the active tab label and its animated underline, the search-match highlight, the live-refresh sweep bar, the featured highlight tile's border/background tint, and — not coincidentally — the "positive" series in every trend chart (see the One Signal Rule below).

### Neutral
- **Paper** (`oklch(1 0 0)` light / `oklch(0.145 0 0)` dark): page and card background.
- **Ink** (`oklch(0.145 0 0)` light / `oklch(0.985 0 0)` dark): primary text.
- **Graphite** (`oklch(0.205 0 0)` light / `oklch(0.922 0 0)` dark): primary-button fill, highest-emphasis non-accent surfaces.
- **Mist** (`oklch(0.97 0 0)` light / `oklch(0.269 0 0)` dark): secondary/muted backgrounds — tile fills, secondary badges, the neutral hover state shadcn calls "accent" (a naming collision worth knowing: shadcn's own `--accent` token is this neutral gray, not the brand emerald).
- **Slate** (`oklch(0.556 0 0)` light / `oklch(0.708 0 0)` dark): secondary/muted text — tile labels, chart captions.
- **Hairline** (`oklch(0.922 0 0)` light / `oklch(1 0 0 / 10%)` dark): the border/ring color used everywhere instead of shadow.
- **Focus Ring** (`oklch(0.708 0 0)` light / `oklch(0.556 0 0)` dark): keyboard-focus ring on interactive controls.
- **Alert** (`oklch(0.577 0.245 27.325)`): shadcn's default destructive red. Reserved for form-validation states (`aria-invalid`); not yet used anywhere in visible product UI, so treat any new destructive-styled surface as new ground, not an established pattern.

### Chart-only palette (dataviz, not UI chrome)
A separate five-color qualitative set exists purely for chart series and must never bleed into buttons, badges, or chrome:
- **Confirmation Green** `#10b981` — the positive/primary series (net profit, promoters, revenue).
- **Signal Sky** `#0ea5e9` — secondary series (FIIs, cash-flow-from-operations lines).
- **Signal Violet** `#8b5cf6` — tertiary series (DIIs).
- **Signal Amber** `#f59e0b` — cautionary series and the Insight Note background tint.
- **Signal Rose** `#f43f5e` — negative/warning series and the low end of the Range Bar gradient.

### Named Rules
**The One Signal Rule.** Emerald means "confirmed/live/positive" and nothing else, in chrome or in charts. If a new chart needs a "this is the good line" color, it's this green — never invent a second meaning for it, and never use it for something neutral just because it's the brand color.

**The Real Palette Rule.** `globals.css` still defines `--chart-1` through `--chart-5` as shadcn's default 0-chroma grayscale scaffolding — nothing in the product actually uses them. The real, chosen chart palette is the five exported hex constants (`EMERALD`/`SKY`/`AMBER`/`ROSE`/`VIOLET`) in `company-charts.tsx`. Don't reach for the CSS variables when adding a new chart; reach for those constants (or promote them to CSS variables in the same pass if you're touching that file anyway).

## Typography

**Body Font:** Geist (with `ui-sans-serif, system-ui` fallback)
**Label/Mono Font:** Geist Mono (with `ui-monospace, monospace` fallback)

**Character:** Geist is neutral and technical without being cold — it carries the numbers. Geist Mono is reserved for one specific job: signaling that a label came directly from a filing rather than from prose.

### Hierarchy
- **Headline** (600, 1.5rem/24px, 1.2 line-height, −0.01em tracking, tabular-nums): the single featured metric in a bento (ROCE, EPS, latest close) — the only text on the page allowed to be this large.
- **Title** (500, 1rem/16px, 1.375 line-height): card/section titles (`CardTitle`, chart titles).
- **Body** (400, 0.875rem/14px, 1.5 line-height): the default — table cells, paragraph copy, tile values that aren't the featured metric.
- **Label** (500, 0.75rem/12px): tile labels, chart subtitles, muted captions.
- **Mono Label** (400, 0.6875rem/11px, Geist Mono): statement-table period/date headers and axis ticks — small and monospaced on purpose.

### Named Rules
**The Ledger Header Rule.** Any header that names a time period or filing date (a statement-table column, a chart axis tick) renders in Geist Mono. The data itself — every number — stays in Geist Sans with `tabular-nums` so it's comfortable to actually read. Mono says "this came from a filing"; proportional sans says "read this."

## Layout

The shell is a persistent sidebar (shadcn `Sidebar`/`SidebarInset`) with a fixed top bar (`site-header`) holding the page title and a company/search combobox; content sits in a single scrolling column. Content padding is `1rem` horizontal (`1.5rem` at `lg`) and `1.5rem` vertical — tight by design, in service of density over breathing room.

Within a panel, the recurring rhythm is: **stat bento** (a 2-column grid on mobile, 4-column on `sm+`, with one 2×2 featured tile) → **chart stack** (one or more chart cards, `gap-1rem` between them) → **statement table**. Chart cards and bento tiles share a `0.75–1rem` gap; nothing in the system uses a container wider than the sidebar-inset's natural width — there is no `max-w-[…]` centering pattern, because this is a data tool, not a marketing page.

`SidebarInset` carries `min-w-0 overflow-x-hidden` deliberately: a wide statement table is allowed to scroll horizontally *within its own card*, but must never drag the sidebar or the page itself sideways. Any new wide element (a table, a wide chart) must respect that boundary rather than reintroducing page-level horizontal scroll.

## Elevation & Depth

**The Flat Ledger Rule.** Depth is earned, not decorative. Cards and containers are separated by a 1px `ring-foreground/10` hairline, not a shadow — there is no ambient drop shadow anywhere in the system. The only real `box-shadow` usages are functional signals for a real state:

### Shadow Vocabulary
- **Scroll-continuation edge** (`shadow-[6px_0_8px_-6px_rgba(0,0,0,0.12)]`, dark: `rgba(0,0,0,0.5)`): applied to a statement table's sticky first column. Signals "more columns are scrolled under here" — it exists only because the column is opaque and sticky, not for atmosphere.
- **Active tab** (`shadow-sm`): the selected tab trigger in the default (non-line) tabs variant gets a faint lift to read as "raised/selected." The line-variant tabs used for the main Company Analysis nav skip this in favor of the animated underline instead.

## Shapes

**The Two-Tier Radius Rule.** Interactive controls sit tight; containers sit loose — never swap the two. Buttons and inputs use `rounded-lg` (10px, the base `--radius`); tab triggers use `rounded-md` (8px), tighter still since they're inline. Cards, chart cards, and statement-table wrappers use `rounded-xl` (14px) up to `rounded-2xl` (18px) for the bento/chart-card tier. Badges use `rounded-4xl` (26px), which at their fixed height is a true pill.

Borders are hairline (1px, `border-border`/`ring-foreground/10`) everywhere; nothing in the system uses a heavier border weight or a dashed/double style outside of chart gridlines (`strokeDasharray="3 3"`, always at low opacity).

## Components

### Buttons
- **Shape:** `rounded-lg` (10px); `xs`/`sm` icon-adjacent sizes tighten to `rounded-[min(var(--radius-md),10-12px)]`.
- **Primary:** Graphite fill (`bg-primary`), Paper text, `h-8` (32px), `hover:bg-primary/80`.
- **Outline / Secondary / Ghost:** all stay within the neutral palette — no variant introduces the emerald accent. A button has never been the thing that says "confirmed"; that's reserved for tab/chart state.
- **Feel:** precise and unadorned — correctness over charm, per the dense/technical voice. No hover lift, no scale bounce; only an `active:translate-y-px` press.

### Cards / Chart Card (signature)
- **Corner Style:** `rounded-xl` (14px) for the generic `Card` primitive; `rounded-2xl` (18px) for the chart-card wrapper used across every trend/comparison chart.
- **Background:** Paper (`bg-card`).
- **Shadow Strategy:** none — see the Flat Ledger Rule; separation is the 1px ring.
- **Header:** title + optional muted one-line subtitle on the left, an optional `action` slot on the right (most often a two-state pill toggle, e.g. Quarterly/Yearly or Annual/Quarterly) — never more than one action per card.
- **Internal Padding:** `1rem` (`0.75rem` in the `size="sm"` card variant).

### Statement Table (signature)
- **Style:** `rounded-xl` bordered wrapper; horizontally scrollable *within itself only* (see Layout).
- **Sticky column:** the first column (row label) stays pinned via `sticky left-0 z-10` with an **opaque** `bg-background` — never a translucent fill, which previously let scrolled text bleed through and produce a ghosting artifact. The scroll-continuation shadow (see Elevation) rides on this column's right edge.
- **Headers:** period/date columns in Geist Mono, right-aligned (the Ledger Header Rule).
- **Values:** Geist Sans, `tabular-nums`, right-aligned.
- **Row entrance:** rows fade/slide in from `4px` below with an `40ms`-per-row stagger (`fill-mode-backwards`, `motion-safe`-gated) — a quiet acknowledgment that new data arrived, never a bounce.

### Metric Bento (signature)
- **Layout:** 2-column grid at base, 4-column at `sm+`, `grid-auto-flow: dense`; one tile spans 2×2 as the "featured" metric.
- **Featured tile:** `rounded-2xl`, emerald-tinted (`border-emerald-500/20 bg-emerald-500/5`), label in emerald-700/400, value at Headline scale with a ticking-number animation.
- **Standard tile:** `rounded-2xl border bg-card`, label at Label scale (muted), value at Body scale (semibold), a quiet `hover:-translate-y-0.5` lift on `duration-300 ease-out`.
- **Numbers:** every tile value ticks from its previous reading to its new one over `0.8s` (custom ease `[0.16, 1, 0.3, 1]`) rather than popping in — reserved for headline-level metrics, deliberately not applied to dense statement-table cells where dozens of concurrent tweens would hurt scanability.

### Insight Note (signature)
- **Style:** `bg-amber-500/10` background, amber-700/400 text, `rounded-lg`, small padding, sits directly beneath the chart it annotates.
- **Behavior rule:** renders only when the underlying data genuinely satisfies the condition being flagged (e.g. a real FII/DII crossover, a real leverage increase) — never a static or always-shown message. If the condition doesn't hold, the component returns nothing; there is no empty/placeholder state for it.

### Range Bar (signature)
- **Style:** `h-2 rounded-full bg-muted` track with a `rose-500/30 → muted → emerald-500/40` gradient fill representing a 52-week low → high range.
- **Motion:** the fill draws in via `scaleX` from 0 → 1, origin-left, on mount.
- **Fallback:** when low/high data is unavailable, the component renders a plain "not available" message in the same footprint rather than an empty bar.

### Tabs — main section nav (signature)
- **Style:** `line` variant — transparent list, no per-tab background. The active tab's label switches to Confirmation Green (`data-active:text-emerald-600` / `dark:text-emerald-400`).
- **Underline:** a single shared `motion.span` with `layoutId="company-tabs-underline"` slides between tabs using a spring (`stiffness: 100, damping: 20`) instead of a linear tween — it should feel like it's being dragged, not teleported.
- **Live-refresh cue:** when switching companies, a thin emerald sweep bar (`refresh-sweep` keyframe, 1.1s ease-in-out infinite, `prefers-reduced-motion`-gated at the CSS level) runs beneath the tab list, and the panel below dims to `opacity-70` — the previous company's numbers stay visible the whole time rather than dropping to a skeleton.

### Badges
- **Style:** `rounded-4xl` (true pill at this height), `secondary` variant = Mist background / Graphite text.
- **Use:** small inline metadata chips (e.g. the "Recent trades" info badge), always paired with a `Tooltip` for anything that needs more than two words of explanation.

## Do's and Don'ts

### Do:
- **Do** keep emerald to exactly one meaning (confirmed/live/positive) across chrome and charts — the One Signal Rule.
- **Do** render statement-table and chart-axis period/date labels in Geist Mono, and the numbers themselves in Geist Sans with `tabular-nums` — the Ledger Header Rule.
- **Do** make an Insight Note's appearance conditional on a real, computed fact about the data on screen; never ship one that always renders.
- **Do** use the opaque-background + edge-shadow pattern for any new sticky table column; a translucent sticky background will ghost.
- **Do** keep new wide elements contained by their own card's horizontal scroll — never let one drag the sidebar or page sideways (`SidebarInset` depends on this).

### Don't:
- **Don't** use the scaffolded `--chart-1`…`--chart-5` CSS variables for a new chart — they're unused grayscale placeholders. Use the real `EMERALD`/`SKY`/`AMBER`/`ROSE`/`VIOLET` constants.
- **Don't** add a decorative/ambient box-shadow anywhere — every shadow in this system does a specific job (the Flat Ledger Rule).
- **Don't** give a button or badge a card-sized radius, or a card a button-sized radius — see the Two-Tier Radius Rule.
- **Don't** phrase an auto-generated insight as a recommendation or prediction — PRODUCT.md's compliance constraint requires this content to read as observation, not advice.
- **Don't** reach for a second accent color for "this also matters" — that instinct is what the amber Insight Note and the chart-only palette already exist to serve; a second UI-chrome accent would break the One Signal Rule.
