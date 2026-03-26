"use client";

import { useEffect, useState } from "react";
import { useMe } from "../../lib/use-me";
import { canCreate, canDelete, canEdit, isViewer } from "../../utils/permissions";
import { FlashMessage, type Flash } from "../components/Flash";
import { Modal } from "../components/Modal";
import { createContact, deleteContact, listContacts, updateContact, type Contact } from "../../lib/api/crm";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type Row = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
};

export function ContactsClient() {
  const { role } = useMe();
  const params = useSearchParams();
  const [flash, setFlash] = useState<Flash>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState<{ firstName: string; lastName: string; email: string; phone: string; organizationName: string }>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    organizationName: "",
  });
  const [saving, setSaving] = useState(false);

  const [state, setState] = useState<
    { status: "loading" } | { status: "error"; message: string } | { status: "ok"; rows: Row[]; total: number }
  >({ status: "loading" });

  async function refresh() {
    const { items, total } = await listContacts();
    setState({
      status: "ok",
      rows: items.map((c) => ({
        id: c.id,
        firstName: c.firstName ?? "",
        lastName: c.lastName ?? "",
        email: c.email ?? null,
        phone: c.phone ?? null,
      })),
      total,
    });
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { items, total } = await listContacts();
        if (!cancelled) {
          setState({
            status: "ok",
            rows: items.map((c) => ({
              id: c.id,
              firstName: c.firstName ?? "",
              lastName: c.lastName ?? "",
              email: c.email ?? null,
              phone: c.phone ?? null,
            })),
            total,
          });
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to load contacts.";
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
    if (wants === "contact") {
      setEditing(null);
      setForm({ firstName: "", lastName: "", email: "", phone: "", organizationName: "" });
      setModalOpen(true);
    }
  }, [params, role]);

  if (state.status === "loading") {
    return <p className="admin-lead">Loading contacts…</p>;
  }

  if (state.status === "error") {
    return (
      <p className="admin-lead" style={{ color: "#ffb4b4" }}>
        {state.message}
      </p>
    );
  }

  if (state.rows.length === 0) {
    return (
      <p className="admin-lead">
        No contacts yet. Add contacts via the API or future CRM forms.
      </p>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <FlashMessage flash={flash} onDismiss={() => setFlash(null)} />
      {canCreate(role) ? (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.75rem" }}>
          <button
            className="admin-btn admin-btn-primary"
            type="button"
            onClick={() => {
              setEditing(null);
              setForm({ firstName: "", lastName: "", email: "", phone: "", organizationName: "" });
              setModalOpen(true);
            }}
          >
            New contact
          </button>
        </div>
      ) : null}

      {isViewer(role) ? (
        <p className="admin-lead" style={{ marginTop: 0 }}>
          You have read-only access.
        </p>
      ) : null}

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "0.875rem",
        }}
      >
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid var(--admin-border)" }}>
            <th style={{ padding: "0.5rem 0.35rem" }}>Name</th>
            <th style={{ padding: "0.5rem 0.35rem" }}>Email</th>
            <th style={{ padding: "0.5rem 0.35rem" }}>Phone</th>
            <th style={{ padding: "0.5rem 0.35rem" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {state.rows.map((row) => (
            <tr key={row.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <td style={{ padding: "0.55rem 0.35rem" }}>
                <Link href={`/crm/contact/?id=${encodeURIComponent(row.id)}`} className="admin-link">
                  {(row.firstName || row.lastName) ? `${row.firstName} ${row.lastName}`.trim() : "Contact"}
                </Link>
              </td>
              <td style={{ padding: "0.55rem 0.35rem" }}>{row.email ?? "—"}</td>
              <td style={{ padding: "0.55rem 0.35rem" }}>{row.phone ?? "—"}</td>
              <td style={{ padding: "0.55rem 0.35rem" }}>
                <div style={{ display: "flex", gap: "0.35rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
                  {canEdit(role) ? (
                    <button
                      className="admin-btn admin-btn-ghost"
                      type="button"
                      style={{ padding: "0.35rem 0.6rem", minHeight: "2rem" }}
                      onClick={() => {
                        setEditing({ id: row.id, firstName: row.firstName, lastName: row.lastName, email: row.email, phone: row.phone });
                        setForm({
                          firstName: row.firstName ?? "",
                          lastName: row.lastName ?? "",
                          email: row.email ?? "",
                          phone: row.phone ?? "",
                          organizationName: "",
                        });
                        setModalOpen(true);
                      }}
                    >
                      Edit
                    </button>
                  ) : null}
                  {canDelete(role) ? (
                    <button
                      className="admin-btn admin-btn-ghost"
                      type="button"
                      style={{ padding: "0.35rem 0.6rem", minHeight: "2rem" }}
                      onClick={async () => {
                        if (!confirm("Delete this contact?")) return;
                        try {
                          await deleteContact(row.id);
                          await refresh();
                          setFlash({ type: "success", message: "Contact deleted." });
                        } catch (e) {
                          const message = e instanceof Error ? e.message : "Delete failed.";
                          setFlash({ type: "error", message });
                        }
                      }}
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ margin: "0.75rem 0 0", fontSize: "0.8rem", color: "var(--admin-muted)" }}>
        Showing {state.rows.length} of {state.total} (first page)
      </p>

      <Modal
        title={editing ? "Edit contact" : "New contact"}
        open={modalOpen}
        onClose={() => {
          if (saving) return;
          setModalOpen(false);
        }}
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
                if (!canCreate(role) && !editing) return;
                if (!canEdit(role) && editing) return;
                setSaving(true);
                try {
                  const payload = {
                    firstName: form.firstName || undefined,
                    lastName: form.lastName || undefined,
                    organizationName: form.organizationName || undefined,
                    email: form.email || undefined,
                    phone: form.phone || undefined,
                  };
                  if (editing) {
                    await updateContact(editing.id, payload);
                    setFlash({ type: "success", message: "Contact updated." });
                  } else {
                    await createContact(payload);
                    setFlash({ type: "success", message: "Contact created." });
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
          <div className="admin-field">
            <label>First name</label>
            <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          </div>
          <div className="admin-field">
            <label>Last name</label>
            <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </div>
          <div className="admin-field">
            <label>Organization</label>
            <input value={form.organizationName} onChange={(e) => setForm({ ...form, organizationName: e.target.value })} />
          </div>
          <div className="admin-field">
            <label>Email</label>
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="admin-field">
            <label>Phone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
