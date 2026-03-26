import crypto from "crypto";
import { BadRequestException } from "@nestjs/common";

function getKey(): Buffer {
  const raw = process.env.GMAIL_TOKEN_ENCRYPTION_KEY;
  if (!raw) throw new BadRequestException("GMAIL_TOKEN_ENCRYPTION_KEY not configured");
  // Accept base64 (preferred) or hex.
  const b64 = Buffer.from(raw, "base64");
  if (b64.length === 32) return b64;
  const hex = Buffer.from(raw, "hex");
  if (hex.length === 32) return hex;
  throw new BadRequestException("GMAIL_TOKEN_ENCRYPTION_KEY must be 32 bytes (base64 or hex)");
}

export function encryptJson(value: unknown): string {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const plaintext = Buffer.from(JSON.stringify(value ?? null), "utf8");
  const enc = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${tag.toString("base64")}.${enc.toString("base64")}`;
}

export function decryptJson<T = any>(blob: string | null | undefined): T | null {
  if (!blob) return null;
  const [ivB64, tagB64, dataB64] = blob.split(".");
  if (!ivB64 || !tagB64 || !dataB64) throw new BadRequestException("Invalid encrypted token blob");
  const key = getKey();
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const data = Buffer.from(dataB64, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  return JSON.parse(plaintext) as T;
}

