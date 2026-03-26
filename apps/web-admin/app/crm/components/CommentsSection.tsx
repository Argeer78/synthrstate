"use client";

import { useEffect, useState } from "react";
import { createComment, listComments, type CommentRow } from "../../../lib/api/collab";
import { FlashMessage, type Flash } from "../../components/Flash";
import { useMe } from "../../../lib/use-me";
import { canCreate, isViewer } from "../../../utils/permissions";

export function CommentsSection(props: { targetType: "LEAD" | "LISTING" | "TASK"; targetId: string }) {
  const { role } = useMe();
  const [flash, setFlash] = useState<Flash>(null);
  const [items, setItems] = useState<CommentRow[]>([]);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const res = await listComments({ targetType: props.targetType, targetId: props.targetId });
    setItems(res.items ?? []);
  }

  useEffect(() => {
    refresh().catch((e) => setFlash({ type: "error", message: e instanceof Error ? e.message : "Failed to load comments" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.targetType, props.targetId]);

  const canPost = canCreate(role) && !isViewer(role);

  return (
    <section className="admin-card" style={{ padding: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "1rem" }}>Comments</h3>
          <p className="admin-lead" style={{ marginTop: "0.35rem" }}>
            Collaborate with your team. Use <code>@email</code> to mention someone.
          </p>
        </div>
        <button className="admin-btn admin-btn-ghost" style={{ minHeight: "2.25rem" }} onClick={() => refresh()} disabled={busy}>
          Refresh
        </button>
      </div>

      <FlashMessage flash={flash} onDismiss={() => setFlash(null)} />

      <div style={{ display: "grid", gap: 10 }}>
        {items.length === 0 ? <p className="admin-lead">No comments yet.</p> : null}
        {items.map((c) => (
          <div key={c.id} style={{ border: "1px solid var(--admin-border)", borderRadius: "0.9rem", padding: "0.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div style={{ fontWeight: 750, color: "var(--admin-text)" }}>
                {c.createdByMembership?.user?.fullName || c.createdByMembership?.user?.email || "Team member"}
              </div>
              <time style={{ color: "var(--admin-muted-2)", fontSize: 12 }}>{new Date(c.createdAt).toLocaleString()}</time>
            </div>
            <div style={{ marginTop: 6, whiteSpace: "pre-wrap", color: "var(--admin-text)", fontSize: 14, lineHeight: 1.45 }}>{c.body}</div>
          </div>
        ))}
      </div>

      {canPost ? (
        <div style={{ marginTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12 }}>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write a comment… (use @email to mention)"
            style={{
              width: "100%",
              minHeight: 84,
              resize: "vertical",
              padding: "0.75rem",
              borderRadius: "0.75rem",
              border: "1px solid var(--admin-border)",
              background: "var(--admin-input-bg)",
              color: "var(--admin-text)",
              fontSize: 14,
            }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
            <button
              className="admin-btn admin-btn-primary"
              disabled={busy || body.trim().length === 0}
              onClick={async () => {
                setBusy(true);
                try {
                  await createComment({ targetType: props.targetType, targetId: props.targetId, body: body.trim() });
                  setBody("");
                  await refresh();
                  setFlash({ type: "success", message: "Comment posted" });
                } catch (e: any) {
                  setFlash({ type: "error", message: e?.message ?? "Failed to post comment" });
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Posting…" : "Post comment"}
            </button>
          </div>
        </div>
      ) : (
        <p className="admin-lead" style={{ marginTop: 12 }}>
          You don’t have permission to post comments.
        </p>
      )}
    </section>
  );
}

