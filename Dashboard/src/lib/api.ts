import { addDays, formatISO, startOfDay } from "date-fns";
import { EnergyRecord } from "./types";
import { getDayFromCache, setDayInCache, updateManifest } from "./cache";

const API_URL =
  "https://n8n.20.248.127.1.nip.io/webhook/FroniusData?from={FROM}&to={TO}";

const isoDateOnly = (date: Date) => date.toISOString().slice(0, 10);

async function fetchDayRange(dayStart: Date, dayEnd: Date) {
  const from = formatISO(dayStart);
  const to = formatISO(dayEnd);
  const url = API_URL.replace("{FROM}", from).replace("{TO}", to);
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
  const dayStart = startOfDay(from);
  const dayEnd = startOfDay(to);

  const days: Date[] = [];
  for (let d = dayStart; d <= dayEnd; d = addDays(d, 1)) {
    days.push(d);
  }

  const results: EnergyRecord[] = [];

  for (const day of days) {
    const dayKey = isoDateOnly(day);
    const cached = await getDayFromCache(dayKey);
    if (cached && cached.length) {
      onChunk?.(dayKey, "cached");
      results.push(...cached);
      continue;
    }

    const dayEndExclusive = addDays(day, 1);
    const fetched = await fetchDayRange(day, dayEndExclusive);
    onChunk?.(dayKey, "fetched");
    await setDayInCache(dayKey, fetched);
    await updateManifest(dayKey);
    results.push(...fetched);
  }

  // Trim to the exact requested window (data comes in UTC)
  const fromMs = from.getTime();
  const toMs = to.getTime();
  return results.filter((r) => {
    const ts = new Date(r.ts).getTime();
    return ts >= fromMs && ts <= toMs;
  });
}
