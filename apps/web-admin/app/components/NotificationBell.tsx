"use client";

import { useEffect, useState } from "react";
import { listNotifications, markNotificationsRead, type NotificationRow } from "../../lib/api/collab";

function linkFor(n: NotificationRow): string | null {
  if (n.leadId) return `/crm/lead/?id=${encodeURIComponent(n.leadId)}`;
  if (n.listingId) return `/listings/view/?id=${encodeURIComponent(n.listingId)}`;
  if (n.taskId) return `/crm/`;
  return null;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [unread, setUnread] = useState(0);

  async function refresh() {
    const res = await listNotifications(25);
    setItems(res.items ?? []);
    setUnread(res.unreadCount ?? 0);
  }

  useEffect(() => {
    refresh().catch(() => {});
    const t = setInterval(() => refresh().catch(() => {}), 30000);
    return () => clearInterval(t);
  }, []);

  async function onToggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      await refresh().catch(() => {});
      const unreadIds = items.filter((i) => !i.isRead).map((i) => i.id);
      if (unreadIds.length) {
        await markNotificationsRead(unreadIds).catch(() => {});
        await refresh().catch(() => {});
      }
    }
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        className="admin-btn admin-btn-ghost"
        onClick={onToggle}
        aria-label={unread > 0 ? `Notifications (${unread} unread)` : "Notifications"}
        style={{ minHeight: "2.25rem", padding: "0 0.75rem" }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span aria-hidden>🔔</span>
          {unread > 0 ? (
            <span
              style={{
                display: "inline-flex",
                minWidth: 20,
                height: 20,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 999,
                background: "var(--admin-accent)",
                color: "#fff",
                fontSize: 12,
                fontWeight: 800,
                padding: "0 6px",
              }}
            >
              {unread}
            </span>
          ) : null}
        </span>
      </button>

      {open ? (
        <div
          className="admin-card"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 0.5rem)",
            width: 360,
            maxWidth: "80vw",
            padding: "0.75rem",
            margin: 0,
            zIndex: 50,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
            <div style={{ fontWeight: 800 }}>Notifications</div>
            <button className="admin-btn admin-btn-ghost" style={{ minHeight: "2rem", padding: "0 0.6rem" }} onClick={() => setOpen(false)}>
              Close
            </button>
          </div>

          {items.length === 0 ? <div style={{ color: "var(--admin-muted)", fontSize: 13 }}>No notifications yet.</div> : null}

          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 420, overflow: "auto" }}>
            {items.map((n) => {
              const href = linkFor(n);
              return (
                <a
                  key={n.id}
                  href={href ?? undefined}
                  className="admin-link"
                  style={{
                    display: "block",
                    padding: "0.65rem 0.7rem",
                    borderRadius: 12,
                    border: "1px solid var(--admin-border)",
                    background: n.isRead ? "transparent" : "var(--admin-surface-2)",
                    textDecoration: "none",
                  }}
                >
                  <div style={{ fontWeight: 750, marginBottom: 2 }}>{n.title}</div>
                  {n.body ? <div style={{ color: "var(--admin-muted)", fontSize: 13, lineHeight: 1.35 }}>{n.body}</div> : null}
                  <div style={{ color: "var(--admin-muted-2)", fontSize: 12, marginTop: 6 }}>
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

