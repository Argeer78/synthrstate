"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { TurnstileField } from "../components/TurnstileField";

export function SignupForm() {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_URL;
  const siteKey =
    (process.env.NEXT_PUBLIC_TURNSTILE_SIGNUP_SITE_KEY ?? "").trim() ||
    (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "").trim();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileNonce, setTurnstileNonce] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!apiBase) {
      setError("NEXT_PUBLIC_API_URL is not set.");
      return;
    }

    const form = e.currentTarget;
    const formData = new FormData(form);
    const agencyName = String(formData.get("agencyName") ?? "").trim();
    const agencySlug = String(formData.get("agencySlug") ?? "").trim();
    const fullName = String(formData.get("fullName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!agencyName || !agencySlug || !fullName || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (siteKey && !turnstileToken.trim()) {
      setError("Please complete the security check.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${apiBase}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "include",
        body: JSON.stringify({
          agencyName,
          agencySlug,
          fullName,
          email,
          password,
          ...(turnstileToken.trim() ? { turnstileToken: turnstileToken.trim() } : {}),
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Signup failed (${res.status}). ${text ? text.slice(0, 160) : ""}`);
      }

      // Cookie is set by the API (httpOnly). Confirm session.
      const meRes = await fetch(`${apiBase}/me`, { method: "GET", credentials: "include", headers: { Accept: "application/json" } });
      if (!meRes.ok) throw new Error(`Signed up, but session check failed (${meRes.status}).`);

      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed.");
      setTurnstileToken("");
      setTurnstileNonce((n) => n + 1);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit} noValidate>
      <div className="admin-field">
        <label htmlFor="agencyName">Agency name</label>
        <input id="agencyName" name="agencyName" type="text" placeholder="Demo Agency" />
      </div>
      <div className="admin-field">
        <label htmlFor="agencySlug">Agency slug</label>
        <input id="agencySlug" name="agencySlug" type="text" placeholder="demo-agency" autoCapitalize="none" />
      </div>
      <div className="admin-field">
        <label htmlFor="fullName">Your full name</label>
        <input id="fullName" name="fullName" type="text" placeholder="Jane Doe" autoComplete="name" />
      </div>
      <div className="admin-field">
        <label htmlFor="email">Work email</label>
        <input id="email" name="email" type="email" placeholder="you@agency.com" autoComplete="email" />
      </div>
      <div className="admin-field">
        <label htmlFor="password">Password</label>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="At least 8 characters"
            autoComplete="new-password"
          />
          <button
            className="admin-btn admin-btn-ghost"
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            style={{ minHeight: "2.5rem", padding: "0 0.75rem", whiteSpace: "nowrap" }}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>
      {siteKey ? (
        <div className="admin-field">
          <TurnstileField
            key={turnstileNonce}
            siteKey={siteKey}
            onToken={setTurnstileToken}
            onExpire={() => setTurnstileToken("")}
          />
        </div>
      ) : null}
      <button type="submit" className="admin-btn admin-btn-primary" disabled={isLoading}>
        {isLoading ? "Creating…" : "Create workspace"}
      </button>
      {error ? (
        <p style={{ margin: 0, color: "#ffb4b4", fontSize: "0.85rem", lineHeight: 1.4 }}>
          {error}
        </p>
      ) : null}
    </form>
  );
}

