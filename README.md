# Eidolon Development Setup

This repository is scaffolded as a small npm workspace monorepo:

- `apps/web`: React + TypeScript + Vite + Tailwind + shadcn-ready frontend
- `apps/api`: Hono on Cloudflare Workers
- `packages/db`: Drizzle schema and migration config for D1
- `packages/shared`: shared types and helpers for future cross-package reuse

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Start the app stack locally:

```bash
npm run dev
```

## Git setup

I initialized the local repository structure, but you still need to connect it to a remote you control.

Run these from the repo root when you are ready:

```bash
git remote add origin <your-remote-url>
git branch -M main
git push -u origin main
```

## Cloudflare setup

The Worker is wired for Cloudflare, but the account-specific resources still need to be created in your environment.

Run these after logging in with Wrangler:

```bash
npx wrangler login
npx wrangler d1 create eidolon-db
npx wrangler r2 bucket create eidolon-assets
npx wrangler vectorize create eidolon-embeddings
```

Copy the generated IDs into `apps/api/wrangler.jsonc` and add any secrets with `npx wrangler secret put`.

For the frontend, create a Cloudflare Pages project later and point it at `apps/web`.
