"use client";

import { IconButton, Tooltip } from "@mui/material";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import BrightnessAutoIcon from "@mui/icons-material/BrightnessAuto";

type Props = {
  value: "light" | "dark" | "system";
  onChange: (v: "light" | "dark" | "system") => void;
};

const nextValue = {
  light: "dark",
  dark: "system",
  system: "light",
} as const;

export function ThemeToggle({ value, onChange }: Props) {
  const handleClick = () => onChange(nextValue[value]);

  const icon =
    value === "light" ? (
      <LightModeIcon />
    ) : value === "dark" ? (
      <DarkModeIcon />
    ) : (
      <BrightnessAutoIcon />
    );

  return (
    <Tooltip title={`Theme: ${value} (click to change)`} arrow>
      <IconButton onClick={handleClick} color="inherit" size="small">
        {icon}
      </IconButton>
    </Tooltip>
  );
}
