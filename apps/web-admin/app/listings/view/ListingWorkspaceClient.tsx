"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMe } from "../../../lib/use-me";
import { canAccessAi, canCreate, canEdit, canPublish, canUploadMedia } from "../../../utils/permissions";
import { FlashMessage, type Flash } from "../../components/Flash";
import {
  createListingInternalNote,
  getListing,
  listListingInternalNotes,
  updateListingDetails,
  type ListingInternalNote,
  type ListingRow,
} from "../../../lib/api/listings";
import { listListingMedia } from "../../../lib/api/media";
import { ListingMediaModal } from "../ListingMediaModal";
import { ListingAiModal } from "../ListingAiModal";
import {
  type PublicationChannelCode,
  getListingPublicationLogs,
  getListingPublications,
  publishListingChannels,
  retryListingChannels,
  unpublishListingChannels,
} from "../../../lib/api/publications";

function Badge(props: { label: string }) {
  return (
    <span style={{ padding: "0.2rem 0.55rem", borderRadius: 999, border: "1px solid var(--admin-border)", fontSize: "0.78rem", color: "var(--admin-muted)" }}>
      {props.label}
    </span>
  );
}

export function ListingWorkspaceClient() {
  const params = useSearchParams();
  const { role } = useMe();
  const [flash, setFlash] = useState<Flash>(null);
  const [listingId, setListingId] = useState("");
  const [state, setState] = useState<
    { status: "idle" } | { status: "loading" } | { status: "error"; message: string } | { status: "ok"; listing: ListingRow }
  >({ status: "idle" });
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    price: "",
    bedrooms: "",
    bathrooms: "",
    sqm: "",
    status: "DRAFT",
  });
  const [mediaCount, setMediaCount] = useState<number | null>(null);
  const [notes, setNotes] = useState<ListingInternalNote[]>([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [publications, setPublications] = useState<
    | { status: "loading" }
    | { status: "error"; message: string }
    | { status: "ok"; data: Awaited<ReturnType<typeof getListingPublications>> }
  >({ status: "loading" });
  const [publicationLogs, setPublicationLogs] = useState<
    | { status: "loading" }
    | { status: "error"; message: string }
    | { status: "ok"; items: Awaited<ReturnType<typeof getListingPublicationLogs>>["items"] }
  >({ status: "loading" });
  const [selectedChannelCodes, setSelectedChannelCodes] = useState<PublicationChannelCode[]>([]);

  async function refresh(id: string) {
    const listing = await getListing(id);
    setState({ status: "ok", listing });
    setEditForm({
      title: listing.title ?? "",
      description: listing.description ?? "",
      price: listing.price != null ? String(listing.price) : "",
      bedrooms: listing.bedrooms != null ? String(listing.bedrooms) : "",
      bathrooms: listing.bathrooms != null ? String(listing.bathrooms) : "",
      sqm: listing.sqm != null ? String(listing.sqm) : "",
      status: listing.status ?? "DRAFT",
    });

    try {
      const media = await listListingMedia(id);
      setMediaCount(media.items.length);
    } catch {
      setMediaCount(null);
    }
    try {
      const res = await listListingInternalNotes(id);
      setNotes(res.items);
    } catch {
      setNotes([]);
    }

    try {
      const [pub, logs] = await Promise.all([getListingPublications(id), getListingPublicationLogs(id, { pageSize: 20 })]);
      setPublications({ status: "ok", data: pub });
      setPublicationLogs({ status: "ok", items: logs.items });
      setSelectedChannelCodes(pub.selectedChannelCodes);
    } catch (e) {
      setPublications({ status: "error", message: e instanceof Error ? e.message : "Failed to load publications." });
      setPublicationLogs({ status: "error", message: e instanceof Error ? e.message : "Failed to load publication logs." });
    }
  }

  useEffect(() => {
    const id = (params?.get("id") ?? "").trim();
    setListingId(id);
  }, [params]);

  useEffect(() => {
    if (!listingId) return;
    let cancelled = false;
    (async () => {
      try {
        setState({ status: "loading" });
        await refresh(listingId);
      } catch (e) {
        if (!cancelled) setState({ status: "error", message: e instanceof Error ? e.message : "Failed to load listing." });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [listingId]);

  if (!listingId) {
    return <p className="admin-lead">Open a listing from the listings page or use `/listings/view/?id=&lt;listingId&gt;`.</p>;
  }
  if (state.status === "loading") return <p className="admin-lead">Loading listing…</p>;
  if (state.status === "error") return <p className="admin-lead" style={{ color: "#ffb4b4" }}>{state.message}</p>;
  if (state.status !== "ok") return null;

  const listing = state.listing;
  const agentLocked = role === "AGENT" && listing.status !== "DRAFT";
  const canMutateDetails = canEdit(role) && !agentLocked;

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <FlashMessage flash={flash} onDismiss={() => setFlash(null)} />

      <section className="admin-card" style={{ maxWidth: "none", padding: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
              <h2 style={{ margin: 0, fontSize: "1.15rem" }}>{listing.title}</h2>
              <Badge label={listing.status ?? "—"} />
              <Badge label={listing.listingType ?? "—"} />
            </div>
            <p className="admin-lead" style={{ margin: "0.35rem 0 0" }}>
              {listing.price != null ? `${listing.price} ${listing.currency ?? "EUR"}` : "No price"} · Beds {listing.bedrooms ?? "—"} · Baths {listing.bathrooms ?? "—"} · SQM {listing.sqm ?? "—"}
            </p>
            {listing.createdAt ? <p className="admin-lead" style={{ margin: "0.35rem 0 0" }}>Created: {String(listing.createdAt).slice(0, 19).replace("T", " ")}</p> : null}
            {listing.property ? (
              <p className="admin-lead" style={{ margin: "0.35rem 0 0" }}>
                {listing.property.address ?? "—"} {listing.property.city ? `· ${listing.property.city}` : ""} {listing.property.area ? `· ${listing.property.area}` : ""}
              </p>
            ) : null}
            {listing.property?.ownerContact ? (
              <p className="admin-lead" style={{ margin: "0.35rem 0 0" }}>
                Owner: {[listing.property.ownerContact.firstName, listing.property.ownerContact.lastName].filter(Boolean).join(" ") || listing.property.ownerContact.organizationName || "—"}
                {listing.property.ownerContact.email ? ` · ${listing.property.ownerContact.email}` : ""}
              </p>
            ) : null}
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <Link href="/listings/" className="admin-btn admin-btn-ghost" style={{ minHeight: "2.25rem" }}>Back to listings</Link>
            <button className="admin-btn admin-btn-ghost" type="button" onClick={() => refresh(listingId).catch(() => {})} style={{ minHeight: "2.25rem" }}>Refresh</button>
          </div>
        </div>
      </section>

      <section className="admin-card" style={{ maxWidth: "none", padding: "1rem" }}>
        <h3 style={{ margin: 0, fontSize: "1rem" }}>Listing details</h3>
        {agentLocked ? <p className="admin-lead" style={{ marginTop: "0.35rem" }}>Agents can edit only draft listings.</p> : null}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "0.5rem", marginTop: "0.6rem" }}>
          <input className="admin-input" value={editForm.title} onChange={(e) => setEditForm((s) => ({ ...s, title: e.target.value }))} disabled={!canMutateDetails} />
          <select
            className="admin-input"
            value={role === "AGENT" ? "DRAFT" : editForm.status}
            onChange={(e) => setEditForm((s) => ({ ...s, status: e.target.value }))}
            disabled={!canMutateDetails || role === "AGENT"}
          >
            <option value="DRAFT">DRAFT</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="ARCHIVED">ARCHIVED</option>
            <option value="SOLD">SOLD</option>
            <option value="RENTED">RENTED</option>
          </select>
        </div>
        <textarea className="admin-input" style={{ width: "100%", minHeight: "9rem", marginTop: "0.5rem", padding: "0.7rem 0.75rem" }} value={editForm.description} onChange={(e) => setEditForm((s) => ({ ...s, description: e.target.value }))} disabled={!canMutateDetails} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "0.5rem", marginTop: "0.5rem" }}>
          <input className="admin-input" placeholder="Price" value={editForm.price} onChange={(e) => setEditForm((s) => ({ ...s, price: e.target.value }))} disabled={!canMutateDetails} />
          <input className="admin-input" placeholder="Bedrooms" value={editForm.bedrooms} onChange={(e) => setEditForm((s) => ({ ...s, bedrooms: e.target.value }))} disabled={!canMutateDetails} />
          <input className="admin-input" placeholder="Bathrooms" value={editForm.bathrooms} onChange={(e) => setEditForm((s) => ({ ...s, bathrooms: e.target.value }))} disabled={!canMutateDetails} />
          <input className="admin-input" placeholder="SQM" value={editForm.sqm} onChange={(e) => setEditForm((s) => ({ ...s, sqm: e.target.value }))} disabled={!canMutateDetails} />
        </div>
        <div style={{ marginTop: "0.6rem", display: "flex", justifyContent: "flex-end" }}>
          <button
            className="admin-btn admin-btn-primary"
            type="button"
            disabled={!canMutateDetails || saving}
            onClick={async () => {
              try {
                setSaving(true);
                await updateListingDetails(listing.id, {
                  title: editForm.title.trim(),
                  description: editForm.description.trim(),
                  status: role === "AGENT" ? "DRAFT" : (editForm.status as any),
                  price: editForm.price.trim() ? Number(editForm.price) : null,
                  bedrooms: editForm.bedrooms.trim() ? Number(editForm.bedrooms) : null,
                  bathrooms: editForm.bathrooms.trim() ? Number(editForm.bathrooms) : null,
                  sqm: editForm.sqm.trim() ? Number(editForm.sqm) : null,
                });
                await refresh(listingId);
                setFlash({ type: "success", message: "Listing details updated." });
              } catch (e) {
                setFlash({ type: "error", message: e instanceof Error ? e.message : "Failed to update listing." });
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "Saving…" : "Save details"}
          </button>
        </div>
      </section>

      <section className="admin-card" style={{ maxWidth: "none", padding: "1rem" }}>
        <h3 style={{ margin: 0, fontSize: "1rem" }}>Media</h3>
        <p className="admin-lead" style={{ marginTop: "0.35rem" }}>Current assets: {mediaCount == null ? "—" : mediaCount}</p>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button className="admin-btn admin-btn-ghost" type="button" style={{ minHeight: "2.25rem" }} onClick={() => setMediaOpen(true)}>
            Manage media
          </button>
        </div>
      </section>

      <section className="admin-card" style={{ maxWidth: "none", padding: "1rem" }}>
        <h3 style={{ margin: 0, fontSize: "1rem" }}>AI description tools</h3>
        <p className="admin-lead" style={{ marginTop: "0.35rem" }}>Generate and apply AI descriptions for this listing.</p>
        {canAccessAi(role) ? (
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button className="admin-btn admin-btn-ghost" type="button" style={{ minHeight: "2.25rem" }} onClick={() => setAiOpen(true)}>
              Open AI tools
            </button>
          </div>
        ) : (
          <p className="admin-lead">You don’t have access to AI tools.</p>
        )}
      </section>

      <section className="admin-card" style={{ maxWidth: "none", padding: "1rem" }}>
        <h3 style={{ margin: 0, fontSize: "1rem" }}>Publishing</h3>
        <p className="admin-lead" style={{ marginTop: "0.35rem" }}>
          Website publish is reflected by listing status <code>{listing.status}</code>. Channel exports below provide operational traceability.
        </p>

        {publications.status === "loading" ? <p className="admin-lead">Loading publication state…</p> : null}
        {publications.status === "error" ? (
          <p className="admin-lead" style={{ color: "#ffb4b4" }}>
            {publications.message}
          </p>
        ) : null}

        {publications.status === "ok" ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "0.6rem", marginTop: "0.6rem" }}>
              <div style={{ border: "1px solid var(--admin-border)", borderRadius: "0.75rem", padding: "0.65rem 0.75rem" }}>
                <p className="admin-lead" style={{ margin: 0 }}>
                  Last attempt: <code>{publications.data.lastAttempt ? String(publications.data.lastAttempt).slice(0, 19).replace("T", " ") : "—"}</code>
                </p>
              </div>
              <div style={{ border: "1px solid var(--admin-border)", borderRadius: "0.75rem", padding: "0.65rem 0.75rem" }}>
                <p className="admin-lead" style={{ margin: 0 }}>
                  Last success: <code>{publications.data.lastSuccess ? String(publications.data.lastSuccess).slice(0, 19).replace("T", " ") : "—"}</code>
                </p>
              </div>
              <div style={{ border: "1px solid var(--admin-border)", borderRadius: "0.75rem", padding: "0.65rem 0.75rem" }}>
                <p className="admin-lead" style={{ margin: 0 }}>
                  Last failure: <code>{publications.data.lastFailure ? String(publications.data.lastFailure).slice(0, 19).replace("T", " ") : "—"}</code>
                </p>
              </div>
            </div>

            <div style={{ marginTop: "0.75rem", display: "grid", gap: "0.6rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap", alignItems: "baseline" }}>
                <h4 style={{ margin: 0, fontSize: "0.95rem" }}>Channels</h4>
                {canPublish(role) ? (
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <button
                      className="admin-btn admin-btn-ghost"
                      type="button"
                      disabled={selectedChannelCodes.length === 0}
                      style={{ minHeight: "2.25rem" }}
                      onClick={async () => {
                        try {
                          await unpublishListingChannels(listing.id, { channels: selectedChannelCodes });
                          await refresh(listingId);
                          setFlash({ type: "success", message: "Unpublished selected channels." });
                        } catch (e) {
                          setFlash({ type: "error", message: e instanceof Error ? e.message : "Unpublish failed." });
                        }
                      }}
                    >
                      Unpublish selected
                    </button>
                    <button
                      className="admin-btn admin-btn-primary"
                      type="button"
                      disabled={selectedChannelCodes.length === 0}
                      style={{ minHeight: "2.25rem" }}
                      onClick={async () => {
                        try {
                          await publishListingChannels(listing.id, { channels: selectedChannelCodes });
                          await refresh(listingId);
                          setFlash({ type: "success", message: "Publication started." });
                        } catch (e) {
                          setFlash({ type: "error", message: e instanceof Error ? e.message : "Publish failed." });
                        }
                      }}
                    >
                      Publish selected
                    </button>
                  </div>
                ) : (
                  <p className="admin-lead" style={{ margin: 0 }}>
                    You can view publication state only.
                  </p>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: canPublish(role) ? "1fr 1fr 1fr" : "1fr 1fr 1fr", gap: "0.6rem" }}>
                {publications.data.channels.map((ch) => {
                  const isSelected = selectedChannelCodes.includes(ch.code);
                  const isFailed = ch.publicationStatus === "FAILED" || ch.lastSync?.status === "FAILED";
                  return (
                    <div key={ch.code} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.75rem", padding: "0.65rem 0.75rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.6rem", alignItems: "center" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: canPublish(role) ? "pointer" : "default" }}>
                          {canPublish(role) ? (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                const next = e.target.checked ? [...selectedChannelCodes, ch.code] : selectedChannelCodes.filter((x) => x !== ch.code);
                                setSelectedChannelCodes(next);
                              }}
                            />
                          ) : (
                            <input type="checkbox" checked={ch.selected} disabled />
                          )}
                          <span style={{ fontWeight: 750 }}>{ch.displayName}</span>
                        </label>
                        <Badge label={ch.publicationStatus ?? "Not published"} />
                      </div>
                      <p className="admin-lead" style={{ margin: "0.45rem 0 0" }}>
                        Last sync: <code>{ch.lastSync?.startedAt ? String(ch.lastSync.startedAt).slice(0, 19).replace("T", " ") : "—"}</code>
                      </p>
                      {ch.lastSync?.message ? (
                        <p className="admin-lead" style={{ margin: "0.3rem 0 0", color: isFailed ? "#ffb4b4" : "var(--admin-muted)" }}>
                          {String(ch.lastSync.message).slice(0, 120)}
                        </p>
                      ) : null}

                      {canPublish(role) && isFailed ? (
                        <div style={{ marginTop: "0.55rem", display: "flex", justifyContent: "flex-end" }}>
                          <button
                            className="admin-btn admin-btn-ghost"
                            type="button"
                            style={{ minHeight: "2.15rem", padding: "0 0.6rem" }}
                            disabled={!selectedChannelCodes.includes(ch.code)}
                            onClick={async () => {
                              try {
                                await retryListingChannels(listing.id, { channels: [ch.code] });
                                await refresh(listingId);
                                setFlash({ type: "success", message: "Retry queued." });
                              } catch (e) {
                                setFlash({ type: "error", message: e instanceof Error ? e.message : "Retry failed." });
                              }
                            }}
                          >
                            Retry
                          </button>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ marginTop: "0.85rem" }}>
              <h4 style={{ margin: 0, fontSize: "0.95rem" }}>Sync logs</h4>
              {publicationLogs.status === "loading" ? <p className="admin-lead">Loading logs…</p> : null}
              {publicationLogs.status === "error" ? (
                <p className="admin-lead" style={{ color: "#ffb4b4" }}>
                  {publicationLogs.message}
                </p>
              ) : null}
              {publicationLogs.status === "ok" ? (
                publicationLogs.items.length === 0 ? (
                  <p className="admin-lead" style={{ marginBottom: 0 }}>
                    No publication attempts yet.
                  </p>
                ) : (
                  <div style={{ overflowX: "auto", marginTop: "0.55rem" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                      <thead>
                        <tr style={{ textAlign: "left", borderBottom: "1px solid var(--admin-border)" }}>
                          <th style={{ padding: "0.5rem 0.35rem" }}>Time</th>
                          <th style={{ padding: "0.5rem 0.35rem" }}>Channel</th>
                          <th style={{ padding: "0.5rem 0.35rem" }}>Action</th>
                          <th style={{ padding: "0.5rem 0.35rem" }}>Status</th>
                          <th style={{ padding: "0.5rem 0.35rem" }}>Message</th>
                        </tr>
                      </thead>
                      <tbody>
                        {publicationLogs.items.map((l) => (
                          <tr key={l.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                            <td style={{ padding: "0.55rem 0.35rem", color: "var(--admin-muted)" }}>{String(l.startedAt).slice(0, 19).replace("T", " ")}</td>
                            <td style={{ padding: "0.55rem 0.35rem" }}>{l.channelDisplayName ?? l.channelCode ?? "—"}</td>
                            <td style={{ padding: "0.55rem 0.35rem", color: "var(--admin-muted)" }}>{l.action ?? "—"}</td>
                            <td style={{ padding: "0.55rem 0.35rem", color: l.status === "FAILED" ? "#ffb4b4" : "var(--admin-muted)" }}>{l.status}</td>
                            <td style={{ padding: "0.55rem 0.35rem", color: "var(--admin-muted)", maxWidth: "34rem" }}>{l.message ? String(l.message).slice(0, 160) : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : null}
            </div>
          </>
        ) : null}
      </section>

      <section className="admin-card" style={{ maxWidth: "none", padding: "1rem" }}>
        <h3 style={{ margin: 0, fontSize: "1rem" }}>Internal notes</h3>
        <div style={{ display: "grid", gap: "0.5rem", marginTop: "0.5rem" }}>
          {notes.length === 0 ? <p className="admin-lead">No internal notes yet.</p> : null}
          {notes.map((n) => (
            <div key={n.id} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.75rem", padding: "0.65rem 0.75rem" }}>
              <p style={{ margin: 0, whiteSpace: "pre-wrap", color: "var(--admin-text)" }}>{n.content}</p>
              <time style={{ display: "block", marginTop: "0.35rem", fontSize: "0.8rem", color: "var(--admin-muted)" }}>
                {String(n.createdAt).slice(0, 19).replace("T", " ")}
              </time>
            </div>
          ))}
        </div>
        {canCreate(role) ? (
          <div style={{ marginTop: "0.6rem" }}>
            <textarea className="admin-input" style={{ width: "100%", minHeight: "5rem", padding: "0.7rem 0.75rem" }} value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} placeholder="Add internal note…" />
            <div style={{ marginTop: "0.5rem", display: "flex", justifyContent: "flex-end" }}>
              <button
                className="admin-btn admin-btn-ghost"
                type="button"
                disabled={savingNote || noteDraft.trim().length < 2}
                onClick={async () => {
                  try {
                    setSavingNote(true);
                    await createListingInternalNote(listing.id, noteDraft.trim());
                    setNoteDraft("");
                    const res = await listListingInternalNotes(listing.id);
                    setNotes(res.items);
                    setFlash({ type: "success", message: "Internal note added." });
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

      <ListingMediaModal
        open={mediaOpen}
        listingId={listing.id}
        onClose={() => {
          setMediaOpen(false);
          refresh(listingId).catch(() => {});
        }}
        canMutate={canUploadMedia(role, listing.status)}
        mutateDisabledReason="You can only upload/manage media on draft listings (and viewers are read-only)."
      />

      <ListingAiModal
        open={aiOpen}
        listingId={listing.id}
        listingStatus={listing.status ?? null}
        role={role}
        onClose={() => setAiOpen(false)}
        onApplied={() => {
          refresh(listingId).catch(() => {});
          setFlash({ type: "success", message: "AI output applied to listing." });
        }}
      />
    </div>
  );
}

