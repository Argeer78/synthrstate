import type { Request } from "express";

/**
 * Best-effort client IP for Turnstile `remoteip`. Requires `trust proxy` when behind a reverse proxy.
 */
export function getClientIp(req: Request): string | undefined {
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string") {
    const first = xf.split(",")[0]?.trim();
    if (first) return first;
  }
  if (Array.isArray(xf) && xf[0]) {
    const first = xf[0].split(",")[0]?.trim();
    if (first) return first;
  }
  const socketIp = req.socket?.remoteAddress;
  if (socketIp) return socketIp;
  return undefined;
}
