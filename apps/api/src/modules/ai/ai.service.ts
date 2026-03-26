import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { OpenAiProvider } from "./providers/openai.provider";
import { AiGenerationStatus, AiGenerationType, AiTone, ListingStatus, TranslationReviewStatus, TranslationSource, UserRole } from "@prisma/client";
import type { ActorScope } from "../auth/rbac-query.util";
import { leadScopeWhere, listingScopeWhere, noteScopeWhere, taskScopeWhere } from "../auth/rbac-query.util";
import type { ApplyGeneratedDescriptionDto } from "./dto/apply-generated-description.dto";
import type { BuyerPreferencesOverrideDto } from "./dto/buyer-match.dto";

function renderTemplate(template: string, context: Record<string, any>): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    const v = context[key];
    if (v === undefined || v === null) return "";
    if (typeof v === "string") return v;
    if (typeof v === "object") return JSON.stringify(v);
    return String(v);
  });
}

function truncate(input: string | undefined | null, maxLen: number) {
  if (!input) return input ?? "";
  const t = input.trim();
  if (t.length <= maxLen) return t;
  return t.slice(0, maxLen).trim();
}

@Injectable()
export class AiService {
  constructor(
    private readonly prisma: PrismaService,
    // production-lean: bind OpenAI directly as the provider for now
    private readonly openAiProvider: OpenAiProvider,
  ) {}

  private toneToTemplateCode(tone: AiTone) {
    const t = tone.toLowerCase();
    return `listing_description.${t}`; // seeded codes
  }

