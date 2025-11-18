# Repository Guidelines

## Project Structure & Module Organization
- Source logic: `DataImport.js` (n8n Function/Code node script).
- Sample inputs: `FroniusSampleData.json` (raw API), `SampleData.json` (formatted example).
- Tariffs/config: `TariffConfig.json` (consumption, feed-in, supply charge, windows).
- Docs: `readme.md` (workflow background and API example).

Expected usage: `DataImport.js` runs inside n8n, consuming the first input item (`$input.first().json.data`) and a config item from a node named `Transform Config`.

## Build, Test, and Development Commands
This repo has no build system. Useful local checks:
- Quick JSON validation: `node -e "JSON.parse(require('fs').readFileSync('TariffConfig.json','utf8'))"`
- Node REPL experiment: `node` then `const raw=require('./FroniusSampleData.json');`
When testing `DataImport.js` locally, wrap it in a small harness that mocks `$input` and `$()`.

## Coding Style & Naming Conventions
- Language: JavaScript (ES2019+), running inside n8n.
- Indentation: 2 spaces; max line length ~100 chars.
- Naming: camelCase for variables/functions; UPPER_SNAKE for constants; JSON keys match API.
- Avoid side effects (only return transformed data). Prefer pure helpers.
- Comments: JSDoc for public helpers; brief inline notes only when non-obvious.

## Testing Guidelines
- Unit shape: pure helpers like `calculateEnergyDeltas()` should be testable with plain JS objects.
- Inputs: mimic `Body.Data` structure from `FroniusSampleData.json` and a tariff object from `TariffConfig.json`.
- Golden samples: keep small fixtures under `testdata/` (add if needed) and compare totals (e.g., sum of `TotalCost_Cents`).
- Run: use `node` + a simple harness; add console assertions. Aim for clear pass/fail output.

## Commit & Pull Request Guidelines
- Commits: use Conventional Commits (feat, fix, refactor, docs, chore). Scope examples: `transform`, `tariff`, `docs`.
  - Example: `fix(transform): handle non‑decreasing PV values`
- PRs: include purpose, before/after behavior, test notes, and any data/edge cases. Attach sample input/output snippets.

## Security & Configuration Tips
- Validate all tariff fields exist; default missing numeric fields to 0.
- Time handling: `StartDate` carries timezone; output uses UTC ISO. Be explicit in docs.
- n8n node names are significant (e.g., `Transform Config`); keep them consistent or adjust lookups accordingly.
