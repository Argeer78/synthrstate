export type ThemeMode = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "synthr_admin_theme";

export function resolveTheme(mode: ThemeMode, prefersDark: boolean): "light" | "dark" {
  if (mode === "system") return prefersDark ? "dark" : "light";
  return mode;
}

