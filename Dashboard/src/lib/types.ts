export type EnergyRecord = {
  ts: string; // ISO string
  import: number; // Wh from grid
  export: number; // Wh to grid
  pv: number; // Wh produced
  cost: number; // cents (can be negative)
};

export type Aggregation =
  | "raw"
  | "hour"
  | "day"
  | "week"
  | "month";

export type FiltersState = {
  from: string; // ISO string
  to: string; // ISO string
  aggregation: Aggregation;
  theme: "light" | "dark" | "system";
};

export type AggregatedPoint = {
  label: string;
  date: Date;
  gridImport: number;
  gridExport: number;
  pvUsed: number;
  pvProduced: number;
  cost: number;
};
