import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { TenantGuard } from "../../auth/guards/tenant.guard";
import { getAuthContext } from "../shared/tenant.req";
import { getPagination } from "../shared/pagination.dto";
import { CreateNoteDto, UpdateNoteDto } from "./dto/note.dto";
import { NoteListQueryDto } from "./dto/note.query.dto";
import { NotesService } from "./notes.service";

@Controller("crm/notes")
@UseGuards(JwtAuthGuard, TenantGuard)
export class NotesController {
  constructor(private readonly notes: NotesService) {}

  @Post()
  async create(@Req() req: Request, @Body() dto: CreateNoteDto) {
    const { agencyId, membershipId } = getAuthContext(req);
    return this.notes.create({ agencyId, actorMembershipId: membershipId, data: dto });
  }

  @Get()
  async list(@Req() req: Request, @Query() query: NoteListQueryDto) {
    const { agencyId } = getAuthContext(req);
    const { skip, take, page, pageSize } = getPagination(query);
    const { items, total } = await this.notes.list({
      agencyId,
      contactId: query.contactId,
      leadId: query.leadId,
      skip,
      take,
    });
    return { items, pageInfo: { page, pageSize, total, hasNextPage: skip + items.length < total } };
  }

  @Get(":id")
  async get(@Req() req: Request, @Param("id") id: string) {
    const { agencyId } = getAuthContext(req);
    return this.notes.get({ agencyId, id });
  }

  @Patch(":id")
  async update(@Req() req: Request, @Param("id") id: string, @Body() dto: UpdateNoteDto) {
    const { agencyId, membershipId } = getAuthContext(req);
    return this.notes.update({ agencyId, actorMembershipId: membershipId, id, content: dto.content });
  }

  @Delete(":id")
  async delete(@Req() req: Request, @Param("id") id: string) {
    const { agencyId, membershipId } = getAuthContext(req);
    return this.notes.delete({ agencyId, actorMembershipId: membershipId, id });
  }
}

