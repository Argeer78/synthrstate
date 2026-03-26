"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createGmailDraft,
  getGmailThread,
  gmailConnectUrl,
  gmailDisconnect,
  gmailStatus,
  gmailSync,
  listGmailThreads,
  suggestGmailReply,
  summarizeGmailThread,
  type GmailThreadRow,
} from "../../../lib/api/gmail";
import { FlashMessage, type Flash } from "../../components/Flash";

export function EmailPanel(props: { contactId?: string; leadId?: string; context?: any }) {
  const [status, setStatus] = useState<{ connected: boolean; gmailUserEmail: string | null } | null>(null);
  const [flash, setFlash] = useState<Flash>(null);
  const [threads, setThreads] = useState<GmailThreadRow[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [threadDetail, setThreadDetail] = useState<any>(null);
  const [aiSummary, setAiSummary] = useState<any>(null);
  const [aiReply, setAiReply] = useState<any>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const scope = useMemo(() => ({ contactId: props.contactId, leadId: props.leadId }), [props.contactId, props.leadId]);

  async function refresh() {
    const s = await gmailStatus();
    setStatus({ connected: s.connected, gmailUserEmail: s.gmailUserEmail });
    if (s.connected) {
      const t = await listGmailThreads(scope);
      setThreads(t.items);
    } else {
      setThreads([]);
      setSelectedThreadId(null);
      setThreadDetail(null);
    }
  }

  useEffect(() => {
    refresh().catch((e) => setFlash({ type: "error", message: String(e?.message ?? e) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope.contactId, scope.leadId]);

  async function onConnect() {
    setBusy("connect");
    try {
      const { url } = await gmailConnectUrl();
      window.location.href = url;
    } catch (e: any) {
      setFlash({ type: "error", message: e?.message ?? "Failed to start Gmail connect" });
      setBusy(null);
    }
  }

  async function onDisconnect() {
    setBusy("disconnect");
    try {
      await gmailDisconnect();
      setFlash({ type: "success", message: "Gmail disconnected" });
      await refresh();
    } catch (e: any) {
      setFlash({ type: "error", message: e?.message ?? "Failed to disconnect" });
    } finally {
      setBusy(null);
    }
  }

  async function onSync() {
    setBusy("sync");
    try {
      const out = await gmailSync(20);
      setFlash({ type: "success", message: `Synced ${out.syncedThreads} threads` });
      await refresh();
    } catch (e: any) {
      setFlash({ type: "error", message: e?.message ?? "Failed to sync" });
    } finally {
      setBusy(null);
    }
  }

  async function openThread(id: string) {
    setSelectedThreadId(id);
    setBusy("thread");
    setAiSummary(null);
    setAiReply(null);
    try {
      const detail = await getGmailThread(id);
      setThreadDetail(detail);
    } catch (e: any) {
      setFlash({ type: "error", message: e?.message ?? "Failed to load thread" });
      setThreadDetail(null);
    } finally {
      setBusy(null);
    }
  }

  async function onAiSummary() {
    if (!selectedThreadId) return;
    setBusy("aiSummary");
    try {
      const out = await summarizeGmailThread(selectedThreadId);
      setAiSummary(out);
    } catch (e: any) {
      setFlash({ type: "error", message: e?.message ?? "Failed to summarize thread" });
    } finally {
      setBusy(null);
    }
  }

  async function onSuggestReply() {
    if (!selectedThreadId) return;
    setBusy("aiReply");
    try {
      const out = await suggestGmailReply(selectedThreadId, props.context);
      setAiReply(out);
    } catch (e: any) {
      setFlash({ type: "error", message: e?.message ?? "Failed to suggest reply" });
    } finally {
      setBusy(null);
    }
  }

  async function onCreateDraft() {
    if (!selectedThreadId) return;
    if (!aiReply?.body || !aiReply?.subject) {
      setFlash({ type: "error", message: "Generate a suggested reply first" });
      return;
    }
    setBusy("draft");
    try {
      const to = prompt("Draft recipient email (To):", "") ?? "";
      if (!to.trim()) throw new Error("To is required");
      await createGmailDraft({ threadId: selectedThreadId, to: to.trim(), subject: String(aiReply.subject), body: String(aiReply.body) });
      setFlash({ type: "success", message: "Draft created in Gmail" });
    } catch (e: any) {
      setFlash({ type: "error", message: e?.message ?? "Failed to create draft" });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="admin-card">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 700 }}>Email (Gmail)</div>
          <div style={{ color: "#6b7280", fontSize: 13 }}>
            {status?.connected ? `Connected as ${status.gmailUserEmail ?? "Gmail user"}` : "Not connected"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {!status?.connected ? (
            <button className="admin-button" onClick={onConnect} disabled={busy === "connect"}>
              Connect Gmail
            </button>
          ) : (
            <>
              <button className="admin-button" onClick={onSync} disabled={busy === "sync"}>
                Sync
              </button>
              <button className="admin-button admin-button-secondary" onClick={onDisconnect} disabled={busy === "disconnect"}>
                Disconnect
              </button>
            </>
          )}
        </div>
      </div>

      <FlashMessage flash={flash} onDismiss={() => setFlash(null)} />

      {status?.connected ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 12, marginTop: 12 }}>
          <div className="admin-card" style={{ margin: 0 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Threads</div>
            {threads.length === 0 ? <div style={{ color: "#6b7280" }}>No threads synced yet.</div> : null}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {threads.map((t) => (
                <button
                  key={t.id}
                  className="admin-button admin-button-secondary"
                  onClick={() => openThread(t.id)}
                  style={{ textAlign: "left", whiteSpace: "normal" }}
                >
                  <div style={{ fontWeight: 700 }}>{t.subject ?? "(no subject)"}</div>
                  <div style={{ color: "#6b7280", fontSize: 13 }}>{t.snippet ?? ""}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="admin-card" style={{ margin: 0 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Thread</div>
            {!selectedThreadId ? <div style={{ color: "#6b7280" }}>Select a thread.</div> : null}
            {selectedThreadId && threadDetail ? (
              <>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                  <button className="admin-button" onClick={onAiSummary} disabled={busy === "aiSummary"}>
                    AI Summary
                  </button>
                  <button className="admin-button" onClick={onSuggestReply} disabled={busy === "aiReply"}>
                    Suggest Reply
                  </button>
                  <button className="admin-button admin-button-secondary" onClick={onCreateDraft} disabled={busy === "draft"}>
                    Create Gmail Draft
                  </button>
                </div>

                {aiSummary ? (
                  <div className="admin-card" style={{ margin: 0, marginBottom: 10 }}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>Summary</div>
                    <div style={{ whiteSpace: "pre-wrap" }}>{aiSummary.summary ?? JSON.stringify(aiSummary, null, 2)}</div>
                  </div>
                ) : null}

                {aiReply ? (
                  <div className="admin-card" style={{ margin: 0, marginBottom: 10 }}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>Suggested reply</div>
                    <div style={{ color: "#6b7280", fontSize: 13, marginBottom: 6 }}>Subject: {aiReply.subject ?? ""}</div>
                    <div style={{ whiteSpace: "pre-wrap" }}>{aiReply.body ?? JSON.stringify(aiReply, null, 2)}</div>
                  </div>
                ) : null}

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {(threadDetail.messages ?? []).map((m: any) => (
                    <div key={m.id} className="admin-card" style={{ margin: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                        <div style={{ fontWeight: 700 }}>{m.fromEmail ?? "—"}</div>
                        <div style={{ color: "#6b7280", fontSize: 13 }}>{m.internalDate ? new Date(m.internalDate).toLocaleString() : ""}</div>
                      </div>
                      <div style={{ color: "#6b7280", fontSize: 13, marginTop: 4 }}>{m.snippet ?? ""}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

