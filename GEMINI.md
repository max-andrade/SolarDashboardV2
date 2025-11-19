# Project Overview

This repository contains a mixed project primarily focused on energy data monitoring and analysis. It includes a Next.js-based web dashboard for visualizing solar and energy data, along with a standalone JavaScript script for processing raw energy data and calculating associated costs based on tariff configurations.

## Components:

1.  **Dashboard (Next.js Application):**
    *   **Purpose:** A web-based "Solar/Energy Dashboard" for displaying aggregated energy data, summary cards, and interactive charts.
    *   **Technologies:** Next.js, React, Material UI, Recharts (for charting), date-fns, idb-keyval (for client-side caching).
    *   **Architecture:** It fetches energy data from an API, aggregates it, and presents it to the user. Client-side caching is implemented to optimize data retrieval. Users can filter data, export it, and configure various settings including API base URL and theme.
    *   **Location:** `Dashboard/` directory.

2.  **Data Processing Script (`DataImport.js`):**
    *   **Purpose:** A standalone JavaScript script responsible for processing raw cumulative energy data (likely from a Fronius inverter/meter API) to calculate per-interval energy deltas (PV production, grid import, grid export) and the total cost based on defined tariffs.
    *   **Functionality:**
        *   Extracts PV production, grid export, and grid import values from raw API payloads.
        *   Calculates energy deltas for each time interval.
        *   Applies a tariff structure, including default consumption rates, discounted windows, feed-in tariffs, and supply charges.
        *   Handles chronological sorting and ensures non-negative energy deltas.
    *   **Location:** `DataImport.js` at the root.

3.  **Configuration and Data Files:**
    *   **`TariffConfig.json`:** Defines the tariff structure used by `DataImport.js` for cost calculations, including default rates, discounted periods, feed-in tariffs, and supply charges.
    *   **`SampleData/`:** Contains sample JSON data, likely used for testing or demonstration of the data processing and dashboard functionalities.
    *   **`Workflows/`:** Contains JSON files that seem to define data API and ingestion workflows, potentially related to how data is sourced or processed before reaching the `DataImport.js` script or the Dashboard's API.
    *   **`src/lib/config.ts` (root and Dashboard):** Configuration files for various settings, including API base URLs.

## Building and Running

### Dashboard (Next.js Application)

To run the Next.js dashboard, navigate to the `Dashboard` directory and use the following commands:

*   **Install Dependencies:**
    ```bash
    npm install
    ```
*   **Run in Development Mode:**
    ```bash
    npm run dev
    ```
    This will start the development server, usually on `http://localhost:3000`.
*   **Build for Production:**
    ```bash
    npm run build
    ```
*   **Start Production Server:**
    ```bash
    npm run start
    ```
*   **Linting:**
    ```bash
    npm run lint
    ```

### Data Processing Script (`DataImport.js`)

The `DataImport.js` script is designed to be executed in an environment where `$input` and `'Transform Config'` are available, likely a custom data processing pipeline or a specific tool that injects these variables.

**Usage:**

The script reads raw data from `$input` and tariff configuration from `'Transform Config'`. It then returns an array of processed energy records with cost calculations.

```javascript
const rawData = JSON.parse($input.first().json.data);
const tariff = $('Transform Config').first().json.tariff;
const data = calculateEnergyDeltas(rawData, tariff);
// ... script continues with sorting and returning data
```

**To run this script directly, you would need to simulate the `$input` and `'Transform Config'` context.** This typically means providing the raw JSON energy data and the tariff configuration (e.g., from `TariffConfig.json`) as inputs to the script's execution environment.

## Development Conventions

*   **Next.js/React Best Practices:** The `Dashboard` project follows standard Next.js and React conventions, utilizing functional components, hooks, and a component-based architecture.
*   **TypeScript:** Both the `Dashboard` and some utility files use TypeScript for type safety.
*   **Material UI:** The `Dashboard` uses Material UI for its component library, ensuring a consistent and modern UI.
*   **API Interaction:** The `Dashboard` interacts with a backend API for data retrieval, with client-side caching implemented for performance.
*   **Data Processing Logic:** The `DataImport.js` script contains detailed logic for transforming raw energy data, including handling cumulative values and applying complex tariff calculations.

This `GEMINI.md` provides a foundational understanding of the project. For deeper insights into specific functionalities or components, refer to the individual source files and their respective documentation (if any).
