"use client";

import { useEffect, useMemo, useState } from "react";
import { useMe } from "../../lib/use-me";
import { gmailConnectUrl, gmailDisconnect, gmailStatus, gmailSync } from "../../lib/api/gmail";

function CodeBlock(props: { title?: string; value: string; copyLabel?: string }) {
  const id = useMemo(() => `code-${Math.random().toString(16).slice(2)}`, []);
  return (
    <div className="admin-code">
      {props.title ? (
        <div className="admin-code-head">
          <div style={{ fontWeight: 800 }}>{props.title}</div>
          <button
            className="admin-btn admin-btn-ghost"
            style={{ minHeight: "2rem", padding: "0 0.6rem" }}
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(props.value);
              } catch {
                // no-op
              }
            }}
          >
            {props.copyLabel ?? "Copy"}
          </button>
        </div>
      ) : null}
      <pre id={id} style={{ margin: 0, overflowX: "auto", padding: "0.75rem", borderRadius: "0.75rem", border: "1px solid var(--admin-border)", background: "var(--admin-input-bg)" }}>
        <code style={{ fontSize: 13, lineHeight: 1.45, color: "var(--admin-text)" }}>{props.value}</code>
      </pre>
    </div>
  );
}

function Section(props: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: "1.25rem" }}>
      <h2 style={{ margin: "0 0 0.5rem", fontSize: "1rem" }}>{props.title}</h2>
      {props.children}
    </section>
  );
}

/** Keep in sync with Prisma enum PropertyType */
const PROPERTY_TYPE_ENUM = [
  "APARTMENT",
  "HOUSE",
  "VILLA",
  "STUDIO",
  "LAND",
  "COMMERCIAL",
  "PARKING",
  "OTHER",
] as const;

const PUBLIC_LIST_SORT = ["createdAt_desc", "createdAt_asc", "price_desc", "price_asc", "title_asc", "title_desc"] as const;

