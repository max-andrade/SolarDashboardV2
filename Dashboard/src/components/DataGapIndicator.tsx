"use client";

import { Chip, Stack, Typography } from "@mui/material";

type Props = {
  loadingDays: string[];
  cachedDays: string[];
};

export function DataGapIndicator({ loadingDays, cachedDays }: Props) {
  if (!loadingDays.length && !cachedDays.length) return null;

  return (
    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
      <Typography variant="body2" color="text.secondary">
        Data cache status:
      </Typography>
      {cachedDays.length > 0 && (
        <Chip
          label={`Cached: ${cachedDays.join(", ")}`}
          color="success"
          size="small"
          variant="outlined"
        />
      )}
      {loadingDays.length > 0 && (
        <Chip
          label={`Fetching: ${loadingDays.join(", ")}`}
          color="primary"
          size="small"
          variant="outlined"
        />
      )}
    </Stack>
  );
}
