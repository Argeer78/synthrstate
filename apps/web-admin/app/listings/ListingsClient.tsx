"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMe } from "../../lib/use-me";
import { canAccessAi, canCreate, canDelete, canEdit, canPublish, canUploadMedia } from "../../utils/permissions";
import { FlashMessage, type Flash } from "../components/Flash";
import { createListing, createProperty, deleteListing, listListings, type ListingRow } from "../../lib/api/listings";
import { publishListingChannels, type PublicationChannelCode } from "../../lib/api/publications";
import { ListingEditModal } from "./ListingEditModal";
import { ListingMediaModal } from "./ListingMediaModal";
import { ListingAiModal } from "./ListingAiModal";
import { Modal } from "../components/Modal";
import { listContacts, type Contact } from "../../lib/api/crm";

export function ListingsClient() {
  const { role } = useMe();
  const params = useSearchParams();
  const router = useRouter();
  const [flash, setFlash] = useState<Flash>(null);
  const [state, setState] = useState<
    { status: "loading" } | { status: "error"; message: string } | { status: "ok"; rows: ListingRow[]; total: number }
  >({ status: "loading" });

  const [editId, setEditId] = useState<string | null>(null);
  const [mediaId, setMediaId] = useState<string | null>(null);
  const [aiTarget, setAiTarget] = useState<{ id: string; status: string } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    ownerContactId: "",
    address: "",
    city: "",
    area: "",
    energyClass: "UNKNOWN",
    listingTitle: "",
    listingType: "SALE",
    price: "",
    status: "DRAFT",
    description: "",
    bedrooms: "",
    bathrooms: "",
    sqm: "",
  });

  async function refresh() {
    const { items, total } = await listListings();
    setState({ status: "ok", rows: items, total });
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { items, total } = await listListings();
        if (!cancelled) {
          setState({
            status: "ok",
            rows: items,
            total,
          });
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to load listings.";
        if (!cancelled) setState({ status: "error", message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!canCreate(role)) return;
    const wants = params?.get("new");
    if (wants === "listing") setCreateOpen(true);
  }, [params, role]);

  useEffect(() => {
    if (!createOpen || !canCreate(role)) return;
    let cancelled = false;
    (async () => {
      try {
        const { items } = await listContacts();
        if (!cancelled) setContacts(items);
      } catch {
        if (!cancelled) setContacts([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [createOpen, role]);

  if (state.status === "loading") {
    return <p className="admin-lead">Loading listings…</p>;
  }

  if (state.status === "error") {
    return (
      <p className="admin-lead" style={{ color: "#ffb4b4" }}>
        {state.message}
      </p>
    );
  }

  async function onPublish(id: string) {
    try {
      await publishListingChannels(id, { channels: ["WEBSITE" as PublicationChannelCode] });
      await refresh();
      setFlash({ type: "success", message: "Listing published." });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Publish failed.";
      setFlash({ type: "error", message });
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this listing? This is a soft delete.")) return;
    try {
      await deleteListing(id);
      await refresh();
      setFlash({ type: "success", message: "Listing deleted." });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Delete failed.";
      setFlash({ type: "error", message });
    }
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <FlashMessage flash={flash} onDismiss={() => setFlash(null)} />
      {canCreate(role) ? (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.75rem" }}>
          <button
            className="admin-btn admin-btn-primary"
            type="button"
            onClick={() => setCreateOpen(true)}
            style={{ minHeight: "2.5rem" }}
          >
            New listing
          </button>
        </div>
      ) : null}
      {state.rows.length === 0 ? (
        <p className="admin-lead">No listings yet. Create your first listing draft to get started.</p>
      ) : null}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "0.875rem",
        }}
      >
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid var(--admin-border)" }}>
            <th style={{ padding: "0.5rem 0.35rem" }}>Title</th>
            <th style={{ padding: "0.5rem 0.35rem" }}>Status</th>
            <th style={{ padding: "0.5rem 0.35rem" }}>Slug</th>
            <th style={{ padding: "0.5rem 0.35rem" }}>Price</th>
            <th style={{ padding: "0.5rem 0.35rem" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {state.rows.map((row) => (
            <tr key={row.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <td style={{ padding: "0.55rem 0.35rem", maxWidth: "14rem" }}>
                <Link href={`/listings/view/?id=${encodeURIComponent(row.id)}`} className="admin-link">
                  {row.title}
                </Link>
              </td>
              <td style={{ padding: "0.55rem 0.35rem", color: "var(--admin-muted)" }}>{row.status}</td>
              <td style={{ padding: "0.55rem 0.35rem" }}>
                <code style={{ fontSize: "0.8em" }}>{row.slug}</code>
              </td>
              <td style={{ padding: "0.55rem 0.35rem" }}>
                {row.price != null ? `${row.price} ${row.currency ?? "EUR"}` : "—"}
              </td>
              <td style={{ padding: "0.55rem 0.35rem" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                  {canEdit(role) ? (
                    <button
                      className="admin-btn admin-btn-ghost"
                      type="button"
                      onClick={() => setEditId(row.id)}
                      title={row.status !== "DRAFT" && role === "AGENT" ? "You can only edit draft listings" : ""}
                      disabled={role === "AGENT" && row.status !== "DRAFT"}
                      style={{ padding: "0.35rem 0.6rem", minHeight: "2rem" }}
                    >
                      Edit
                    </button>
                  ) : null}

                  {canPublish(role) ? (
                    <button
                      className="admin-btn admin-btn-ghost"
                      type="button"
                      style={{ padding: "0.35rem 0.6rem", minHeight: "2rem" }}
                      onClick={() => onPublish(row.id)}
                      disabled={row.status === "ACTIVE"}
                      title={row.status === "ACTIVE" ? "Already published" : ""}
                    >
                      Publish
                    </button>
                  ) : null}

                  {canUploadMedia(role, row.status) ? (
                    <button
                      className="admin-btn admin-btn-ghost"
                      type="button"
                      style={{ padding: "0.35rem 0.6rem", minHeight: "2rem" }}
                      onClick={() => setMediaId(row.id)}
                    >
                      Media
                    </button>
                  ) : null}

                  {canAccessAi(role) ? (
                    <button
                      className="admin-btn admin-btn-ghost"
                      type="button"
                      style={{ padding: "0.35rem 0.6rem", minHeight: "2rem" }}
                      onClick={() => setAiTarget({ id: row.id, status: row.status })}
                    >
                      AI
                    </button>
                  ) : null}

                  {canDelete(role) ? (
                    <button
                      className="admin-btn admin-btn-ghost"
                      type="button"
                      style={{ padding: "0.35rem 0.6rem", minHeight: "2rem" }}
                      onClick={() => onDelete(row.id)}
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ margin: "0.75rem 0 0", fontSize: "0.8rem", color: "var(--admin-muted)" }}>
        Showing {state.rows.length} of {state.total} (first page)
      </p>

      <Modal
        title="Create listing"
        open={createOpen}
        onClose={() => (creating ? null : setCreateOpen(false))}
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
            <button className="admin-btn admin-btn-ghost" type="button" onClick={() => setCreateOpen(false)} disabled={creating}>
              Cancel
            </button>
            <button
              className="admin-btn admin-btn-primary"
              type="button"
              disabled={creating || !canCreate(role)}
              onClick={async () => {
                if (!createForm.ownerContactId || !createForm.address.trim() || !createForm.listingTitle.trim() || !createForm.description.trim()) {
                  setFlash({ type: "error", message: "Owner contact, address, listing title, and description are required." });
                  return;
                }

                try {
                  setCreating(true);
                  const property = await createProperty({
                    ownerContactId: createForm.ownerContactId,
                    address: createForm.address.trim(),
                    city: createForm.city.trim() || undefined,
                    area: createForm.area.trim() || undefined,
                    energyClass: createForm.energyClass as "A" | "B" | "C" | "D" | "E" | "F" | "G" | "UNKNOWN",
                  });

                  const isAgent = role === "AGENT";
                  const listing = await createListing({
                    propertyId: property.id,
                    listingType: createForm.listingType as "SALE" | "RENT",
                    status: isAgent ? "DRAFT" : (createForm.status as "DRAFT" | "ACTIVE" | "ARCHIVED" | "SOLD" | "RENTED"),
                    title: createForm.listingTitle.trim(),
                    description: createForm.description.trim(),
                    price: createForm.price.trim() ? Number(createForm.price) : undefined,
                    bedrooms: createForm.bedrooms.trim() ? Number(createForm.bedrooms) : undefined,
                    bathrooms: createForm.bathrooms.trim() ? Number(createForm.bathrooms) : undefined,
                    sqm: createForm.sqm.trim() ? Number(createForm.sqm) : undefined,
                    currency: "EUR",
                  });

                  setCreateOpen(false);
                  setCreateForm({
                    ownerContactId: "",
                    address: "",
                    city: "",
                    area: "",
                    energyClass: "UNKNOWN",
                    listingTitle: "",
                    listingType: "SALE",
                    price: "",
                    status: "DRAFT",
                    description: "",
                    bedrooms: "",
                    bathrooms: "",
                    sqm: "",
                  });
                  await refresh();
                  router.push(`/listings/view/?id=${encodeURIComponent(listing.id)}`);
                } catch (e) {
                  setFlash({ type: "error", message: e instanceof Error ? e.message : "Failed to create listing." });
                } finally {
                  setCreating(false);
                }
              }}
            >
              {creating ? "Creating…" : "Create listing"}
            </button>
          </div>
        }
      >
        <div style={{ display: "grid", gap: "0.9rem" }}>
          <p className="admin-lead" style={{ margin: 0 }}>
            One form, two backend steps: create property first, then create listing.
          </p>

          <div style={{ display: "grid", gap: "0.5rem" }}>
            <label style={{ fontSize: "0.85rem", color: "var(--admin-muted)" }}>Owner contact *</label>
            <select
              className="admin-input"
              value={createForm.ownerContactId}
              onChange={(e) => setCreateForm((s) => ({ ...s, ownerContactId: e.target.value }))}
            >
              <option value="">Select contact…</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {`${[c.firstName, c.lastName].filter(Boolean).join(" ") || c.organizationName || "Contact"}${c.email ? ` · ${c.email}` : ""}`}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "0.5rem" }}>
            <input className="admin-input" placeholder="Address *" value={createForm.address} onChange={(e) => setCreateForm((s) => ({ ...s, address: e.target.value }))} />
            <input className="admin-input" placeholder="City" value={createForm.city} onChange={(e) => setCreateForm((s) => ({ ...s, city: e.target.value }))} />
            <input className="admin-input" placeholder="Area" value={createForm.area} onChange={(e) => setCreateForm((s) => ({ ...s, area: e.target.value }))} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
            <select className="admin-input" value={createForm.energyClass} onChange={(e) => setCreateForm((s) => ({ ...s, energyClass: e.target.value }))}>
              {["UNKNOWN", "A", "B", "C", "D", "E", "F", "G"].map((v) => (
                <option key={v} value={v}>
                  Energy {v}
                </option>
              ))}
            </select>
            <select className="admin-input" value={createForm.listingType} onChange={(e) => setCreateForm((s) => ({ ...s, listingType: e.target.value }))}>
              <option value="SALE">Sale</option>
              <option value="RENT">Rent</option>
            </select>
            <select
              className="admin-input"
              value={role === "AGENT" ? "DRAFT" : createForm.status}
              onChange={(e) => setCreateForm((s) => ({ ...s, status: e.target.value }))}
              disabled={role === "AGENT"}
              title={role === "AGENT" ? "Agents create draft listings only" : ""}
            >
              <option value="DRAFT">DRAFT</option>
              <option value="ACTIVE">ACTIVE</option>
            </select>
          </div>

          <input
            className="admin-input"
            placeholder="Listing title *"
            value={createForm.listingTitle}
            onChange={(e) => setCreateForm((s) => ({ ...s, listingTitle: e.target.value }))}
          />
          <textarea
            className="admin-input"
            placeholder="Description *"
            rows={4}
            value={createForm.description}
            onChange={(e) => setCreateForm((s) => ({ ...s, description: e.target.value }))}
            style={{ width: "100%", resize: "vertical", padding: "0.7rem 0.75rem" }}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.5rem" }}>
            <input className="admin-input" placeholder="Price" inputMode="decimal" value={createForm.price} onChange={(e) => setCreateForm((s) => ({ ...s, price: e.target.value }))} />
            <input className="admin-input" placeholder="Bedrooms" inputMode="numeric" value={createForm.bedrooms} onChange={(e) => setCreateForm((s) => ({ ...s, bedrooms: e.target.value }))} />
            <input className="admin-input" placeholder="Bathrooms" inputMode="numeric" value={createForm.bathrooms} onChange={(e) => setCreateForm((s) => ({ ...s, bathrooms: e.target.value }))} />
            <input className="admin-input" placeholder="SQM" inputMode="decimal" value={createForm.sqm} onChange={(e) => setCreateForm((s) => ({ ...s, sqm: e.target.value }))} />
          </div>
        </div>
      </Modal>

      <ListingEditModal
        open={editId != null}
        listingId={editId}
        role={role}
        onClose={() => setEditId(null)}
        onSaved={() => {
          refresh().catch(() => {});
          setFlash({ type: "success", message: "Listing saved." });
        }}
      />

      <ListingMediaModal
        open={mediaId != null}
        listingId={mediaId}
        onClose={() => setMediaId(null)}
        canMutate={canUploadMedia(role, state.status === "ok" ? state.rows.find((r) => r.id === mediaId)?.status : undefined)}
        mutateDisabledReason="You can only upload/manage media on draft listings (and viewers are read-only)."
      />

      <ListingAiModal
        open={aiTarget != null}
        listingId={aiTarget?.id ?? null}
        listingStatus={aiTarget?.status ?? null}
        role={role}
        onClose={() => setAiTarget(null)}
        onApplied={() => {
          refresh().catch(() => {});
          setFlash({ type: "success", message: "AI output applied to listing." });
        }}
      />
    </div>
  );
}
