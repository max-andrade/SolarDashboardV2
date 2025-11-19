# Repository Guidelines

## Project Structure & Module Organization
- Source logic: `DataImport.js` (n8n Function/Code node script).
- Sample inputs: `SampleData/FroniusSampleData.json` (raw API), `SampleData/SampleData.json` (formatted example).
- Tariffs/config: `TariffConfig.json` (consumption, feed-in, supply charge, windows).
- Docs: `readme.md` (workflow background, API example, dashboard notes).
- Dashboard app: `dashboard/` (Next.js App Router, TypeScript, Tailwind, MUI, Recharts, IndexedDB cache).

Expected usage: `DataImport.js` runs inside n8n, consuming the first input item (`$input.first().json.data`) and a config item from a node named `Transform Config`.

## Build, Test, and Development Commands
- n8n script quick checks: `node -e "JSON.parse(require('fs').readFileSync('TariffConfig.json','utf8'))"`
- Node REPL experiment: `node` then `const raw=require('./SampleData/FroniusSampleData.json')`
- Local harness for `DataImport.js`: mock `$input`/`$()` and call `calculateEnergyDeltas`.
- Dashboard:
  - `cd dashboard && npm install`
  - `npm run dev` to run locally; `npm run lint` for checks.

## Coding Style & Naming Conventions
- Language: JavaScript (ES2019+) for n8n; TypeScript/React for dashboard.
- Indentation: 2 spaces; max line length ~100 chars.
- Naming: camelCase for variables/functions; UPPER_SNAKE for constants; JSON keys match API/dashboard data shape.
- Comments: JSDoc for public helpers; inline comments only for non-obvious logic.

## Testing Guidelines
- Pure helper focus: `calculateEnergyDeltas()` test with fixtures; compare sums (e.g., `TotalCost_Cents`).
- Keep small fixtures under `SampleData/`; console-based assertions are fine.
- Dashboard: rely on `npm run lint` and lightweight manual verification (filters, caching, theming).

## Commit & Pull Request Guidelines
- Use Conventional Commits (`feat`, `fix`, `refactor`, `docs`, `chore`). Example: `fix(transform): scale supply charge by interval`.
- PRs: describe purpose, behavior before/after, test notes, data edge cases (missing tariff fields, variable intervals).

## Security & Configuration Tips
- Validate tariff fields; default missing numeric fields to 0.
- Time handling: `StartDate` carries timezone; output uses UTC ISO. UI uses local display; API queries stay UTC.
- n8n node names are significant (e.g., `Transform Config`); keep them consistent or adjust lookups.
- Dashboard data expectations: API returns `{ ts, import, export, pv, cost }` (Wh/cents). Aggregations sum values; PV used is `max(pv - export, 0)`. IndexedDB caches per-day fetches with a manifest key.
