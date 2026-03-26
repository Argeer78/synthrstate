import { Body, Controller, Get, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import type { Request } from "express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { GmailService } from "./gmail.service";
import { GmailCreateDraftDto, GmailSyncDto, GmailThreadsQueryDto } from "./dto/gmail.dto";
import { UserRole } from "@prisma/client";
import { getAuthContext } from "../crm/shared/tenant.req";

@Controller("integrations/gmail")
@UseGuards(JwtAuthGuard, RolesGuard)
export class GmailController {
  constructor(private readonly gmail: GmailService) {}

  @Get("connect")
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.AGENT, UserRole.STAFF)
  async connect(@Req() req: Request) {
    const ctx = getAuthContext(req);
    return await this.gmail.getConnectUrl({ agencyId: ctx.agencyId, membershipId: ctx.membershipId });
  }

  // OAuth callback must be reachable by browser. We keep it public but validate state.
  // It redirects back to admin with a flag.
  @Get("callback")
  async callback(@Query("code") code: string, @Query("state") state: string | undefined, @Res() res: Response) {
    if (!code) return res.status(400).send("Missing code");
    const out = await this.gmail.handleCallback({ code, state });
    return res.redirect(out.redirectUrl);
  }

  @Get("status")
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.AGENT, UserRole.STAFF)
  async status(@Req() req: Request) {
    const ctx = getAuthContext(req);
    return await this.gmail.status({ agencyId: ctx.agencyId, membershipId: ctx.membershipId });
  }

  @Post("disconnect")
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.AGENT, UserRole.STAFF)
  async disconnect(@Req() req: Request) {
    const ctx = getAuthContext(req);
    return await this.gmail.disconnect({ agencyId: ctx.agencyId, membershipId: ctx.membershipId });
  }

  @Post("sync")
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.AGENT, UserRole.STAFF)
  async sync(@Req() req: Request, @Body() dto: GmailSyncDto) {
    const ctx = getAuthContext(req);
    const maxThreads = dto.maxThreads ?? 20;
    return await this.gmail.sync({ agencyId: ctx.agencyId, membershipId: ctx.membershipId, maxThreads });
  }

  @Get("threads")
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.AGENT, UserRole.STAFF)
  async threads(@Req() req: Request, @Query() query: GmailThreadsQueryDto) {
    const ctx = getAuthContext(req);
    return await this.gmail.listThreads({
      agencyId: ctx.agencyId,
      membershipId: ctx.membershipId,
      contactId: query.contactId,
      leadId: query.leadId,
    });
  }

  @Get("thread")
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.AGENT, UserRole.STAFF)
  async thread(@Req() req: Request, @Query("id") id: string) {
    const ctx = getAuthContext(req);
    return await this.gmail.getThread({ agencyId: ctx.agencyId, membershipId: ctx.membershipId, threadId: id });
  }

  @Post("thread/summary")
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.AGENT, UserRole.STAFF)
  async summary(@Req() req: Request, @Body() body: { threadId: string }) {
    const ctx = getAuthContext(req);
    return await this.gmail.summarizeThread({ agencyId: ctx.agencyId, membershipId: ctx.membershipId, threadId: body.threadId });
  }

  @Post("thread/suggest-reply")
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.AGENT, UserRole.STAFF)
  async suggestReply(@Req() req: Request, @Body() body: { threadId: string; context?: any }) {
    const ctx = getAuthContext(req);
    return await this.gmail.suggestReply({
      agencyId: ctx.agencyId,
      membershipId: ctx.membershipId,
      threadId: body.threadId,
      context: body.context,
    });
  }

  @Post("thread/create-draft")
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.AGENT, UserRole.STAFF)
  async createDraft(@Req() req: Request, @Body() dto: GmailCreateDraftDto) {
    const ctx = getAuthContext(req);
    // No autonomous send in MVP; drafts only.
    return await this.gmail.createDraft({
      agencyId: ctx.agencyId,
      membershipId: ctx.membershipId,
      to: dto.to,
      subject: dto.subject,
      body: dto.body,
    });
  }
}

