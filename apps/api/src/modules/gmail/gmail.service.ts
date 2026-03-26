import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { google } from "googleapis";
import { PrismaService } from "../../prisma/prisma.service";
import { decryptJson, encryptJson } from "./gmail.crypto";
import { OpenAiProvider } from "../ai/providers/openai.provider";
import { UserRole } from "@prisma/client";

const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.compose",
] as const;

function oauthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new BadRequestException("GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET/GOOGLE_REDIRECT_URI not configured");
  }
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

function extractHeader(headers: any[] | undefined, name: string): string | null {
  const h = (headers ?? []).find((x) => String(x?.name ?? "").toLowerCase() === name.toLowerCase());
  const v = h?.value;
  return typeof v === "string" ? v : null;
}

function pickEmail(addr: string | null | undefined): string | null {
  if (!addr) return null;
  const m = addr.match(/<([^>]+)>/);
  const raw = (m?.[1] ?? addr).trim().toLowerCase();
  return raw.includes("@") ? raw : null;
}

@Injectable()
export class GmailService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly openai: OpenAiProvider,
  ) {}

  async getConnectUrl(params: { agencyId: string; membershipId: string }) {
    const client = oauthClient();
    const state = Buffer.from(JSON.stringify({ agencyId: params.agencyId, membershipId: params.membershipId })).toString("base64url");
    const url = client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: [...GMAIL_SCOPES],
      include_granted_scopes: true,
      state,
    });
    return { url };
  }

  async handleCallback(params: { code: string; state?: string }) {
    const client = oauthClient();
    const tokenResp = await client.getToken(params.code);
    const tokens = tokenResp.tokens;
    if (!tokens.access_token) throw new BadRequestException("Missing access_token from Google");

    const decoded = params.state ? JSON.parse(Buffer.from(params.state, "base64url").toString("utf8")) : null;
    const agencyId = decoded?.agencyId as string | undefined;
    const membershipId = decoded?.membershipId as string | undefined;
    if (!agencyId || !membershipId) throw new BadRequestException("Invalid OAuth state");

    client.setCredentials(tokens);
    const gmail = google.gmail({ version: "v1", auth: client });
    const profile = await gmail.users.getProfile({ userId: "me" });
    const emailAddress = profile.data.emailAddress;
    if (!emailAddress) throw new BadRequestException("Could not read Gmail profile");

    await this.prisma.gmailConnection.upsert({
      where: { membershipId },
      update: {
        agencyId,
        gmailUserEmail: emailAddress,
        accessTokenEnc: encryptJson({ access_token: tokens.access_token }),
        refreshTokenEnc: tokens.refresh_token ? encryptJson({ refresh_token: tokens.refresh_token }) : undefined,
        tokenExpiryAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        scope: tokens.scope ?? GMAIL_SCOPES.join(" "),
        lastSyncedAt: null,
      },
      create: {
        agencyId,
        membershipId,
        gmailUserEmail: emailAddress,
        accessTokenEnc: encryptJson({ access_token: tokens.access_token }),
        refreshTokenEnc: tokens.refresh_token ? encryptJson({ refresh_token: tokens.refresh_token }) : null,
        tokenExpiryAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        scope: tokens.scope ?? GMAIL_SCOPES.join(" "),
      },
    });

    const adminBase = (process.env.ADMIN_APP_URL ?? "https://app.synthrstate.com").replace(/\/$/, "");
    return { redirectUrl: `${adminBase}/crm/?gmail=connected` };
  }

  async disconnect(params: { agencyId: string; membershipId: string }) {
    await this.prisma.gmailConnection.deleteMany({ where: { agencyId: params.agencyId, membershipId: params.membershipId } });
    return { ok: true };
  }

  async status(params: { agencyId: string; membershipId: string }) {
    const conn = await this.prisma.gmailConnection.findFirst({
      where: { agencyId: params.agencyId, membershipId: params.membershipId },
      select: { gmailUserEmail: true, lastSyncedAt: true },
    });
    return { connected: Boolean(conn), gmailUserEmail: conn?.gmailUserEmail ?? null, lastSyncedAt: conn?.lastSyncedAt ?? null };
  }

  private async gmailClientForMembership(params: { agencyId: string; membershipId: string }) {
    const conn = await this.prisma.gmailConnection.findFirst({
      where: { agencyId: params.agencyId, membershipId: params.membershipId },
    });
    if (!conn) throw new NotFoundException("Gmail not connected");

    const client = oauthClient();
    const access = decryptJson<{ access_token: string }>(conn.accessTokenEnc);
    const refresh = decryptJson<{ refresh_token: string }>(conn.refreshTokenEnc);
    client.setCredentials({
      access_token: access?.access_token ?? undefined,
      refresh_token: refresh?.refresh_token ?? undefined,
    });
    return { client, conn };
  }

  async sync(params: { agencyId: string; membershipId: string; maxThreads: number }) {
    const { client, conn } = await this.gmailClientForMembership(params);
    const gmail = google.gmail({ version: "v1", auth: client });

    const list = await gmail.users.threads.list({ userId: "me", maxResults: params.maxThreads, q: "newer_than:30d" });
    const threads = list.data.threads ?? [];

    for (const t of threads) {
      if (!t.id) continue;
      const thread = await gmail.users.threads.get({ userId: "me", id: t.id, format: "metadata", metadataHeaders: ["From", "To", "Subject", "Date"] });
      const messages = thread.data.messages ?? [];
      const last = messages[messages.length - 1];
      const headers = last?.payload?.headers ?? [];
      const subject = extractHeader(headers as any, "Subject");
      const from = pickEmail(extractHeader(headers as any, "From"));
      const toRaw = extractHeader(headers as any, "To");
      const toEmails = (toRaw ?? "")
        .split(",")
        .map((s) => pickEmail(s))
        .filter(Boolean);
      const internalDateMs = last?.internalDate ? Number(last.internalDate) : null;
      const lastAt = internalDateMs ? new Date(internalDateMs) : null;

      // Best-effort contact linking by email (from/to)
      const matchEmail = from ?? toEmails[0] ?? null;
      const contact = matchEmail
        ? await this.prisma.contact.findFirst({ where: { agencyId: params.agencyId, email: matchEmail } })
        : null;

      const upserted = await this.prisma.gmailThread.upsert({
        where: { agencyId_gmailThreadId_membershipId: { agencyId: params.agencyId, gmailThreadId: t.id, membershipId: params.membershipId } },
        update: {
          subject,
          snippet: thread.data.snippet ?? undefined,
          fromEmail: from ?? undefined,
          toEmails: toEmails as any,
          lastMessageAt: lastAt,
          contactId: contact?.id ?? null,
          connectionId: conn.id,
        },
        create: {
          agencyId: params.agencyId,
          membershipId: params.membershipId,
          connectionId: conn.id,
          gmailThreadId: t.id,
          subject,
          snippet: thread.data.snippet ?? undefined,
          fromEmail: from ?? undefined,
          toEmails: toEmails as any,
          lastMessageAt: lastAt,
          contactId: contact?.id ?? null,
        },
      });

      // Store minimal messages: ids + snippet
      for (const m of messages.slice(-10)) {
        if (!m.id) continue;
        const h = m.payload?.headers ?? [];
        const mFrom = pickEmail(extractHeader(h as any, "From"));
        const mToRaw = extractHeader(h as any, "To");
        const mTo = (mToRaw ?? "")
          .split(",")
          .map((s) => pickEmail(s))
          .filter(Boolean);
        const mSubject = extractHeader(h as any, "Subject");
        const ms = m.internalDate ? Number(m.internalDate) : null;

        await this.prisma.gmailMessage.upsert({
          where: { agencyId_gmailMessageId_membershipId: { agencyId: params.agencyId, gmailMessageId: m.id, membershipId: params.membershipId } },
          update: {
            threadId: upserted.id,
            fromEmail: mFrom ?? undefined,
            toEmails: mTo as any,
            subject: mSubject ?? undefined,
            snippet: m.snippet ?? undefined,
            internalDate: ms ? new Date(ms) : null,
          },
          create: {
            agencyId: params.agencyId,
            membershipId: params.membershipId,
            threadId: upserted.id,
            gmailMessageId: m.id,
            fromEmail: mFrom ?? undefined,
            toEmails: mTo as any,
            subject: mSubject ?? undefined,
            snippet: m.snippet ?? undefined,
            internalDate: ms ? new Date(ms) : null,
          },
        });
      }
    }

    await this.prisma.gmailConnection.update({
      where: { membershipId: params.membershipId },
      data: { lastSyncedAt: new Date() },
    });

    return { ok: true, syncedThreads: threads.length };
  }

  async listThreads(params: { agencyId: string; membershipId: string; contactId?: string; leadId?: string }) {
    // Ensure connected
    await this.gmailClientForMembership(params);
    const where: any = { agencyId: params.agencyId, membershipId: params.membershipId };
    if (params.contactId) where.contactId = params.contactId;
    if (params.leadId) where.leadId = params.leadId;
    const items = await this.prisma.gmailThread.findMany({
      where,
      orderBy: { lastMessageAt: "desc" },
      take: 50,
      select: { id: true, gmailThreadId: true, subject: true, snippet: true, fromEmail: true, lastMessageAt: true, contactId: true, leadId: true },
    });
    return { items };
  }

  async getThread(params: { agencyId: string; membershipId: string; threadId: string }) {
    await this.gmailClientForMembership(params);
    const thread = await this.prisma.gmailThread.findFirst({
      where: { id: params.threadId, agencyId: params.agencyId, membershipId: params.membershipId },
    });
    if (!thread) throw new NotFoundException("Thread not found");
    const messages = await this.prisma.gmailMessage.findMany({
      where: { threadId: thread.id, agencyId: params.agencyId, membershipId: params.membershipId },
      orderBy: { internalDate: "asc" },
      select: { id: true, fromEmail: true, toEmails: true, subject: true, snippet: true, internalDate: true, bodyText: true },
    });
    return { thread, messages };
  }

  async summarizeThread(params: { agencyId: string; membershipId: string; threadId: string; leadContext?: any; contactContext?: any; listingContext?: any }) {
    const data = await this.getThread(params);
    const msgText = data.messages
      .map((m) => `From: ${m.fromEmail ?? "—"}\nSnippet: ${m.snippet ?? ""}`)
      .join("\n\n");

    const userPrompt = [
      "Summarize this Gmail thread for a real estate CRM user.",
      "Return strict JSON: { summary: string, keyPoints: string[], nextSteps: string[] }",
      "",
      "Thread:",
      msgText.slice(0, 6000),
    ].join("\n");

    const { json } = await this.openai.generateJson({ userPrompt });
    return json;
  }

  async suggestReply(params: { agencyId: string; membershipId: string; threadId: string; context?: { lead?: any; contact?: any; listing?: any } }) {
    const data = await this.getThread(params);
    const msgText = data.messages
      .slice(-8)
      .map((m) => `From: ${m.fromEmail ?? "—"}\nSnippet: ${m.snippet ?? ""}`)
      .join("\n\n");

    const contextText = params.context ? JSON.stringify(params.context) : "{}";

    const userPrompt = [
      "Draft a professional reply for this real estate email thread.",
      "Use the provided CRM context when helpful.",
      "Return strict JSON: { subject: string, body: string }",
      "",
      "Context:",
      contextText.slice(0, 2000),
      "",
      "Thread:",
      msgText.slice(0, 6000),
    ].join("\n");

    const { json } = await this.openai.generateJson({ userPrompt });
    return json;
  }

  async createDraft(params: { agencyId: string; membershipId: string; to: string; subject: string; body: string }) {
    const { client } = await this.gmailClientForMembership(params);
    const gmail = google.gmail({ version: "v1", auth: client });
    const raw = [
      `To: ${params.to}`,
      `Subject: ${params.subject}`,
      "Content-Type: text/plain; charset=utf-8",
      "",
      params.body,
    ].join("\r\n");
    const encoded = Buffer.from(raw, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const resp = await gmail.users.drafts.create({
      userId: "me",
      requestBody: { message: { raw: encoded } },
    });
    return { ok: true, draftId: resp.data.id ?? null };
  }
}

