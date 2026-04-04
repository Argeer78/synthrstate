function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function buildWelcomeEmail(params: {
  ownerName?: string | null;
  agencyName: string;
  appUrl: string;
  supportEmail?: string;
  demoHint?: string;
}) {
  const name = params.ownerName?.trim() || "there";
  const agency = params.agencyName.trim();
  const appUrl = params.appUrl.replace(/\/$/, "");

  const subject = `Welcome to Synthr${agency ? ` — ${agency}` : ""}`;

  const steps = [
    "Finish your agency setup (branding, contact details).",
    "Create or import your first listing, then upload photos and set the cover image.",
    "Use CRM to track leads: add notes, assign tasks, and follow up quickly.",
    "Open Billing when you’re ready to upgrade or manage your subscription.",
  ];

  const text = [
    `Hi ${name},`,
    "",
    `Welcome to Synthr${agency ? ` for ${agency}` : ""}.`,
    "",
    "Getting started:",
    ...steps.map((s, i) => `${i + 1}. ${s}`),
    "",
    `Open Synthr Admin: ${appUrl}`,
    params.demoHint ? "" : "",
    params.demoHint ? `Demo: ${params.demoHint}` : "",
    params.supportEmail ? `Support: ${params.supportEmail}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const htmlSteps = steps
    .map((s) => `<li style="margin:0 0 8px 0;line-height:1.5;color:#111827;">${escapeHtml(s)}</li>`)
    .join("");

  const html = `
  <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;max-width:560px;margin:0 auto;padding:24px;">
    <h1 style="margin:0 0 12px 0;font-size:20px;line-height:1.2;color:#111827;">Welcome to Synthr</h1>
    <p style="margin:0 0 16px 0;font-size:14px;line-height:1.55;color:#374151;">
      Hi <strong style="color:#111827;">${escapeHtml(name)}</strong>, welcome${agency ? ` to <strong style="color:#111827;">${escapeHtml(agency)}</strong>` : ""}.
    </p>
    <div style="border:1px solid #e5e7eb;border-radius:12px;padding:16px;background:#ffffff;">
      <p style="margin:0 0 10px 0;font-size:13px;font-weight:700;color:#111827;">Getting started</p>
      <ol style="margin:0;padding-left:18px;">${htmlSteps}</ol>
      <div style="margin-top:14px;">
        <a href="${escapeHtml(appUrl)}" style="display:inline-block;background:#111827;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:10px 14px;border-radius:10px;">
          Open Synthr Admin
        </a>
      </div>
    </div>
    ${
      params.demoHint
        ? `<p style="margin:14px 0 0 0;font-size:13px;color:#6b7280;">${escapeHtml(params.demoHint)}</p>`
        : ""
    }
    ${
      params.supportEmail
        ? `<p style="margin:10px 0 0 0;font-size:13px;color:#6b7280;">Need help? Email <a href="mailto:${escapeHtml(
            params.supportEmail,
          )}" style="color:#111827;font-weight:700;text-decoration:none;">${escapeHtml(params.supportEmail)}</a></p>`
        : ""
    }
    <p style="margin:18px 0 0 0;font-size:12px;color:#9ca3af;">Synthr</p>
  </div>
  `.trim();

  return { subject, text, html };
}

