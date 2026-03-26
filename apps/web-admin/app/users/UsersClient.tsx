"use client";

import { useEffect, useMemo, useState } from "react";
import { FlashMessage, type Flash } from "../components/Flash";
import { Modal } from "../components/Modal";
import { useMe } from "../../lib/use-me";
import type { UserRole } from "../../utils/permissions";
import { canManageUsers } from "../../utils/permissions";
import { createTeamMember, listTeamMembers, resetTeamMemberPassword, updateTeamMember, type TeamMember, type UserStatus } from "../../lib/api/users";

function roleLabel(role: UserRole) {
  return role === "STAFF" ? "Viewer" : role;
}

function statusLabel(status: UserStatus) {
  return status;
}

function formatName(m: TeamMember) {
  const full = m.fullName?.trim();
  return full && full.length > 0 ? full : m.email;
}

export function UsersClient() {
  const { state: meState, role } = useMe();
  const [flash, setFlash] = useState<Flash>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [createSaving, setCreateSaving] = useState(false);
  const [createForm, setCreateForm] = useState<{ fullName: string; email: string; password: string; role: UserRole }>({
    fullName: "",
    email: "",
    password: "",
    role: "AGENT",
  });

  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TeamMember | null>(null);
  const [editRole, setEditRole] = useState<UserRole>("AGENT");
  const [editStatus, setEditStatus] = useState<UserStatus>("ACTIVE");
  const [editSaving, setEditSaving] = useState(false);

  const [resetOpen, setResetOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<TeamMember | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetSaving, setResetSaving] = useState(false);

  const myEmail = meState.status === "ok" ? meState.me.user?.email ?? null : null;

  const allowedCreateRoles = useMemo(() => {
    if (role === "OWNER") return ["OWNER", "MANAGER", "AGENT", "STAFF"] as UserRole[];
    if (role === "MANAGER") return ["AGENT", "STAFF"] as UserRole[];
    return [] as UserRole[];
  }, [role]);

  const allowedEditRolesForManager = useMemo(() => {
    if (role !== "MANAGER") return null;
    return ["AGENT", "STAFF"] as UserRole[];
  }, [role]);

  async function refresh() {
    setLoading(true);
    try {
      const { items } = await listTeamMembers({ page: 1, pageSize: 50 });
      setMembers(Array.isArray(items) ? items : []);
      setFlash(null);
    } catch (e) {
      setFlash({ type: "error", message: e instanceof Error ? e.message : "Failed to load team." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canManage = canManageUsers(role);

  if (loading) return <p className="admin-lead">Loading team…</p>;
  if (!canManage) return <p className="admin-lead">No access.</p>;

  return (
    <div style={{ marginTop: "1.5rem" }}>
      <FlashMessage flash={flash} onDismiss={() => setFlash(null)} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "0.75rem", flexWrap: "wrap" }}>
        <div>
          <p className="admin-lead" style={{ margin: 0 }}>
            Team members & roles
          </p>
          <p className="admin-lead" style={{ marginTop: "0.35rem", marginBottom: 0, color: "var(--admin-muted)" }}>
            MVP mode: manual user creation (password required). STAFF is shown as Viewer in UI.
          </p>
        </div>
        <button
          className="admin-btn admin-btn-primary"
          type="button"
          disabled={!canManage || allowedCreateRoles.length === 0}
          onClick={() => {
            setCreateForm({ fullName: "", email: "", password: "", role: allowedCreateRoles[0] ?? "AGENT" });
            setCreateOpen(true);
          }}
          style={{ minHeight: "2.5rem" }}
        >
          Add user
        </button>
      </div>

      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", marginTop: "0.75rem" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid var(--admin-border)" }}>
              <th style={{ padding: "0.5rem 0.35rem" }}>Name</th>
              <th style={{ padding: "0.5rem 0.35rem" }}>Email</th>
              <th style={{ padding: "0.5rem 0.35rem" }}>Role</th>
              <th style={{ padding: "0.5rem 0.35rem" }}>Status</th>
              <th style={{ padding: "0.5rem 0.35rem" }}>Joined</th>
              <th style={{ padding: "0.5rem 0.35rem" }} />
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const isOwner = m.role === "OWNER";
              const isSelf = myEmail && m.email.toLowerCase() === myEmail.toLowerCase();
              const manager = role === "MANAGER";
              const managerCannotManageOwner = manager && isOwner;
              const canEditThis = !managerCannotManageOwner;
              const canResetThis = canEditThis;

              return (
                <tr key={m.membershipId} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <td style={{ padding: "0.55rem 0.35rem", maxWidth: "18rem" }}>{formatName(m)}</td>
                  <td style={{ padding: "0.55rem 0.35rem", color: "var(--admin-muted)" }}>{m.email}</td>
                  <td style={{ padding: "0.55rem 0.35rem" }}>{roleLabel(m.role)}</td>
                  <td style={{ padding: "0.55rem 0.35rem", color: m.status === "DISABLED" ? "#ffb4b4" : "var(--admin-muted)" }}>
                    {statusLabel(m.status)}
                    {isSelf ? <span style={{ marginLeft: "0.5rem", color: "var(--admin-accent)" }}>(You)</span> : null}
                  </td>
                  <td style={{ padding: "0.55rem 0.35rem", color: "var(--admin-muted)" }}>{String(m.joinedAt).slice(0, 10)}</td>
                  <td style={{ padding: "0.55rem 0.35rem", textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "0.35rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
                      {canEditThis ? (
                        <button
                          className="admin-btn admin-btn-ghost"
                          type="button"
                          style={{ minHeight: "2rem", padding: "0 0.6rem" }}
                          onClick={() => {
                            setEditTarget(m);
                            setEditRole(m.role);
                            setEditStatus(m.status);
                            setEditOpen(true);
                          }}
                        >
                          Edit
                        </button>
                      ) : null}

                      {canResetThis ? (
                        <button
                          className="admin-btn admin-btn-ghost"
                          type="button"
                          style={{ minHeight: "2rem", padding: "0 0.6rem" }}
                          onClick={() => {
                            setResetTarget(m);
                            setResetPassword("");
                            setResetOpen(true);
                          }}
                        >
                          Reset password
                        </button>
                      ) : null}

                      {canEditThis ? (
                        <button
                          className="admin-btn admin-btn-ghost"
                          type="button"
                          style={{ minHeight: "2rem", padding: "0 0.6rem" }}
                          disabled={!canEditThis}
                          onClick={async () => {
                            try {
                              if (isSelf && m.status === "ACTIVE") {
                                const typed = prompt("Type DISABLE to deactivate your own account.");
                                if (typed !== "DISABLE") return;
                                await updateTeamMember(m.membershipId, { status: "DISABLED", force: true });
                              } else {
                                const nextStatus: UserStatus = m.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
                                await updateTeamMember(m.membershipId, { status: nextStatus });
                              }
                              setFlash({ type: "success", message: "Team member updated." });
                              await refresh();
                            } catch (e) {
                              setFlash({ type: "error", message: e instanceof Error ? e.message : "Update failed." });
                            }
                          }}
                        >
                          {m.status === "ACTIVE" ? "Deactivate" : "Activate"}
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
            {members.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "0.75rem 0.35rem" }}>
                  <p className="admin-lead" style={{ margin: 0 }}>
                    No team members yet.
                  </p>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Modal
        title="Add team member (manual)"
        open={createOpen}
        onClose={() => (createSaving ? null : setCreateOpen(false))}
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
            <button className="admin-btn admin-btn-ghost" type="button" onClick={() => setCreateOpen(false)} disabled={createSaving}>
              Cancel
            </button>
            <button
              className="admin-btn admin-btn-primary"
              type="button"
              disabled={createSaving || !createForm.email.trim() || !createForm.password.trim()}
              onClick={async () => {
                try {
                  setCreateSaving(true);
                  await createTeamMember({
                    fullName: createForm.fullName.trim() || undefined,
                    email: createForm.email.trim(),
                    password: createForm.password,
                    role: createForm.role,
                  });
                  setCreateOpen(false);
                  setFlash({ type: "success", message: "User created." });
                  await refresh();
                } catch (e) {
                  setFlash({ type: "error", message: e instanceof Error ? e.message : "Create failed." });
                } finally {
                  setCreateSaving(false);
                }
              }}
            >
              {createSaving ? "Creating…" : "Create"}
            </button>
          </div>
        }
      >
        <div style={{ display: "grid", gap: "0.6rem" }}>
          <p className="admin-lead" style={{ margin: 0 }}>
            MVP: This creates a user and assigns them directly to your agency.
          </p>
          <input className="admin-input" placeholder="Full name (optional)" value={createForm.fullName} onChange={(e) => setCreateForm((s) => ({ ...s, fullName: e.target.value }))} />
          <input className="admin-input" placeholder="Email *" value={createForm.email} onChange={(e) => setCreateForm((s) => ({ ...s, email: e.target.value }))} />
          <input className="admin-input" placeholder="Password *" type="password" value={createForm.password} onChange={(e) => setCreateForm((s) => ({ ...s, password: e.target.value }))} />
          <label style={{ fontSize: "0.85rem", color: "var(--admin-muted)" }}>Role *</label>
          <select className="admin-input" value={createForm.role} onChange={(e) => setCreateForm((s) => ({ ...s, role: e.target.value as UserRole }))}>
            {allowedCreateRoles.map((r) => (
              <option key={r} value={r}>
                {roleLabel(r)}
              </option>
            ))}
          </select>
        </div>
      </Modal>

      <Modal
        title="Reset password"
        open={resetOpen}
        onClose={() => (resetSaving ? null : setResetOpen(false))}
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
            <button className="admin-btn admin-btn-ghost" type="button" onClick={() => setResetOpen(false)} disabled={resetSaving}>
              Cancel
            </button>
            <button
              className="admin-btn admin-btn-primary"
              type="button"
              disabled={resetSaving || !resetTarget || resetPassword.trim().length < 8}
              onClick={async () => {
                if (!resetTarget) return;
                try {
                  setResetSaving(true);
                  const isSelf = myEmail && resetTarget.email.toLowerCase() === myEmail.toLowerCase();
                  let force = false;
                  if (isSelf) {
                    const typed = prompt("You are resetting your own password. Type RESET to confirm.");
                    if (typed !== "RESET") return;
                    force = true;
                  }
                  await resetTeamMemberPassword(resetTarget.membershipId, { newPassword: resetPassword, force });
                  setResetOpen(false);
                  setResetTarget(null);
                  setResetPassword("");
                  setFlash({ type: "success", message: "Password reset. Share the temporary password securely with the user." });
                } catch (e) {
                  setFlash({ type: "error", message: e instanceof Error ? e.message : "Password reset failed." });
                } finally {
                  setResetSaving(false);
                }
              }}
            >
              {resetSaving ? "Resetting…" : "Reset password"}
            </button>
          </div>
        }
      >
        {resetTarget ? (
          <div style={{ display: "grid", gap: "0.6rem" }}>
            <p className="admin-lead" style={{ margin: 0 }}>
              Set a temporary password for <strong style={{ color: "var(--admin-text)" }}>{resetTarget.email}</strong>. The password will be hashed and cannot be recovered later.
            </p>
            <input
              className="admin-input"
              type="password"
              placeholder="New temporary password (min 8 chars)"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
            />
            <p className="admin-lead" style={{ margin: 0 }}>
              Share this password securely (e.g., phone or 1Password). Ask the user to change it after signing in.
            </p>
          </div>
        ) : null}
      </Modal>

      <Modal
        title="Edit member"
        open={editOpen}
        onClose={() => (editSaving ? null : setEditOpen(false))}
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
            <button className="admin-btn admin-btn-ghost" type="button" onClick={() => setEditOpen(false)} disabled={editSaving}>
              Cancel
            </button>
            <button
              className="admin-btn admin-btn-primary"
              type="button"
              disabled={editSaving || !editTarget}
              onClick={async () => {
                if (!editTarget) return;
                try {
                  setEditSaving(true);
                  await updateTeamMember(editTarget.membershipId, { role: editRole, status: editStatus, force: false });
                  setEditOpen(false);
                  setFlash({ type: "success", message: "Changes saved." });
                  await refresh();
                } catch (e) {
                  setFlash({ type: "error", message: e instanceof Error ? e.message : "Update failed." });
                } finally {
                  setEditSaving(false);
                }
              }}
            >
              {editSaving ? "Saving…" : "Save"}
            </button>
          </div>
        }
      >
        {editTarget ? (
          <div style={{ display: "grid", gap: "0.6rem" }}>
            <p className="admin-lead" style={{ margin: 0 }}>
              {role === "MANAGER" && editTarget.role === "OWNER" ? "MVP: Manager cannot edit OWNER users." : "Update role and active/disabled status."}
            </p>

            <label style={{ fontSize: "0.85rem", color: "var(--admin-muted)" }}>Role</label>
            <select
              className="admin-input"
              value={editRole}
              onChange={(e) => setEditRole(e.target.value as UserRole)}
              disabled={role === "MANAGER" && editTarget.role === "OWNER"}
            >
              {((role === "OWNER" ? (["OWNER", "MANAGER", "AGENT", "STAFF"] as UserRole[]) : (["AGENT", "STAFF"] as UserRole[])) as UserRole[]).map((r) => (
                <option key={r} value={r}>
                  {roleLabel(r)}
                </option>
              ))}
            </select>

            <label style={{ fontSize: "0.85rem", color: "var(--admin-muted)" }}>Status</label>
            <select className="admin-input" value={editStatus} onChange={(e) => setEditStatus(e.target.value as UserStatus)}>
              <option value="ACTIVE">ACTIVE</option>
              <option value="DISABLED">DISABLED</option>
            </select>

            <p className="admin-lead" style={{ margin: 0, color: "var(--admin-muted)" }}>
              MVP safety: deactivating your own account requires an explicit confirmation via the Deactivate button.
            </p>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

