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
import { AggregatedPoint } from "../lib/types";

type Props = {
  points: AggregatedPoint[];
  mode: "energy" | "cost";
  onModeChange: (mode: "energy" | "cost") => void;
};

export function EnergyChart({ points, mode, onModeChange }: Props) {
  const data =
    mode === "energy"
      ? points.map((p) => ({
          label: p.label,
          gridImport: p.gridImport,
          gridExport: p.gridExport,
          pvUsed: p.pvUsed,
          cost: p.cost,
        }))
      : points.map((p) => ({
          label: p.label,
          cost: p.cost / 100, // convert cents to dollars for display
        }));

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
            <Tooltip
              formatter={(value: number, name) => [
                value.toLocaleString(),
                name === "pvUsed"
                  ? "PV Used"
                  : name === "gridExport"
                  ? "Grid Export"
                  : "Grid Import",
              ]}
            />
            <Legend
              payload={[
                { value: "Grid Import", type: "square", color: "#1976d2" },
                { value: "Grid Export", type: "square", color: "#ef6c00" },
                { value: "PV Used", type: "square", color: "#2e7d32" },
              ]}
            />
            <Bar dataKey="gridImport" stackId="energy" fill="#1976d2" />
            <Bar dataKey="gridExport" stackId="energy" fill="#ef6c00" />
            <Bar dataKey="pvUsed" stackId="energy" fill="#2e7d32" />
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
