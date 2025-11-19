"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { AggregatedPoint, Aggregation } from "../lib/types";

type Props = {
  points: AggregatedPoint[];
  mode: "energy" | "cost";
  onModeChange: (mode: "energy" | "cost") => void;
  aggregation: Aggregation;
};

const useKWh = (aggregation: Aggregation) =>
  aggregation === "day" || aggregation === "week" || aggregation === "month";

type EnergyTooltipProps = {
  active?: boolean;
  payload?: EnergyPayloadEntry[];
  label?: string;
  unitLabel: string;
};

type EnergyPayloadEntry = {
  dataKey?: string | number;
  value?: number | string;
  payload?: {
    gridImport?: number;
    gridExport?: number;
    pvUsed?: number;
    cost?: number;
  };
};

function EnergyTooltip({
  active,
  payload,
  label,
  unitLabel,
}: EnergyTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const base = (payload[0] as EnergyPayloadEntry)?.payload ?? {};
  const costDollars = ((base?.cost ?? 0) as number) / 100;
  return (
    <Box sx={{ p: 1, bgcolor: "background.paper", border: "1px solid", borderColor: "divider" }}>
      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="body2">
        Grid Import: {base?.gridImport?.toLocaleString()} {unitLabel}
      </Typography>
      <Typography variant="body2">
        Grid Export: {base?.gridExport?.toLocaleString()} {unitLabel}
      </Typography>
      <Typography variant="body2">
        PV Used: {base?.pvUsed?.toLocaleString()} {unitLabel}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.5 }}>
        Total Cost: ${costDollars.toFixed(2)}
      </Typography>
    </Box>
  );
}

export function EnergyChart({ points, mode, onModeChange, aggregation }: Props) {
  const kwh = useKWh(aggregation);
  const data =
    mode === "energy"
      ? points.map((p) => ({
          label: p.label,
          gridImport: kwh ? p.gridImport / 1000 : p.gridImport,
          gridExport: kwh ? p.gridExport / 1000 : p.gridExport,
          pvUsed: kwh ? p.pvUsed / 1000 : p.pvUsed,
          cost: p.cost,
        }))
      : points.map((p) => ({
          label: p.label,
          cost: p.cost / 100, // convert cents to dollars for display
        }));

  const unitLabel = kwh ? "kWh" : "Wh";

  return (
    <Box sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6">Energy vs PV</Typography>
        <ToggleButtonGroup
          value={mode}
          exclusive
          size="small"
          onChange={(_, val) => val && onModeChange(val)}
        >
          <ToggleButton value="energy">Energy</ToggleButton>
          <ToggleButton value="cost">Cost</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <ResponsiveContainer width="100%" height={420}>
        {mode === "energy" ? (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" interval="preserveStartEnd" />
            <YAxis />
            <Tooltip content={<EnergyTooltip unitLabel={unitLabel} />} />
            <Legend />
            <Bar
              dataKey="gridImport"
              name={`Grid Import (${unitLabel})`}
              stackId="energy"
              fill="#1976d2"
            />
            <Bar
              dataKey="gridExport"
              name={`Grid Export (${unitLabel})`}
              stackId="energy"
              fill="#ef6c00"
            />
            <Bar
              dataKey="pvUsed"
              name={`PV Used (${unitLabel})`}
              stackId="energy"
              fill="#2e7d32"
            />
            <Bar dataKey="cost" hide />
          </BarChart>
        ) : (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" interval="preserveStartEnd" />
            <YAxis />
            <Tooltip
              formatter={(value: number) => [`$${value.toFixed(2)}`, "Cost"]}
            />
            <Legend />
            <Bar dataKey="cost" fill="#9c27b0" name="Cost (AUD $)" />
          </BarChart>
        )}
      </ResponsiveContainer>
    </Box>
  );
}