  async generateListingDescription(params: {
    agencyId: string;
    listingId: string;
    membershipId: string;
    actor: ActorScope;
    tone: AiTone;
    listingOverride?: { title?: string; descriptionEn?: string; descriptionEl?: string };
  }) {
    const listing = await this.prisma.listing.findFirst({
      where: {
        id: params.listingId,
        agencyId: params.agencyId,
        deletedAt: null,
        property: { deletedAt: null },
        ...listingScopeWhere(params.actor),
      },
      include: {
        property: {
          select: {
            id: true,
            address: true,
            city: true,
            area: true,
            latitude: true,
            longitude: true,
            energyClass: true,
            features: true,
            ownerContact: {
              select: {
                firstName: true,
                lastName: true,
                organizationName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!listing) throw new NotFoundException("Listing not found");

    if (params.actor.role === UserRole.AGENT && listing.status !== ListingStatus.DRAFT) {
      throw new ForbiddenException("Agents can only generate descriptions for draft listings");
    }

    // Load latest prompt template version for this tone
    const templateVersion = await this.prisma.aiPromptTemplateVersion.findFirst({
      where: {
        agencyId: params.agencyId,
        promptTemplate: { code: this.toneToTemplateCode(params.tone) },
      },
      orderBy: { versionNumber: "desc" },
      include: { promptTemplate: true },
    });

    if (!templateVersion) throw new BadRequestException("Prompt template not found for this tone");

    const features = Array.isArray(listing.property.features) ? (listing.property.features as any[]) : [];
    const featureText = features.slice(0, 12).map((f) => String(f)).join(", ");

    const inputContext = {
      listingTitle: truncate(params.listingOverride?.title ?? listing.title, 140),
      listingType: listing.listingType,
      price: listing.price ?? "",
      currency: listing.currency ?? "",
      bedrooms: listing.bedrooms ?? "",
      bathrooms: listing.bathrooms ?? "",
      sqm: listing.sqm ?? "",
      address: truncate(listing.property.address, 220),
      city: listing.property.city ?? "",
      area: listing.property.area ?? "",
      energyClass: listing.property.energyClass ?? "UNKNOWN",
      features: truncate(featureText, 500),
      tone: params.tone,
    };

    const systemPrompt = templateVersion.systemPromptText ?? undefined;
    const userPrompt = renderTemplate(templateVersion.userPromptText, inputContext);

    const generation = await this.prisma.aiListingDescriptionGeneration.create({
      data: {
        agencyId: params.agencyId,
        listingId: params.listingId,
        tone: params.tone,
        type: AiGenerationType.LISTING_DESCRIPTION,
        status: AiGenerationStatus.RUNNING,
        promptTemplateVersionId: templateVersion.id,
        createdByMembershipId: params.membershipId,
        inputJson: inputContext as any,
        generatedDescriptionEn: null,
        generatedDescriptionEl: null,
      },
    });

    try {
      const result = await this.openAiProvider.generateJson({
        systemPrompt,
        userPrompt,
        providerHint: "openai.chat.completions",
      });

      const raw = result.json ?? {};
      if (typeof raw.en !== "string" || typeof raw.el !== "string") {
        throw new BadRequestException("AI output missing en/el strings");
      }

      const updated = await this.prisma.aiListingDescriptionGeneration.update({
        where: { id: generation.id },
        data: {
          status: AiGenerationStatus.SUCCEEDED,
          generatedDescriptionEn: raw.en.trim(),
          generatedDescriptionEl: raw.el.trim(),
          outputJson: raw as any,
          provider: "openai",
          model: process.env.OPENAI_MODEL ?? null,
          providerRaw: raw as any,
        },
      });

      return updated;
    } catch (e: any) {
      await this.prisma.aiListingDescriptionGeneration.update({
        where: { id: generation.id },
        data: {
          status: AiGenerationStatus.FAILED,
          errorMessage: typeof e?.message === "string" ? e.message : "AI generation failed",
        },
      });
      throw e;
    }
  }

  async applyGeneratedDescription(params: {
    agencyId: string;
    generationId: string;
    membershipId: string;
    role: UserRole;
    dto: ApplyGeneratedDescriptionDto;
  }) {
    const generation = await this.prisma.aiListingDescriptionGeneration.findFirst({
      where: {
        id: params.generationId,
        agencyId: params.agencyId,
      },
      select: {
        id: true,
        listingId: true,
        status: true,
      },
    });

    if (!generation) throw new NotFoundException("Generation not found");
    if (generation.status !== AiGenerationStatus.SUCCEEDED && generation.status !== AiGenerationStatus.EDITED_SAVED) {
      throw new BadRequestException("Generation is not ready to apply");
    }

    // Basic validation checks
    const en = params.dto.descriptionEn.trim();
    const el = params.dto.descriptionEl.trim();
    if (en.length < 20 || el.length < 20) {
      throw new BadRequestException("Descriptions are too short");
    }

    const listing = await this.prisma.listing.findFirst({
      where: {
        id: generation.listingId,
        agencyId: params.agencyId,
        deletedAt: null,
        property: { deletedAt: null },
        ...listingScopeWhere({ role: params.role, membershipId: params.membershipId }),
      },
      select: { id: true, status: true },
    });
    if (!listing) throw new NotFoundException("Listing not found");
    if (
      params.role === UserRole.AGENT &&
      listing.status !== ListingStatus.DRAFT
    ) {
      throw new ForbiddenException("Agents can only apply AI output to draft listings");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.listing.update({
        where: { id: generation.listingId },
        data: {
          description: en,
          descriptionEl: el,
        },
      });

      await tx.aiListingDescriptionGeneration.update({
        where: { id: generation.id },
        data: {
          status: AiGenerationStatus.EDITED_SAVED,
          savedDescriptionEn: en,
          savedDescriptionEl: el,
          savedAt: new Date(),
          savedByMembershipId: params.membershipId,
        },
      });
    });

    return { ok: true };
  }

  async getGeneration(params: { agencyId: string; generationId: string; actor: ActorScope }) {
    const generation = await this.prisma.aiListingDescriptionGeneration.findFirst({
      where: {
        id: params.generationId,
        agencyId: params.agencyId,
        listing: { is: { deletedAt: null, ...listingScopeWhere(params.actor) } },
      },
      include: {
        promptTemplateVersion: {
          include: { promptTemplate: true },
        },
      },
    });
    if (!generation) throw new NotFoundException("Generation not found");
    return generation;
  }

  async generateLeadSummary(params: {
    agencyId: string;
    leadId: string;
    membershipId: string;
    actor: ActorScope;
    maxNotes?: number;
    maxTasks?: number;
    includeInquiries?: boolean;
  }) {
    const lead = await this.prisma.lead.findFirst({
      where: { id: params.leadId, agencyId: params.agencyId, ...leadScopeWhere(params.actor) },
      include: {
        contact: true,
      },
    });

    if (!lead) throw new NotFoundException("Lead not found");

    const [notes, tasks, inquiries] = await Promise.all([
      this.prisma.note.findMany({
        where: {
          agencyId: params.agencyId,
          OR: [{ leadId: lead.id }, { contactId: lead.contactId }],
          ...noteScopeWhere(params.actor),
        },
        orderBy: { createdAt: "desc" },
        take: params.maxNotes ?? 10,
        select: { content: true, createdAt: true, leadId: true, contactId: true },
      }),
      this.prisma.task.findMany({
        where: { agencyId: params.agencyId, leadId: lead.id, ...taskScopeWhere(params.actor) },
        orderBy: { dueAt: "asc", createdAt: "desc" },
        take: params.maxTasks ?? 8,
        select: { title: true, status: true, dueAt: true, createdAt: true },
      }),
      params.includeInquiries
        ? this.prisma.inquiry.findMany({
            where: { agencyId: params.agencyId, leadId: lead.id },
            orderBy: { createdAt: "desc" },
            take: 8,
            select: { status: true, source: true, message: true, createdAt: true },
          })
        : Promise.resolve([]),
    ]);

    const notesText = notes
      .map((n) => {
        const who = n.leadId ? "lead" : "contact";
        const when = n.createdAt ? n.createdAt.toISOString().slice(0, 10) : "";
        return `- (${who}, ${when}) ${truncate(String(n.content), 240)}`;
      })
      .join("\n");

    const tasksText = tasks
      .map((t) => {
        const due = t.dueAt ? new Date(t.dueAt).toISOString().slice(0, 10) : "no-due-date";
        return `- ${t.title} [${t.status}] due:${due}`;
      })
      .join("\n");

    const inquiriesText = (inquiries as any[])
      .map((i) => {
        return `- (${i.source}/${i.status}, ${i.createdAt?.toISOString?.().slice(0, 10) ?? ""}) ${truncate(
          String(i.message ?? ""),
          240,
        )}`;
      })
      .join("\n");

    const templateVersion = await this.prisma.aiPromptTemplateVersion.findFirst({
      where: {
        agencyId: params.agencyId,
        promptTemplate: { code: "lead_summary.standard" },
      },
      orderBy: { versionNumber: "desc" },
      include: { promptTemplate: true },
    });
    if (!templateVersion) throw new BadRequestException("Prompt template not found for lead summary");

    const inputContext = {
      leadTitle: lead.title ?? `${lead.contact.firstName ?? ""} ${lead.contact.lastName ?? ""}`.trim(),
      leadStatus: lead.status,
      contactName: [lead.contact.firstName, lead.contact.lastName].filter(Boolean).join(" "),
      notesText: notesText || "(none)",
      tasksText: tasksText || "(none)",
      inquiriesText: params.includeInquiries ? inquiriesText || "(none)" : "(inquiries omitted)",
    };

    const generation = await this.prisma.aiLeadSummaryGeneration.create({
      data: {
        agencyId: params.agencyId,
        leadId: params.leadId,
        status: AiGenerationStatus.RUNNING,
        type: AiGenerationType.LEAD_SUMMARY,
        promptTemplateVersionId: templateVersion.id,
        createdByMembershipId: params.membershipId,
        inputJson: inputContext as any,
      },
    });

    const userPrompt = renderTemplate(templateVersion.userPromptText, inputContext);
    const systemPrompt = templateVersion.systemPromptText ?? undefined;

    try {
      const result = await this.openAiProvider.generateJson({
        systemPrompt,
        userPrompt,
        providerHint: "openai.chat.completions",
      });

      const raw = result.json ?? {};
      if (
        typeof raw.summaryEn !== "string" ||
        typeof raw.summaryEl !== "string" ||
        typeof raw.nextActionEn !== "string" ||
        typeof raw.nextActionEl !== "string"
      ) {
        throw new BadRequestException("AI output missing lead summary fields");
      }

      const updated = await this.prisma.aiLeadSummaryGeneration.update({
        where: { id: generation.id },
        data: {
          status: AiGenerationStatus.SUCCEEDED,
          outputJson: raw as any,
          generatedSummaryEn: raw.summaryEn.trim(),
          generatedSummaryEl: raw.summaryEl.trim(),
          generatedNextActionEn: raw.nextActionEn.trim(),
          generatedNextActionEl: raw.nextActionEl.trim(),
        },
      });
      return updated;
    } catch (e: any) {
      await this.prisma.aiLeadSummaryGeneration.update({
        where: { id: generation.id },
        data: {
          status: AiGenerationStatus.FAILED,
          errorMessage: typeof e?.message === "string" ? e.message : "AI generation failed",
        },
      });
      throw e;
    }
  }

  async getLeadSummaryGeneration(params: { agencyId: string; generationId: string; actor: ActorScope }) {
    const generation = await this.prisma.aiLeadSummaryGeneration.findFirst({
      where: {
        id: params.generationId,
        agencyId: params.agencyId,
        lead: { is: { ...leadScopeWhere(params.actor) } },
      },
      include: { lead: { select: { id: true, status: true, title: true } } },
    });
    if (!generation) throw new NotFoundException("Generation not found");
    return generation;
  }

  private computeBuyerListingBaseScore(params: {
    buyerPreferences: {
      listingType?: string;
      minPrice?: number;
      maxPrice?: number;
      bedrooms?: number;
      city?: string;
      area?: string;
      preferredFeatures?: string[];
    };
    listing: {
      listingType: string;
      price: number | null;
      bedrooms: number | null;
      city: string | null;
      area: string | null;
      features: any;
    };
  }): { score: number; reasonsEn: string[]; reasonsEl: string[] } {
    const reasonsEn: string[] = [];
    const reasonsEl: string[] = [];

    let score = 0;

    const buyer = params.buyerPreferences;
    const l = params.listing;

    if (buyer.listingType) {
      if (l.listingType === buyer.listingType) {
        score += 40;
        reasonsEn.push(`Type match (${l.listingType})`);
        reasonsEl.push(`Ταυτότητα τύπου: ${l.listingType}`);
      } else {
        reasonsEn.push(`Type mismatch (wanted ${buyer.listingType})`);
        reasonsEl.push(`Τύπος που ζητήθηκε: ${buyer.listingType}`);
      }
    }

    const minPrice = buyer.minPrice;
    const maxPrice = buyer.maxPrice;
    if (typeof minPrice === "number" || typeof maxPrice === "number") {
      if (l.price == null) {
        reasonsEn.push("No price provided");
      } else {
        const price = l.price;
        const inRange =
          (typeof minPrice === "number" ? price >= minPrice : true) &&
          (typeof maxPrice === "number" ? price <= maxPrice : true);
        if (inRange) {
          score += 20;
          reasonsEn.push(`Price fits budget (${price})`);
          reasonsEl.push(`Η τιμή ταιριάζει στον προϋπολογισμό (${price})`);
        } else {
          const dist =
            (typeof minPrice === "number" ? Math.max(0, minPrice - price) : 0) +
            (typeof maxPrice === "number" ? Math.max(0, price - maxPrice) : 0);
          const penalty = Math.min(20, Math.round(dist / 50));
          score += Math.max(0, 20 - penalty);
          reasonsEn.push(`Price somewhat off-range (distance:${dist})`);
          reasonsEl.push(`Η τιμή αποκλίνει (απόσταση:${dist})`);
        }
      }
    }

    if (typeof buyer.bedrooms === "number") {
      if (l.bedrooms != null && l.bedrooms >= buyer.bedrooms) {
        score += 15;
        reasonsEn.push(`Bedrooms >= ${buyer.bedrooms}`);
        reasonsEl.push(`Υπνοδωμάτια >= ${buyer.bedrooms}`);
      } else {
        reasonsEn.push(`Bedrooms below preference`);
        reasonsEl.push(`Λιγότερα υπνοδωμάτια από την προτίμηση`);
      }
    }

    if (buyer.city) {
      const ok = l.city ? l.city.toLowerCase().includes(buyer.city.toLowerCase()) : false;
      if (ok) {
        score += 15;
        reasonsEn.push(`City match (${buyer.city})`);
        reasonsEl.push(`Ταίριασμα πόλης (${buyer.city})`);
      } else {
        reasonsEn.push(`City not matching`);
      }
    }

    if (buyer.area) {
      const ok = l.area ? l.area.toLowerCase() === buyer.area.toLowerCase() : false;
      if (ok) {
        score += 10;
        reasonsEn.push(`Area match (${buyer.area})`);
        reasonsEl.push(`Ταίριασμα περιοχής (${buyer.area})`);
      }
    }

    const preferred = Array.isArray(buyer.preferredFeatures) ? buyer.preferredFeatures : [];
    if (preferred.length > 0) {
      const listingFeatures = Array.isArray(l.features) ? (l.features as any[]).map(String) : [];
      const hits = preferred.filter((f) => listingFeatures.some((lf) => lf.toLowerCase().includes(String(f).toLowerCase())));
      const featureScore = Math.min(10, Math.round((hits.length / Math.max(1, preferred.length)) * 10));
      score += featureScore;
      reasonsEn.push(`Features overlap: ${hits.length}/${preferred.length}`);
      reasonsEl.push(`Επικάλυψη χαρακτηριστικών: ${hits.length}/${preferred.length}`);
    }

    score = Math.max(0, Math.min(100, score));
    return { score, reasonsEn, reasonsEl };
  }

  async generateBuyerPropertyMatch(params: {
    agencyId: string;
    buyerLeadId: string;
    membershipId: string;
    actor: ActorScope;
    limit?: number;
    preferencesOverride?: BuyerPreferencesOverrideDto;
  }) {
    const lead = await this.prisma.lead.findFirst({
      where: { id: params.buyerLeadId, agencyId: params.agencyId, ...leadScopeWhere(params.actor) },
      include: { contact: true },
    });
    if (!lead) throw new NotFoundException("Buyer lead not found");

    const prefs = {
      listingType: params.preferencesOverride?.listingType ?? lead.buyerListingType ?? undefined,
      minPrice:
        typeof params.preferencesOverride?.minPrice === "number"
          ? params.preferencesOverride.minPrice
          : lead.buyerMinPrice != null
            ? Number(lead.buyerMinPrice)
            : undefined,
      maxPrice:
        typeof params.preferencesOverride?.maxPrice === "number"
          ? params.preferencesOverride.maxPrice
          : lead.buyerMaxPrice != null
            ? Number(lead.buyerMaxPrice)
            : undefined,
      bedrooms: params.preferencesOverride?.bedrooms ?? lead.buyerMinBedrooms ?? undefined,
      city: params.preferencesOverride?.city ?? lead.buyerCity ?? undefined,
      area: params.preferencesOverride?.area ?? lead.buyerArea ?? undefined,
      preferredFeatures:
        params.preferencesOverride?.preferredFeatures ??
        (Array.isArray(lead.buyerFeatureKeywords) ? (lead.buyerFeatureKeywords as any) : undefined) ??
        undefined,
    };

    const candidateLimit = Math.min(params.limit ?? 6, 15);
    const shortlistLimit = Math.min(candidateLimit * 3, 30);

    // Candidate selection (published only for now)
    const where: Record<string, unknown> = {
      agencyId: params.agencyId,
      status: "ACTIVE",
      deletedAt: null,
      property: { deletedAt: null },
      ...listingScopeWhere(params.actor),
    };
    if (prefs.listingType) where.listingType = prefs.listingType;
    if (typeof prefs.minPrice === "number" || typeof prefs.maxPrice === "number") {
      where.price = {
        ...(typeof prefs.minPrice === "number" ? { gte: prefs.minPrice } : {}),
        ...(typeof prefs.maxPrice === "number" ? { lte: prefs.maxPrice } : {}),
      };
    }
    if (typeof prefs.bedrooms === "number") where.bedrooms = { gte: prefs.bedrooms };
    if (prefs.city) where.property = { ...(where.property ?? {}), city: { contains: prefs.city, mode: "insensitive" } };
    if (prefs.area) where.property = { ...(where.property ?? {}), area: { equals: prefs.area } };

    const candidates = await this.prisma.listing.findMany({
      where,
      take: shortlistLimit,
      orderBy: { createdAt: "desc" },
      include: {
        property: {
          select: {
            id: true,
            city: true,
            area: true,
            features: true,
          },
        },
      },
    });

    const enriched = candidates.map((l) => {
      const base = this.computeBuyerListingBaseScore({
        buyerPreferences: {
          listingType: prefs.listingType,
          minPrice: prefs.minPrice,
          maxPrice: prefs.maxPrice,
          bedrooms: prefs.bedrooms,
          city: prefs.city,
          area: prefs.area,
          preferredFeatures: prefs.preferredFeatures,
        },
        listing: {
          listingType: l.listingType,
          price: l.price == null ? null : Number(l.price),
          bedrooms: l.bedrooms ?? null,
          city: l.property.city ?? null,
          area: l.property.area ?? null,
          features: l.property.features,
        },
      });
      return {
        listingId: l.id,
        title: l.title,
        listingType: l.listingType,
        price: l.price == null ? null : Number(l.price),
        bedrooms: l.bedrooms,
        city: l.property.city ?? null,
        area: l.property.area ?? null,
        features: Array.isArray(l.property.features) ? l.property.features : [],
        baseScore: base.score,
        baseReasonsEn: base.reasonsEn.slice(0, 4),
        baseReasonsEl: base.reasonsEl.slice(0, 4),
      };
    });

    // Sort by base score before sending to AI
    enriched.sort((a, b) => b.baseScore - a.baseScore);
    const shortlisted = enriched.slice(0, shortlistLimit);

    const templateVersion = await this.prisma.aiPromptTemplateVersion.findFirst({
      where: {
        agencyId: params.agencyId,
        promptTemplate: { code: "buyer_property_match.standard" },
      },
      orderBy: { versionNumber: "desc" },
      include: { promptTemplate: true },
    });
    if (!templateVersion) throw new BadRequestException("Prompt template not found for buyer matching");

    const inputContext = {
      buyerLeadTitle: lead.title ?? "",
      buyerContactName: [lead.contact.firstName, lead.contact.lastName].filter(Boolean).join(" "),
      preferences: prefs,
      candidates: shortlisted,
      limit: candidateLimit,
    };

    const generation = await this.prisma.aiBuyerPropertyMatchGeneration.create({
      data: {
        agencyId: params.agencyId,
        buyerLeadId: params.buyerLeadId,
        status: AiGenerationStatus.RUNNING,
        type: AiGenerationType.BUYER_PROPERTY_MATCH,
        promptTemplateVersionId: templateVersion.id,
        createdByMembershipId: params.membershipId,
        inputJson: inputContext as any,
      },
    });

    const userPrompt = renderTemplate(templateVersion.userPromptText, {
      ...inputContext,
      candidates: shortlisted, // renderTemplate will JSON stringify objects
    });
    const systemPrompt = templateVersion.systemPromptText ?? undefined;

    try {
      const result = await this.openAiProvider.generateJson({
        systemPrompt,
        userPrompt,
        providerHint: "openai.chat.completions",
      });

      const raw = result.json ?? {};
      if (!Array.isArray(raw.results)) throw new BadRequestException("AI output missing results[]");

      // Validate & map
      const candidateById = new Map(shortlisted.map((c) => [c.listingId, c]));
      const parsed = raw.results
        .map((r: any) => {
          const listingId = String(r.listingId ?? "");
          if (!candidateById.has(listingId)) return null;
          const score = Number(r.score);
          if (!Number.isFinite(score)) return null;
          return {
            listingId,
            score: Math.max(0, Math.min(100, Math.round(score))),
            reasonsEn: Array.isArray(r.reasonsEn) ? r.reasonsEn : [],
            reasonsEl: Array.isArray(r.reasonsEl) ? r.reasonsEl : [],
            baseScore: candidateById.get(listingId)?.baseScore ?? null,
          };
        })
        .filter(Boolean) as Array<{
          listingId: string;
          score: number;
          reasonsEn: string[];
          reasonsEl: string[];
          baseScore: number | null;
        }>;

      const final = parsed
        .sort((a, b) => b.score - a.score)
        .slice(0, candidateLimit);

      await this.prisma.$transaction(async (tx) => {
        for (const r of final) {
          await tx.aiBuyerPropertyMatchRecommendation.create({
            data: {
              agencyId: params.agencyId,
              matchGenerationId: generation.id,
              listingId: r.listingId,
              score: r.score,
              reasonsEn: r.reasonsEn,
              reasonsEl: r.reasonsEl,
              baseScore: r.baseScore ?? undefined,
            },
          });
        }

        await tx.aiBuyerPropertyMatchGeneration.update({
          where: { id: generation.id },
          data: {
            status: AiGenerationStatus.SUCCEEDED,
            outputJson: raw as any,
          },
        });
      });

      return {
        generationId: generation.id,
        results: final,
      };
    } catch (e: any) {
      await this.prisma.aiBuyerPropertyMatchGeneration.update({
        where: { id: generation.id },
        data: {
          status: AiGenerationStatus.FAILED,
          errorMessage: typeof e?.message === "string" ? e.message : "AI generation failed",
        },
      });
      throw e;
    }
  }

  async getBuyerMatchGeneration(params: { agencyId: string; generationId: string; actor: ActorScope }) {
    const generation = await this.prisma.aiBuyerPropertyMatchGeneration.findFirst({
      where: {
        id: params.generationId,
        agencyId: params.agencyId,
        buyerLead: { is: { ...leadScopeWhere(params.actor) } },
      },
      include: {
        recommendations: {
          include: { listing: { select: { id: true, slug: true, title: true, listingType: true, price: true } } },
        },
      },
    });
    if (!generation) throw new NotFoundException("Generation not found");
    return generation;
  }

  private async translateListingText(params: {
    sourceLanguage: string;
    targetLanguage: string;
    title: string;
    description: string;
    shortDescription?: string | null;
  }) {
    const systemPrompt =
      "You translate real-estate listing copy. Keep facts/numbers unchanged. Return JSON with keys: title, description, shortDescription.";
    const userPrompt = [
      `Source language: ${params.sourceLanguage}`,
      `Target language: ${params.targetLanguage}`,
      `Title: ${params.title}`,
      `Description: ${params.description}`,
      `ShortDescription: ${params.shortDescription ?? ""}`,
    ].join("\n");

    const result = await this.openAiProvider.generateJson({
      systemPrompt,
      userPrompt,
      providerHint: "openai.chat.completions",
    });
    const raw = result.json ?? {};
    if (typeof raw.title !== "string" || typeof raw.description !== "string") {
      throw new BadRequestException("AI translation output missing required fields");
    }
    return {
      title: raw.title.trim(),
      description: raw.description.trim(),
      shortDescription: typeof raw.shortDescription === "string" ? raw.shortDescription.trim() : null,
    };
  }

  async translateListingContent(params: {
    agencyId: string;
    listingId: string;
    membershipId: string;
    actor: ActorScope;
    targetLanguage: string;
    overwrite: boolean;
  }) {
    const targetLanguage = params.targetLanguage.trim().toLowerCase();
    if (!/^[a-z]{2}(-[a-z]{2})?$/.test(targetLanguage)) throw new BadRequestException("Invalid target language");

    const listing = await this.prisma.listing.findFirst({
      where: {
        id: params.listingId,
        agencyId: params.agencyId,
        deletedAt: null,
        property: { deletedAt: null },
        ...listingScopeWhere(params.actor),
      },
      select: {
        id: true,
        title: true,
        description: true,
        originalLanguageCode: true,
        translations: {
          where: { languageCode: targetLanguage },
          select: { id: true, translatedBy: true },
          take: 1,
        },
      },
    });
    if (!listing) throw new NotFoundException("Listing not found");

    const sourceLanguage = listing.originalLanguageCode || "en";
    if (targetLanguage === sourceLanguage) throw new BadRequestException("Target language equals original language");

    const existing = listing.translations[0];
    if (existing && !params.overwrite && existing.translatedBy === TranslationSource.HUMAN) {
      throw new ForbiddenException("Manual translation exists. Use overwrite to replace it.");
    }
    if (existing && !params.overwrite) {
      return { skipped: true, reason: "Translation already exists", targetLanguage };
    }

    const translated = await this.translateListingText({
      sourceLanguage,
      targetLanguage,
      title: listing.title,
      description: listing.description,
      shortDescription: null,
    });

    const saved = await this.prisma.listingContentTranslation.upsert({
      where: {
        agencyId_listingId_languageCode: {
          agencyId: params.agencyId,
          listingId: listing.id,
          languageCode: targetLanguage,
        },
      },
      create: {
        agencyId: params.agencyId,
        listingId: listing.id,
        languageCode: targetLanguage,
        title: translated.title,
        description: translated.description,
        shortDescription: translated.shortDescription,
        translatedBy: TranslationSource.AI,
        translatedAt: new Date(),
        reviewStatus: TranslationReviewStatus.DRAFT,
        createdByMembershipId: params.membershipId,
      },
      update: {
        title: translated.title,
        description: translated.description,
        shortDescription: translated.shortDescription,
        translatedBy: TranslationSource.AI,
        translatedAt: new Date(),
        reviewStatus: TranslationReviewStatus.DRAFT,
        reviewedAt: null,
        reviewedByMembershipId: null,
      },
    });

    return { skipped: false, item: saved };
  }

  async bulkTranslateListings(params: {
    agencyId: string;
    membershipId: string;
    actor: ActorScope;
    listingIds?: string[];
    allEligible: boolean;
    targetLanguage: string;
    overwrite: boolean;
  }) {
    const whereBase: any = {
      agencyId: params.agencyId,
      deletedAt: null,
      property: { deletedAt: null },
      ...listingScopeWhere(params.actor),
    };
    if (!params.allEligible) {
      if (!params.listingIds || params.listingIds.length === 0) throw new BadRequestException("listingIds required when allEligible is false");
      whereBase.id = { in: params.listingIds };
    }

    const candidates = await this.prisma.listing.findMany({
      where: whereBase,
      select: { id: true },
      take: params.allEligible ? 200 : undefined,
    });

    let translated = 0;
    let skipped = 0;
    const errors: Array<{ listingId: string; error: string }> = [];

    for (const c of candidates) {
      try {
        const result = await this.translateListingContent({
          agencyId: params.agencyId,
          listingId: c.id,
          membershipId: params.membershipId,
          actor: params.actor,
          targetLanguage: params.targetLanguage,
          overwrite: params.overwrite,
        });
        if (result.skipped) skipped += 1;
        else translated += 1;
      } catch (e: any) {
        skipped += 1;
        errors.push({ listingId: c.id, error: typeof e?.message === "string" ? e.message : "Translation failed" });
      }
    }

    return {
      targetLanguage: params.targetLanguage,
      total: candidates.length,
      translated,
      skipped,
      errors: errors.slice(0, 50),
    };
  }

  async generateHelpAssistantAnswer(params: {
    agencyId: string;
    membershipId: string;
    role: UserRole;
    question: string;
    pageHint?: string;
  }) {
    const safeQuestion = truncate(params.question, 1200);
    if (!safeQuestion || safeQuestion.trim().length < 2) {
      throw new BadRequestException("Question is required");
    }

    const roleText = params.role === UserRole.STAFF ? "VIEWER (STAFF)" : params.role;
    const systemPrompt =
      "You are Synthr Admin Assistant. Reply with concise, practical instructions for using the product. " +
      "Do not provide legal/financial claims. Do not invent unavailable features. " +
      "Return JSON with keys: answer, suggestedActions (array of <=3 short strings), relatedPages (array of <=4 route strings).";

    const userPrompt = [
      `Role: ${roleText}`,
      `AgencyId: ${params.agencyId}`,
      params.pageHint ? `Page: ${params.pageHint}` : "",
      "Question:",
      safeQuestion,
      "",
      "Context: Synthr admin includes Home, Listings, CRM, AI, Users, Billing, Integrations/API & Feeds, User Manual, Feedback.",
      "Permissions summary: OWNER full; MANAGER manages AGENT/STAFF and publishes; AGENT works scoped CRM/listings drafts; STAFF is read-only.",
    ]
      .filter(Boolean)
      .join("\n");

    const result = await this.openAiProvider.generateJson({
      systemPrompt,
      userPrompt,
      providerHint: "openai.chat.completions",
    });

    const raw = result.json ?? {};
    const answer = typeof raw.answer === "string" ? raw.answer.trim() : "";
    if (!answer) throw new BadRequestException("AI output missing answer");

    const suggestedActions = Array.isArray(raw.suggestedActions)
      ? raw.suggestedActions.map((x: any) => String(x)).filter(Boolean).slice(0, 3)
      : [];
    const relatedPages = Array.isArray(raw.relatedPages)
      ? raw.relatedPages.map((x: any) => String(x)).filter((x: string) => x.startsWith("/")).slice(0, 4)
      : [];

    return {
      answer,
      suggestedActions,
      relatedPages,
    };
  }
}

