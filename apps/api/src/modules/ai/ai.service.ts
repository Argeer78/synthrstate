import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { OpenAiProvider } from "./providers/openai.provider";
import { AiGenerationStatus, AiGenerationType, AiTone } from "@prisma/client";
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
    tone: AiTone;
    listingOverride?: { title?: string; descriptionEn?: string; descriptionEl?: string };
  }) {
    const listing = await this.prisma.listing.findFirst({
      where: {
        id: params.listingId,
        agencyId: params.agencyId,
        deletedAt: null,
        property: { deletedAt: null },
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
      where: { id: generation.listingId, agencyId: params.agencyId, deletedAt: null, property: { deletedAt: null } },
      select: { id: true },
    });
    if (!listing) throw new NotFoundException("Listing not found");

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

  async getGeneration(params: { agencyId: string; generationId: string }) {
    const generation = await this.prisma.aiListingDescriptionGeneration.findFirst({
      where: { id: params.generationId, agencyId: params.agencyId },
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
    maxNotes?: number;
    maxTasks?: number;
    includeInquiries?: boolean;
  }) {
    const lead = await this.prisma.lead.findFirst({
      where: { id: params.leadId, agencyId: params.agencyId },
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
        },
        orderBy: { createdAt: "desc" },
        take: params.maxNotes ?? 10,
        select: { content: true, createdAt: true, leadId: true, contactId: true },
      }),
      this.prisma.task.findMany({
        where: { agencyId: params.agencyId, leadId: lead.id },
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

  async getLeadSummaryGeneration(params: { agencyId: string; generationId: string }) {
    const generation = await this.prisma.aiLeadSummaryGeneration.findFirst({
      where: { id: params.generationId, agencyId: params.agencyId },
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
    limit?: number;
    preferencesOverride?: BuyerPreferencesOverrideDto;
  }) {
    const lead = await this.prisma.lead.findFirst({
      where: { id: params.buyerLeadId, agencyId: params.agencyId },
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
    const where: any = {
      agencyId: params.agencyId,
      status: "ACTIVE",
      deletedAt: null,
      property: { deletedAt: null },
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

  async getBuyerMatchGeneration(params: { agencyId: string; generationId: string }) {
    const generation = await this.prisma.aiBuyerPropertyMatchGeneration.findFirst({
      where: { id: params.generationId, agencyId: params.agencyId },
      include: {
        recommendations: {
          include: { listing: { select: { id: true, slug: true, title: true, listingType: true, price: true } } },
        },
      },
    });
    if (!generation) throw new NotFoundException("Generation not found");
    return generation;
  }
}

