"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";

export function FeedbackClient() {
  const { t } = useTranslation();
  const [kind, setKind] = useState("bug");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const canSend = message.trim().length >= 10;

  function sendByEmail() {
    const subject = encodeURIComponent(`[Synthr Feedback] ${kind}`);
    const body = encodeURIComponent(message.trim());
    window.location.href = `mailto:support@synthrstate.com?subject=${subject}&body=${body}`;
    setSent(true);
  }

  return (
    <div className="admin-card" style={{ maxWidth: "none", padding: "1rem" }}>
      <p className="admin-lead" style={{ marginBottom: "0.6rem" }}>
        {t("feedback.intro")}
      </p>
      <div style={{ display: "grid", gap: "0.6rem", maxWidth: "56rem" }}>
        <select className="admin-input" value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="bug">{t("feedback.types.bug")}</option>
          <option value="feature">{t("feedback.types.feature")}</option>
          <option value="uiux">{t("feedback.types.uiux")}</option>
          <option value="performance">{t("feedback.types.performance")}</option>
          <option value="other">{t("feedback.types.other")}</option>
        </select>
        <textarea
          className="admin-input"
          rows={8}
          placeholder={t("feedback.placeholder")}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={{ padding: "0.75rem", resize: "vertical" }}
        />
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button className="admin-btn admin-btn-primary" type="button" onClick={sendByEmail} disabled={!canSend}>
            {t("feedback.send")}
          </button>
          <button className="admin-btn admin-btn-ghost" type="button" onClick={() => setMessage("")}>
            {t("feedback.clear")}
          </button>
        </div>
        {sent ? (
          <p className="admin-lead" style={{ margin: 0 }}>
            {t("feedback.sentHint")}
          </p>
        ) : null}
      </div>
    </div>
  );
}

