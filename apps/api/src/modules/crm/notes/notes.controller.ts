import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { TenantGuard } from "../../auth/guards/tenant.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/roles.decorator";
import { ROLES_MUTATE } from "../../auth/rbac.constants";
import { getAuthContext } from "../shared/tenant.req";
import { getPagination } from "../shared/pagination.dto";
import { CreateNoteDto, UpdateNoteDto } from "./dto/note.dto";
import { NoteListQueryDto } from "./dto/note.query.dto";
import { NotesService } from "./notes.service";

@Controller("crm/notes")
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class NotesController {
  constructor(private readonly notes: NotesService) {}

  @Post()
  @Roles(...ROLES_MUTATE)
  async create(@Req() req: Request, @Body() dto: CreateNoteDto) {
    const { agencyId, membershipId, role } = getAuthContext(req);
    return this.notes.create({
      agencyId,
      actor: { role, membershipId },
      actorMembershipId: membershipId,
      data: dto,
    });
  }

  @Get()
  async list(@Req() req: Request, @Query() query: NoteListQueryDto) {
    const { agencyId, role, membershipId } = getAuthContext(req);
    const { skip, take, page, pageSize } = getPagination(query);
    const { items, total } = await this.notes.list({
      agencyId,
      actor: { role, membershipId },
      contactId: query.contactId,
      leadId: query.leadId,
      skip,
      take,
    });
    return { items, pageInfo: { page, pageSize, total, hasNextPage: skip + items.length < total } };
  }

  @Get(":id")
  async get(@Req() req: Request, @Param("id") id: string) {
    const { agencyId, role, membershipId } = getAuthContext(req);
    return this.notes.get({ agencyId, actor: { role, membershipId }, id });
  }

  @Patch(":id")
  @Roles(...ROLES_MUTATE)
  async update(@Req() req: Request, @Param("id") id: string, @Body() dto: UpdateNoteDto) {
    const { agencyId, membershipId, role } = getAuthContext(req);
    return this.notes.update({
      agencyId,
      actor: { role, membershipId },
      actorMembershipId: membershipId,
      id,
      content: dto.content,
    });
  }

  @Delete(":id")
  @Roles(...ROLES_MUTATE)
  async delete(@Req() req: Request, @Param("id") id: string) {
    const { agencyId, membershipId, role } = getAuthContext(req);
    return this.notes.delete({ agencyId, actor: { role, membershipId }, actorMembershipId: membershipId, id });
  }
}

