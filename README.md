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
