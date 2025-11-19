## Repository overview

This repo demonstrates an end‑to‑end energy data pipeline using n8n workflows, a Fronius inverter/datamanager, and a Next.js dashboard. It includes containerization assets for Azure Container Instances, automation workflows, a web UI, and sample data/fixtures.

### Folder map
- `Containers/`: Docker setup used to run the n8n workflow stack in Azure Container Instances.
- `Workflows/`: Two n8n workflows for Fronius integration.
  - `FroniusDataIngestion.json`: Daily import and pre-processing of PV/meter data, including interval aggregation and tariff-based cost calculations (peak/off-peak/shoulder, discounts, export rate).
  - `FroniusDataAPI.json`: HTTP API that serves the pre-processed data to the dashboard.
- `Dashboard/`: Next.js (App Router) UI for querying and visualizing inverter/datamanager data via the API.
- `SampleData/`: Example datasets used for development and testing.

**Data API:** `https://n8n.20.248.127.1.nip.io/webhook/FroniusData?from=2025-11-17T22:40:00Z&to=2025-11-18T22:40:00Z` (use ISO/UTC for `from`/`to`).

### Key files
- `SampleData/SampleData.json`: Sample formatted dataset.
- `SampleData/FroniusSampleData.json`: Raw source data from Fronius.
- `SampleData/PowerConsumptionTableSampleData.json`: Historical table snapshot.
- `Workflows/Config/TariffConfig.json`: Tariff configuration for ingestion.
- `DataImport.js`: Transformation logic used by the ingestion workflow.

# Dashboard (Next.js + MUI + Tailwind)
A new dashboard lives in `/dashboard` (Next.js app router, TypeScript, MUI, Tailwind, Recharts, IndexedDB caching).

## Features
- Filters with persisted state (date range, aggregation; defaults to last 30 days, daily).
- Stacked bar chart: grid import, grid export, PV used on-site; toggle to cost view. Tooltips include cost and units (kWh when daily/weekly/monthly, Wh otherwise).
- Summary cards (“period in a nutshell”) using kWh for daily or coarser aggregations.
- Local cache for filter preferences and per-day API responses in IndexedDB; a simple loading bar shows when cache/network is being queried.
- CSV export of the aggregated view.
- Theming with system/light/dark and preference persistence.
- Settings drawer with theme selection, API base override (defaults to `NEXT_PUBLIC_API_URL` or the nip.io URL), and cache resets (data-only or full).
- Auto-adjust aggregation based on range (<=24h raw, <=72h hourly, otherwise daily); raw view limits render to the latest 500 points.
- Abortable fetches with basic date validation; chart shows a shimmer skeleton while loading.

## Run locally
```bash
cd dashboard
npm install   # already run once, but safe
npm run dev   # open http://localhost:3000
```

## Notes on data
- API responses are assumed to match `SampleData/SampleData.json` shape:
  - `ts` (ISO), `import` (Wh), `export` (Wh), `pv` (Wh), `cost` (cents; can be negative).
- Aggregations sum energy and cost; PV used is `max(pv - export, 0)` per bucket. When aggregation is daily or coarser, energy displays in kWh; otherwise Wh.
- Date inputs/visuals use local time; API stays UTC (`Z` timestamps) in query params. Fetching batches contiguous missing ranges and caches per-day slices for reuse.
- IndexedDB errors are tolerated during fetch; fallback continues without cache.

## TODOs (dashboard)
- Add runtime response validation (e.g., Zod) and structured error logging for API fetches.
- Introduce ErrorBoundary for the app and unit tests for `aggregateRecords`, `getDataBetween`, and cache helpers.
- Document/decide final timezone bucketing strategy (currently UI local for inputs/labels, UTC for API).
