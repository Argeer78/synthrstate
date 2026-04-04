const DEV_PLACEHOLDER = "dev-only-change-me";

/**
 * JWT signing secret. In production, must be set and strong.
 * Call from bootstrap beforelisten so misconfiguration fails fast.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (process.env.NODE_ENV === "production") {
    if (!secret || secret === DEV_PLACEHOLDER) {
      throw new Error(
        "JWT_SECRET must be set in production to a strong secret (not the default placeholder).",
      );
    }
    if (secret.length < 32) {
      throw new Error("JWT_SECRET must be at least 32 characters in production.");
    }
  }
  return secret || DEV_PLACEHOLDER;
}
