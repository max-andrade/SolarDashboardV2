"use client";

import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { differenceInHours } from "date-fns";
import { Aggregation, FiltersState } from "../lib/types";

type Props = {
  filters: FiltersState;
  onChange: (next: FiltersState) => void;
  disabled?: boolean;
};

const aggregationOptions: { value: Aggregation; label: string }[] = [
  { value: "raw", label: "Raw" },
  { value: "hour", label: "Hourly" },
  { value: "day", label: "Daily" },
  { value: "week", label: "Weekly" },
  { value: "month", label: "Monthly" },
];

export function FilterPanel({ filters, onChange, disabled }: Props) {
  const suggestAggregation = (fromValue: string, toValue: string): Aggregation | null => {
    const fromDate = new Date(fromValue);
    const toDate = new Date(toValue);
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) return null;
    const hours = Math.abs(differenceInHours(toDate, fromDate));
    if (hours <= 24) return "raw";
    if (hours <= 72) return "hour";
    return "day";
  };

  const applyAggregationRule = (next: FiltersState, changedKey: keyof FiltersState | "range") => {
    if (changedKey === "aggregation") return next;
    const suggested = suggestAggregation(next.from, next.to);
    if (suggested && suggested !== next.aggregation) {
      return { ...next, aggregation: suggested };
    }
    return next;
  };

  const handleInput = (key: keyof FiltersState, value: string) => {
    onChange(applyAggregationRule({ ...filters, [key]: value }, key));
  };

  const handlePreset = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - days);
    const isoLocal = (d: Date) =>
      new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
    const next = applyAggregationRule(
      {
        ...filters,
        from: isoLocal(from),
        to: isoLocal(to),
      },
      "range"
    );
    onChange(next);
  };

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        mb: 2,
      }}
    >
      <Stack
        spacing={2}
        direction={{ xs: "column", md: "row" }}
        alignItems={{ md: "center" }}
        justifyContent="space-between"
      >
        <Stack spacing={2} direction={{ xs: "column", sm: "row" }}>
          <TextField
            label="From"
            type="datetime-local"
            size="small"
            value={filters.from}
            onChange={(e) => handleInput("from", e.target.value)}
            InputLabelProps={{ shrink: true }}
            disabled={disabled}
            inputProps={{ "aria-label": "From date time" }}
            sx={{
              "& input[type='datetime-local']::-webkit-calendar-picker-indicator": {
                filter: (theme) =>
                  theme.palette.mode === "dark" ? "invert(1)" : "none",
              },
            }}
          />
          <TextField
            label="To"
            type="datetime-local"
            size="small"
            value={filters.to}
            onChange={(e) => handleInput("to", e.target.value)}
            InputLabelProps={{ shrink: true }}
            disabled={disabled}
            inputProps={{ "aria-label": "To date time" }}
            sx={{
              "& input[type='datetime-local']::-webkit-calendar-picker-indicator": {
                filter: (theme) =>
                  theme.palette.mode === "dark" ? "invert(1)" : "none",
              },
            }}
          />
          <FormControl size="small">
            <InputLabel id="agg-label">Aggregation</InputLabel>
            <Select
              labelId="agg-label"
              label="Aggregation"
              value={filters.aggregation}
              onChange={(e) =>
                handleInput("aggregation", e.target.value as Aggregation)
              }
              disabled={disabled}
            >
              {aggregationOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Typography variant="body2" sx={{ alignSelf: "center" }}>
            Quick Ranges:
          </Typography>
          {[
            { label: "24h", days: 1 },
            { label: "72h", days: 3 },
            { label: "7d", days: 7 },
            { label: "30d", days: 30 },
            { label: "90d", days: 90 },
          ].map((opt) => (
            <Button
              key={opt.label}
              variant="outlined"
              size="small"
              onClick={() => handlePreset(opt.days)}
              disabled={disabled}
            >
              {opt.label}
            </Button>
          ))}
        </Stack>
      </Stack>
    </Box>
  );
}
