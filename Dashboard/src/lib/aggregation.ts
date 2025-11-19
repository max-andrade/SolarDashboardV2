import {
  startOfDay,
  startOfHour,
  startOfMonth,
  startOfWeek,
  format,
} from "date-fns";
import { AggregatedPoint, Aggregation, EnergyRecord } from "./types";

type BucketMap = Record<
  string,
  {
    date: Date;
    gridImport: number;
    gridExport: number;
    pvProduced: number;
    pvUsed: number;
    cost: number;
  }
>;

function getBucketStart(date: Date, aggregation: Aggregation): Date {
  switch (aggregation) {
    case "hour":
      return startOfHour(date);
    case "day":
      return startOfDay(date);
    case "week":
      return startOfWeek(date, { weekStartsOn: 1 }); // Monday
    case "month":
      return startOfMonth(date);
    case "raw":
    default:
      return date;
  }
}

function labelFor(date: Date, aggregation: Aggregation): string {
  switch (aggregation) {
    case "hour":
      return format(date, "MMM d HH:00");
    case "day":
      return format(date, "MMM d");
    case "week":
      return `Week of ${format(date, "MMM d")}`;
    case "month":
      return format(date, "MMM yyyy");
    case "raw":
    default:
      return format(date, "MMM d HH:mm");
  }
}

/**
 * Aggregate energy records into the requested bucket size.
 */
export function aggregateRecords(
  records: EnergyRecord[],
  aggregation: Aggregation
): AggregatedPoint[] {
  const buckets: BucketMap = {};
  for (const r of records) {
    const date = new Date(r.ts);
    const bucketStart = getBucketStart(date, aggregation);
    const key = bucketStart.toISOString();
    const pvUsed = Math.max(r.pv - r.export, 0);

    if (!buckets[key]) {
      buckets[key] = {
        date: bucketStart,
        gridImport: 0,
        gridExport: 0,
        pvProduced: 0,
        pvUsed: 0,
        cost: 0,
      };
    }

    buckets[key].gridImport += r.import;
    buckets[key].gridExport += r.export;
    buckets[key].pvProduced += r.pv;
    buckets[key].pvUsed += pvUsed;
    buckets[key].cost += r.cost;
  }

  return Object.values(buckets)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((b) => ({
      label: labelFor(b.date, aggregation),
      date: b.date,
      gridImport: Math.round(b.gridImport),
      gridExport: Math.round(b.gridExport),
      pvUsed: Math.round(b.pvUsed),
      pvProduced: Math.round(b.pvProduced),
      cost: Math.round(b.cost),
    }));
}
