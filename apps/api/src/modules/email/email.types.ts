export type EmailMessage = {
  to: string;
  subject: string;
  /** Plaintext fallback. */
  text: string;
  /** HTML body. */
  html: string;
};

export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  from: string;
};

