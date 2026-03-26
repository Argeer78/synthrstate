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

export function IntegrationsClient() {
  const { state } = useMe();
  const agencySlug = state.status === "ok" ? state.me.agency?.slug ?? "demo-agency" : "demo-agency";
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "https://api.synthrstate.com";
  const [gmail, setGmail] = useState<{ status: "loading" } | { status: "error"; message: string } | { status: "ok"; connected: boolean; gmailUserEmail: string | null; lastSyncedAt: string | null }>({ status: "loading" });
  const [gmailBusy, setGmailBusy] = useState(false);

  const publicListUrl = `${apiBase}/public/${agencySlug}/listings`;
  const publicDetailUrl = `${apiBase}/public/${agencySlug}/listings/{listingSlug}`;
  const xmlFeedUrl = `${apiBase}/public/${agencySlug}/feeds/xml`; // placeholder (MVP docs only)

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
          Public endpoints are agency-scoped by <code>agencySlug</code> and only return published listings.
        </p>
        <CodeBlock title="List listings" value={`GET ${publicListUrl}`} />
        <CodeBlock
          title="Example response (list)"
          value={JSON.stringify(
            {
              items: [
                {
                  id: "uuid",
                  slug: "central-apartment-2br",
                  title: "Central apartment",
                  listingType: "SALE",
                  price: "250000",
                  currency: "EUR",
                  bedrooms: 2,
                  bathrooms: 1,
                  sqm: "78",
                  property: { address: "…", city: "…", area: "…" },
                  cover: { url: "https://…", storageKey: "…" },
                },
              ],
              pageInfo: { page: 1, pageSize: 20, total: 1, hasNextPage: false },
            },
            null,
            2,
          )}
        />

        <CodeBlock title="Listing detail" value={`GET ${publicDetailUrl}`} />
        <CodeBlock
          title="Example response (detail)"
          value={JSON.stringify(
            {
              id: "uuid",
              slug: "central-apartment-2br",
              title: "Central apartment",
              description: "…",
              listingType: "SALE",
              status: "ACTIVE",
              price: "250000",
              currency: "EUR",
              bedrooms: 2,
              bathrooms: 1,
              sqm: "78",
              property: {
                address: "…",
                city: "…",
                area: "…",
                owner: { firstName: "…", lastName: "…" },
              },
              cover: { url: "https://…", storageKey: "…" },
              gallery: [{ url: "https://…", storageKey: "…" }],
            },
            null,
            2,
          )}
        />
      </Section>

      <Section title="XML feed export (MVP documentation)">
        <p className="admin-lead">
          MVP note: Synthr’s XML feed is documented here for integration planning. If your agency has the XML export enabled, it will be available as an agency-specific URL.
        </p>
        <CodeBlock title="Example XML feed URL" value={xmlFeedUrl} />
        <CodeBlock
          title="Sample XML (shape example)"
          value={[
            `<?xml version="1.0" encoding="UTF-8"?>`,
            `<listings agency="${agencySlug}">`,
            `  <listing slug="central-apartment-2br" status="ACTIVE">`,
            `    <title>Central apartment</title>`,
            `    <listingType>SALE</listingType>`,
            `    <price currency="EUR">250000</price>`,
            `    <bedrooms>2</bedrooms>`,
            `    <bathrooms>1</bathrooms>`,
            `    <sqm>78</sqm>`,
            `    <address>…</address>`,
            `    <media>`,
            `      <image url="https://…" />`,
            `    </media>`,
            `  </listing>`,
            `</listings>`,
          ].join("\n")}
        />
        <p className="admin-lead" style={{ marginBottom: 0 }}>
          Publication status affects whether a listing appears: typically only <code>ACTIVE</code>/<code>published</code> listings are included.
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
                ["title", "Public listing title"],
                ["description", "Main description (market-facing)"],
                ["price", "Numeric price (sale/rent)"],
                ["listingType", "SALE or RENT"],
                ["bedrooms", "Bedrooms (integer)"],
                ["bathrooms", "Bathrooms (integer)"],
                ["sqm", "Area (square meters)"],
                ["address", "Property address (where available)"],
                ["media", "Cover + gallery image URLs"],
                ["status", "Publication state (DRAFT/ACTIVE/etc.)"],
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
          <li>Missing required data (title/description/price/specs) depending on your integration rules.</li>
          <li>Publication failed (check listing workspace → Publishing logs).</li>
          <li>Wrong <code>agencySlug</code> or wrong listing <code>slug</code>.</li>
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

