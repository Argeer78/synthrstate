"use client";

import { useEffect, useState } from "react";
import { useMe } from "../../lib/use-me";
import { canCreate, canEdit, isViewer } from "../../utils/permissions";
import { FlashMessage, type Flash } from "../components/Flash";
import { Modal } from "../components/Modal";
import { createTask, deleteTask, listTasks, updateTask, type Task } from "../../lib/api/crm";

export function TasksClient() {
  const { role } = useMe();
  const [flash, setFlash] = useState<Flash>(null);
  const [state, setState] = useState<
    { status: "loading" } | { status: "error"; message: string } | { status: "ok"; rows: Task[]; total: number }
  >({ status: "loading" });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState<{ title: string; status: string; dueAt: string; leadId: string; assignedToMembershipId: string; description: string }>({
    title: "",
    status: "TODO",
    dueAt: "",
    leadId: "",
    assignedToMembershipId: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);

  async function refresh() {
    const { items, total } = await listTasks();
    setState({ status: "ok", rows: items, total });
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { items, total } = await listTasks();
        if (!cancelled) setState({ status: "ok", rows: items, total });
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to load tasks.";
        if (!cancelled) setState({ status: "error", message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") return <p className="admin-lead">Loading tasks…</p>;
  if (state.status === "error")
    return (
      <p className="admin-lead" style={{ color: "#ffb4b4" }}>
        {state.message}
      </p>
    );

  return (
    <div style={{ marginTop: "1.5rem" }}>
      <h2 style={{ margin: "0 0 0.5rem", fontSize: "1rem" }}>Tasks</h2>
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
              setForm({ title: "", status: "TODO", dueAt: "", leadId: "", assignedToMembershipId: "", description: "" });
              setModalOpen(true);
            }}
          >
            New task
          </button>
        </div>
      ) : null}

      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid var(--admin-border)" }}>
              <th style={{ padding: "0.5rem 0.35rem" }}>Title</th>
              <th style={{ padding: "0.5rem 0.35rem" }}>Status</th>
              <th style={{ padding: "0.5rem 0.35rem" }}>Due</th>
              <th style={{ padding: "0.5rem 0.35rem" }}>Lead</th>
              <th style={{ padding: "0.5rem 0.35rem" }} />
            </tr>
          </thead>
          <tbody>
            {state.rows.map((t) => (
              <tr key={t.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <td style={{ padding: "0.55rem 0.35rem" }}>{t.title}</td>
                <td style={{ padding: "0.55rem 0.35rem", color: "var(--admin-muted)" }}>{t.status}</td>
                <td style={{ padding: "0.55rem 0.35rem" }}>{t.dueAt ? String(t.dueAt).slice(0, 10) : "—"}</td>
                <td style={{ padding: "0.55rem 0.35rem" }}>{t.leadId ? <code style={{ fontSize: "0.8em" }}>{t.leadId.slice(0, 8)}…</code> : "—"}</td>
                <td style={{ padding: "0.55rem 0.35rem", textAlign: "right" }}>
                  {canEdit(role) ? (
                    <div style={{ display: "inline-flex", gap: "0.35rem" }}>
                      <button
                        className="admin-btn admin-btn-ghost"
                        type="button"
                        style={{ minHeight: "2rem", padding: "0 0.6rem" }}
                        onClick={() => {
                          setEditing(t);
                          setForm({
                            title: t.title ?? "",
                            status: t.status ?? "TODO",
                            dueAt: t.dueAt ? String(t.dueAt).slice(0, 10) : "",
                            leadId: t.leadId ?? "",
                            assignedToMembershipId: t.assignedToMembershipId ?? "",
                            description: "",
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
                          if (!confirm("Delete this task?")) return;
                          try {
                            await deleteTask(t.id);
                            await refresh();
                            setFlash({ type: "success", message: "Task deleted." });
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
        {state.rows.length === 0 ? <p className="admin-lead">No tasks yet.</p> : null}
      </div>

      <Modal
        title={editing ? "Edit task" : "New task"}
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
                  const payload = {
                    title: form.title,
                    status: form.status || undefined,
                    dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : undefined,
                    leadId: !editing && form.leadId ? form.leadId : undefined,
                    assignedToMembershipId: form.assignedToMembershipId || undefined,
                    description: form.description || undefined,
                  };
                  if (editing) {
                    await updateTask(editing.id, payload);
                    setFlash({ type: "success", message: "Task updated." });
                  } else {
                    await createTask(payload as any);
                    setFlash({ type: "success", message: "Task created." });
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
            <label>Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="admin-field">
            <label>Status</label>
            <input value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} placeholder="TODO / IN_PROGRESS / DONE" />
          </div>
          <div className="admin-field">
            <label>Due date</label>
            <input type="date" value={form.dueAt} onChange={(e) => setForm({ ...form, dueAt: e.target.value })} />
          </div>
          {!editing ? (
            <div className="admin-field">
              <label>Lead ID (optional)</label>
              <input value={form.leadId} onChange={(e) => setForm({ ...form, leadId: e.target.value })} placeholder="UUID" />
            </div>
          ) : null}
          <div className="admin-field">
            <label>Assign to membershipId (optional)</label>
            <input value={form.assignedToMembershipId} onChange={(e) => setForm({ ...form, assignedToMembershipId: e.target.value })} placeholder="membership UUID" />
          </div>
        </div>
      </Modal>
    </div>
  );
}

