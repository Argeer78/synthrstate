import { Injectable, Logger } from "@nestjs/common";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { loadSmtpConfig } from "./email.config";
import type { EmailMessage, SmtpConfig } from "./email.types";
import { buildWelcomeEmail } from "./templates/welcome.email";
import { buildPasswordResetEmail } from "./templates/password-reset.email";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly config: SmtpConfig | null;
  private readonly transporter: Transporter | null;

  constructor() {
    this.config = loadSmtpConfig();
    this.transporter = this.config
      ? nodemailer.createTransport({
          host: this.config.host,
          port: this.config.port,
          secure: this.config.secure,
          auth: this.config.user ? { user: this.config.user, pass: this.config.pass ?? "" } : undefined,
        })
      : null;
  }

  isConfigured(): boolean {
    return Boolean(this.config && this.transporter);
  }

  async send(msg: EmailMessage): Promise<void> {
    if (!this.transporter || !this.config) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("Email is not configured");
      }
      this.logger.warn(`Email skipped (not configured): to=${msg.to} subject=${msg.subject}`);
      return;
    }

    await this.transporter.sendMail({
      from: this.config.from,
      to: msg.to,
      subject: msg.subject,
      text: msg.text,
      html: msg.html,
    });
  }

  async sendWelcomeEmail(params: {
    to: string;
    ownerName?: string | null;
    agencyName: string;
  }): Promise<void> {
    const appUrl = (process.env.ADMIN_APP_URL ?? "https://app.synthrstate.com").replace(/\/$/, "");
    const supportEmail = process.env.BILLING_SUPPORT_EMAIL ?? process.env.SUPPORT_EMAIL ?? undefined;
    const demoHint = process.env.WELCOME_EMAIL_DEMO_HINT?.trim() || undefined;

    const built = buildWelcomeEmail({
      ownerName: params.ownerName,
      agencyName: params.agencyName,
      appUrl,
      supportEmail,
      demoHint,
    });

    await this.send({
      to: params.to,
      subject: built.subject,
      text: built.text,
      html: built.html,
    });
  }

  async sendPasswordResetEmail(params: {
    to: string;
    resetUrl: string;
    requestedFromIp?: string;
  }): Promise<void> {
    const supportEmail = process.env.BILLING_SUPPORT_EMAIL ?? process.env.SUPPORT_EMAIL ?? undefined;
    const built = buildPasswordResetEmail({
      resetUrl: params.resetUrl,
      supportEmail,
      requestedFromIp: params.requestedFromIp,
    });

    await this.send({
      to: params.to,
      subject: built.subject,
      text: built.text,
      html: built.html,
    });
  }
}

