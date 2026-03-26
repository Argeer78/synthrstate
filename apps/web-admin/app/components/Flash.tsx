"use client";

export type Flash = { type: "success" | "error" | "info"; message: string } | null;

export function FlashMessage(props: { flash: Flash; onDismiss?: () => void }) {
  if (!props.flash) return null;
  const color =
    props.flash.type === "success"
      ? "#b7f7c4"
      : props.flash.type === "error"
        ? "#ffb4b4"
        : "var(--admin-muted)";

  return (
    <div
      style={{
        border: "1px solid var(--admin-border)",
        borderRadius: "0.75rem",
        padding: "0.75rem 0.9rem",
        marginBottom: "0.9rem",
        background: "rgba(0,0,0,0.18)",
      }}
    >
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", justifyContent: "space-between" }}>
        <p style={{ margin: 0, color, fontSize: "0.9rem", lineHeight: 1.4 }}>{props.flash.message}</p>
        {props.onDismiss ? (
          <button className="admin-btn admin-btn-ghost" type="button" onClick={props.onDismiss} style={{ minHeight: "2rem", padding: "0 0.6rem" }}>
            OK
          </button>
        ) : null}
      </div>
    </div>
  );
}

