const rawData = JSON.parse($input.first().json.data);
const tariff = $('Transform Config').first().json.tariff;
const data = calculateEnergyDeltas(rawData, tariff);
return data.sort((a, b) => {
    return new Date(a.Timestamp_UTC_ISO) - new Date(b.Timestamp_UTC_ISO);
});

/*
total = 0;
month.forEach(d => total += d.TotalCost_Cents);
console.log(total / 100);
*/


/**
 * Processes the cumulative energy data from the Fronius GetArchiveData.cgi API 
 * response to calculate energy deltas (production, import, export) for each 
 * 5-minute interval and calculate the total cost based on provided tariffs.
 *
 * @param {object} rawJsonPayload The JSON response object from the Fronius API.
 * @param {object} tariffs The tariff structure including rates, discount, and supply charge.
 * @returns {Array<object>} An array of objects containing chronological interval data and total cost.
 */
function calculateEnergyDeltas(rawJsonPayload, tariffs) {
    const outputData = [];

    // --- TARIFF HELPER FUNCTIONS ---
    
    /**
     * Determines the consumption rate (in Cents/Wh) for a given timestamp.
     * @param {Date} timestamp The date/time of the interval end.
     * @returns {number} The consumption tariff rate in Cents/Wh.
     */
    const getConsumptionRate = (timestamp) => {
        // Use toTimeString() to get the time in the Date object's local timezone (derived from StartDate offset)
        const timeStr = timestamp.toTimeString().substring(0, 5); // e.g., "05:30"
        
        // Find if the timestamp falls within any discounted window
        const window = tariffs.discountedWIndows.find(w => {
            return timeStr >= w.from && timeStr < w.to;
        });

        // Convert Cents/kWh to Cents/Wh
        const ratePerKWh = window ? window.tariffCents : tariffs.defaultTariffCents;
        return ratePerKWh / 1000;
    };
    
    // Convert supply charge to per-Wh unit (assuming tariffs.5MinutesSupplyChargeCents is Cents for 5 minutes)
    const fiveMinSupplyCharge = tariffs['5MinutesSupplyChargeCents'] || 0;
    
    // Convert Feed-in Tariff from Cents/kWh to Cents/Wh
    const feedInRatePerWh = (tariffs.feedInTariff || 0) / 1000;

    // --- 1. Locate Data Paths (Safely) ---
    const data = rawJsonPayload?.Body?.Data;
    if (!data) {
        console.error("Error: Missing 'Body.Data' in the payload.");
        return outputData;
    }

    const inverterKey = Object.keys(data).find(key => key.startsWith('inverter/'));
    const meterKey = Object.keys(data).find(key => key.startsWith('meter:'));

    if (!inverterKey || !meterKey) {
        console.error("Error: Could not find inverter or meter data paths.");
        return outputData;
    }

    const pvValues = data[inverterKey]?.Data?.EnergyReal_WAC_Sum_Produced?.Values;
    const exportValues = data[meterKey]?.Data?.EnergyReal_WAC_Minus_Absolute?.Values;
    const importValues = data[meterKey]?.Data?.EnergyReal_WAC_Plus_Absolute?.Values;
    
    // Determine the starting timestamp
    const startTimeISO = rawJsonPayload.Head.RequestArguments.StartDate;
    if (!startTimeISO) {
        console.error("Error: Missing StartDate in RequestArguments.");
        return outputData;
    }
    // The Date object created here maintains the local time zone offset specified in startTimeISO
    const startTimeMs = new Date(startTimeISO).getTime();

    // --- 2. Normalize and Sort Time Offsets ---
    const allOffsets = new Set([
        ...Object.keys(pvValues).map(Number),
        ...Object.keys(exportValues).map(Number),
        ...Object.keys(importValues).map(Number)
    ]);
    
    const sortedOffsets = Array.from(allOffsets).sort((a, b) => a - b);

    // --- 3. Process Data and Calculate Deltas ---
    
    const getEnergy = (values, offset) => {
        return +values[offset] || 0; 
    };

    let prevValues = {
        export: 0,
        import: 0
    };
    let previousOffset = 0;

    for (let i = 0; i < sortedOffsets.length; i++) {
        const currentOffset = sortedOffsets[i];
        
        if (previousOffset === 0) {
            prevValues.export = getEnergy(exportValues, currentOffset);
            prevValues.import = getEnergy(importValues, currentOffset);
            previousOffset = currentOffset;
            continue;
        }

        const currentTimestampMs = startTimeMs + (currentOffset * 1000);
        // intervalEndDate retains the offset and represents the time in the local timezone
        const intervalEndDate = new Date(currentTimestampMs); 
        const currentTimestampISO = intervalEndDate.toISOString(); // UTC ISO for output field

        // Get current values (PV is per-interval already)
        const currentPV = getEnergy(pvValues, currentOffset);
        const currentExport = getEnergy(exportValues, currentOffset);
        const currentImport = getEnergy(importValues, currentOffset);

        // Calculate raw deltas (import/export are cumulative so diff them)
        const rawDeltaExport = currentExport - prevValues.export;
        const rawDeltaImport = currentImport - prevValues.import;
        
        const intervalSeconds = currentOffset - previousOffset;

        // --- ENFORCEMENT & FORMATTING (Integer Wh and Non-Negative) ---
        const deltaExport = Math.round(Math.max(0, rawDeltaExport));
        const deltaImport = Math.round(Math.max(0, rawDeltaImport));

        // --- COST CALCULATION ---

        // 1. Calculate Grid Import Cost (Positive cost)
        const importRatePerWh = getConsumptionRate(intervalEndDate);
        const importCostCents = deltaImport * importRatePerWh;
        
        // 2. Calculate Grid Export Credit (Negative cost/credit)
        const exportCreditCents = deltaExport * feedInRatePerWh * -1;
        
        // 3. Calculate Supply Charge (Positive cost)
        // Scale the supply charge if the interval isn't exactly 5 minutes.
        const supplyChargeCents = fiveMinSupplyCharge * (intervalSeconds / 300);

        // 4. Apply Discount (Excludes supply charge)
        const totalEnergyCostBeforeDiscount = importCostCents;
        const discountFactor = (100 - (tariffs.discountPercentage || 0)) / 100;
        const discountedEnergyCost = totalEnergyCostBeforeDiscount * discountFactor;
        
        // Calculate the actual discount applied
        // This is necessary because the feed-in credit might make the net energy cost negative.
        const actualDiscountApplied = totalEnergyCostBeforeDiscount - discountedEnergyCost;

        // Calculate total cost (Import Cost + Export Credit + Supply Charge)
        const totalEnergyAndExport = importCostCents + exportCreditCents;
        const totalCostBeforeSupplyCharge = totalEnergyAndExport - actualDiscountApplied;
        const totalCostCents = totalCostBeforeSupplyCharge + supplyChargeCents;

        outputData.push({
            Timestamp_UTC_ISO: currentTimestampISO, 
            Interval_Seconds: intervalSeconds,
            
            PV_Production_Wh: currentPV,
            
            Grid_Export_Wh_Previous: prevValues.export,
            Grid_Export_Wh_Current: currentExport,
            Grid_Export_Wh: deltaExport,
            
            Grid_Import_Wh_Previous: prevValues.import,
            Grid_Import_Wh_Current: currentImport,
            Grid_Import_Wh: deltaImport,
            
            // New field for total cost (positive if owed, negative if credit)
            TotalCost_Cents: totalCostCents
        });

        // Update previous values for the next iteration 
        prevValues.export = currentExport;
        prevValues.import = currentImport;
        previousOffset = currentOffset;
    }

    return outputData;
}
