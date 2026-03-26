"use client";

import { useEffect, useState } from "react";
import { Modal } from "../components/Modal";
import type { ListingRow } from "../../lib/api/listings";
import { getListing, updateListing } from "../../lib/api/listings";
import type { UserRole } from "../../utils/permissions";

export function ListingEditModal(props: {
  open: boolean;
  listingId: string | null;
  role: UserRole | null;
  onClose: () => void;
  onSaved: (updated: ListingRow) => void;
}) {
  const [state, setState] = useState<
    | { status: "idle" }
    | { status: "loading" }
    | { status: "error"; message: string }
    | { status: "ready"; listing: ListingRow; saving: boolean; message?: string }
  >({ status: "idle" });

  useEffect(() => {
    if (!props.open || !props.listingId) return;
    let cancelled = false;
    setState({ status: "loading" });
    (async () => {
      try {
        const listing = await getListing(props.listingId!);
        if (!cancelled) setState({ status: "ready", listing, saving: false });
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to load listing.";
        if (!cancelled) setState({ status: "error", message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [props.open, props.listingId]);

  async function save() {
    if (state.status !== "ready") return;
    setState({ ...state, saving: true, message: undefined });
    try {
      const updated = await updateListing(state.listing.id, {
        title: state.listing.title,
        description: state.listing.description ?? "",
        descriptionEl: state.listing.descriptionEl ?? undefined,
      });
      props.onSaved(updated);
      props.onClose();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to save.";
      setState({ ...state, saving: false, message });
    }
  }

  const disabledBecauseAgentNonDraft =
    state.status === "ready" && props.role === "AGENT" && state.listing.status !== "DRAFT";

  return (
    <Modal
      title="Edit listing"
      open={props.open}
      onClose={props.onClose}
      footer={
        state.status === "ready" ? (
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
            <button className="admin-btn admin-btn-ghost" type="button" onClick={props.onClose}>
              Cancel
            </button>
            <button
              className="admin-btn admin-btn-primary"
              type="button"
              onClick={save}
              disabled={state.saving || disabledBecauseAgentNonDraft}
              title={disabledBecauseAgentNonDraft ? "You can only edit draft listings" : ""}
            >
              {state.saving ? "Saving…" : "Save"}
            </button>
          </div>
        ) : null
      }
    >
      {state.status === "loading" ? <p className="admin-lead">Loading…</p> : null}
      {state.status === "error" ? (
        <p className="admin-lead" style={{ color: "#ffb4b4" }}>
          {state.message}
        </p>
      ) : null}

      {state.status === "ready" ? (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {state.message ? (
            <p className="admin-lead" style={{ color: "#ffb4b4", marginBottom: 0 }}>
              {state.message}
            </p>
          ) : null}

          <div className="admin-field">
            <label>Title</label>
            <input
              value={state.listing.title ?? ""}
              onChange={(e) => setState({ ...state, listing: { ...state.listing, title: e.target.value } })}
              disabled={disabledBecauseAgentNonDraft}
            />
          </div>
          <div className="admin-field">
            <label>Description (EN)</label>
            <textarea
              value={state.listing.description ?? ""}
              onChange={(e) => setState({ ...state, listing: { ...state.listing, description: e.target.value } })}
              disabled={disabledBecauseAgentNonDraft}
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
              value={state.listing.descriptionEl ?? ""}
              onChange={(e) => setState({ ...state, listing: { ...state.listing, descriptionEl: e.target.value } })}
              disabled={disabledBecauseAgentNonDraft}
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
        </div>
      ) : null}
    </Modal>
  );
}

