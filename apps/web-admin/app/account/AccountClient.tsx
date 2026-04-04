"use client";

import { useMemo, useState } from "react";
import { useMe } from "../../lib/use-me";
import { changeMyPassword } from "../../lib/api/auth";
import { FlashMessage, type Flash } from "../components/Flash";

export function AccountClient() {
  const { state } = useMe();
  const [flash, setFlash] = useState<Flash>(null);
  const [busy, setBusy] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const membershipId = useMemo(() => {
    if (state.status !== "ok") return null;
    // /me shape: { membership: { id, role }, user: { ... }, agency: { ... } }
    return ((state.me as any)?.membership?.id as string | undefined) ?? null;
  }, [state]);

  async function onChangePassword() {
    setFlash(null);
    if (!membershipId) {
      setFlash({ type: "error", message: "Not signed in." });
      return;
    }
    if (!currentPw.trim()) {
      setFlash({ type: "error", message: "Please enter your current password." });
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
      await changeMyPassword(currentPw, pw1);
      setCurrentPw("");
      setPw1("");
      setPw2("");
      setFlash({ type: "success", message: "Password updated." });
    } catch (e) {
      setFlash({ type: "error", message: e instanceof Error ? e.message : "Failed to update password." });
    } finally {
      setBusy(false);
    }
  }

  const canSubmit =
    Boolean(membershipId) &&
    currentPw.trim().length > 0 &&
    pw1.trim().length >= 8 &&
    pw2.trim().length >= 8 &&
    pw1 === pw2 &&
    !busy;

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <FlashMessage flash={flash} onDismiss={() => setFlash(null)} />

      <section className="admin-card" style={{ maxWidth: "none", padding: "1rem" }}>
        <h2 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>Change password</h2>
        <div className="admin-form" style={{ maxWidth: 520 }}>
          <div className="admin-field">
            <label htmlFor="currentPw">Current password</label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                id="currentPw"
                type={showCurrent ? "text" : "password"}
                autoComplete="current-password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
              />
              <button
                className="admin-btn admin-btn-ghost"
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                style={{ minHeight: "2.5rem", padding: "0 0.75rem", whiteSpace: "nowrap" }}
              >
                {showCurrent ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <div className="admin-field">
            <label htmlFor="pw1">New password</label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                id="pw1"
                type={showNew ? "text" : "password"}
                autoComplete="new-password"
                value={pw1}
                onChange={(e) => setPw1(e.target.value)}
              />
              <button
                className="admin-btn admin-btn-ghost"
                type="button"
                onClick={() => setShowNew((v) => !v)}
                style={{ minHeight: "2.5rem", padding: "0 0.75rem", whiteSpace: "nowrap" }}
              >
                {showNew ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <div className="admin-field">
            <label htmlFor="pw2">Confirm password</label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                id="pw2"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
              />
              <button
                className="admin-btn admin-btn-ghost"
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                style={{ minHeight: "2.5rem", padding: "0 0.75rem", whiteSpace: "nowrap" }}
              >
                {showConfirm ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <button className="admin-btn admin-btn-primary" type="button" onClick={onChangePassword} disabled={!canSubmit}>
            {busy ? "Saving…" : "Update password"}
          </button>
          <p className="admin-lead" style={{ marginTop: "0.75rem" }}>
            This updates your password immediately. You may need to sign in again on other devices.
          </p>
        </div>
      </section>
    </div>
  );
}

