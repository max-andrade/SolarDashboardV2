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
  const handleInput = (key: keyof FiltersState, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const handlePreset = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - days);
    const isoLocal = (d: Date) =>
      new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
    onChange({
      ...filters,
      from: isoLocal(from),
      to: isoLocal(to),
    });
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
          />
          <TextField
            label="To"
            type="datetime-local"
            size="small"
            value={filters.to}
            onChange={(e) => handleInput("to", e.target.value)}
            InputLabelProps={{ shrink: true }}
            disabled={disabled}
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
            Quick ranges:
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={() => handlePreset(7)}
            disabled={disabled}
          >
            7d
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => handlePreset(30)}
            disabled={disabled}
          >
            30d
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
