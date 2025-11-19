import { addDays, startOfDay } from "date-fns";
import { EnergyRecord } from "./types";
import { getCachedDayKeys, getDayFromCache, setDayInCache, updateManifest } from "./cache";

const API_URL =
  "https://n8n.20.248.127.1.nip.io/webhook/FroniusData?from={FROM}&to={TO}";

const isoDateOnly = (date: Date) => date.toISOString().slice(0, 10);

async function fetchRange(from: Date, to: Date) {
  const url = API_URL.replace("{FROM}", from.toISOString()).replace("{TO}", to.toISOString());
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Failed to fetch data: ${resp.status}`);
  }
  const json = (await resp.json()) as EnergyRecord[];
  return json;
}

/**
 * Retrieve data for a range; pulls whole days and caches each day separately.
 * Returns consolidated records trimmed to the requested range.
 */
export async function getDataBetween(
  from: Date,
  to: Date,
  onChunk?: (dayKey: string, state: "cached" | "fetched") => void
): Promise<EnergyRecord[]> {
  const manifest = new Set(await getCachedDayKeys());
  const dayStart = startOfDay(from);
  const dayEnd = startOfDay(to);

  const days: Date[] = [];
  for (let d = dayStart; d <= dayEnd; d = addDays(d, 1)) {
    days.push(d);
  }

  const cachedDays: string[] = [];
  const missingRanges: { start: Date; end: Date }[] = [];

  let currentMissingStart: Date | null = null;

  for (const day of days) {
    const dayKey = isoDateOnly(day);
    if (manifest.has(dayKey)) {
      cachedDays.push(dayKey);
      if (currentMissingStart) {
        missingRanges.push({ start: currentMissingStart, end: day });
        currentMissingStart = null;
      }
    } else {
      if (!currentMissingStart) currentMissingStart = day;
    }
  }
  if (currentMissingStart) {
    missingRanges.push({ start: currentMissingStart, end: addDays(dayEnd, 1) });
  }

  const results: EnergyRecord[] = [];

  for (const dayKey of cachedDays) {
    const cached = await getDayFromCache(dayKey);
    if (cached && cached.length) {
      onChunk?.(dayKey, "cached");
      results.push(...cached);
    }
  }

  for (const range of missingRanges) {
    const fromRange = range.start;
    const toRange = range.end instanceof Date ? range.end : addDays(range.end, 1);
    const fetched = await fetchRange(fromRange, toRange);
    onChunk?.(isoDateOnly(fromRange), "fetched");

    // Split fetched data by day and cache per-day to keep manifest granularity
    const perDay: Record<string, EnergyRecord[]> = {};
    for (const rec of fetched) {
      const key = isoDateOnly(new Date(rec.ts));
      if (!perDay[key]) perDay[key] = [];
      perDay[key].push(rec);
    }
    for (const [key, records] of Object.entries(perDay)) {
      await setDayInCache(key, records);
      await updateManifest(key);
      results.push(...records);
    }
  }

  // Trim to the exact requested window (data comes in UTC)
  const fromMs = from.getTime();
  const toMs = to.getTime();
  return results.filter((r) => {
    const ts = new Date(r.ts).getTime();
    return ts >= fromMs && ts <= toMs;
  });
}
