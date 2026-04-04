import { BadRequestException } from "@nestjs/common";
import type { SmtpConfig } from "./email.types";

function required(name: string, value: string | undefined): string {
  const v = value?.trim();
  if (!v) throw new BadRequestException(`${name} is required`);
  return v;
}

export function loadSmtpConfig(): SmtpConfig | null {
  const from = process.env.EMAIL_FROM?.trim();
  const host = process.env.SMTP_HOST?.trim();
  const portRaw = process.env.SMTP_PORT?.trim();

  // Allow running without email configured in dev/staging.
  if (!host || !portRaw || !from) return null;

  const port = Number(portRaw);
  if (!Number.isFinite(port) || port <= 0) return null;

  const secure = String(process.env.SMTP_SECURE ?? "").trim() === "true" || port === 465;
  const user = process.env.SMTP_USER?.trim() || undefined;
  const pass = process.env.SMTP_PASS?.trim() || undefined;

  return {
    host,
    port,
    secure,
    user,
    pass,
    from,
  };
}

export function assertEmailConfiguredForProd(config: SmtpConfig | null) {
  if (process.env.NODE_ENV !== "production") return;
  if (!config) {
    throw new Error(
      "Email is not configured. Set SMTP_HOST, SMTP_PORT, EMAIL_FROM (and optionally SMTP_USER/SMTP_PASS).",
    );
  }
  // If user is set, require pass (common misconfig).
  if (config.user && !config.pass) {
    throw new Error("SMTP_USER is set but SMTP_PASS is missing.");
  }
}

