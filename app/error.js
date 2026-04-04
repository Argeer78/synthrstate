"use client";

import { useEffect } from "react";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error("root app segment error", error);
  }, [error]);

  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif" }}>
      <h1 style={{ marginBottom: "0.5rem" }}>Temporarily unavailable</h1>
      <p style={{ marginBottom: "1rem", color: "#555" }}>
        A server rendering error occurred. Please retry.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        style={{
          border: "1px solid #222",
          background: "#111",
          color: "#fff",
          borderRadius: "8px",
          padding: "0.5rem 0.9rem",
          cursor: "pointer",
        }}
      >
        Reload page
      </button>
      {error?.digest ? <p style={{ marginTop: "1rem", color: "#666" }}>Error code: {error.digest}</p> : null}
    </main>
  );
}
