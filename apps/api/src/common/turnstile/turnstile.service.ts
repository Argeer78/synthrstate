import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

type TurnstilePurpose = "inquiry" | "signup";

@Injectable()
export class TurnstileService {
  private readonly logger = new Logger(TurnstileService.name);

  constructor(private readonly config: ConfigService) {}

  private secretFor(purpose: TurnstilePurpose): string | undefined {
    if (purpose === "inquiry") {
      const v = this.config.get<string>("TURNSTILE_INQUIRY_SECRET_KEY");
      return v?.trim() || undefined;
    }
    if (purpose === "signup") {
      const v = this.config.get<string>("TURNSTILE_SIGNUP_SECRET_KEY");
      return v?.trim() || undefined;
    }
    return undefined;
  }

  /**
   * When the secret for this purpose is configured, requires a valid token from Cloudflare.
   * When not configured, skips verification (local/dev).
   */
  async assertValidResponse(
    purpose: TurnstilePurpose,
    token: string | undefined,
    remoteIp?: string,
  ): Promise<void> {
    const secret = this.secretFor(purpose);
    if (!secret) {
      if (process.env.NODE_ENV === "production") {
        throw new BadRequestException(
          "Security verification is not configured (set TURNSTILE_*_SECRET_KEY on the API).",
        );
      }
      return;
    }

    const response = token?.trim();
    if (!response) {
      throw new BadRequestException("Security verification required");
    }

    const body = new URLSearchParams();
    body.set("secret", secret);
    body.set("response", response);
    if (remoteIp?.trim()) body.set("remoteip", remoteIp.trim());

    let data: { success?: boolean; "error-codes"?: string[] };
    try {
      const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body,
      });
      data = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
    } catch (e) {
      this.logger.warn(`Turnstile siteverify request failed: ${e instanceof Error ? e.message : e}`);
      throw new BadRequestException("Security verification temporarily unavailable");
    }

    if (!data.success) {
      const codes = data["error-codes"]?.join(", ") ?? "unknown";
      this.logger.warn(`Turnstile verification failed: ${codes}`);
      throw new BadRequestException("Security verification failed");
    }
  }
}
