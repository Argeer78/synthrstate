import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import type { ActorScope } from "../auth/rbac-query.util";
import { UserRole, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { CreateTeamMemberDto } from "./dto/create-team-member.dto";
import { UpdateTeamMemberDto } from "./dto/update-team-member.dto";

type TeamMember = {
  membershipId: string;
  userId: string;
  email: string;
  fullName: string | null;
  role: UserRole;
  status: UserStatus;
  joinedAt: string;
  createdAt: string;
};

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: { agencyId: string; actor: ActorScope; skip: number; take: number }) {
    const memberships = await this.prisma.agencyMembership.findMany({
      where: { agencyId: params.agencyId },
      orderBy: { createdAt: "desc" },
      skip: params.skip,
      take: params.take,
      include: { user: { select: { id: true, email: true, fullName: true, status: true, createdAt: true } } },
    });

    return {
      items: memberships.map((m) => ({
        membershipId: m.id,
        userId: m.userId,
        email: m.user.email,
        fullName: m.user.fullName,
        role: m.role,
        status: m.user.status,
        joinedAt: m.createdAt.toISOString(),
        createdAt: m.user.createdAt.toISOString(),
      })) satisfies TeamMember[],
      total: memberships.length, // MVP: pageInfo not critical
    };
  }

  async create(params: { agencyId: string; actor: ActorScope; actorMembershipId: string; data: CreateTeamMemberDto }) {
    const email = params.data.email.trim().toLowerCase();
    if (params.actor.role === UserRole.MANAGER && params.data.role === UserRole.OWNER) {
      throw new ForbiddenException("Managers cannot create OWNER users");
    }
    if (params.actor.role === UserRole.MANAGER && !(params.data.role === UserRole.AGENT || params.data.role === UserRole.STAFF)) {
      throw new ForbiddenException("Managers can only create AGENT or STAFF users");
    }

    return this.prisma.$transaction(async (tx) => {
      let user = await tx.user.findUnique({
        where: { email },
      });

      const passwordHash = await bcrypt.hash(params.data.password, 12);
      if (!user) {
        user = await tx.user.create({
          data: {
            email,
            fullName: params.data.fullName?.trim() || null,
            passwordHash,
            status: UserStatus.ACTIVE,
          },
        });
      } else {
        // MVP: reset password on manual create attempt
        user = await tx.user.update({
          where: { id: user.id },
          data: {
            fullName: params.data.fullName?.trim() || user.fullName,
            passwordHash,
            status: UserStatus.ACTIVE,
          },
        });
      }

      // Ensure membership exists and role is set
      const existingMembership = await tx.agencyMembership.findFirst({
        where: { agencyId: params.agencyId, userId: user.id },
      });

      const membership = existingMembership
        ? await tx.agencyMembership.update({
            where: { id: existingMembership.id },
            data: { role: params.data.role },
          })
        : await tx.agencyMembership.create({
            data: {
              agencyId: params.agencyId,
              userId: user.id,
              role: params.data.role,
            },
          });

      return {
        membershipId: membership.id,
        userId: membership.userId,
        email,
        fullName: user.fullName ?? null,
        role: membership.role,
        status: UserStatus.ACTIVE,
        joinedAt: membership.createdAt.toISOString(),
        createdAt: user.createdAt.toISOString(),
      };
    });
  }

  async update(params: { agencyId: string; actor: ActorScope; actorMembershipId: string; membershipId: string; data: UpdateTeamMemberDto }) {
    const membership = await this.prisma.agencyMembership.findFirst({
      where: { id: params.membershipId, agencyId: params.agencyId },
      include: { user: { select: { id: true, status: true, createdAt: true } } },
    });
    if (!membership) throw new NotFoundException("User not found");

    // Safety: managers cannot edit OWNER users or promote to OWNER
    if (params.actor.role === UserRole.MANAGER) {
      if (membership.role === UserRole.OWNER) throw new ForbiddenException("Managers cannot edit OWNER users");
      if (params.data.role === UserRole.OWNER) throw new ForbiddenException("Managers cannot promote to OWNER");
      if (params.data.role != null && !(params.data.role === UserRole.AGENT || params.data.role === UserRole.STAFF)) {
        throw new ForbiddenException("Managers can only assign AGENT or STAFF roles");
      }
    }

    // Safety: OWNER deactivation requires explicit force
    if (params.data.status === UserStatus.DISABLED && membership.id === params.actorMembershipId) {
      if (params.actor.role === UserRole.OWNER && params.data.force !== true) {
        throw new ForbiddenException("Deactivating your own account requires force: true");
      }
      if (params.actor.role === UserRole.MANAGER && params.data.force !== true) {
        // MVP safeguard (even though managers can’t fully manage OWNERs)
        throw new ForbiddenException("Deactivating your own account requires force: true");
      }
    }

    return this.prisma.$transaction(async (tx) => {
      if (params.data.role != null) {
        await tx.agencyMembership.update({
          where: { id: membership.id },
          data: { role: params.data.role },
        });
      }
      if (params.data.status != null) {
        await tx.user.update({
          where: { id: membership.userId },
          data: { status: params.data.status },
        });
      }

      const updated = await tx.agencyMembership.findFirst({
        where: { id: membership.id },
        include: { user: { select: { id: true, email: true, fullName: true, status: true, createdAt: true } } },
      });

      if (!updated) throw new NotFoundException("User not found");

      return {
        membershipId: updated.id,
        userId: updated.userId,
        email: updated.user.email,
        fullName: updated.user.fullName,
        role: updated.role,
        status: updated.user.status,
        joinedAt: updated.createdAt.toISOString(),
        createdAt: updated.user.createdAt.toISOString(),
      };
    });
  }

  async resetPassword(params: {
    agencyId: string;
    actor: ActorScope;
    actorMembershipId: string;
    membershipId: string;
    newPassword: string;
    force?: boolean;
  }) {
    const membership = await this.prisma.agencyMembership.findFirst({
      where: { id: params.membershipId, agencyId: params.agencyId },
      include: { user: { select: { id: true, email: true } } },
    });
    if (!membership) throw new NotFoundException("User not found");

    if (params.actor.role === UserRole.MANAGER) {
      if (membership.role === UserRole.OWNER) throw new ForbiddenException("Managers cannot reset OWNER passwords");
      if (!(membership.role === UserRole.AGENT || membership.role === UserRole.STAFF)) {
        throw new ForbiddenException("Managers can only reset AGENT or STAFF passwords");
      }
    }

    if (membership.id === params.actorMembershipId && params.force !== true) {
      throw new ForbiddenException("Resetting your own password via admin requires force: true");
    }

    const passwordHash = await bcrypt.hash(params.newPassword, 12);
    await this.prisma.user.update({
      where: { id: membership.userId },
      data: { passwordHash },
    });

    return { ok: true };
  }
}

