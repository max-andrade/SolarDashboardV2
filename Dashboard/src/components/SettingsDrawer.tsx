"use client";

import {
  Box,
  Button,
  Divider,
  Drawer,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import { useState } from "react";
import { FiltersState } from "../lib/types";

type Props = {
  open: boolean;
  onClose: () => void;
  filters: FiltersState;
  onUpdateFilters: (next: FiltersState) => void;
  onResetDataCache: () => Promise<void> | void;
  onResetAllCache: () => Promise<void> | void;
};

export function SettingsDrawer({
  open,
  onClose,
  filters,
  onUpdateFilters,
  onResetDataCache,
  onResetAllCache,
}: Props) {
  const [pending, setPending] = useState<null | "data" | "all">(null);
  const [confirm, setConfirm] = useState<null | "data" | "all">(null);

  const handleThemeChange = (_: unknown, value: FiltersState["theme"] | null) => {
    if (!value) return;
    onUpdateFilters({ ...filters, theme: value });
  };

  const handleResetData = async () => {
    setPending("data");
    try {
      await onResetDataCache();
    } finally {
      setPending(null);
    }
  };

  const handleResetAll = async () => {
    setPending("all");
    try {
      await onResetAllCache();
    } finally {
      setPending(null);
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: { xs: 320, sm: 380 }, p: 3 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Settings
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Adjust theme, API endpoint, and local cache controls.
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Theme
            </Typography>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={filters.theme}
              onChange={handleThemeChange}
            >
              <ToggleButton value="light">Light</ToggleButton>
              <ToggleButton value="dark">Dark</ToggleButton>
              <ToggleButton value="system">System</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Divider />

          <Stack spacing={1}>
            <Typography variant="subtitle2">Local Cache</Typography>
            <Button
              variant="contained"
              color="warning"
              onClick={() => setConfirm("data")}
              disabled={pending !== null}
            >
              Reset data cache (keep preferences)
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => setConfirm("all")}
              disabled={pending !== null}
            >
              Reset all local cached data
            </Button>
          </Stack>
        </Stack>
      </Box>
      <Dialog open={!!confirm} onClose={() => setConfirm(null)}>
        <DialogTitle>Confirm reset</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirm === "all"
              ? "This will clear all locally cached data and preferences. Continue?"
              : "This will clear cached data but keep your preferences. Continue?"}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(null)}>Cancel</Button>
          <Button
            color="error"
            onClick={() => {
              const action = confirm === "all" ? handleResetAll : handleResetData;
              setConfirm(null);
              void action();
            }}
            autoFocus
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Drawer>
  );
}
