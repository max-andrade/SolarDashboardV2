"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CssBaseline,
  Container,
  CircularProgress,
  Snackbar,
  Alert,
  LinearProgress,
  AppBar,
  Toolbar,
  Typography,
  Stack,
  createTheme,
  ThemeProvider,
  useMediaQuery,
  IconButton,
  Tooltip,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import { FilterPanel } from "../components/FilterPanel";
import { SummaryCards } from "../components/SummaryCards";
import { EnergyChart } from "../components/EnergyChart";
import { ExportButton } from "../components/ExportButton";
import { usePersistentFilters } from "../hooks/usePersistentState";
import { aggregateRecords } from "../lib/aggregation";
import { getDataBetween } from "../lib/api";
import { AggregatedPoint, FiltersState } from "../lib/types";
import { clearAllCache, clearDataCache } from "../lib/cache";
import { SettingsDrawer } from "../components/SettingsDrawer";
import { DEFAULT_API_BASE } from "../lib/config";

export default function Page() {
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const { filters, updateFilters, resetFilters } = usePersistentFilters();
  const [mode, setMode] = useState<"energy" | "cost">("energy");
  const [loading, setLoading] = useState(false);
  const [points, setPoints] = useState<AggregatedPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const fetchIdRef = useRef(0);

  const themeChoice = (() => {
    const themeSetting = filters?.theme ?? "system";
    return themeSetting === "system" ? (prefersDark ? "dark" : "light") : themeSetting;
  })();
  const theme = useMemo(
    () =>
      createTheme({
        palette: { mode: themeChoice },
        components: {
          MuiTooltip: { defaultProps: { arrow: true } },
        },
      }),
    [themeChoice]
  );

  const fetchData = useCallback(
    async (activeFilters: FiltersState) => {
      const requestId = ++fetchIdRef.current;
      setLoading(true);
      const from = new Date(activeFilters.from);
      const to = new Date(activeFilters.to);
      try {
        const records = await getDataBetween(from, to, { apiBase: activeFilters.apiBase });
        const aggregated = aggregateRecords(records, activeFilters.aggregation);
        if (fetchIdRef.current === requestId) {
          setPoints(aggregated);
        }
      } catch (err) {
        if (fetchIdRef.current === requestId) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      } finally {
        if (fetchIdRef.current === requestId) {
          setLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    if (!filters) return;
    void fetchData(filters);
  }, [filters, fetchData]);

  const handleResetDataCache = async () => {
    if (!filters) return;
    try {
      await clearDataCache();
      await fetchData(filters);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset data cache");
    }
  };

  const handleResetAllCache = async () => {
    try {
      await clearAllCache();
      setPoints([]);
      resetFilters();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset cache");
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Solar/Energy Dashboard
          </Typography>
          <Tooltip title="Settings">
            <IconButton color="inherit" onClick={() => setSettingsOpen(true)}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        {filters ? (
          <>
            {loading && <LinearProgress sx={{ mb: 2 }} />}
            <FilterPanel filters={filters} onChange={updateFilters} disabled={loading} />
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ sm: "center" }}
              sx={{ mb: 2 }}
            >
              <Typography variant="body2" color="text.secondary">
                Showing {filters.aggregation} data from {filters.from} to {filters.to}
              </Typography>
              <Stack direction="row" spacing={1}>
                <ExportButton points={points} />
              </Stack>
            </Stack>
            <SummaryCards points={points} aggregation={filters.aggregation} />
            <EnergyChart
              points={points}
              mode={mode}
              onModeChange={setMode}
              aggregation={filters.aggregation}
              loading={loading}
            />
          </>
        ) : (
          <Stack alignItems="center" sx={{ mt: 4 }}>
            <CircularProgress />
          </Stack>
        )}
      </Container>
      {filters && (
        <SettingsDrawer
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          filters={filters}
          onUpdateFilters={updateFilters}
          onResetDataCache={handleResetDataCache}
          onResetAllCache={handleResetAllCache}
          defaultApiBase={DEFAULT_API_BASE}
        />
      )}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="error" onClose={() => setError(null)} sx={{ width: "100%" }}>
          {error}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}
