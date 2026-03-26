"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMe } from "../../../lib/use-me";
import { canCreate, canEdit, isViewer } from "../../../utils/permissions";
import { FlashMessage, type Flash } from "../../components/Flash";
import {
  createContactNote,
  createLead,
  createTask,
  deleteNote,
  getContact,
  listInquiries,
  listLeadsForContact,
  listNotes,
  listTasks,
  updateContact,
  updateNote,
  updateTask,
  type Contact,
  type Inquiry,
  type Lead,
  type Note,
  type Task,
} from "../../../lib/api/crm";
import { listActivity, type ActivityEvent } from "../../../lib/api/activity";
import { EmailPanel } from "../components/EmailPanel";

function Badge(props: { label: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "0.15rem 0.55rem",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.12)",
        color: "var(--admin-muted)",
        fontSize: "0.78rem",
        fontWeight: 750,
        letterSpacing: "0.02em",
      }}
    >
      {props.label}
    </span>
  );
}

function contactName(c: Contact) {
  const n = [c.firstName, c.lastName].filter(Boolean).join(" ").trim();
  return n || c.organizationName || c.email || c.phone || "Contact";
}

export function ContactWorkspaceClient() {
  const { role } = useMe();
  const params = useSearchParams();
  const [flash, setFlash] = useState<Flash>(null);

  const [contactId, setContactId] = useState("");
  const [state, setState] = useState<
    | { status: "idle" }
    | { status: "loading" }
    | { status: "error"; message: string }
    | { status: "ok"; contact: Contact & { createdAt?: string; type?: string } }
  >({ status: "idle" });

  const [form, setForm] = useState({ firstName: "", lastName: "", organizationName: "", email: "", phone: "" });
  const [saving, setSaving] = useState(false);

  const [leads, setLeads] = useState<{ status: "loading" } | { status: "error"; message: string } | { status: "ok"; items: Lead[] }>({ status: "loading" });
  const [notes, setNotes] = useState<{ status: "loading" } | { status: "error"; message: string } | { status: "ok"; items: Note[] }>({ status: "loading" });
  const [tasks, setTasks] = useState<{ status: "loading" } | { status: "error"; message: string } | { status: "ok"; items: Task[] }>({ status: "loading" });
  const [inquiries, setInquiries] = useState<{ status: "loading" } | { status: "error"; message: string } | { status: "ok"; items: Inquiry[] }>({ status: "loading" });
  const [activity, setActivity] = useState<{ status: "loading" } | { status: "error"; message: string } | { status: "ok"; items: ActivityEvent[] }>({ status: "loading" });

  const [noteDraft, setNoteDraft] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const [leadDraftTitle, setLeadDraftTitle] = useState("");
  const [creatingLead, setCreatingLead] = useState(false);

  const [taskDraft, setTaskDraft] = useState<{ title: string; dueAt: string; leadId: string }>({ title: "", dueAt: "", leadId: "" });
  const [creatingTask, setCreatingTask] = useState(false);

  const canMutate = useMemo(() => canCreate(role) || canEdit(role), [role]);

  useEffect(() => {
    const id = (params?.get("id") ?? "").trim();
    setContactId(id);
  }, [params]);

  async function refreshAll(id: string) {
    const [cRes, leadsRes, notesRes, activityRes] = await Promise.allSettled([
      getContact(id),
      listLeadsForContact(id),
      listNotes({ contactId: id }),
      listActivity({ contactId: id, take: 15 }),
    ]);

    if (cRes.status === "fulfilled") {
      setState({ status: "ok", contact: cRes.value });
      setForm({
        firstName: cRes.value.firstName ?? "",
        lastName: cRes.value.lastName ?? "",
        organizationName: cRes.value.organizationName ?? "",
        email: cRes.value.email ?? "",
        phone: cRes.value.phone ?? "",
      });
    } else {
      setState({ status: "error", message: cRes.reason instanceof Error ? cRes.reason.message : "Failed to load contact." });
    }

    const leadItems = leadsRes.status === "fulfilled" ? leadsRes.value.items : [];
    if (leadsRes.status === "fulfilled") setLeads({ status: "ok", items: leadItems });
    else setLeads({ status: "error", message: leadsRes.reason instanceof Error ? leadsRes.reason.message : "Failed to load leads." });

    if (notesRes.status === "fulfilled") setNotes({ status: "ok", items: notesRes.value.items });
    else setNotes({ status: "error", message: notesRes.reason instanceof Error ? notesRes.reason.message : "Failed to load notes." });

    if (activityRes.status === "fulfilled") setActivity({ status: "ok", items: activityRes.value.items });
    else setActivity({ status: "error", message: activityRes.reason instanceof Error ? activityRes.reason.message : "Failed to load activity." });

    // Tasks + inquiries: derive from leads (MVP)
    try {
      const taskLists = await Promise.all(leadItems.map((l) => listTasks({ leadId: l.id })));
      const mergedTasks = taskLists.flatMap((r) => r.items);
      mergedTasks.sort((a, b) => String(b.dueAt ?? b.id).localeCompare(String(a.dueAt ?? a.id)));
      setTasks({ status: "ok", items: mergedTasks });
    } catch (e) {
      setTasks({ status: "error", message: e instanceof Error ? e.message : "Failed to load tasks." });
    }

    try {
      const inquiryLists = await Promise.all(leadItems.map((l) => listInquiries({ leadId: l.id })));
      const merged = inquiryLists.flatMap((r) => r.items);
      merged.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
      setInquiries({ status: "ok", items: merged });
    } catch (e) {
      setInquiries({ status: "error", message: e instanceof Error ? e.message : "Failed to load inquiries." });
    }
  }

  useEffect(() => {
    if (!contactId) {
      setState({ status: "idle" });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setState({ status: "loading" });
        setLeads({ status: "loading" });
        setNotes({ status: "loading" });
        setTasks({ status: "loading" });
        setInquiries({ status: "loading" });
        setActivity({ status: "loading" });
        await refreshAll(contactId);
      } catch (e) {
        if (!cancelled) setState({ status: "error", message: e instanceof Error ? e.message : "Failed to load contact." });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [contactId]);

  if (!contactId) {
    return (
      <div className="admin-card" style={{ padding: "1rem", maxWidth: "none" }}>
        <h2 style={{ margin: 0, fontSize: "1rem" }}>Open a contact</h2>
        <p className="admin-lead" style={{ marginBottom: 0 }}>
          This admin app is a static export. Use links from the contacts list, or open:{" "}
          <code style={{ fontSize: "0.9em" }}>/crm/contact/?id=&lt;contactId&gt;</code>
        </p>
      </div>
    );
  }

  if (state.status === "loading") return <p className="admin-lead">Loading contact…</p>;
  if (state.status === "error") return <p className="admin-lead" style={{ color: "#ffb4b4" }}>{state.message}</p>;
  if (state.status !== "ok") return null;

  const c = state.contact;

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <FlashMessage flash={flash} onDismiss={() => setFlash(null)} />

      <section className="admin-card" style={{ padding: "1rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
              <h2 style={{ margin: 0, fontSize: "1.1rem" }}>{contactName(c)}</h2>
              {c.type ? <Badge label={String(c.type)} /> : null}
            </div>
            <p className="admin-lead" style={{ margin: "0.35rem 0 0" }}>
              {c.email ? <span>{c.email}</span> : <span style={{ color: "var(--admin-muted)" }}>No email</span>}
              {" · "}
              {c.phone ? <span>{c.phone}</span> : <span style={{ color: "var(--admin-muted)" }}>No phone</span>}
            </p>
            {c.createdAt ? (
              <p className="admin-lead" style={{ margin: "0.35rem 0 0" }}>
                Created: {String(c.createdAt).slice(0, 19).replace("T", " ")}
              </p>
            ) : null}
            <p className="admin-lead" style={{ margin: "0.35rem 0 0" }}>
              Contact ID: <code>{c.id}</code>
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <Link className="admin-btn admin-btn-ghost" href="/crm/" style={{ minHeight: "2.5rem" }}>
              Back to CRM
            </Link>
            <button
              className="admin-btn admin-btn-ghost"
              type="button"
              style={{ minHeight: "2.5rem" }}
              onClick={() => refreshAll(contactId).catch((e) => setFlash({ type: "error", message: e instanceof Error ? e.message : "Refresh failed." }))}
            >
              Refresh
            </button>
          </div>
        </div>
      </section>

      <section className="admin-card" style={{ padding: "1rem" }}>
        <h3 style={{ margin: 0, fontSize: "1rem" }}>Contact details</h3>
        {isViewer(role) ? <p className="admin-lead" style={{ marginTop: "0.35rem" }}>You have read-only access.</p> : null}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(15rem, 1fr))", gap: "0.5rem", marginTop: "0.6rem" }}>
          <input className="admin-input" placeholder="First name" value={form.firstName} onChange={(e) => setForm((s) => ({ ...s, firstName: e.target.value }))} disabled={!canEdit(role)} />
          <input className="admin-input" placeholder="Last name" value={form.lastName} onChange={(e) => setForm((s) => ({ ...s, lastName: e.target.value }))} disabled={!canEdit(role)} />
          <input className="admin-input" placeholder="Organization" value={form.organizationName} onChange={(e) => setForm((s) => ({ ...s, organizationName: e.target.value }))} disabled={!canEdit(role)} />
          <input className="admin-input" placeholder="Email" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} disabled={!canEdit(role)} />
          <input className="admin-input" placeholder="Phone" value={form.phone} onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))} disabled={!canEdit(role)} />
        </div>

        <div style={{ marginTop: "0.6rem", display: "flex", justifyContent: "flex-end" }}>
          <button
            className="admin-btn admin-btn-primary"
            type="button"
            disabled={!canEdit(role) || saving}
            onClick={async () => {
              try {
                setSaving(true);
                await updateContact(contactId, {
                  firstName: form.firstName.trim() || undefined,
                  lastName: form.lastName.trim() || undefined,
                  organizationName: form.organizationName.trim() || undefined,
                  email: form.email.trim() || undefined,
                  phone: form.phone.trim() || undefined,
                });
                setFlash({ type: "success", message: "Contact updated." });
                await refreshAll(contactId);
              } catch (e) {
                setFlash({ type: "error", message: e instanceof Error ? e.message : "Failed to update contact." });
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "Saving…" : "Save contact"}
          </button>
        </div>
      </section>

      <section className="admin-card" style={{ padding: "1rem" }}>
        <h3 style={{ margin: 0, fontSize: "1rem" }}>Leads</h3>
        <p className="admin-lead" style={{ marginTop: "0.35rem" }}>All leads linked to this contact.</p>

        {leads.status === "loading" ? <p className="admin-lead">Loading leads…</p> : null}
        {leads.status === "error" ? <p className="admin-lead" style={{ color: "#ffb4b4" }}>{leads.message}</p> : null}
        {leads.status === "ok" ? (
          <>
            <div style={{ display: "grid", gap: "0.5rem", marginTop: "0.5rem" }}>
              {leads.items.length === 0 ? <p className="admin-lead">No leads yet.</p> : null}
              {leads.items.map((l) => (
                <div key={l.id} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.75rem", padding: "0.75rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
                    <div style={{ minWidth: 0 }}>
                      <Link href={`/crm/lead/?id=${encodeURIComponent(l.id)}`} className="admin-link">
                        {l.title ?? "Lead"}
                      </Link>
                      <p className="admin-lead" style={{ margin: "0.25rem 0 0" }}>
                        Status: <code>{l.status}</code>
                      </p>
                    </div>
                    {l.assignedToMembershipId ? <Badge label={`Assigned`} /> : <Badge label="Unassigned" />}
                  </div>
                </div>
              ))}
            </div>

            {canCreate(role) ? (
              <div style={{ marginTop: "0.85rem", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "0.85rem" }}>
                <h4 style={{ margin: 0, fontSize: "0.95rem" }}>Create lead for this contact</h4>
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                  <input className="admin-input" placeholder="Lead title (optional)" value={leadDraftTitle} onChange={(e) => setLeadDraftTitle(e.target.value)} style={{ flex: "1 1 18rem" }} />
                  <button
                    className="admin-btn admin-btn-primary"
                    type="button"
                    disabled={creatingLead}
                    onClick={async () => {
                      try {
                        setCreatingLead(true);
                        const created = await createLead({ contactId, title: leadDraftTitle.trim() || undefined, status: "NEW" });
                        setLeadDraftTitle("");
                        setFlash({ type: "success", message: "Lead created." });
                        await refreshAll(contactId);
                        window.location.href = `/crm/lead/?id=${encodeURIComponent(created.id)}`;
                      } catch (e) {
                        setFlash({ type: "error", message: e instanceof Error ? e.message : "Failed to create lead." });
                      } finally {
                        setCreatingLead(false);
                      }
                    }}
                  >
                    {creatingLead ? "Creating…" : "Create lead"}
                  </button>
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </section>

      <section className="admin-card" style={{ padding: "1rem" }}>
        <h3 style={{ margin: 0, fontSize: "1rem" }}>Notes</h3>
        {notes.status === "loading" ? <p className="admin-lead">Loading notes…</p> : null}
        {notes.status === "error" ? <p className="admin-lead" style={{ color: "#ffb4b4" }}>{notes.message}</p> : null}
        {notes.status === "ok" ? (
          <div style={{ display: "grid", gap: "0.6rem", marginTop: "0.5rem" }}>
            {notes.items.length === 0 ? <p className="admin-lead">No notes yet.</p> : null}
            {notes.items.map((n) => (
              <div key={n.id} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.75rem", padding: "0.75rem" }}>
                <p style={{ margin: 0, color: "var(--admin-text)", whiteSpace: "pre-wrap" }}>{n.content}</p>
                <div style={{ marginTop: "0.45rem", display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
                  <time style={{ color: "var(--admin-muted)", fontSize: "0.8rem" }}>{String(n.createdAt).slice(0, 19).replace("T", " ")}</time>
                  {canEdit(role) ? (
                    <div style={{ display: "inline-flex", gap: "0.35rem" }}>
                      <button
                        className="admin-btn admin-btn-ghost"
                        type="button"
                        style={{ minHeight: "2rem", padding: "0 0.6rem" }}
                        onClick={async () => {
                          const next = prompt("Edit note", n.content);
                          if (next == null) return;
                          try {
                            await updateNote(n.id, { content: next.trim() });
                            setFlash({ type: "success", message: "Note updated." });
                            const { items } = await listNotes({ contactId });
                            setNotes({ status: "ok", items });
                          } catch (e) {
                            setFlash({ type: "error", message: e instanceof Error ? e.message : "Failed to update note." });
                          }
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="admin-btn admin-btn-ghost"
                        type="button"
                        style={{ minHeight: "2rem", padding: "0 0.6rem" }}
                        onClick={async () => {
                          if (!confirm("Delete this note?")) return;
                          try {
                            await deleteNote(n.id);
                            setFlash({ type: "success", message: "Note deleted." });
                            const { items } = await listNotes({ contactId });
                            setNotes({ status: "ok", items });
                          } catch (e) {
                            setFlash({ type: "error", message: e instanceof Error ? e.message : "Failed to delete note." });
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {canCreate(role) ? (
          <div style={{ marginTop: "0.85rem", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "0.85rem" }}>
            <h4 style={{ margin: 0, fontSize: "0.95rem" }}>Add note</h4>
            <textarea
              className="admin-input"
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              rows={4}
              placeholder="Write a quick note…"
              style={{ width: "100%", marginTop: "0.5rem", padding: "0.7rem 0.75rem", resize: "vertical" }}
            />
            <div style={{ marginTop: "0.5rem", display: "flex", justifyContent: "flex-end" }}>
              <button
                className="admin-btn admin-btn-primary"
                type="button"
                disabled={savingNote || noteDraft.trim().length < 2}
                onClick={async () => {
                  try {
                    setSavingNote(true);
                    await createContactNote({ contactId, content: noteDraft.trim() });
                    setNoteDraft("");
                    setFlash({ type: "success", message: "Note added." });
                    const { items } = await listNotes({ contactId });
                    setNotes({ status: "ok", items });
                  } catch (e) {
                    setFlash({ type: "error", message: e instanceof Error ? e.message : "Failed to add note." });
                  } finally {
                    setSavingNote(false);
                  }
                }}
              >
                {savingNote ? "Saving…" : "Add note"}
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <section className="admin-card" style={{ padding: "1rem" }}>
        <h3 style={{ margin: 0, fontSize: "1rem" }}>Tasks</h3>
        <p className="admin-lead" style={{ marginTop: "0.35rem" }}>
          MVP: tasks are shown from leads linked to this contact.
        </p>
        {tasks.status === "loading" ? <p className="admin-lead">Loading tasks…</p> : null}
        {tasks.status === "error" ? <p className="admin-lead" style={{ color: "#ffb4b4" }}>{tasks.message}</p> : null}
        {tasks.status === "ok" ? (
          <div style={{ overflowX: "auto", marginTop: "0.5rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid var(--admin-border)" }}>
                  <th style={{ padding: "0.5rem 0.35rem" }}>Title</th>
                  <th style={{ padding: "0.5rem 0.35rem" }}>Status</th>
                  <th style={{ padding: "0.5rem 0.35rem" }}>Due</th>
                  <th style={{ padding: "0.5rem 0.35rem" }}>Lead</th>
                  <th style={{ padding: "0.5rem 0.35rem", textAlign: "right" }} />
                </tr>
              </thead>
              <tbody>
                {tasks.items.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "0.75rem 0.35rem" }}>
                      <p className="admin-lead" style={{ margin: 0 }}>
                        No tasks yet.
                      </p>
                    </td>
                  </tr>
                ) : null}
                {tasks.items.map((t) => (
                  <tr key={t.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <td style={{ padding: "0.55rem 0.35rem" }}>{t.title}</td>
                    <td style={{ padding: "0.55rem 0.35rem", color: "var(--admin-muted)" }}>{t.status}</td>
                    <td style={{ padding: "0.55rem 0.35rem" }}>{t.dueAt ? String(t.dueAt).slice(0, 10) : "—"}</td>
                    <td style={{ padding: "0.55rem 0.35rem" }}>
                      {t.leadId ? (
                        <Link href={`/crm/lead/?id=${encodeURIComponent(t.leadId)}`} className="admin-link">
                          {t.leadId.slice(0, 8)}…
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td style={{ padding: "0.55rem 0.35rem", textAlign: "right" }}>
                      {canEdit(role) ? (
                        <button
                          className="admin-btn admin-btn-ghost"
                          type="button"
                          style={{ minHeight: "2rem", padding: "0 0.6rem" }}
                          onClick={async () => {
                            try {
                              await updateTask(t.id, { status: t.status === "DONE" ? "TODO" : "DONE" });
                              await refreshAll(contactId);
                              setFlash({ type: "success", message: t.status === "DONE" ? "Marked as TODO." : "Marked as DONE." });
                            } catch (e) {
                              setFlash({ type: "error", message: e instanceof Error ? e.message : "Failed to update task." });
                            }
                          }}
                        >
                          {t.status === "DONE" ? "Reopen" : "Done"}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {canCreate(role) ? (
          <div style={{ marginTop: "0.85rem", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "0.85rem" }}>
            <h4 style={{ margin: 0, fontSize: "0.95rem" }}>Add task</h4>
            <div style={{ marginTop: "0.5rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(12rem, 1fr))", gap: "0.5rem" }}>
              <input className="admin-input" placeholder="Task title…" value={taskDraft.title} onChange={(e) => setTaskDraft((s) => ({ ...s, title: e.target.value }))} />
              <input className="admin-input" type="date" value={taskDraft.dueAt} onChange={(e) => setTaskDraft((s) => ({ ...s, dueAt: e.target.value }))} />
              <select
                className="admin-input"
                value={taskDraft.leadId}
                onChange={(e) => setTaskDraft((s) => ({ ...s, leadId: e.target.value }))}
                style={{ width: "100%", minWidth: 0 }}
              >
                <option value="">Lead (optional)</option>
                {leads.status === "ok"
                  ? leads.items.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.title ?? l.id.slice(0, 8)}
                      </option>
                    ))
                  : null}
              </select>
            </div>
            <div style={{ marginTop: "0.5rem", display: "flex", justifyContent: "flex-end" }}>
              <button
                className="admin-btn admin-btn-primary"
                type="button"
                disabled={creatingTask || taskDraft.title.trim().length < 2}
                onClick={async () => {
                  try {
                    setCreatingTask(true);
                    await createTask({
                      title: taskDraft.title.trim(),
                      status: "TODO",
                      dueAt: taskDraft.dueAt || undefined,
                      leadId: taskDraft.leadId || undefined,
                    });
                    setTaskDraft({ title: "", dueAt: "", leadId: "" });
                    setFlash({ type: "success", message: "Task created." });
                    await refreshAll(contactId);
                  } catch (e) {
                    setFlash({ type: "error", message: e instanceof Error ? e.message : "Failed to create task." });
                  } finally {
                    setCreatingTask(false);
                  }
                }}
              >
                {creatingTask ? "Saving…" : "Add task"}
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <section className="admin-card" style={{ padding: "1rem" }}>
        <h3 style={{ margin: 0, fontSize: "1rem" }}>Inquiry history</h3>
        <p className="admin-lead" style={{ marginTop: "0.35rem" }}>
          MVP: inquiries are shown via leads converted from inquiries.
        </p>
        {inquiries.status === "loading" ? <p className="admin-lead">Loading inquiries…</p> : null}
        {inquiries.status === "error" ? <p className="admin-lead" style={{ color: "#ffb4b4" }}>{inquiries.message}</p> : null}
        {inquiries.status === "ok" ? (
          <div style={{ display: "grid", gap: "0.6rem", marginTop: "0.5rem" }}>
            {inquiries.items.length === 0 ? <p className="admin-lead">No inquiries found.</p> : null}
            {inquiries.items.map((iq) => (
              <div key={iq.id} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.75rem", padding: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
                  <p style={{ margin: 0, color: "var(--admin-text)", fontWeight: 650 }}>
                    {iq.listing?.title ?? "Listing"} {iq.listing?.id ? <span style={{ color: "var(--admin-muted)", fontWeight: 500 }}>· {iq.listing.slug}</span> : null}
                  </p>
                  <Badge label={String(iq.status ?? "—")} />
                </div>
                {iq.message ? <p className="admin-lead" style={{ margin: "0.4rem 0 0", whiteSpace: "pre-wrap" }}>{iq.message}</p> : null}
                <div style={{ marginTop: "0.45rem", display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
                  <time style={{ color: "var(--admin-muted)", fontSize: "0.8rem" }}>{String(iq.createdAt).slice(0, 19).replace("T", " ")}</time>
                  <div style={{ display: "inline-flex", gap: "0.35rem" }}>
                    {iq.leadId ? (
                      <Link className="admin-btn admin-btn-ghost" href={`/crm/lead/?id=${encodeURIComponent(iq.leadId)}`} style={{ minHeight: "2rem", padding: "0 0.6rem" }}>
                        View lead
                      </Link>
                    ) : null}
                    {iq.listing?.id ? (
                      <Link className="admin-btn admin-btn-ghost" href={`/listings/view/?id=${encodeURIComponent(iq.listing.id)}`} style={{ minHeight: "2rem", padding: "0 0.6rem" }}>
                        View listing
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <EmailPanel
        contactId={contactId}
        context={{
          contact: state.status === "ok" ? state.contact : null,
          leads: leads.status === "ok" ? leads.items : null,
        }}
      />

      {/* Contact-scoped collaboration can be added later; MVP focuses on leads/listings/tasks */}

      <section className="admin-card" style={{ padding: "1rem" }}>
        <h3 style={{ margin: 0, fontSize: "1rem" }}>Recent activity</h3>
        {activity.status === "loading" ? <p className="admin-lead">Loading activity…</p> : null}
        {activity.status === "error" ? <p className="admin-lead" style={{ color: "#ffb4b4" }}>{activity.message}</p> : null}
        {activity.status === "ok" ? (
          <div style={{ border: "1px solid var(--admin-border)", borderRadius: "0.9rem", overflow: "hidden", marginTop: "0.5rem" }}>
            {activity.items.length === 0 ? (
              <p className="admin-lead" style={{ margin: 0, padding: "0.9rem 1rem" }}>
                No activity yet.
              </p>
            ) : (
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {activity.items.map((a, idx) => (
                  <li
                    key={a.id ?? `${a.entityType}-${a.entityId}-${idx}`}
                    style={{
                      padding: "0.85rem 1rem",
                      borderTop: idx === 0 ? "none" : "1px solid rgba(255,255,255,0.06)",
                      display: "flex",
                      gap: "1rem",
                      alignItems: "baseline",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, color: "var(--admin-text)", fontWeight: 650 }}>{a.message || `${a.entityType} ${a.action}`}</p>
                      <p style={{ margin: "0.2rem 0 0", color: "var(--admin-muted)", fontSize: "0.85rem" }}>
                        {a.entityType} · <code>{String(a.entityId).slice(0, 8)}…</code>
                      </p>
                    </div>
                    <time style={{ color: "var(--admin-muted)", fontSize: "0.8rem", flexShrink: 0 }}>
                      {String(a.createdAt).slice(0, 19).replace("T", " ")}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </section>
    </div>
  );
}

