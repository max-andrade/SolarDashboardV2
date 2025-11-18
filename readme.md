Background: This folder contains relevant files used by two n8n workflows. The first one runs on a schedule and extracts energy consumption/generation data from a Fronius datamanager and transforms it into a more reusable format for energy consumption information. The second one exposes an API to query this process data by data range.


Data Retrieval API: https://n8n.20.248.127.1.nip.io/webhook/FroniusData?from=2025-11-17T22:40:00Z&to=2025-11-18T22:40:00Z
NOTE: where to and from are in UTC

Relevant Files:
Sample data found under:  /SampleData.json
Fronious Import Transformation Logic: /DataImport.js
Sample Source Fronius Data: /FroniusSampleData.json
Tariff Calculation Config File: /TariffCOnfig.json