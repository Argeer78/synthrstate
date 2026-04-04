"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FlashMessage, type Flash } from "../components/Flash";
import { resetPasswordWithToken } from "../../lib/api/auth";

export function ResetPasswordClient() {
  const router = useRouter();
  const search = useSearchParams();
  const token = useMemo(() => String(search.get("token") ?? "").trim(), [search]);

  const [flash, setFlash] = useState<Flash>(null);
  const [busy, setBusy] = useState(false);
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFlash(null);

    if (!token) {
      setFlash({ type: "error", message: "Missing reset token. Please use the link from your email." });
      return;
    }
    if (!pw1.trim() || pw1.length < 8) {
      setFlash({ type: "error", message: "Password must be at least 8 characters." });
      return;
    }
    if (pw1 !== pw2) {
      setFlash({ type: "error", message: "Passwords do not match." });
      return;
    }

    setBusy(true);
    try {
      await resetPasswordWithToken(token, pw1);
      setFlash({ type: "success", message: "Password updated. You can now sign in." });
      setPw1("");
      setPw2("");
      setTimeout(() => router.push("/login/"), 600);
    } catch (err) {
      setFlash({ type: "error", message: err instanceof Error ? err.message : "Reset failed." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="admin-form" onSubmit={onSubmit} noValidate>
      <FlashMessage flash={flash} onDismiss={() => setFlash(null)} />
      <div className="admin-field">
        <label htmlFor="pw1">New password</label>
        <input id="pw1" type="password" autoComplete="new-password" value={pw1} onChange={(e) => setPw1(e.target.value)} />
      </div>
      <div className="admin-field">
        <label htmlFor="pw2">Confirm password</label>
        <input id="pw2" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
      </div>
      <button type="submit" className="admin-btn admin-btn-primary" disabled={busy}>
        {busy ? "Saving…" : "Update password"}
      </button>
    </form>
  );
}

