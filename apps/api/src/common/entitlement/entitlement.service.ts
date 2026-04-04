import { ForbiddenException, Injectable } from "@nestjs/common";
import { AgencySubscriptionStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class EntitlementService {
  private readonly superadminEmails: Set<string>;

  constructor(private readonly prisma: PrismaService) {
    const raw = [
      process.env.SUPERADMIN_EMAILS,
      process.env.SUPERADMIN_EMAIL,
      // Convenience: treat PRIMARY_OWNER_EMAIL as superadmin when set (for demo/ops).
      process.env.PRIMARY_OWNER_EMAIL,
    ]
      .filter(Boolean)
      .join(",");
    this.superadminEmails = new Set(
      raw
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
    );
  }

  /** Platform operator bypass (subscription / mutation gate). */
  isSuperadminEmail(email: string | null | undefined): boolean {
    const e = email?.trim().toLowerCase();
    return Boolean(e && this.superadminEmails.has(e));
  }

  /**
   * Throws if agency cannot perform write operations (mutations).
   */
  async assertAgencyCanMutate(params: { agencyId: string; userEmail?: string | null }): Promise<void> {
    const email = params.userEmail?.trim().toLowerCase();
    if (email && this.superadminEmails.has(email)) return;

    const row = await this.prisma.agencySubscription.findUnique({
      where: { agencyId: params.agencyId },
      select: { status: true, trialEndsAt: true, currentPeriodEnd: true },
    });

    if (!row) {
      throw new ForbiddenException({
        code: "SUBSCRIPTION_REQUIRED",
        message: "No subscription for this workspace. Complete billing setup to continue.",
      });
    }

    const now = new Date();

    if (row.status === AgencySubscriptionStatus.TRIALING) {
      const end = row.trialEndsAt ?? row.currentPeriodEnd;
      if (end && end > now) return;
      throw new ForbiddenException({
        code: "TRIAL_ENDED",
        message: "Trial has ended. Upgrade your plan to continue.",
      });
    }

    if (row.status === AgencySubscriptionStatus.ACTIVE) return;

    throw new ForbiddenException({
      code: "SUBSCRIPTION_INACTIVE",
      message: "Workspace is read-only until billing is active.",
    });
  }
}
