"use client";

import { useEffect } from "react";

export function Modal(props: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") props.onClose();
    }
    if (props.open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [props.open, props.onClose]);

  if (!props.open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "grid",
        placeItems: "center",
        padding: "1rem",
        zIndex: 50,
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) props.onClose();
      }}
    >
      <div className="admin-card" style={{ maxWidth: "52rem", width: "100%", padding: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
          <h1 style={{ margin: 0, fontSize: "1.05rem" }}>{props.title}</h1>
          <button className="admin-btn admin-btn-ghost" type="button" onClick={props.onClose} style={{ minHeight: "2.25rem" }}>
            Close
          </button>
        </div>
        <div style={{ marginTop: "1rem" }}>{props.children}</div>
        {props.footer ? <div style={{ marginTop: "1rem" }}>{props.footer}</div> : null}
      </div>
    </div>
  );
}

