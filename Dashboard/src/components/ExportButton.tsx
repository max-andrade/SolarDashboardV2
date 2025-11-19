"use client";

import { Button } from "@mui/material";
import { AggregatedPoint } from "../lib/types";
import { unparse } from "papaparse";

type Props = {
  points: AggregatedPoint[];
};

export function ExportButton({ points }: Props) {
  const handleExport = () => {
    const rows = points.map((p) => ({
      label: p.label,
      date: p.date.toISOString(),
      gridImport_Wh: p.gridImport,
      gridExport_Wh: p.gridExport,
      pvUsed_Wh: p.pvUsed,
      pvProduced_Wh: p.pvProduced,
      cost_cents: p.cost,
    }));
    const csv = unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "energy-dashboard.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outlined" size="small" onClick={handleExport} disabled={!points.length}>
      Export CSV
    </Button>
  );
}
