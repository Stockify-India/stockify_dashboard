# Stockify Dashboard

A Next.js dashboard for stock and company analysis, built with shadcn/ui.

## Features

- **Dashboard** — overview charts and data tables
- **Company Analysis** — per-company deep dives
- **Peer Comparison** — compare companies side by side
- **Industry Research** — industry-level insights
- **Formulas & Template Analysis** — analysis formulas and templates
- **Personal Data Tracking** — track your own data/watchlist
- **Agent Discussion** — agent-driven discussion view

## Prerequisites

- [Node.js](https://nodejs.org/) 20 or later
- npm (bundled with Node.js)

## Getting started

1. Clone the repo and move into the app directory:

   ```bash
   git clone https://github.com/Stockify-India/stockify_dashboard.git
   cd stockify_dashboard/stockify
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the dev server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available scripts

Run these from the `stockify` directory:

| Command | Description |
| --- | --- |
| `npm run dev` | Start the app in development mode |
| `npm run build` | Build the app for production |
| `npm run start` | Run the production build |
| `npm run lint` | Lint the codebase |
| `npm run format` | Format code with Prettier |
| `npm run typecheck` | Type-check with TypeScript |

## Adding UI components

This project uses [shadcn/ui](https://ui.shadcn.com/). To add a new component:

```bash
npx shadcn@latest add button
```

Components are placed in the `components` directory and can be imported like:

```tsx
import { Button } from "@/components/ui/button"
```

## Project structure

```
stockify/
├── app/                # Routes (App Router)
├── components/         # Shared UI components
├── hooks/              # Custom React hooks
├── lib/                # Utilities
└── public/             # Static assets
```

## End-to-end testing (Playwright)

End-to-end tests live at the repo root, separate from the `stockify` app package.

1. Install root dependencies (from the repo root, not `stockify/`):

   ```bash
   npm install
   npx playwright install --with-deps
   ```

2. Run the tests:

   ```bash
   npx playwright test
   ```

3. View the HTML report after a run:

   ```bash
   npx playwright show-report
   ```

Test files live in `tests/` and configuration is in `playwright.config.ts`
(tests run against Chromium, Firefox, and WebKit). The `Playwright Tests`
GitHub Actions workflow (`.github/workflows/playwright.yml`) runs the suite
on every push and pull request to `main`/`master` and uploads the HTML
report as a build artifact.

A `@playwright/mcp` server is configured in `.mcp.json` so AI coding agents
(Claude Code, etc.) can drive a real browser — navigate, click, fill forms,
take screenshots — while working in this repo.

## AI agent configuration

This repo includes configuration for AI coding agents (Claude Code, Codex,
and compatible tools):

- `.claude/` — Claude Code project settings, custom subagents
  (`.claude/agents/`), and skills (`.claude/skills/`).
- `.agents/` / `.codex/` — equivalent skill and hook configuration for
  other agent runtimes.
- `skills-lock.json` — a lockfile pinning the installed skills to a source
  repo, path, and content hash, so skill installs are reproducible.

These directories configure how AI agents assist with this codebase (e.g.
UI/design skills, animation review, browser automation via Playwright) —
they are not part of the shipped Next.js application.
