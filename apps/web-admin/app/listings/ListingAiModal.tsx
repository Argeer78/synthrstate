"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "../components/Modal";
import { applyGeneratedDescription, generateListingDescription } from "../../lib/api/ai";
import type { UserRole } from "../../utils/permissions";
import { canApplyAiToListing } from "../../utils/permissions";

const DEFAULT_TONES = ["STANDARD", "PROFESSIONAL", "FRIENDLY", "LUXURY"] as const;

export function ListingAiModal(props: {
  open: boolean;
  listingId: string | null;
  listingStatus: string | null;
  role: UserRole | null;
  onClose: () => void;
  onApplied: () => void;
}) {
  const [tone, setTone] = useState<string>("STANDARD");
  const [state, setState] = useState<
    | { status: "idle" }
    | { status: "generating" }
    | { status: "ready"; generationId: string; descriptionEn: string; descriptionEl: string; message?: string; applying?: boolean }
    | { status: "error"; message: string }
  >({ status: "idle" });

  useEffect(() => {
    if (!props.open) {
      setState({ status: "idle" });
      setTone("STANDARD");
    }
  }, [props.open]);

  const canApply = useMemo(
    () => canApplyAiToListing(props.role, props.listingStatus ?? undefined),
    [props.role, props.listingStatus],
  );

  async function generate() {
    if (!props.listingId) return;
    setState({ status: "generating" });
    try {
      const gen = await generateListingDescription(props.listingId, tone);
      const en = (gen.generatedDescriptionEn ?? "").trim();
      const el = (gen.generatedDescriptionEl ?? "").trim();
      setState({
        status: "ready",
        generationId: gen.id,
        descriptionEn: en,
        descriptionEl: el,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Generation failed.";
      setState({ status: "error", message });
    }
  }

  async function apply() {
    if (state.status !== "ready") return;
    setState({ ...state, applying: true, message: undefined });
    try {
      await applyGeneratedDescription(state.generationId, {
        descriptionEn: state.descriptionEn,
        descriptionEl: state.descriptionEl,
      });
      setState({ ...state, applying: false, message: "Applied to listing." });
      props.onApplied();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Apply failed.";
      setState({ ...state, applying: false, message });
    }
  }

  return (
    <Modal
      title="AI · Listing description"
      open={props.open}
      onClose={props.onClose}
      footer={
        <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
          <button className="admin-btn admin-btn-ghost" type="button" onClick={props.onClose}>
            Done
          </button>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="admin-btn admin-btn-ghost" type="button" onClick={generate} disabled={state.status === "generating"}>
              {state.status === "generating" ? "Generating…" : "Generate"}
            </button>
            {state.status === "ready" && canApply ? (
              <button className="admin-btn admin-btn-primary" type="button" onClick={apply} disabled={state.applying}>
                {state.applying ? "Applying…" : "Apply to listing"}
              </button>
            ) : null}
          </div>
        </div>
      }
    >
      {state.status === "error" ? (
        <p className="admin-lead" style={{ color: "#ffb4b4" }}>
          {state.message}
        </p>
      ) : null}

      <div style={{ display: "grid", gap: "0.75rem" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--admin-muted)", marginBottom: "0.35rem" }}>
            Tone
          </label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            style={{
              width: "100%",
              minHeight: "2.75rem",
              borderRadius: "0.5rem",
              border: "1px solid var(--admin-border)",
              background: "rgba(0,0,0,0.25)",
              color: "var(--admin-text)",
              padding: "0 0.75rem",
            }}
          >
            {DEFAULT_TONES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {!canApply && state.status === "ready" ? (
          <p className="admin-lead" style={{ margin: 0 }}>
            You can generate, but you can’t apply to this listing (Agents can only apply to drafts).
          </p>
        ) : null}

        {state.status === "ready" ? (
          <>
            {state.message ? (
              <p className="admin-lead" style={{ margin: 0, color: state.message.includes("failed") ? "#ffb4b4" : "#b7f7c4" }}>
                {state.message}
              </p>
            ) : null}
            <div className="admin-field">
              <label>Description (EN)</label>
              <textarea
                value={state.descriptionEn}
                onChange={(e) => setState({ ...state, descriptionEn: e.target.value })}
                style={{
                  width: "100%",
                  minHeight: "8rem",
                  padding: "0.75rem 0.875rem",
                  borderRadius: "0.5rem",
                  border: "1px solid var(--admin-border)",
                  background: "rgba(0,0,0,0.25)",
                  color: "var(--admin-text)",
                  fontSize: "0.9375rem",
                }}
              />
            </div>
            <div className="admin-field">
              <label>Description (EL)</label>
              <textarea
                value={state.descriptionEl}
                onChange={(e) => setState({ ...state, descriptionEl: e.target.value })}
                style={{
                  width: "100%",
                  minHeight: "8rem",
                  padding: "0.75rem 0.875rem",
                  borderRadius: "0.5rem",
                  border: "1px solid var(--admin-border)",
                  background: "rgba(0,0,0,0.25)",
                  color: "var(--admin-text)",
                  fontSize: "0.9375rem",
                }}
              />
            </div>
          </>
        ) : (
          <p className="admin-lead" style={{ margin: 0 }}>
            Generate a bilingual description and (if allowed) apply it to the listing.
          </p>
        )}
      </div>
    </Modal>
  );
}

