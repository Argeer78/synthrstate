"use client";

import { useEffect, useState } from "react";
import { Modal } from "../components/Modal";
import { createImageUpload, completeUpload, deleteMediaAsset, listListingMedia, type MediaAsset } from "../../lib/api/media";

export function ListingMediaModal(props: {
  open: boolean;
  listingId: string | null;
  onClose: () => void;
  canMutate: boolean;
  mutateDisabledReason?: string;
}) {
  const [state, setState] = useState<
    | { status: "idle" }
    | { status: "loading" }
    | { status: "ready"; items: MediaAsset[]; message?: string; uploading?: boolean }
    | { status: "error"; message: string }
  >({ status: "idle" });

  async function refresh() {
    if (!props.listingId) return;
    const { items } = await listListingMedia(props.listingId);
    setState({ status: "ready", items });
  }

  useEffect(() => {
    if (!props.open || !props.listingId) return;
    let cancelled = false;
    setState({ status: "loading" });
    (async () => {
      try {
        const { items } = await listListingMedia(props.listingId!);
        if (!cancelled) setState({ status: "ready", items });
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to load media.";
        if (!cancelled) setState({ status: "error", message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [props.open, props.listingId]);

  async function onPickFile(file: File) {
    if (!props.listingId) return;
    if (!props.canMutate) {
      setState((s) => (s.status === "ready" ? { ...s, message: props.mutateDisabledReason ?? "You don’t have permission." } : s));
      return;
    }

    setState((s) => (s.status === "ready" ? { ...s, uploading: true, message: undefined } : s));
    try {
      const created = await createImageUpload(props.listingId, {
        fileName: file.name,
        contentType: file.type || "image/jpeg",
        sizeBytes: file.size,
      });

      const put = await fetch(created.uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "content-type": file.type || "application/octet-stream",
        },
      });
      if (!put.ok) {
        const t = await put.text().catch(() => "");
        throw new Error(`Upload failed (${put.status}) ${t.slice(0, 180)}`);
      }
      const etag = put.headers.get("etag") ?? undefined;
      await completeUpload(props.listingId, created.mediaAsset.id, etag);
      await refresh();
      setState((s) => (s.status === "ready" ? { ...s, uploading: false, message: "Upload completed." } : s));
    } catch (e) {
      const message = e instanceof Error ? e.message : "Upload failed.";
      setState((s) => (s.status === "ready" ? { ...s, uploading: false, message } : { status: "error", message }));
    }
  }

  async function remove(assetId: string) {
    if (!props.listingId) return;
    if (!props.canMutate) return;
    try {
      await deleteMediaAsset(props.listingId, assetId);
      await refresh();
      setState((s) => (s.status === "ready" ? { ...s, message: "Media deleted." } : s));
    } catch (e) {
      const message = e instanceof Error ? e.message : "Delete failed.";
      setState((s) => (s.status === "ready" ? { ...s, message } : { status: "error", message }));
    }
  }

  return (
    <Modal title="Media" open={props.open} onClose={props.onClose}>
      {state.status === "loading" ? <p className="admin-lead">Loading…</p> : null}
      {state.status === "error" ? (
        <p className="admin-lead" style={{ color: "#ffb4b4" }}>
          {state.message}
        </p>
      ) : null}
      {state.status === "ready" ? (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {state.message ? (
            <p className="admin-lead" style={{ margin: 0, color: state.message.includes("failed") ? "#ffb4b4" : "#b7f7c4" }}>
              {state.message}
            </p>
          ) : null}

          <div>
            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--admin-muted)", marginBottom: "0.35rem" }}>
              Upload image
            </label>
            <input
              type="file"
              accept="image/*"
              disabled={!props.canMutate || state.uploading}
              title={!props.canMutate ? props.mutateDisabledReason ?? "You don’t have permission" : ""}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onPickFile(f);
                e.currentTarget.value = "";
              }}
            />
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid var(--admin-border)" }}>
                  <th style={{ padding: "0.5rem 0.35rem" }}>File</th>
                  <th style={{ padding: "0.5rem 0.35rem" }}>Status</th>
                  <th style={{ padding: "0.5rem 0.35rem" }}>Cover</th>
                  <th style={{ padding: "0.5rem 0.35rem" }} />
                </tr>
              </thead>
              <tbody>
                {state.items.map((a) => (
                  <tr key={a.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <td style={{ padding: "0.55rem 0.35rem" }}>{a.fileName ?? a.id.slice(0, 8)}</td>
                    <td style={{ padding: "0.55rem 0.35rem", color: "var(--admin-muted)" }}>{a.uploadStatus}</td>
                    <td style={{ padding: "0.55rem 0.35rem" }}>{a.isCover ? "Yes" : "—"}</td>
                    <td style={{ padding: "0.55rem 0.35rem", textAlign: "right" }}>
                      {props.canMutate ? (
                        <button className="admin-btn admin-btn-ghost" type="button" style={{ minHeight: "2rem", padding: "0 0.6rem" }} onClick={() => remove(a.id)}>
                          Delete
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {state.items.length === 0 ? <p className="admin-lead">No media yet.</p> : null}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

