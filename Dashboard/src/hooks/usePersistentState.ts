import { useEffect, useState } from "react";
import { readFilters, writeFilters } from "../lib/cache";
import { FiltersState } from "../lib/types";

const DEFAULT_AGGREGATION: FiltersState["aggregation"] = "day";

const isoLocal = (d: Date) => {
  const pad = (n: number) => `${n}`.padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

const defaultDateRange = (): { from: string; to: string } => {
  const now = new Date();
  const from = new Date(now);
  from.setDate(now.getDate() - 30);
  return { from: isoLocal(from), to: isoLocal(now) };
};

export function usePersistentFilters() {
  const [filters, setFilters] = useState<FiltersState | null>(null);

  useEffect(() => {
    async function load() {
      const stored = await readFilters();
      if (stored) {
        setFilters(stored);
      } else {
        const { from, to } = defaultDateRange();
        setFilters({
          from,
          to,
          aggregation: DEFAULT_AGGREGATION,
          theme: "system",
        });
      }
    }
    load();
  }, []);

  const updateFilters = (next: FiltersState) => {
    setFilters(next);
    writeFilters(next).catch(() => {
      /* ignore cache write errors */
    });
  };

  return { filters, updateFilters };
}
