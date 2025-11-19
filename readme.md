Background: This folder contains relevant files used by two n8n workflows. The first one runs on a schedule and extracts energy consumption/generation data from a Fronius datamanager and transforms it into a more reusable format for energy consumption information. The second one exposes an API to query this process data by data range.


Data Retrieval API: https://n8n.20.248.127.1.nip.io/webhook/FroniusData?from=2025-11-17T22:40:00Z&to=2025-11-18T22:40:00Z
NOTE: where to and from are in UTC

Relevant Files:
Sample data found under:  SampleData/SampleData.json
Fronious Import Transformation Logic: /DataImport.js
Sample Source Fronius Data: SampleData/FroniusSampleData.json
Tariff Calculation Config File: /TariffCOnfig.json
Sample Data Currently stored in the PowerConsumptionTable (all historical data): SampleData/PowerConsumptionTableSampleData.json

# Dashboard (Next.js + MUI + Tailwind)
A new dashboard lives in `/dashboard` (Next.js app router, TypeScript, MUI, Tailwind, Recharts, IndexedDB caching).

## Features
- Filters with persisted state (date range, aggregation; defaults to last 30 days, daily).
- Stacked bar chart: grid import, grid export, PV used on-site; toggle to cost view. Tooltips include cost and units (kWh when daily/weekly/monthly, Wh otherwise).
- Summary cards (“period in a nutshell”) using kWh for daily or coarser aggregations.
- Local cache for filter preferences and per-day API responses in IndexedDB; a simple loading bar shows when cache/network is being queried.
- CSV export of the aggregated view.
- Theming with system/light/dark and preference persistence.

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
