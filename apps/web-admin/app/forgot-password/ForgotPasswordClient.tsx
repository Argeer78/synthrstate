"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { FlashMessage, type Flash } from "../components/Flash";
import { requestPasswordReset } from "../../lib/api/auth";

export function ForgotPasswordClient() {
  const [flash, setFlash] = useState<Flash>(null);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFlash(null);
    if (!email.trim()) {
      setFlash({ type: "error", message: "Please enter your email." });
      return;
    }

    setBusy(true);
    try {
      await requestPasswordReset(email.trim());
      setFlash({
        type: "success",
        message: "If an account exists for that email, a reset link has been sent.",
      });
      setEmail("");
    } catch (err) {
      setFlash({ type: "error", message: err instanceof Error ? err.message : "Request failed." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="admin-form" onSubmit={onSubmit} noValidate>
      <FlashMessage flash={flash} onDismiss={() => setFlash(null)} />
      <div className="admin-field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@agency.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <button type="submit" className="admin-btn admin-btn-primary" disabled={busy}>
        {busy ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}

