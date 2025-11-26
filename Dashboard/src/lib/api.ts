import { addDays, startOfDay } from "date-fns";
import { EnergyRecord } from "./types";
import { getCachedDayKeys, getDayFromCache, setDayInCache, updateManifest } from "./cache";

const isoDateOnly = (date: Date) => date.toISOString().slice(0, 10);

function buildUrl(from: Date, to: Date) {
  const base = "/api/data";
  const fromIso = encodeURIComponent(from.toISOString());
  const toIso = encodeURIComponent(to.toISOString());
  return `${base}?from=${fromIso}&to=${toIso}`;
}

async function fetchRange(from: Date, to: Date, signal?: AbortSignal) {
  const url = buildUrl(from, to);
  const resp = await fetch(url, { signal });
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
  options?: {
    onChunk?: (dayKey: string, state: "cached" | "fetched") => void;
    signal?: AbortSignal;
  }
): Promise<EnergyRecord[]> {
  if (!(from instanceof Date) || Number.isNaN(from.getTime())) {
    throw new Error("Invalid from date");
  }
  if (!(to instanceof Date) || Number.isNaN(to.getTime())) {
    throw new Error("Invalid to date");
  }
  if (from > to) {
    throw new Error("From date must be before To date");
  }

  let manifest: Set<string>;
  try {
    manifest = new Set(await getCachedDayKeys());
  } catch {
    // If cache is unavailable, continue without it.
    manifest = new Set();
  }
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
    try {
      const cached = await getDayFromCache(dayKey);
      if (cached && cached.length) {
        options?.onChunk?.(dayKey, "cached");
        results.push(...cached);
      }
    } catch {
      // Ignore cache read failures and continue to fetch missing ranges.
    }
  }

  for (const range of missingRanges) {
    const fromRange = range.start;
    const toRange = range.end instanceof Date ? range.end : addDays(range.end, 1);
    const fetched = await fetchRange(fromRange, toRange, options?.signal);
    options?.onChunk?.(isoDateOnly(fromRange), "fetched");

    // Split fetched data by day and cache per-day to keep manifest granularity
    const perDay: Record<string, EnergyRecord[]> = {};
    for (const rec of fetched) {
      const key = isoDateOnly(new Date(rec.ts));
      if (!perDay[key]) perDay[key] = [];
      perDay[key].push(rec);
    }
    for (const [key, records] of Object.entries(perDay)) {
      try {
        await setDayInCache(key, records);
        await updateManifest(key);
      } catch {
        // Cache write failures should not block data availability.
      }
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
