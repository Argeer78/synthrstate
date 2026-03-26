"use client";

import { useMe } from "../../lib/use-me";

function Section(props: { title: string; children: React.ReactNode }) {
  return (
    <section className="admin-card" style={{ maxWidth: "none", padding: "1rem" }}>
      <h2 style={{ margin: "0 0 0.5rem", fontSize: "1rem" }}>{props.title}</h2>
      {props.children}
    </section>
  );
}

export function ManualClient() {
  const { role } = useMe();
  const roleLabel = role === "STAFF" ? "Viewer (STAFF)" : role ?? "Unknown";

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <Section title="How To Use Synthr Admin">
        <p className="admin-lead" style={{ marginBottom: "0.5rem" }}>
          Signed in role: <strong style={{ color: "var(--admin-text)" }}>{roleLabel}</strong>
        </p>
        <ul className="admin-list" style={{ marginBottom: 0 }}>
          <li>Home: daily overview, due tasks, and quick actions</li>
          <li>Listings: create, edit, media, AI description, and publish flow</li>
          <li>CRM: contacts, leads, tasks, notes, inquiries, and conversions</li>
          <li>User Manual: role-aware operational reference for your team</li>
        </ul>
      </Section>

      <Section title="Owner">
        <ul className="admin-list" style={{ marginBottom: 0 }}>
          <li>Full agency access: billing, team management, publishing, and AI</li>
          <li>Manage all users and roles, including Managers</li>
          <li>Open Billing to upgrade/manage subscription and renewal visibility</li>
          <li>Use API and Gmail settings from API & Feeds / workspace email panels</li>
        </ul>
      </Section>

      <Section title="Manager">
        <ul className="admin-list" style={{ marginBottom: 0 }}>
          <li>Team operations: manage AGENT/STAFF users and daily CRM flows</li>
          <li>Can publish listings and use AI tools</li>
          <li>Billing visibility may be read-only depending on backend policy</li>
          <li>Cannot manage Owner-level permissions</li>
        </ul>
      </Section>

      <Section title="Agent">
        <ul className="admin-list" style={{ marginBottom: 0 }}>
          <li>Create/edit contacts, leads, tasks, and draft listings in scoped data</li>
          <li>AI usage is limited to allowed scoped workflows</li>
          <li>Publishing is not available; Owner/Manager handles final publish</li>
          <li>Can work lead and listing workspaces end-to-end for daily execution</li>
        </ul>
      </Section>

      <Section title="Viewer (Staff)">
        <ul className="admin-list" style={{ marginBottom: 0 }}>
          <li>Read-only visibility for assigned/visible records</li>
          <li>No create/edit/delete, no publishing, no AI actions</li>
          <li>Use CRM/listing pages for monitoring and internal coordination</li>
        </ul>
      </Section>

      <Section title="Recommended Daily Workflow">
        <ol style={{ margin: 0, paddingLeft: "1.1rem", color: "var(--admin-muted)", lineHeight: 1.7 }}>
          <li>Start on Home and review new inquiries and due tasks.</li>
          <li>Open CRM to process inquiries and convert qualified ones into leads.</li>
          <li>Use lead workspace for notes, tasks, contact context, and email panel.</li>
          <li>Use listings workspace for content/media quality and publishing actions.</li>
          <li>Owners/Managers review Billing, Team, and Integrations weekly.</li>
        </ol>
      </Section>
    </div>
  );
}

