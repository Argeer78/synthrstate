type BuiltEmail = {
  subject: string;
  text: string;
  html: string;
};

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return c;
    }
  });
}

export function buildPasswordResetEmail(params: {
  resetUrl: string;
  supportEmail?: string;
  requestedFromIp?: string;
}): BuiltEmail {
  const safeUrl = params.resetUrl;
  const ipLine = params.requestedFromIp ? `Requested from IP: ${params.requestedFromIp}` : null;
  const supportLine = params.supportEmail ? `Support: ${params.supportEmail}` : null;

  const subject = "Reset your Synthr password";
  const text = [
    "We received a request to reset your Synthr password.",
    "",
    `Reset link: ${safeUrl}`,
    "",
    "This link expires in 1 hour. If you didn't request this, you can ignore this email.",
    ipLine,
    supportLine,
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
  <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; line-height:1.45; color:#111827;">
    <h2 style="margin:0 0 12px;">Reset your password</h2>
    <p style="margin:0 0 14px;">
      We received a request to reset your Synthr password.
    </p>
    <p style="margin:0 0 18px;">
      <a href="${escapeHtml(safeUrl)}" style="display:inline-block; background:#2563eb; color:white; text-decoration:none; padding:10px 14px; border-radius:10px;">
        Reset password
      </a>
    </p>
    <p style="margin:0 0 10px; color:#374151;">
      This link expires in <strong>1 hour</strong>. If you didn’t request this, you can ignore this email.
    </p>
    ${
      params.requestedFromIp
        ? `<p style="margin:0 0 6px; color:#6b7280; font-size:12px;">Requested from IP: ${escapeHtml(params.requestedFromIp)}</p>`
        : ""
    }
    ${
      params.supportEmail
        ? `<p style="margin:0; color:#6b7280; font-size:12px;">Support: <a href="mailto:${escapeHtml(params.supportEmail)}">${escapeHtml(params.supportEmail)}</a></p>`
        : ""
    }
  </div>
  `.trim();

  return { subject, text, html };
}

