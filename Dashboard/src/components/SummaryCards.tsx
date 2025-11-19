"use client";

import { Card, CardContent, Typography, Box } from "@mui/material";
import { AggregatedPoint, Aggregation } from "../lib/types";

type Props = {
  points: AggregatedPoint[];
  aggregation: Aggregation;
};

const formatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
});

const costFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 2,
});

const useKWh = (aggregation: Aggregation) =>
  aggregation === "day" || aggregation === "week" || aggregation === "month";

export function SummaryCards({ points, aggregation }: Props) {
  const kwh = useKWh(aggregation);
  const energyUnit = kwh ? "kWh" : "Wh";
  const totals = points.reduce(
    (acc, p) => {
      acc.gridImport += p.gridImport;
      acc.gridExport += p.gridExport;
      acc.pvUsed += p.pvUsed;
      acc.cost += p.cost;
      return acc;
    },
    { gridImport: 0, gridExport: 0, pvUsed: 0, cost: 0 }
  );

  const toDisplay = (val: number) => (kwh ? val / 1000 : val);

  const cards = [
    { label: `Grid Import (${energyUnit})`, value: formatter.format(toDisplay(totals.gridImport)) },
    { label: `Grid Export (${energyUnit})`, value: formatter.format(toDisplay(totals.gridExport)) },
    {
      label: `PV Used On-site (${energyUnit})`,
      value: formatter.format(toDisplay(totals.pvUsed)),
    },
    {
      label: "Net Cost (AUD $)",
      value: `$${costFormatter.format(totals.cost / 100)}`,
    },
  ];

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
        gap: 2,
        mb: 2,
      }}
    >
      {cards.map((card) => (
        <Card key={card.label} variant="outlined" sx={{ height: "100%" }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary">
              {card.label}
            </Typography>
            <Typography variant="h5">{card.value}</Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
