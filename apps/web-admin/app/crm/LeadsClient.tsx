"use client";

import { useEffect, useState } from "react";
import { useMe } from "../../lib/use-me";
import { canCreate, canEdit, isViewer } from "../../utils/permissions";
import { FlashMessage, type Flash } from "../components/Flash";
import { Modal } from "../components/Modal";
import Link from "next/link";
import { createLead, deleteLead, listLeads, updateLead, type Lead } from "../../lib/api/crm";
import { useSearchParams } from "next/navigation";

export function LeadsClient() {
  const { role } = useMe();
  const params = useSearchParams();
  const [flash, setFlash] = useState<Flash>(null);
  const [state, setState] = useState<
    { status: "loading" } | { status: "error"; message: string } | { status: "ok"; rows: Lead[]; total: number }
  >({ status: "loading" });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [form, setForm] = useState<{ contactId: string; title: string; status: string; assignedToMembershipId: string }>({
    contactId: "",
    title: "",
    status: "NEW",
    assignedToMembershipId: "",
  });
  const [saving, setSaving] = useState(false);

  async function refresh() {
    const { items, total } = await listLeads();
    setState({ status: "ok", rows: items, total });
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { items, total } = await listLeads();
        if (!cancelled) setState({ status: "ok", rows: items, total });
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to load leads.";
        if (!cancelled) setState({ status: "error", message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!canCreate(role)) return;
    const wants = params?.get("new");
    if (wants === "lead") {
      setEditing(null);
      setForm({ contactId: "", title: "", status: "NEW", assignedToMembershipId: "" });
      setModalOpen(true);
    }
  }, [params, role]);

  if (state.status === "loading") return <p className="admin-lead">Loading leads…</p>;
  if (state.status === "error")
    return (
      <p className="admin-lead" style={{ color: "#ffb4b4" }}>
        {state.message}
      </p>
    );

  return (
    <div style={{ marginTop: "1.5rem" }}>
      <h2 style={{ margin: "0 0 0.5rem", fontSize: "1rem" }}>Leads</h2>
      <FlashMessage flash={flash} onDismiss={() => setFlash(null)} />

      {isViewer(role) ? (
        <p className="admin-lead" style={{ marginTop: 0 }}>
          You have read-only access.
        </p>
      ) : null}

      {canCreate(role) ? (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.75rem" }}>
          <button
            className="admin-btn admin-btn-primary"
            type="button"
            onClick={() => {
              setEditing(null);
              setForm({ contactId: "", title: "", status: "NEW", assignedToMembershipId: "" });
              setModalOpen(true);
            }}
          >
            New lead
          </button>
        </div>
      ) : null}

      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid var(--admin-border)" }}>
              <th style={{ padding: "0.5rem 0.35rem" }}>Title</th>
              <th style={{ padding: "0.5rem 0.35rem" }}>Status</th>
              <th style={{ padding: "0.5rem 0.35rem" }}>Contact</th>
              <th style={{ padding: "0.5rem 0.35rem" }} />
            </tr>
          </thead>
          <tbody>
            {state.rows.map((l) => (
              <tr key={l.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <td style={{ padding: "0.55rem 0.35rem" }}>
                  <Link href={`/crm/lead/?id=${encodeURIComponent(l.id)}`} className="admin-link">
                    {l.title ?? "Lead"}
                  </Link>
                </td>
                <td style={{ padding: "0.55rem 0.35rem", color: "var(--admin-muted)" }}>{l.status}</td>
                <td style={{ padding: "0.55rem 0.35rem" }}>
                  <code style={{ fontSize: "0.8em" }}>{l.contactId.slice(0, 8)}…</code>
                </td>
                <td style={{ padding: "0.55rem 0.35rem", textAlign: "right" }}>
                  {canEdit(role) ? (
                    <div style={{ display: "inline-flex", gap: "0.35rem" }}>
                      <button
                        className="admin-btn admin-btn-ghost"
                        type="button"
                        style={{ minHeight: "2rem", padding: "0 0.6rem" }}
                        onClick={() => {
                          setEditing(l);
                          setForm({
                            contactId: l.contactId,
                            title: l.title ?? "",
                            status: l.status ?? "NEW",
                            assignedToMembershipId: l.assignedToMembershipId ?? "",
                          });
                          setModalOpen(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="admin-btn admin-btn-ghost"
                        type="button"
                        style={{ minHeight: "2rem", padding: "0 0.6rem" }}
                        onClick={async () => {
                          if (!confirm("Delete this lead?")) return;
                          try {
                            await deleteLead(l.id);
                            await refresh();
                            setFlash({ type: "success", message: "Lead deleted." });
                          } catch (e) {
                            const message = e instanceof Error ? e.message : "Delete failed.";
                            setFlash({ type: "error", message });
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {state.rows.length === 0 ? <p className="admin-lead">No leads yet.</p> : null}
      </div>

      <Modal
        title={editing ? "Edit lead" : "New lead"}
        open={modalOpen}
        onClose={() => (saving ? null : setModalOpen(false))}
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
            <button className="admin-btn admin-btn-ghost" type="button" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button
              className="admin-btn admin-btn-primary"
              type="button"
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                try {
                  if (editing) {
                    await updateLead(editing.id, {
                      title: form.title || undefined,
                      status: form.status || undefined,
                      assignedToMembershipId: form.assignedToMembershipId || undefined,
                    });
                    setFlash({ type: "success", message: "Lead updated." });
                  } else {
                    await createLead({
                      contactId: form.contactId,
                      title: form.title || undefined,
                      status: form.status || undefined,
                      assignedToMembershipId: form.assignedToMembershipId || undefined,
                    });
                    setFlash({ type: "success", message: "Lead created." });
                  }
                  await refresh();
                  setModalOpen(false);
                } catch (e) {
                  const message = e instanceof Error ? e.message : "Save failed.";
                  setFlash({ type: "error", message });
                } finally {
                  setSaving(false);
                }
              }}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        }
      >
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {!editing ? (
            <div className="admin-field">
              <label>Contact ID</label>
              <input value={form.contactId} onChange={(e) => setForm({ ...form, contactId: e.target.value })} placeholder="UUID" />
            </div>
          ) : null}
          <div className="admin-field">
            <label>Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="admin-field">
            <label>Status</label>
            <input value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} placeholder="NEW / ..." />
          </div>
          <div className="admin-field">
            <label>Assign to membershipId (optional)</label>
            <input value={form.assignedToMembershipId} onChange={(e) => setForm({ ...form, assignedToMembershipId: e.target.value })} placeholder="membership UUID" />
          </div>
          <p className="admin-lead" style={{ margin: 0 }}>
            MVP note: you can paste a Contact ID from the Contacts table or API.
          </p>
        </div>
      </Modal>
    </div>
  );
}

