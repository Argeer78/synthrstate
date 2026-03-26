import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import type { ActorScope } from "../../auth/rbac-query.util";
import { contactScopeWhere, inquiryScopeWhere } from "../../auth/rbac-query.util";
import { ActivityAction, ActivityEntityType, InquiryStatus, LeadStatus, NotificationType, UserRole } from "@prisma/client";
import { NotificationsService } from "../../collaboration/notifications.service";

@Injectable()
export class InquiriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async list(params: { agencyId: string; actor: ActorScope; skip: number; take: number; leadId?: string }) {
    const where = {
      agencyId: params.agencyId,
      ...inquiryScopeWhere(params.actor),
    } as const;

    const whereAny: any = { ...where };
    if (params.leadId) whereAny.leadId = params.leadId;

    const [items, total] = await Promise.all([
      this.prisma.inquiry.findMany({
        where: whereAny,
        orderBy: { createdAt: "desc" },
        skip: params.skip,
        take: params.take,
        select: {
          id: true,
          status: true,
          source: true,
          name: true,
          email: true,
          phone: true,
          message: true,
          createdAt: true,
          listing: { select: { id: true, title: true, slug: true } },
          leadId: true,
        },
      }),
      this.prisma.inquiry.count({ where: whereAny }),
    ]);

    return { items, total };
  }

  async convert(params: {
    agencyId: string;
    actor: ActorScope;
    actorMembershipId: string;
    inquiryId: string;
  }) {
    const inquiry = await this.prisma.inquiry.findFirst({
      where: {
        id: params.inquiryId,
        agencyId: params.agencyId,
        ...inquiryScopeWhere(params.actor),
      },
      include: {
        listing: { select: { id: true, title: true } },
        lead: { select: { id: true } },
      },
    });
    if (!inquiry) throw new NotFoundException("Inquiry not found");
    if (inquiry.leadId) {
      return { ok: true, inquiryId: inquiry.id, leadId: inquiry.leadId, contactId: inquiry.lead?.id ? null : null, alreadyConverted: true };
    }

    const email = inquiry.email?.trim()?.toLowerCase() || null;
    const phone = inquiry.phone?.trim() || null;

    // Keep MVP constraints consistent with public createInquiry validation.
    if (!email && !phone) throw new BadRequestException("Inquiry has no email or phone to match/create a contact");

    const name = (inquiry.name ?? "").trim();
    const [firstName, ...rest] = name.split(/\s+/).filter(Boolean);
    const lastName = rest.length > 0 ? rest.join(" ") : undefined;

    const canSearchAgencyWide = params.actor.role === UserRole.OWNER || params.actor.role === UserRole.MANAGER;

    const contactWhereBase: any = {
      agencyId: params.agencyId,
      ...(canSearchAgencyWide ? {} : contactScopeWhere(params.actor)),
    };

    let contact = null as any;
    if (email) {
      contact = await this.prisma.contact.findFirst({
        where: { ...contactWhereBase, email },
      });
    }
    if (!contact && phone) {
      contact = await this.prisma.contact.findFirst({
        where: { ...contactWhereBase, phone },
      });
    }

    const createdContact =
      contact ??
      (await this.prisma.contact.create({
        data: {
          agencyId: params.agencyId,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          email: email ?? undefined,
          phone: phone ?? undefined,
          createdByMembershipId: params.actorMembershipId,
        },
      }));

    const lead = await this.prisma.lead.create({
      data: {
        agencyId: params.agencyId,
        contactId: createdContact.id,
        status: LeadStatus.NEW,
        title: inquiry.listing?.title ? `Inquiry: ${inquiry.listing.title}` : "Inquiry",
        assignedToMembershipId: params.actor.role === UserRole.AGENT ? params.actorMembershipId : undefined,
        createdByMembershipId: params.actorMembershipId,
      },
    });

    await this.prisma.activityEvent.create({
      data: {
        agencyId: params.agencyId,
        actorMembershipId: params.actorMembershipId,
        entityType: ActivityEntityType.LEAD,
        entityId: lead.id,
        action: ActivityAction.CREATED,
        leadId: lead.id,
        message: "Lead created from inquiry",
        metadata: { inquiryId: inquiry.id, listingId: inquiry.listing?.id ?? null },
      },
    });

    if (inquiry.message && inquiry.message.trim()) {
      await this.prisma.note.create({
        data: {
          agencyId: params.agencyId,
          leadId: lead.id,
          content: inquiry.message.trim(),
          createdByMembershipId: params.actorMembershipId,
        },
      });
    }

    const updatedInquiry = await this.prisma.inquiry.update({
      where: { id: inquiry.id },
      data: {
        leadId: lead.id,
        status: InquiryStatus.CONVERTED,
      },
      select: { id: true, leadId: true, status: true },
    });

    await this.prisma.activityEvent.create({
      data: {
        agencyId: params.agencyId,
        actorMembershipId: params.actorMembershipId,
        entityType: ActivityEntityType.LEAD,
        entityId: lead.id,
        action: ActivityAction.UPDATED,
        leadId: lead.id,
        message: "Inquiry converted",
        metadata: { inquiryId: inquiry.id },
      },
    });

    // Notify owners/managers + assignee (if any).
    const recipients = await this.prisma.agencyMembership.findMany({
      where: { agencyId: params.agencyId, role: { in: [UserRole.OWNER, UserRole.MANAGER] } },
      select: { id: true },
      take: 50,
    });
    const ids = new Set(recipients.map((r) => r.id));
    if (lead.assignedToMembershipId) ids.add(lead.assignedToMembershipId);
    ids.delete(params.actorMembershipId);
    await Promise.all(
      Array.from(ids).map((membershipId) =>
        this.notifications.create({
          agencyId: params.agencyId,
          membershipId,
          type: NotificationType.INQUIRY_CONVERTED,
          title: "Inquiry converted",
          body: inquiry.listing?.title ? `Converted into lead for ${inquiry.listing.title}` : "Converted into lead",
          inquiryId: inquiry.id,
          leadId: lead.id,
          listingId: inquiry.listing?.id ?? undefined,
        }),
      ),
    );

    return {
      ok: true,
      inquiryId: updatedInquiry.id,
      leadId: updatedInquiry.leadId,
      contactId: createdContact.id,
      alreadyConverted: false,
      reusedContact: Boolean(contact),
    };
  }
}

