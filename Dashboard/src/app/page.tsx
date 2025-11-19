"use client";

import { useEffect, useMemo, useState } from "react";
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
} from "@mui/material";
import { FilterPanel } from "../components/FilterPanel";
import { SummaryCards } from "../components/SummaryCards";
import { EnergyChart } from "../components/EnergyChart";
import { ExportButton } from "../components/ExportButton";
import { usePersistentFilters } from "../hooks/usePersistentState";
import { aggregateRecords } from "../lib/aggregation";
import { getDataBetween } from "../lib/api";
import { AggregatedPoint, FiltersState } from "../lib/types";
import { ThemeToggle } from "../components/ThemeToggle";

export default function Page() {
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const { filters, updateFilters } = usePersistentFilters();
  const [mode, setMode] = useState<"energy" | "cost">("energy");
  const [loading, setLoading] = useState(false);
  const [points, setPoints] = useState<AggregatedPoint[]>([]);
  const [error, setError] = useState<string | null>(null);

  const themeChoice =
    filters?.theme === "system" ? (prefersDark ? "dark" : "light") : filters?.theme ?? "light";
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

  const handleThemeChange = (themeValue: FiltersState["theme"]) => {
    if (!filters) return;
    updateFilters({ ...filters, theme: themeValue });
  };

  useEffect(() => {
    if (!filters) return;
    const run = async () => {
      setLoading(true);
      const from = new Date(filters.from);
      const to = new Date(filters.to);
      try {
        const records = await getDataBetween(from, to);
        const aggregated = aggregateRecords(records, filters.aggregation);
        setPoints(aggregated);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [filters]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Fronius Energy Dashboard
          </Typography>
          {filters && <ThemeToggle value={filters.theme} onChange={handleThemeChange} />}
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        {filters ? (
          <>
            {loading && <LinearProgress sx={{ mb: 2 }} />}
            <FilterPanel
              filters={filters}
              onChange={updateFilters}
              disabled={loading}
            />
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
            {loading ? (
              <Stack alignItems="center" sx={{ mt: 4 }}>
                <CircularProgress />
              </Stack>
            ) : (
              <>
                <SummaryCards points={points} aggregation={filters.aggregation} />
                <EnergyChart
                  points={points}
                  mode={mode}
                  onModeChange={setMode}
                  aggregation={filters.aggregation}
                />
              </>
            )}
          </>
        ) : (
          <Stack alignItems="center" sx={{ mt: 4 }}>
            <CircularProgress />
          </Stack>
        )}
      </Container>
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
