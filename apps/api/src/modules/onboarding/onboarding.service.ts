import { ForbiddenException, Injectable } from "@nestjs/common";
import { AgencySubscriptionStatus, UserRole } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  private assertRole(role: UserRole) {
    if (!(role === UserRole.OWNER || role === UserRole.MANAGER)) throw new ForbiddenException("Only Owner/Manager can run onboarding");
  }

  private normalizeHex(input: string | undefined | null) {
    if (!input) return null;
    const t = input.trim();
    if (t.length === 0) return null;
    return t.startsWith("#") ? t : `#${t}`;
  }

  async getStatus(params: { agencyId: string; membershipId: string; role: UserRole }) {
    this.assertRole(params.role);

    const [agency, membership, checklist] = await Promise.all([
      this.prisma.agency.findUnique({
        where: { id: params.agencyId },
        select: {
          id: true,
          name: true,
          slug: true,
          phone: true,
          email: true,
          descriptionShort: true,
          officeAddress: true,
          brandColorHex: true,
          logoUrl: true,
          onboardingCompletedAt: true,
          onboardingDismissedAt: true,
        },
      }),
      this.prisma.agencyMembership.findUnique({
        where: { id: params.membershipId },
        select: { id: true, role: true, phone: true, titleLabel: true, user: { select: { id: true, fullName: true, email: true } } },
      }),
      this.computeChecklist({ agencyId: params.agencyId, membershipId: params.membershipId }),
    ]);

    const agencyBasicsOk = Boolean(agency?.name && (agency.email || agency.phone));
    const brandingOk = Boolean((agency?.descriptionShort && agency.descriptionShort.trim().length >= 10) || (agency?.officeAddress && agency.officeAddress.trim().length >= 8) || agency?.brandColorHex);
    const adminOk = Boolean(membership?.user?.fullName && (membership.phone || membership.user.email));

    const completed = Boolean(agency?.onboardingCompletedAt) || (agencyBasicsOk && brandingOk && adminOk);
    const dismissed = Boolean(agency?.onboardingDismissedAt);

    return {
      completed,
      dismissed,
      steps: {
        agencyBasicsOk,
        brandingOk,
        adminOk,
      },
      agency,
      membership,
      checklist,
    };
  }

  async updateAgencyBasics(params: { agencyId: string; role: UserRole; name: string; phone?: string; email?: string; logoUrl?: string }) {
    this.assertRole(params.role);
    await this.prisma.agency.update({
      where: { id: params.agencyId },
      data: {
        name: params.name.trim(),
        phone: params.phone?.trim() || null,
        email: params.email?.trim() || null,
        logoUrl: params.logoUrl?.trim() || null,
        onboardingDismissedAt: null,
      },
    });
    return { ok: true };
  }

  async updateBranding(params: { agencyId: string; role: UserRole; descriptionShort?: string; officeAddress?: string; brandColorHex?: string }) {
    this.assertRole(params.role);
    await this.prisma.agency.update({
      where: { id: params.agencyId },
      data: {
        descriptionShort: params.descriptionShort?.trim() || null,
        officeAddress: params.officeAddress?.trim() || null,
        brandColorHex: this.normalizeHex(params.brandColorHex),
        onboardingDismissedAt: null,
      },
    });
    return { ok: true };
  }

  async updateAdminProfile(params: { agencyId: string; membershipId: string; role: UserRole; fullName?: string; phone?: string; titleLabel?: string }) {
    this.assertRole(params.role);

    if (params.fullName && params.fullName.trim().length > 0) {
      const m = await this.prisma.agencyMembership.findUnique({ where: { id: params.membershipId }, select: { userId: true } });
      if (m?.userId) {
        await this.prisma.user.update({ where: { id: m.userId }, data: { fullName: params.fullName.trim() } });
      }
    }

    await this.prisma.agencyMembership.update({
      where: { id: params.membershipId },
      data: {
        phone: params.phone?.trim() || null,
        titleLabel: params.titleLabel?.trim() || null,
      },
    });

    await this.prisma.agency.update({ where: { id: params.agencyId }, data: { onboardingDismissedAt: null } });
    return { ok: true };
  }

  async dismiss(params: { agencyId: string; role: UserRole }) {
    this.assertRole(params.role);
    await this.prisma.agency.update({ where: { id: params.agencyId }, data: { onboardingDismissedAt: new Date() } });
    return { ok: true };
  }

  async complete(params: { agencyId: string; role: UserRole }) {
    this.assertRole(params.role);
    await this.prisma.agency.update({ where: { id: params.agencyId }, data: { onboardingCompletedAt: new Date(), onboardingDismissedAt: null } });
    return { ok: true };
  }

  private async computeChecklist(params: { agencyId: string; membershipId: string }) {
    const [teamCount, listingCount, gmailCount, subCount] = await Promise.all([
      this.prisma.agencyMembership.count({ where: { agencyId: params.agencyId } }),
      this.prisma.listing.count({ where: { agencyId: params.agencyId, deletedAt: null } }),
      this.prisma.gmailConnection.count({ where: { agencyId: params.agencyId } }),
      this.prisma.agencySubscription.count({
        where: { agencyId: params.agencyId, status: { in: [AgencySubscriptionStatus.ACTIVE, AgencySubscriptionStatus.TRIALING] } },
      }),
    ]);

    return {
      firstTeamMemberAdded: teamCount >= 2,
      firstListingCreated: listingCount >= 1,
      gmailConnected: gmailCount >= 1,
      billingConfigured: subCount >= 1,
    };
  }
}

