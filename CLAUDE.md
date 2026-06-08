# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**CÍCLICO · El Mundial de los Datos 2026** — A Spanish-language interactive data dashboard that reimagines the 2026 FIFA World Cup as if countries competed on socioeconomic metrics instead of goals. The tournament covers only **4 groups (A, B, C, J) with 16 countries** — not the full 48-team tournament.

## Commands

```bash
npm run dev        # Start dev server (http://localhost:5173)
npm run build      # Production build (outputs to build/)
npm run preview    # Preview production build
npm run check      # TypeScript + Svelte type checking
npm run check:watch  # Type checking in watch mode
```

No test suite. Type checking (`npm run check`) is the primary correctness tool.

## Architecture

SvelteKit app (Svelte 5) with `@sveltejs/adapter-node`. All data is static — no backend, no API calls. Source imports use the `$lib/` alias for `src/lib/`.

**Data layer** (`src/lib/data.ts`):
- `COUNTRIES` — one entry per country with all metric fields (`pobreza`, `gini`, `pisa`, `aprobacion`, `prensa`, `pib`, `cerveza`, `feriados`) plus qualitative fields (`govt`, `leader`, `autocracy`, `economia`, `relacion`, `politico`)
- `GROUPS` — maps group keys to `{ name, countries[] }`
- `VARIABLES` — nested `{ cats: [{ label, vars: Variable[] }] }` structure; each `Variable` has `id`, `dir` (`'asc'|'desc'`), `unit`, `desc`, and optional `locked`
- `EDITORIAL` — per-group editorial commentary, keyed `[varId][groupKey]`
- `MATCHES` — schedule entries with `date`, `time`, `home`, `away`, `venue`, optional `arge` flag (marks Argentina matches for highlighting)
- `STATS_DATA` — editorial stat cards for the Estadísticas section
- `getMetric(country, varId)` — helper to read a metric by string id

**Types** (`src/lib/types.ts`): `Country`, `Match`, `Variable`, `VariableCategory`, `Group`, `StatCard`

**Stores** (`src/lib/stores.ts`):
- `currentVar` — the active metric id (default `'aprobacion'`), shared across routes
- `fixtureResults` — persisted to `localStorage`, maps match ids to winner codes

**Routes** (all in `src/routes/`):
- `/` (`+page.svelte`) — landing/home
- `/datos` — main group tables, sorted by the selected variable; the core interactive view
- `/fixture` — bracket/fixture simulator using `fixtureResults` store
- `/paises` — country cards with modal detail view
- `/calendario` — match schedule with live countdown
- `/ciudades` — host cities
- `/stats` — editorial stat cards

Navigation and global CSS live in `+layout.svelte` and `src/app.css`. Static assets (images, logo) in `static/`.

## CSS Design System

All styles are in `src/app.css` and component `<style>` blocks. Use the CSS variables and shared classes — do not hardcode colors or spacing.

**CSS variables** (defined in `:root`):
- `--orange` / `--orange-dim` — brand accent
- `--bg` / `--bg-card` / `--bg-card2` — background layers
- `--border` — subtle borders
- `--text` / `--muted` — foreground text
- `--green` / `--red` — positive/negative indicators

**Shared utility classes** (defined globally in `app.css`):
- `.section` — page wrapper with max-width and padding
- `.section-hero-label` / `.section-title` / `.section-subtitle` — standard page header trio
- `.card` — bordered card with hover effect
- `.filter-btn` — pill-shaped filter toggle

**Fonts**: `Instrument Sans` (body), `Inter` (headings/UI — `.inter`, `h1–h3`), `DM Mono` (numbers — `.mono`)

## Adding / Updating Data

- **New country**: add to `COUNTRIES` with all metric fields, add its code to `GROUPS[key].countries`, and add its matches to `MATCHES`.
- **New metric**: add to `VARIABLES.cats[n].vars`, add the field to every country in `COUNTRIES` and to the `Country` interface in `types.ts`, and add editorial commentary for each group in `EDITORIAL`.
- **Locked variables** (the "picantes" category): set `locked: true` in the variable definition; `/datos` renders them with a lock icon and disables clicks.
- **Sort direction**: `dir: 'desc'` means higher is better (e.g. PIB); `dir: 'asc'` means lower is better (e.g. pobreza). This affects both sort order and the bar width calculation in `calcBar()` in `/datos`.
