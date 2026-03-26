"use client";

import { useEffect, useState } from "react";
import { FlashMessage, type Flash } from "../components/Flash";
import { convertInquiry, listInquiries, type Inquiry } from "../../lib/api/crm";
import { useMe } from "../../lib/use-me";
import { canCreate } from "../../utils/permissions";
import { Modal } from "../components/Modal";
import Link from "next/link";

export function InquiriesClient() {
  const { role } = useMe();
  const [flash, setFlash] = useState<Flash>(null);
  const [state, setState] = useState<
    { status: "loading" } | { status: "error"; message: string } | { status: "ok"; rows: Inquiry[]; total: number }
  >({ status: "loading" });

  const [convertTarget, setConvertTarget] = useState<Inquiry | null>(null);
  const [converting, setConverting] = useState(false);
  const [lastConvertedLeadId, setLastConvertedLeadId] = useState<string | null>(null);

  async function refresh() {
    const { items, total } = await listInquiries();
    setState({ status: "ok", rows: items, total });
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { items, total } = await listInquiries();
        if (!cancelled) setState({ status: "ok", rows: items, total });
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to load inquiries.";
        if (!cancelled) setState({ status: "error", message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") return <p className="admin-lead">Loading inquiries…</p>;
  if (state.status === "error")
    return (
      <p className="admin-lead" style={{ color: "#ffb4b4" }}>
        {state.message}
      </p>
    );

  return (
    <div style={{ marginTop: "1.5rem" }}>
      <h2 style={{ margin: "0 0 0.5rem", fontSize: "1rem" }}>Inquiries</h2>
      <p className="admin-lead" style={{ marginTop: 0 }}>
        New public website inquiries (website form). Convert an inquiry to create a Contact + Lead in CRM.
      </p>
      <FlashMessage flash={flash} onDismiss={() => setFlash(null)} />

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid var(--admin-border)" }}>
              <th style={{ padding: "0.5rem 0.35rem" }}>When</th>
              <th style={{ padding: "0.5rem 0.35rem" }}>Listing</th>
              <th style={{ padding: "0.5rem 0.35rem" }}>From</th>
              <th style={{ padding: "0.5rem 0.35rem" }}>Contact</th>
              <th style={{ padding: "0.5rem 0.35rem" }}>Message</th>
              <th style={{ padding: "0.5rem 0.35rem" }} />
            </tr>
          </thead>
          <tbody>
            {state.rows.map((inq) => (
              <tr key={inq.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <td style={{ padding: "0.55rem 0.35rem", color: "var(--admin-muted)" }}>
                  {String(inq.createdAt).slice(0, 19).replace("T", " ")}
                </td>
                <td style={{ padding: "0.55rem 0.35rem" }}>{inq.listing?.title ?? "—"}</td>
                <td style={{ padding: "0.55rem 0.35rem", color: "var(--admin-muted)" }}>{inq.name}</td>
                <td style={{ padding: "0.55rem 0.35rem" }}>
                  {inq.email ? <span>{inq.email}</span> : null}
                  {inq.email && inq.phone ? <span style={{ color: "var(--admin-muted)" }}> · </span> : null}
                  {inq.phone ? <span>{inq.phone}</span> : null}
                  {!inq.email && !inq.phone ? "—" : null}
                </td>
                <td style={{ padding: "0.55rem 0.35rem", color: "var(--admin-muted)", maxWidth: "28rem" }}>
                  {inq.message ? String(inq.message).slice(0, 180) : "—"}
                </td>
                <td style={{ padding: "0.55rem 0.35rem", textAlign: "right" }}>
                  {inq.status === "CONVERTED" || inq.leadId ? (
                    <span style={{ fontSize: "0.8rem", color: "var(--admin-muted)" }}>Converted</span>
                  ) : canCreate(role) ? (
                    <button
                      className="admin-btn admin-btn-ghost"
                      type="button"
                      style={{ minHeight: "2rem", padding: "0 0.6rem" }}
                      onClick={() => setConvertTarget(inq)}
                    >
                      Convert
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {state.rows.length === 0 ? <p className="admin-lead">No inquiries yet.</p> : null}
      </div>

      <Modal
        title="Convert inquiry"
        open={convertTarget != null}
        onClose={() => (converting ? null : setConvertTarget(null))}
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
            <button className="admin-btn admin-btn-ghost" type="button" onClick={() => setConvertTarget(null)} disabled={converting}>
              Cancel
            </button>
            <button
              className="admin-btn admin-btn-primary"
              type="button"
              disabled={converting}
              onClick={async () => {
                if (!convertTarget) return;
                setConverting(true);
                try {
                  const result = await convertInquiry(convertTarget.id);
                  await refresh();
                  setConvertTarget(null);
                  setLastConvertedLeadId(result.leadId ?? null);
                  setFlash({
                    type: "success",
                    message: result.alreadyConverted
                      ? "Inquiry was already converted."
                      : `Converted: Lead ${result.leadId.slice(0, 8)}… (${result.reusedContact ? "reused contact" : "new contact"})`,
                  });
                } catch (e) {
                  const message = e instanceof Error ? e.message : "Conversion failed.";
                  setFlash({ type: "error", message });
                } finally {
                  setConverting(false);
                }
              }}
            >
              {converting ? "Converting…" : "Convert"}
            </button>
          </div>
        }
      >
        {convertTarget ? (
          <div style={{ display: "grid", gap: "0.5rem" }}>
            <p className="admin-lead" style={{ margin: 0 }}>
              This will create (or reuse) a Contact and create a new Lead for:
            </p>
            <p style={{ margin: 0, color: "var(--admin-text)", fontWeight: 600 }}>{convertTarget.listing?.title ?? "Listing"}</p>
            <p style={{ margin: 0, color: "var(--admin-muted)" }}>
              From: {convertTarget.name} {convertTarget.email ? `· ${convertTarget.email}` : ""} {convertTarget.phone ? `· ${convertTarget.phone}` : ""}
            </p>
            <p className="admin-lead" style={{ margin: "0.25rem 0 0" }}>
              Duplicate handling (MVP): match contact by email first, then phone; otherwise create a new contact.
            </p>
          </div>
        ) : null}
      </Modal>

      {lastConvertedLeadId ? (
        <div style={{ marginTop: "0.75rem" }}>
          <Link className="admin-btn admin-btn-ghost" href={`/crm/lead/?id=${encodeURIComponent(lastConvertedLeadId)}`} style={{ minHeight: "2.25rem" }}>
            View lead
          </Link>
        </div>
      ) : null}
    </div>
  );
}

