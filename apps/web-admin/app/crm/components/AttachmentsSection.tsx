"use client";

import { useEffect, useState } from "react";
import {
  completeAttachmentUpload,
  createSignedAttachmentUpload,
  getAttachmentDownloadUrl,
  listAttachments,
  type AttachmentRow,
} from "../../../lib/api/collab";
import { FlashMessage, type Flash } from "../../components/Flash";
import { useMe } from "../../../lib/use-me";
import { canCreate, isViewer } from "../../../utils/permissions";

export function AttachmentsSection(props: { targetType: "LEAD" | "LISTING" | "TASK"; targetId: string }) {
  const { role } = useMe();
  const [flash, setFlash] = useState<Flash>(null);
  const [items, setItems] = useState<AttachmentRow[]>([]);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const res = await listAttachments({ targetType: props.targetType, targetId: props.targetId });
    setItems(res.items ?? []);
  }

  useEffect(() => {
    refresh().catch((e) => setFlash({ type: "error", message: e instanceof Error ? e.message : "Failed to load attachments" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.targetType, props.targetId]);

  const canUpload = canCreate(role) && !isViewer(role);

  async function upload(file: File) {
    setBusy(true);
    try {
      const signed = await createSignedAttachmentUpload({
        targetType: props.targetType,
        targetId: props.targetId,
        fileName: file.name,
        contentType: file.type || "application/octet-stream",
        sizeBytes: file.size,
      });
      await fetch(signed.uploadUrl, { method: "PUT", body: file, headers: { "content-type": file.type || "application/octet-stream" } });
      await completeAttachmentUpload({ targetType: props.targetType, targetId: props.targetId, attachmentId: signed.attachment.id });
      await refresh();
      setFlash({ type: "success", message: "File uploaded" });
    } catch (e: any) {
      setFlash({ type: "error", message: e?.message ?? "Upload failed" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="admin-card" style={{ padding: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "1rem" }}>Attachments</h3>
          <p className="admin-lead" style={{ marginTop: "0.35rem" }}>
            Files shared on this item.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="admin-btn admin-btn-ghost" style={{ minHeight: "2.25rem" }} onClick={() => refresh()} disabled={busy}>
            Refresh
          </button>
          {canUpload ? (
            <label className="admin-btn admin-btn-primary" style={{ minHeight: "2.25rem", cursor: busy ? "not-allowed" : "pointer" }}>
              {busy ? "Uploading…" : "Upload"}
              <input
                type="file"
                style={{ display: "none" }}
                disabled={busy}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  void upload(f);
                  e.currentTarget.value = "";
                }}
              />
            </label>
          ) : null}
        </div>
      </div>

      <FlashMessage flash={flash} onDismiss={() => setFlash(null)} />

      <div style={{ display: "grid", gap: 8 }}>
        {items.length === 0 ? <p className="admin-lead">No attachments yet.</p> : null}
        {items.map((a) => (
          <div key={a.id} style={{ border: "1px solid var(--admin-border)", borderRadius: "0.9rem", padding: "0.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
              <div style={{ fontWeight: 750 }}>{a.fileName}</div>
              <button
                className="admin-btn admin-btn-ghost"
                style={{ minHeight: "2rem", padding: "0 0.6rem" }}
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    const res = await getAttachmentDownloadUrl({ targetType: props.targetType, targetId: props.targetId, attachmentId: a.id });
                    window.open(res.url, "_blank", "noopener,noreferrer");
                  } catch (e: any) {
                    setFlash({ type: "error", message: e?.message ?? "Failed to get download link" });
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Download
              </button>
            </div>
            <div style={{ color: "var(--admin-muted)", fontSize: 13 }}>
              {a.mimeType} · {(a.sizeBytes / 1024).toFixed(1)} KB · {new Date(a.createdAt).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {!canUpload ? <p className="admin-lead" style={{ marginTop: 10 }}>You don’t have permission to upload files.</p> : null}
    </section>
  );
}

