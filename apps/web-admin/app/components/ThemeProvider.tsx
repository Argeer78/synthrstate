"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { resolveTheme, THEME_STORAGE_KEY, type ThemeMode } from "../../lib/theme";

type ThemeContextValue = {
  mode: ThemeMode;
  resolved: "light" | "dark";
  setMode: (next: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function prefersDark(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? true;
}

function applyResolvedTheme(resolved: "light" | "dark") {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = resolved;
}

export function ThemeProvider(props: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const stored = (localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null) ?? "system";
    const m: ThemeMode = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
    setModeState(m);
    const r = resolveTheme(m, prefersDark());
    setResolved(r);
    applyResolvedTheme(r);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const r = resolveTheme("system", mq.matches);
      setResolved(r);
      applyResolvedTheme(r);
    };
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, [mode]);

  const api = useMemo<ThemeContextValue>(() => {
    return {
      mode,
      resolved,
      setMode: (next) => {
        setModeState(next);
        localStorage.setItem(THEME_STORAGE_KEY, next);
        const r = resolveTheme(next, prefersDark());
        setResolved(r);
        applyResolvedTheme(r);
      },
    };
  }, [mode, resolved]);

  return <ThemeContext.Provider value={api}>{props.children}</ThemeContext.Provider>;
}

export function useTheme() {
  const v = useContext(ThemeContext);
  if (!v) throw new Error("useTheme must be used within ThemeProvider");
  return v;
}

