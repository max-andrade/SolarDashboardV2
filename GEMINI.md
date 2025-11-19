# Project Overview

This repository demonstrates an end-to-end energy data pipeline using n8n workflows, a Fronius inverter/datamanager, and a Next.js dashboard. It includes containerization assets for Azure Container Instances, automation workflows, a web UI, and sample data/fixtures.

## Folder Map

*   `/Containers`: Docker setup used to run the n8n workflow stack in Azure Container Instances.
*   `/Workflows`: Two n8n workflows for Fronius integration.
    *   `FroniusDataIngestion.json`: Daily import and pre-processing of PV/meter data, including interval aggregation and tariff-based cost calculations (peak/off-peak/shoulder, discounts, export rate).
    *   `FroniusDataAPI.json`: HTTP API that serves the pre-processed data to the dashboard.
*   `/Dashboard`: Next.js (App Router) UI for querying and visualizing inverter/datamanager data via the API.
*   `/SampleData`: Example datasets used for development and testing.

**Data API:** `https://n8n.20.248.127.1.nip.io/webhook/FroniusData?from=2025-11-17T22:40:00Z&to=2025-11-18T22:40:00Z` (use ISO/UTC for `from`/`to`).

## Key Files

*   `SampleData/SampleData.json`: Sample formatted dataset.
*   `SampleData/FroniusSampleData.json`: Raw source data from Fronius.
*   `SampleData/PowerConsumptionTableSampleData.json`: Historical table snapshot.
*   `Workflows/Config/TariffConfig.json`: Tariff configuration for ingestion.
*   `Workflows/JS/DataImport.js`: Transformation logic used by the ingestion workflow.

# Dashboard (Next.js + MUI + Tailwind)

A new dashboard lives in `/dashboard` (Next.js app router, TypeScript, MUI, Tailwind, Recharts, IndexedDB caching).

## Features

*   Filters with persisted state (date range, aggregation; defaults to last 30 days, daily).
*   Stacked bar chart: grid import, grid export, PV used on-site; toggle to cost view. Tooltips include cost and units (kWh when daily/weekly/monthly, Wh otherwise).
*   Summary cards ("period in a nutshell") using kWh for daily or coarser aggregations.
*   Local cache for filter preferences and per-day API responses in IndexedDB; a simple loading bar shows when cache/network is being queried.
*   CSV export of the aggregated view.
*   Theming with system/light/dark and preference persistence.
*   Settings drawer with theme selection and cache resets (data-only or full).
*   Auto-adjust aggregation based on range (<=24h raw, <=72h hourly, otherwise daily); raw view limits render to the latest 500 points.
*   Abortable fetches with basic date validation; chart shows a shimmer skeleton while loading.

## Building and Running

### Dashboard (Next.js Application)

To run the Next.js dashboard locally, navigate to the `Dashboard` directory and use the following commands:

*   **Install Dependencies:**
    ```bash
    cd dashboard
    npm install
    ```
*   **Run in Development Mode:**
    ```bash
    npm run dev   # open http://localhost:3000
    ```

### Data Processing Script (`Workflows/JS/DataImport.js`)

This script is part of the n8n workflow (`FroniusDataIngestion.json`). Its execution is managed by n8n.

**Usage within n8n:**

The script reads raw data from an `$input` variable and tariff configuration from a `'Transform Config'` variable (likely within the n8n context). It then processes this data to calculate energy deltas and costs.

## Development Conventions

*   **Next.js/React Best Practices:** The `Dashboard` project follows standard Next.js and React conventions, utilizing functional components, hooks, and a component-based architecture.
*   **TypeScript:** The `Dashboard` uses TypeScript for type safety.
*   **Material UI & Tailwind CSS:** The `Dashboard` uses Material UI for components and Tailwind CSS for styling, ensuring a consistent and modern UI.
*   **API Interaction:** The `Dashboard` interacts with a backend API (served by `FroniusDataAPI.json` via n8n) for data retrieval, with client-side caching implemented for performance using IndexedDB.
*   **Data Processing Logic:** The `Workflows/JS/DataImport.js` script contains detailed logic for transforming raw energy data, including handling cumulative values and applying complex tariff calculations.
*   **Environment Variables:** Client traffic calls a local Next.js proxy at `/api/data`. Upstream n8n URL and API key are provided via server environment variables `POWER_DATA_API_URL` and `POWER_DATA_API_KEY` (not exposed client-side).

## TODOs (dashboard)

*   Add runtime response validation (e.g., Zod) and structured error logging for API fetches.
*   Introduce ErrorBoundary for the app and unit tests for `aggregateRecords`, `getDataBetween`, and cache helpers.
