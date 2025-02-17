"use client";

import { useTheme as useNextTheme } from "next-themes";

export const useTheme = () => {
  const { theme, setTheme, systemTheme } = useNextTheme();

  return {
    theme: theme as "dark" | "light" | "system",
    setTheme,
    systemTheme,
  };
};
