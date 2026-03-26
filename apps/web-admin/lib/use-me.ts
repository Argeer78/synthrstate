"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "./admin-api";
import type { UserRole } from "../utils/permissions";
import type { MeResponse } from "./me";
import { getRoleFromMe } from "./me";

export function useMe() {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "anon" }
    | { status: "ok"; me: MeResponse; role: UserRole | null }
    | { status: "error"; message: string }
  >({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch("/me", { method: "GET" });
        if (!res.ok) {
          if (!cancelled) setState({ status: "anon" });
          return;
        }
        const me = (await res.json()) as MeResponse;
        const role = getRoleFromMe(me);
        if (!cancelled) setState({ status: "ok", me, role });
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to load session.";
        if (!cancelled) setState({ status: "error", message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const role = useMemo(() => (state.status === "ok" ? state.role : null), [state]);

  return { state, role };
}

