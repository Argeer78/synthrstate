"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_URL;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError(null);
    if (!apiBase) {
      setError("API URL is not configured.");
      return;
    }

    const form = e.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${apiBase}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Login failed (${res.status}). ${text ? text.slice(0, 120) : ""}`);
      }

      // Cookie is set by the API (httpOnly). We still verify session with /me.
      const meRes = await fetch(`${apiBase}/me`, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (!meRes.ok) {
        throw new Error(`Logged in, but session check failed (${meRes.status}).`);
      }

      router.push("/");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit} noValidate>
      <div className="admin-field">
        <label htmlFor="email">Work email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@agency.com"
        />
      </div>
      <div className="admin-field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
        />
      </div>
      <button type="submit" className="admin-btn admin-btn-primary">
        {isLoading ? "Signing in..." : "Continue"}
      </button>
      {error ? (
        <p style={{ margin: 0, color: "#ffb4b4", fontSize: "0.85rem", lineHeight: 1.4 }}>
          {error}
        </p>
      ) : null}
    </form>
  );
}
