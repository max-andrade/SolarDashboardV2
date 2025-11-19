import { clear, del, get, set } from "idb-keyval";
import { EnergyRecord, FiltersState } from "./types";

const DATA_KEY_PREFIX = "fronius-day-";
const FILTERS_KEY = "fronius-filters";
const MANIFEST_KEY = `${DATA_KEY_PREFIX}manifest`;

const keyForDay = (day: string) => `${DATA_KEY_PREFIX}${day}`;

export async function readFilters(): Promise<FiltersState | undefined> {
  return get(FILTERS_KEY);
}

export async function writeFilters(filters: FiltersState) {
  return set(FILTERS_KEY, filters);
}

export async function getDayFromCache(dayKey: string) {
  return get<EnergyRecord[]>(keyForDay(dayKey));
}

export async function setDayInCache(dayKey: string, records: EnergyRecord[]) {
  return set(keyForDay(dayKey), records);
}

export async function getCachedDayKeys(): Promise<string[]> {
  // idb-keyval doesn't expose iteration; rely on known prefix set.
  // Keep a simple manifest list under a well-known key to avoid iteration APIs.
  const manifest = await get<string[]>(MANIFEST_KEY);
  if (manifest) return manifest;
  return [];
}

export async function updateManifest(dayKey: string) {
  const manifest = (await get<string[]>(MANIFEST_KEY)) ?? [];
  if (!manifest.includes(dayKey)) {
    manifest.push(dayKey);
    await set(MANIFEST_KEY, manifest);
  }
}

export async function clearDataCache() {
  const manifest = (await get<string[]>(MANIFEST_KEY)) ?? [];
  await Promise.all(manifest.map((dayKey) => del(keyForDay(dayKey))));
  await del(MANIFEST_KEY);
}

export async function clearAllCache() {
  await clear();
}
