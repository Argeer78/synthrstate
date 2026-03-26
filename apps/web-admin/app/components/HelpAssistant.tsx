"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Modal } from "./Modal";
import { askHelpAssistant } from "../../lib/api/ai";
import { useTranslation } from "react-i18next";

function answerFor(question: string) {
  const q = question.toLowerCase();
  if (q.includes("inquiry")) return "Open CRM -> Inquiries, review details, then use Convert to create lead/contact records.";
  if (q.includes("publish")) return "Open Listings -> Listing workspace -> Publishing section. Owner/Manager can publish/unpublish and retry sync.";
  if (q.includes("gmail")) return "Open API & Feeds -> Gmail settings. Connect account, then use lead/contact Email panels for sync, summary, and drafts.";
  if (q.includes("role") || q.includes("permission")) return "See User Manual for Owner/Manager/Agent/Viewer capabilities and daily workflows.";
  return "Use the User Manual for role-based steps, or open Feedback to send a request to the team.";
}

export function HelpAssistant() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [actions, setActions] = useState<string[]>([]);
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const fallback = useMemo(() => (question.trim() ? answerFor(question) : ""), [question]);
  const suggestions = useMemo(
    () => [t("help.s1"), t("help.s2"), t("help.s3"), t("help.s4")],
    [t],
  );

  async function onAsk() {
    if (!question.trim()) return;
    try {
      setLoading(true);
      const res = await askHelpAssistant(question.trim(), typeof window !== "undefined" ? window.location.pathname : undefined);
      setAnswer(res.answer);
      setActions(Array.isArray(res.suggestedActions) ? res.suggestedActions : []);
      setPages(Array.isArray(res.relatedPages) ? res.relatedPages : []);
    } catch {
      setAnswer(fallback);
      setActions([]);
      setPages([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button type="button" className="admin-btn admin-btn-ghost" style={{ minHeight: "2.25rem", padding: "0 0.75rem" }} onClick={() => setOpen(true)}>
        {t("help.button")}
      </button>

      <Modal title={t("help.title")} open={open} onClose={() => setOpen(false)}>
        <p className="admin-lead" style={{ marginBottom: "0.6rem" }}>
          {t("help.subtitle")}
        </p>
        <div style={{ display: "grid", gap: "0.5rem" }}>
          <input
            className="admin-input"
            placeholder={t("help.placeholder")}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button className="admin-btn admin-btn-primary" type="button" disabled={loading || !question.trim()} onClick={onAsk}>
              {loading ? t("help.thinking") : t("help.ask")}
            </button>
          </div>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {suggestions.map((s) => (
              <button key={s} type="button" className="admin-btn admin-btn-ghost" style={{ minHeight: "2rem", padding: "0 0.6rem" }} onClick={() => setQuestion(s)}>
                {s}
              </button>
            ))}
          </div>
          {answer || fallback ? (
            <div style={{ border: "1px solid var(--admin-border)", borderRadius: "0.75rem", padding: "0.7rem" }}>
              <p style={{ margin: 0, color: "var(--admin-text)" }}>{answer || fallback}</p>
              {actions.length > 0 ? (
                <ul className="admin-list" style={{ marginTop: "0.5rem", marginBottom: 0 }}>
                  {actions.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              ) : null}
              {pages.length > 0 ? (
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.6rem" }}>
                  {pages.map((p) => (
                    <Link key={p} href={p} className="admin-btn admin-btn-ghost" style={{ minHeight: "2rem", padding: "0 0.6rem" }} onClick={() => setOpen(false)}>
                      {p}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <Link href="/manual/" className="admin-btn admin-btn-primary" onClick={() => setOpen(false)}>
              {t("help.openManual")}
            </Link>
            <Link href="/feedback/" className="admin-btn admin-btn-ghost" onClick={() => setOpen(false)}>
              {t("help.sendFeedback")}
            </Link>
          </div>
        </div>
      </Modal>
    </>
  );
}

