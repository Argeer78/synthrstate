"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMe } from "../../../lib/use-me";
import { canCreate, canEdit, isViewer } from "../../../utils/permissions";
import { FlashMessage, type Flash } from "../../components/Flash";
import { createLeadNote, createTask, deleteNote, getLead, listInquiries, listNotes, listTasks, updateLead, updateNote, updateTask, type Inquiry, type Lead, type Note, type Task } from "../../../lib/api/crm";
import { listActivity, type ActivityEvent } from "../../../lib/api/activity";
import { EmailPanel } from "../components/EmailPanel";
import { CommentsSection } from "../components/CommentsSection";
import { AttachmentsSection } from "../components/AttachmentsSection";

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

export function LeadWorkspaceClient() {
  const { role } = useMe();
  const params = useSearchParams();
  const [flash, setFlash] = useState<Flash>(null);

  const [leadId, setLeadId] = useState<string>("");
  const [state, setState] = useState<
    | { status: "idle" }
    | { status: "loading" }
    | { status: "error"; message: string }
    | { status: "ok"; lead: Lead & any }
  >({ status: "idle" });

  const [notes, setNotes] = useState<{ status: "loading" } | { status: "error"; message: string } | { status: "ok"; items: Note[] }>({
    status: "loading",
  });
  const [tasks, setTasks] = useState<{ status: "loading" } | { status: "error"; message: string } | { status: "ok"; items: Task[] }>({
    status: "loading",
  });
  const [inquiries, setInquiries] = useState<
    { status: "loading" } | { status: "error"; message: string } | { status: "ok"; items: Inquiry[] }
  >({ status: "loading" });
  const [activity, setActivity] = useState<
    { status: "loading" } | { status: "error"; message: string } | { status: "ok"; items: ActivityEvent[] }
  >({ status: "loading" });

  const [noteDraft, setNoteDraft] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const [taskDraft, setTaskDraft] = useState<{ title: string; dueAt: string }>({ title: "", dueAt: "" });
  const [savingTask, setSavingTask] = useState(false);

  const canMutate = useMemo(() => canCreate(role) || canEdit(role), [role]);

  useEffect(() => {
    const id = (params?.get("id") ?? "").trim();
    setLeadId(id);
  }, [params]);

  async function refreshAll(id: string) {
    const [leadRes, notesRes, tasksRes, inquiriesRes, activityRes] = await Promise.allSettled([
      getLead(id),
      listNotes({ leadId: id }),
      listTasksByLead(id),
      listInquiries({ leadId: id }),
      listActivity({ leadId: id, take: 15 }),
    ]);

    if (leadRes.status === "fulfilled") setState({ status: "ok", lead: leadRes.value });
    else setState({ status: "error", message: leadRes.reason instanceof Error ? leadRes.reason.message : "Failed to load lead." });

    if (notesRes.status === "fulfilled") setNotes({ status: "ok", items: notesRes.value.items });
    else setNotes({ status: "error", message: notesRes.reason instanceof Error ? notesRes.reason.message : "Failed to load notes." });

    if (tasksRes.status === "fulfilled") setTasks({ status: "ok", items: tasksRes.value.items });
    else setTasks({ status: "error", message: tasksRes.reason instanceof Error ? tasksRes.reason.message : "Failed to load tasks." });

    if (inquiriesRes.status === "fulfilled") setInquiries({ status: "ok", items: inquiriesRes.value.items });
    else setInquiries({ status: "error", message: inquiriesRes.reason instanceof Error ? inquiriesRes.reason.message : "Failed to load inquiries." });

    if (activityRes.status === "fulfilled") setActivity({ status: "ok", items: activityRes.value.items });
    else setActivity({ status: "error", message: activityRes.reason instanceof Error ? activityRes.reason.message : "Failed to load activity." });
  }

  useEffect(() => {
    if (!leadId) {
      setState({ status: "idle" });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setState({ status: "loading" });
        setNotes({ status: "loading" });
        setTasks({ status: "loading" });
        setInquiries({ status: "loading" });
        setActivity({ status: "loading" });
        await refreshAll(leadId);
      } catch (e) {
        if (!cancelled) setState({ status: "error", message: e instanceof Error ? e.message : "Failed to load lead." });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [leadId]);

  if (!leadId) {
    return (
      <div className="admin-card" style={{ padding: "1rem", maxWidth: "none" }}>
        <h2 style={{ margin: 0, fontSize: "1rem" }}>Open a lead</h2>
        <p className="admin-lead" style={{ marginBottom: 0 }}>
          This admin app is currently deployed as a static export. Use links from the CRM list, or open:{" "}
          <code style={{ fontSize: "0.9em" }}>/crm/lead/?id=&lt;leadId&gt;</code>
        </p>
      </div>
    );
  }

  if (state.status === "loading") return <p className="admin-lead">Loading lead…</p>;
  if (state.status === "error")
    return (
      <p className="admin-lead" style={{ color: "#ffb4b4" }}>
        {state.message}
      </p>
    );

  if (state.status !== "ok") return null;
  const lead = state.lead as Lead & { contact?: any; createdAt?: string; assignedToMembershipId?: string | null; status?: string; title?: string };
  const contact = lead.contact as any | undefined;

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <FlashMessage flash={flash} onDismiss={() => setFlash(null)} />

      <section className="admin-card" style={{ padding: "1rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
              <h2 style={{ margin: 0, fontSize: "1.1rem" }}>{lead.title ?? "Lead"}</h2>
              <Badge label={lead.status ?? "—"} />
            </div>
            <p className="admin-lead" style={{ margin: "0.35rem 0 0" }}>
              <span style={{ color: "var(--admin-muted)" }}>Lead ID:</span> <code>{lead.id}</code>
            </p>
            {lead.createdAt ? (
              <p className="admin-lead" style={{ margin: "0.35rem 0 0" }}>
                <span style={{ color: "var(--admin-muted)" }}>Created:</span> {String(lead.createdAt).slice(0, 19).replace("T", " ")}
              </p>
            ) : null}
          </div>

          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <Link className="admin-btn admin-btn-ghost" href="/crm/" style={{ minHeight: "2.5rem" }}>
              Back to CRM
            </Link>
            <button
              className="admin-btn admin-btn-ghost"
              type="button"
              style={{ minHeight: "2.5rem" }}
              onClick={() => refreshAll(leadId).catch((e) => setFlash({ type: "error", message: e instanceof Error ? e.message : "Refresh failed." }))}
            >
              Refresh
            </button>
          </div>
        </div>

        <div style={{ marginTop: "0.9rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(16rem, 1fr))", gap: "0.75rem" }}>
          <div style={{ border: "1px solid var(--admin-border)", borderRadius: "0.75rem", padding: "0.75rem" }}>
            <p className="admin-lead" style={{ margin: 0 }}>
              <strong style={{ color: "var(--admin-text)" }}>Contact</strong>
            </p>
            {contact ? (
              <div style={{ marginTop: "0.4rem" }}>
                <p style={{ margin: 0, color: "var(--admin-text)", fontWeight: 650 }}>
                  <Link href={`/crm/contact/?id=${encodeURIComponent(contact.id)}`} className="admin-link">
                    {[contact.firstName, contact.lastName].filter(Boolean).join(" ") || contact.organizationName || "Contact"}
                  </Link>
                </p>
                <p className="admin-lead" style={{ margin: "0.25rem 0 0" }}>
                  {contact.email ? <span>{contact.email}</span> : <span style={{ color: "var(--admin-muted)" }}>No email</span>}
                  {" · "}
                  {contact.phone ? <span>{contact.phone}</span> : <span style={{ color: "var(--admin-muted)" }}>No phone</span>}
                </p>
                <p className="admin-lead" style={{ margin: "0.35rem 0 0" }}>
                  <span style={{ color: "var(--admin-muted)" }}>Contact ID:</span> <code>{contact.id}</code>
                </p>
              </div>
            ) : (
              <p className="admin-lead" style={{ margin: "0.4rem 0 0" }}>
                —
              </p>
            )}
          </div>

          <div style={{ border: "1px solid var(--admin-border)", borderRadius: "0.75rem", padding: "0.75rem" }}>
            <p className="admin-lead" style={{ margin: 0 }}>
              <strong style={{ color: "var(--admin-text)" }}>Assignment</strong>
            </p>
            <p className="admin-lead" style={{ margin: "0.4rem 0 0" }}>
              <span style={{ color: "var(--admin-muted)" }}>Assigned to:</span>{" "}
              {lead.assignedToMembershipId ? <code>{lead.assignedToMembershipId}</code> : <span style={{ color: "var(--admin-muted)" }}>Unassigned</span>}
            </p>
            {isViewer(role) ? null : (
              <div style={{ marginTop: "0.55rem", display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                <input
                  className="admin-input"
                  value={String((lead as any).__draftAssignedTo ?? "")}
                  placeholder="membershipId (optional)"
                  onChange={(e) => {
                    const v = e.target.value;
                    setState((s) => (s.status === "ok" ? ({ ...s, lead: { ...(s.lead as any), __draftAssignedTo: v } } as any) : s));
                  }}
                  style={{ maxWidth: "20rem" }}
                />
                <button
                  className="admin-btn admin-btn-ghost"
                  type="button"
                  onClick={async () => {
                    try {
                      const v = String((lead as any).__draftAssignedTo ?? "").trim();
                      await updateLead(lead.id, { assignedToMembershipId: v || undefined });
                      setFlash({ type: "success", message: "Assignment updated." });
                      await refreshAll(leadId);
                    } catch (e) {
                      setFlash({ type: "error", message: e instanceof Error ? e.message : "Failed to update assignment." });
                    }
                  }}
                  title={canMutate ? "" : "You don’t have permission"}
                  disabled={!canMutate}
                  style={{ minHeight: "2.25rem" }}
                >
                  Save
                </button>
              </div>
            )}
            {role === "AGENT" ? (
              <p className="admin-lead" style={{ margin: "0.45rem 0 0" }}>
                Agents can only assign leads to themselves (enforced by API).
              </p>
            ) : null}
          </div>

          <div style={{ border: "1px solid var(--admin-border)", borderRadius: "0.75rem", padding: "0.75rem" }}>
            <p className="admin-lead" style={{ margin: 0 }}>
              <strong style={{ color: "var(--admin-text)" }}>Status</strong>
            </p>
            <p className="admin-lead" style={{ margin: "0.4rem 0 0" }}>
              <span style={{ color: "var(--admin-muted)" }}>Current:</span> <code>{lead.status ?? "—"}</code>
            </p>
            {isViewer(role) ? null : (
              <div style={{ marginTop: "0.55rem", display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                <select
                  className="admin-input"
                  value={String((lead as any).__draftStatus ?? lead.status ?? "NEW")}
                  onChange={(e) => {
                    const v = e.target.value;
                    setState((s) => (s.status === "ok" ? ({ ...s, lead: { ...(s.lead as any), __draftStatus: v } } as any) : s));
                  }}
                  style={{ maxWidth: "14rem" }}
                >
                  <option value="NEW">NEW</option>
                  <option value="CONTACTED">CONTACTED</option>
                  <option value="QUALIFIED">QUALIFIED</option>
                  <option value="NEGOTIATION">NEGOTIATION</option>
                  <option value="WON">WON</option>
                  <option value="LOST">LOST</option>
                </select>
                <button
                  className="admin-btn admin-btn-ghost"
                  type="button"
                  disabled={!canMutate}
                  title={canMutate ? "" : "You don’t have permission"}
                  onClick={async () => {
                    try {
                      const v = String((lead as any).__draftStatus ?? lead.status ?? "NEW");
                      await updateLead(lead.id, { status: v });
                      setFlash({ type: "success", message: "Lead status updated." });
                      await refreshAll(leadId);
                    } catch (e) {
                      setFlash({ type: "error", message: e instanceof Error ? e.message : "Failed to update lead status." });
                    }
                  }}
                  style={{ minHeight: "2.25rem" }}
                >
                  Save
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="admin-card" style={{ padding: "1rem" }}>
        <h3 style={{ margin: 0, fontSize: "1rem" }}>Notes</h3>
        <p className="admin-lead" style={{ marginTop: "0.35rem" }}>
          Notes are role-scoped by the API. Agents will only see their own notes on this lead.
        </p>

        {notes.status === "loading" ? <p className="admin-lead">Loading notes…</p> : null}
        {notes.status === "error" ? (
          <p className="admin-lead" style={{ color: "#ffb4b4" }}>
            {notes.message}
          </p>
        ) : null}

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
                            const { items } = await listNotes({ leadId });
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
                            const { items } = await listNotes({ leadId });
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
                    await createLeadNote({ leadId, content: noteDraft.trim() });
                    setNoteDraft("");
                    setFlash({ type: "success", message: "Note added." });
                    const { items } = await listNotes({ leadId });
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
          Keep tasks small and actionable. Mark done as you go.
        </p>

        {tasks.status === "loading" ? <p className="admin-lead">Loading tasks…</p> : null}
        {tasks.status === "error" ? (
          <p className="admin-lead" style={{ color: "#ffb4b4" }}>
            {tasks.message}
          </p>
        ) : null}

        {tasks.status === "ok" ? (
          <div style={{ overflowX: "auto", marginTop: "0.5rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid var(--admin-border)" }}>
                  <th style={{ padding: "0.5rem 0.35rem" }}>Title</th>
                  <th style={{ padding: "0.5rem 0.35rem" }}>Status</th>
                  <th style={{ padding: "0.5rem 0.35rem" }}>Due</th>
                  <th style={{ padding: "0.5rem 0.35rem", textAlign: "right" }} />
                </tr>
              </thead>
              <tbody>
                {tasks.items.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: "0.75rem 0.35rem" }}>
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
                    <td style={{ padding: "0.55rem 0.35rem", textAlign: "right" }}>
                      {canEdit(role) ? (
                        <div style={{ display: "inline-flex", gap: "0.35rem" }}>
                          <button
                            className="admin-btn admin-btn-ghost"
                            type="button"
                            style={{ minHeight: "2rem", padding: "0 0.6rem" }}
                            onClick={async () => {
                              const nextTitle = prompt("Edit task title", t.title ?? "");
                              if (nextTitle == null) return;
                              const nextDueAt = prompt("Edit due date (YYYY-MM-DD), blank to clear", t.dueAt ? String(t.dueAt).slice(0, 10) : "");
                              if (nextDueAt == null) return;
                              try {
                                const dueAt = nextDueAt.trim();
                                await updateTask(t.id, {
                                  title: nextTitle.trim(),
                                  dueAt: dueAt ? dueAt : undefined,
                                });
                                const { items } = await listTasksByLead(leadId);
                                setTasks({ status: "ok", items });
                                setFlash({ type: "success", message: "Task updated." });
                              } catch (e) {
                                setFlash({ type: "error", message: e instanceof Error ? e.message : "Failed to update task." });
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
                              try {
                                await updateTask(t.id, { status: t.status === "DONE" ? "TODO" : "DONE" });
                                const { items } = await listTasksByLead(leadId);
                                setTasks({ status: "ok", items });
                                setFlash({ type: "success", message: t.status === "DONE" ? "Marked as TODO." : "Marked as DONE." });
                              } catch (e) {
                                setFlash({ type: "error", message: e instanceof Error ? e.message : "Failed to update task." });
                              }
                            }}
                          >
                            {t.status === "DONE" ? "Reopen" : "Done"}
                          </button>
                        </div>
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
            <div style={{ marginTop: "0.5rem", display: "grid", gridTemplateColumns: "2fr 1fr", gap: "0.5rem" }}>
              <input
                className="admin-input"
                value={taskDraft.title}
                onChange={(e) => setTaskDraft((s) => ({ ...s, title: e.target.value }))}
                placeholder="Task title…"
              />
              <input className="admin-input" type="date" value={taskDraft.dueAt} onChange={(e) => setTaskDraft((s) => ({ ...s, dueAt: e.target.value }))} />
            </div>
            <div style={{ marginTop: "0.5rem", display: "flex", justifyContent: "flex-end" }}>
              <button
                className="admin-btn admin-btn-primary"
                type="button"
                disabled={savingTask || taskDraft.title.trim().length < 2}
                onClick={async () => {
                  try {
                    setSavingTask(true);
                    await createTask({
                      title: taskDraft.title.trim(),
                      status: "TODO",
                      dueAt: taskDraft.dueAt || undefined,
                      leadId,
                    });
                    setTaskDraft({ title: "", dueAt: "" });
                    setFlash({ type: "success", message: "Task created." });
                    const { items } = await listTasksByLead(leadId);
                    setTasks({ status: "ok", items });
                  } catch (e) {
                    setFlash({ type: "error", message: e instanceof Error ? e.message : "Failed to create task." });
                  } finally {
                    setSavingTask(false);
                  }
                }}
              >
                {savingTask ? "Saving…" : "Add task"}
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <section className="admin-card" style={{ padding: "1rem" }}>
        <h3 style={{ margin: 0, fontSize: "1rem" }}>Inquiry context</h3>
        <p className="admin-lead" style={{ marginTop: "0.35rem" }}>
          If this lead came from a public inquiry, you’ll see it here.
        </p>
        {inquiries.status === "loading" ? <p className="admin-lead">Loading inquiries…</p> : null}
        {inquiries.status === "error" ? (
          <p className="admin-lead" style={{ color: "#ffb4b4" }}>
            {inquiries.message}
          </p>
        ) : null}
        {inquiries.status === "ok" ? (
          <div style={{ display: "grid", gap: "0.6rem", marginTop: "0.5rem" }}>
            {inquiries.items.length === 0 ? <p className="admin-lead">No linked inquiries.</p> : null}
            {inquiries.items.map((iq) => (
              <div key={iq.id} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.75rem", padding: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
                  <p style={{ margin: 0, color: "var(--admin-text)", fontWeight: 650 }}>
                    {iq.name ?? "Inquiry"} {iq.email ? <span style={{ color: "var(--admin-muted)", fontWeight: 500 }}>· {iq.email}</span> : null}
                  </p>
                  <Badge label={String(iq.status ?? "—")} />
                </div>
                {iq.listing?.slug ? (
                  <p className="admin-lead" style={{ margin: "0.35rem 0 0" }}>
                    Listing: <code>{iq.listing.slug}</code> <span style={{ color: "var(--admin-muted)" }}>({iq.listing.title ?? "—"})</span>
                  </p>
                ) : null}
                {iq.message ? (
                  <p className="admin-lead" style={{ margin: "0.4rem 0 0", whiteSpace: "pre-wrap" }}>
                    {iq.message}
                  </p>
                ) : null}
                <time style={{ display: "block", marginTop: "0.45rem", color: "var(--admin-muted)", fontSize: "0.8rem" }}>
                  {String(iq.createdAt).slice(0, 19).replace("T", " ")}
                </time>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <EmailPanel
        leadId={leadId}
        contactId={state.status === "ok" ? state.lead.contactId : undefined}
        context={{
          lead: state.status === "ok" ? state.lead : null,
          contact: state.status === "ok" ? (state.lead as any)?.contact ?? null : null,
        }}
      />

      <CommentsSection targetType="LEAD" targetId={leadId} />
      <AttachmentsSection targetType="LEAD" targetId={leadId} />

      <section className="admin-card" style={{ padding: "1rem" }}>
        <h3 style={{ margin: 0, fontSize: "1rem" }}>Recent activity</h3>
        <p className="admin-lead" style={{ marginTop: "0.35rem" }}>
          Latest events for this lead (role-scoped).
        </p>
        {activity.status === "loading" ? <p className="admin-lead">Loading activity…</p> : null}
        {activity.status === "error" ? (
          <p className="admin-lead" style={{ color: "#ffb4b4" }}>
            {activity.message}
          </p>
        ) : null}
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
                      <p style={{ margin: 0, color: "var(--admin-text)", fontWeight: 650 }}>
                        {a.message || `${a.entityType} ${a.action}`}
                      </p>
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

async function listTasksByLead(leadId: string) {
  const { items } = await listTasks({ leadId });
  return { items };
}