export function IntegrationsClient() {
  const { state } = useMe();
  const agencySlug = state.status === "ok" ? state.me.agency?.slug ?? "demo-agency" : "demo-agency";
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "https://api.synthrstate.com";
  const [gmail, setGmail] = useState<{ status: "loading" } | { status: "error"; message: string } | { status: "ok"; connected: boolean; gmailUserEmail: string | null; lastSyncedAt: string | null }>({ status: "loading" });
  const [gmailBusy, setGmailBusy] = useState(false);

  const publicListUrl = `${apiBase}/public/${agencySlug}/listings`;
  const publicDetailUrl = `${apiBase}/public/${agencySlug}/listings/{listingSlug}`;
  const publicSimilarUrl = `${apiBase}/public/${agencySlug}/listings/{listingSlug}/similar`;
  const xmlFeedUrl = `${apiBase}/public/${agencySlug}/feeds/xml`;

  async function refreshGmail() {
    try {
      const s = await gmailStatus();
      setGmail({ status: "ok", connected: s.connected, gmailUserEmail: s.gmailUserEmail, lastSyncedAt: s.lastSyncedAt });
    } catch (e) {
      setGmail({ status: "error", message: e instanceof Error ? e.message : "Failed to load Gmail status." });
    }
  }

  useEffect(() => {
    refreshGmail();
  }, []);

  return (
    <div>
      <Section title="Overview">
        <p className="admin-lead">
          Synthr supports integrations for publishing listings to websites and portals. For MVP, integrations focus on:
        </p>
        <ul className="admin-list">
          <li>Public listings API (JSON)</li>
          <li>XML feed export (concept + mapping)</li>
          <li>Publication status & sync logs (controls what is “live”)</li>
        </ul>
        <p className="admin-lead" style={{ marginBottom: 0 }}>
          <strong>Public API</strong> is best for custom websites/apps. <strong>XML feed</strong> is best for portal-style imports and legacy systems.
        </p>
      </Section>

      <Section title="API basics">
        <CodeBlock title="Base API URL" value={apiBase} />
        <p className="admin-lead" style={{ marginTop: "0.75rem" }}>
          - <strong>Protected endpoints</strong> (admin actions) require authentication (cookie-based session in the admin app).
          <br />- <strong>Public endpoints</strong> are safe for websites and do not require auth.
          <br />- Responses are JSON.
        </p>
      </Section>

      <Section title="Public listings API">
        <p className="admin-lead">
          Public endpoints are agency-scoped by <code>agencySlug</code>. Only <strong>ACTIVE</strong> listings are returned (draft/archived are omitted).
        </p>
        <CodeBlock title="List listings" value={`GET ${publicListUrl}`} />
        <p className="admin-lead" style={{ marginTop: "0.5rem" }}>
          Optional query parameters (all optional; unknown params may return 400 if the API validates strictly):
        </p>
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem", marginTop: "0.35rem" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid var(--admin-border)" }}>
                <th style={{ padding: "0.5rem 0.35rem" }}>Parameter</th>
                <th style={{ padding: "0.5rem 0.35rem" }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["lang", "BCP47-style code (e.g. en, el). Picks translation when available; falls back to listing original language."],
                ["q", "Case-insensitive search over title and description (and related text)."],
                ["listingType", "SALE or RENT"],
                ["propertyType", `One of: ${PROPERTY_TYPE_ENUM.join(", ")}`],
                ["city", "Substring match on property city (case-insensitive)."],
                ["area", "Exact match on property area/neighborhood."],
                ["minPrice, maxPrice", "Numeric price range."],
                ["bedrooms", "Exact bedroom count (legacy shortcut)."],
                ["minBedrooms, maxBedrooms", "Bedroom count range."],
                ["minBathrooms, maxBathrooms", "Bathroom count range."],
                ["minSqm, maxSqm", "Interior/size range (sqm)."],
                ["sort", `One of: ${PUBLIC_LIST_SORT.join(", ")}`],
                ["page", "1-based page index (default 1)."],
                ["pageSize", "Page size, max 100 (default 20)."],
              ].map(([k, v]) => (
                <tr key={k} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <td style={{ padding: "0.55rem 0.35rem", verticalAlign: "top", whiteSpace: "nowrap" }}>
                    <code>{k}</code>
                  </td>
                  <td style={{ padding: "0.55rem 0.35rem", color: "var(--admin-muted)" }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <CodeBlock
          title="Example response (list)"
          value={JSON.stringify(
            {
              items: [
                {
                  id: "uuid",
                  slug: "central-apartment-2br",
                  languageCode: "en",
                  title: "Central apartment",
                  shortDescription: null,
                  listingType: "SALE",
                  price: "250000",
                  currency: "EUR",
                  bedrooms: 2,
                  bathrooms: 1,
                  sqm: "78",
                  property: {
                    id: "uuid",
                    address: "…",
                    city: "…",
                    area: "…",
                    latitude: null,
                    longitude: null,
                    propertyType: "APARTMENT",
                    energyClass: "B",
                  },
                  cover: { storageKey: "…", url: "https://…" },
                },
              ],
              pageInfo: { page: 1, pageSize: 20, total: 1, hasNextPage: false },
            },
            null,
            2,
          )}
        />

        <CodeBlock title="Listing detail" value={`GET ${publicDetailUrl}?lang=en`} />
        <CodeBlock
          title="Example response (detail)"
          value={JSON.stringify(
            {
              id: "uuid",
              slug: "central-apartment-2br",
              languageCode: "en",
              title: "Central apartment",
              description: "…",
              shortDescription: null,
              listingType: "SALE",
              status: "ACTIVE",
              price: "250000",
              currency: "EUR",
              bedrooms: 2,
              bathrooms: 1,
              sqm: "78",
              property: {
                id: "uuid",
                address: "…",
                city: "…",
                area: "…",
                latitude: null,
                longitude: null,
                propertyType: "APARTMENT",
                energyClass: "B",
                owner: { id: "uuid", firstName: "…", lastName: "…", organizationName: null },
              },
              cover: { storageKey: "…", url: "https://…" },
              gallery: [{ storageKey: "…", url: "https://…", sortOrder: 0, isCover: true, mimeType: "image/jpeg", fileName: "…" }],
            },
            null,
            2,
          )}
        />

        <CodeBlock title="Similar listings" value={`GET ${publicSimilarUrl}?limit=6&lang=en`} />
        <p className="admin-lead" style={{ marginBottom: 0 }}>
          Returns a compact list of other ACTIVE listings (same deal type; same city/area/bedrooms when present). Item shape aligns with the list endpoint (title, specs, property classification, cover).
        </p>
      </Section>

      <Section title="XML feed export">
        <p className="admin-lead">
          Agency-wide XML for portals and legacy importers. Only <strong>ACTIVE</strong> listings. Optional <code>?lang=xx</code> limits rows to that language (original + matching translation rows). Without <code>lang</code>, each listing may appear once per language version (original + translations).
        </p>
        <CodeBlock title="XML feed URL" value={`${xmlFeedUrl}?lang=en`} />
        <CodeBlock
          title="Sample XML (matches live shape)"
          value={[
            `<?xml version="1.0" encoding="UTF-8"?>`,
            `<listings agency="${agencySlug}" generatedAt="2026-03-28T12:00:00.000Z">`,
            `  <listing id="uuid" slug="central-apartment-2br" language="en">`,
            `    <title>Central apartment</title>`,
            `    <description>…</description>`,
            `    <shortDescription></shortDescription>`,
            `    <listingType>SALE</listingType>`,
            `    <propertyType>APARTMENT</propertyType>`,
            `    <status>ACTIVE</status>`,
            `    <price currency="EUR">250000</price>`,
            `    <bedrooms>2</bedrooms>`,
            `    <bathrooms>1</bathrooms>`,
            `    <sqm>78</sqm>`,
            `    <energyClass>B</energyClass>`,
            `    <address>…</address>`,
            `    <city>…</city>`,
            `    <area>…</area>`,
            `    <latitude></latitude>`,
            `    <longitude></longitude>`,
            `  </listing>`,
            `</listings>`,
          ].join("\n")}
        />
        <p className="admin-lead" style={{ marginBottom: 0 }}>
          Images are not embedded in XML in the current MVP; use the public JSON detail endpoint or signed URLs from your integration layer if you need a full media set.
        </p>
      </Section>

      <Section title="Admin catalog API (authenticated)">
        <p className="admin-lead" style={{ marginBottom: 0 }}>
          <code>GET /catalog/listings</code> (session/JWT + tenant) supports the same core property filters plus agency fields:{" "}
          <code>status</code>, <code>energyClass</code>, <code>ownerContactId</code>, and sort via <code>sortBy</code> / <code>sortOrder</code>. Use this for back-office search; use the public routes above for buyer-facing sites.
        </p>
      </Section>

      <Section title="Publication channels & schema version">
        <p className="admin-lead" style={{ marginBottom: 0 }}>
          Publication logs on successful sync include <code>listingExportSchemaVersion</code> (currently <strong>1</strong>) so you can tell which field set a run targeted. Feed mapping records may include the same version and a short note pointing at these public routes. Website / XML feed / portal channels are simulated in MVP except traceability in logs.
        </p>
      </Section>

      <Section title="Field mapping (common fields)">
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid var(--admin-border)" }}>
                <th style={{ padding: "0.5rem 0.35rem" }}>Field</th>
                <th style={{ padding: "0.5rem 0.35rem" }}>Meaning</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["languageCode", "Resolved content language for this JSON row (list/detail/similar)."],
                ["title / description / shortDescription", "Market-facing text; translations when lang matches."],
                ["listingType", "SALE or RENT"],
                ["propertyType", "Physical/marketing category (enum on property; see list above)."],
                ["energyClass", "A–G or UNKNOWN (property-level)."],
                ["price / currency", "Deal terms on the listing"],
                ["bedrooms / bathrooms / sqm", "Listing-level specs"],
                ["property.city / property.area / address", "Location fields on the property"],
                ["property.latitude / longitude", "Optional coordinates when set"],
                ["cover / gallery", "Media references (JSON); URLs may be signed or CDN depending on env"],
                ["status", "Listing workflow state (public detail exposes ACTIVE for published items only)"],
              ].map(([k, v]) => (
                <tr key={k} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <td style={{ padding: "0.55rem 0.35rem" }}>
                    <code>{k}</code>
                  </td>
                  <td style={{ padding: "0.55rem 0.35rem", color: "var(--admin-muted)" }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Troubleshooting">
        <ul className="admin-list" style={{ marginBottom: 0 }}>
          <li>Listing is still <strong>draft/unpublished</strong> (not ACTIVE / not published to Website channel).</li>
          <li>
            <strong>400 Bad Request</strong> on public list: invalid query values (e.g. wrong <code>propertyType</code> or <code>sort</code> token). Check enums and numeric params.
          </li>
          <li>Missing required data (title/description/price/specs) depending on your integration rules.</li>
          <li>Publication failed (check listing workspace → Publishing logs).</li>
          <li>Wrong <code>agencySlug</code> or wrong listing <code>slug</code>.</li>
          <li>
            <code>lang</code> mismatch: API falls back to the listing&apos;s original language when a translation is missing.
          </li>
        </ul>
      </Section>

      <Section title="Support">
        <p className="admin-lead" style={{ marginBottom: 0 }}>
          For technical integration support, email <code>support@synthrstate.com</code> (placeholder).
        </p>
      </Section>

      <Section title="Gmail settings">
        {gmail.status === "loading" ? <p className="admin-lead">Loading Gmail status…</p> : null}
        {gmail.status === "error" ? (
          <p className="admin-lead" style={{ color: "#ffb4b4" }}>
            {gmail.message}
          </p>
        ) : null}
        {gmail.status === "ok" ? (
          <>
            <p className="admin-lead" style={{ marginBottom: "0.5rem" }}>
              Connection:{" "}
              <strong style={{ color: "var(--admin-text)" }}>{gmail.connected ? "Connected" : "Not connected"}</strong>
              {gmail.gmailUserEmail ? <span> · {gmail.gmailUserEmail}</span> : null}
            </p>
            <p className="admin-lead" style={{ marginBottom: "0.75rem" }}>
              Last sync: {gmail.lastSyncedAt ? String(gmail.lastSyncedAt).slice(0, 19).replace("T", " ") : "Never"}
            </p>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {gmail.connected ? (
                <>
                  <button
                    className="admin-btn admin-btn-ghost"
                    type="button"
                    disabled={gmailBusy}
                    onClick={async () => {
                      try {
                        setGmailBusy(true);
                        await gmailSync(25);
                        await refreshGmail();
                      } finally {
                        setGmailBusy(false);
                      }
                    }}
                  >
                    Sync now
                  </button>
                  <button
                    className="admin-btn admin-btn-ghost"
                    type="button"
                    disabled={gmailBusy}
                    onClick={async () => {
                      try {
                        setGmailBusy(true);
                        await gmailDisconnect();
                        await refreshGmail();
                      } finally {
                        setGmailBusy(false);
                      }
                    }}
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  className="admin-btn admin-btn-primary"
                  type="button"
                  disabled={gmailBusy}
                  onClick={async () => {
                    try {
                      setGmailBusy(true);
                      const { url } = await gmailConnectUrl();
                      window.location.href = url;
                    } finally {
                      setGmailBusy(false);
                    }
                  }}
                >
                  Connect Gmail
                </button>
              )}
            </div>
          </>
        ) : null}
      </Section>
    </div>
  );
}

