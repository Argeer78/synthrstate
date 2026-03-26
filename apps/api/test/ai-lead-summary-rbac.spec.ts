import { AiService } from "../src/modules/ai/ai.service";
import { UserRole } from "@prisma/client";

describe("AI lead summary RBAC", () => {
  test("Agent A cannot derive summary from Agent B's notes/tasks", async () => {
    const actorA = { agencyId: "agency-1", membershipId: "m-A", role: UserRole.AGENT };

    const prisma: any = {
      lead: {
        findFirst: jest.fn().mockResolvedValue({
          id: "lead-1",
          agencyId: "agency-1",
          status: "NEW",
          title: "Lead title",
          contactId: "contact-1",
          contact: { firstName: "John", lastName: "Doe" },
        }),
      },
      note: {
        findMany: jest.fn().mockImplementation(async ({ where }: any) => {
          const createdBy = where?.createdByMembershipId;
          if (createdBy === "m-A") {
            return [
              {
                content: "Agent A secret note",
                createdAt: new Date("2026-01-01T00:00:00.000Z"),
                leadId: "lead-1",
                contactId: null,
              },
            ];
          }
          // If scoping is missing, we simulate a data leak by returning Agent B note content.
          return [
            {
              content: "Agent B secret note",
              createdAt: new Date("2026-01-02T00:00:00.000Z"),
              leadId: "lead-1",
              contactId: null,
            },
          ];
        }),
      },
      task: {
        findMany: jest.fn().mockImplementation(async ({ where }: any) => {
          const or: any[] = Array.isArray(where?.OR) ? where.OR : [];
          const hasAccessToA =
            or.some((x) => x?.createdByMembershipId === "m-A") || or.some((x) => x?.assignedToMembershipId === "m-A");
          if (hasAccessToA) {
            return [
              {
                title: "Agent A secret task",
                status: "TODO",
                dueAt: new Date("2026-02-01T00:00:00.000Z"),
                createdAt: new Date("2026-01-01T00:00:00.000Z"),
              },
            ];
          }
          // If scoping is missing, return Agent B task content.
          return [
            {
              title: "Agent B secret task",
              status: "TODO",
              dueAt: new Date("2026-02-02T00:00:00.000Z"),
              createdAt: new Date("2026-01-02T00:00:00.000Z"),
            },
          ];
        }),
      },
      aiPromptTemplateVersion: {
        findFirst: jest.fn().mockResolvedValue({
          id: "tpl-1",
          userPromptText: "NOTES={{notesText}}; TASKS={{tasksText}}",
          systemPromptText: "sys",
        }),
      },
      aiLeadSummaryGeneration: {
        create: jest.fn().mockResolvedValue({ id: "gen-1" }),
        update: jest.fn().mockResolvedValue({ id: "gen-1" }),
      },
    };

    const openAiProvider: any = {
      generateJson: jest.fn().mockResolvedValue({
        json: {
          summaryEn: "summary",
          summaryEl: "summary",
          nextActionEn: "next",
          nextActionEl: "next",
        },
      }),
    };

    const svc = new AiService(prisma, openAiProvider);

    await svc.generateLeadSummary({
      agencyId: "agency-1",
      leadId: "lead-1",
      membershipId: "m-A",
      actor: actorA,
      includeInquiries: false,
      maxNotes: 5,
      maxTasks: 5,
    });

    const call = openAiProvider.generateJson.mock.calls[0][0];
    const userPrompt: string = call.userPrompt;

    expect(userPrompt).toContain("Agent A secret note");
    expect(userPrompt).not.toContain("Agent B secret note");
    expect(userPrompt).toContain("Agent A secret task");
    expect(userPrompt).not.toContain("Agent B secret task");
  });

  test("Owner/Manager keep full agency scope for AI summary input", async () => {
    const actorOwner = { agencyId: "agency-1", membershipId: "m-OWNER", role: UserRole.OWNER };

    const prisma: any = {
      lead: {
        findFirst: jest.fn().mockResolvedValue({
          id: "lead-1",
          agencyId: "agency-1",
          status: "NEW",
          title: "Lead title",
          contactId: "contact-1",
          contact: { firstName: "John", lastName: "Doe" },
        }),
      },
      note: {
        findMany: jest.fn().mockImplementation(async ({ where }: any) => {
          // Owner should not be restricted to createdByMembershipId.
          if (!where?.createdByMembershipId) {
            return [
              {
                content: "Agent A secret note",
                createdAt: new Date("2026-01-01T00:00:00.000Z"),
                leadId: "lead-1",
                contactId: null,
              },
              {
                content: "Agent B secret note",
                createdAt: new Date("2026-01-02T00:00:00.000Z"),
                leadId: "lead-1",
                contactId: null,
              },
            ];
          }
          return [];
        }),
      },
      task: {
        findMany: jest.fn().mockImplementation(async ({ where }: any) => {
          // Owner should not be restricted by taskScopeWhere (no OR constraint).
          if (!where?.OR) {
            return [
              {
                title: "Agent A secret task",
                status: "TODO",
                dueAt: new Date("2026-02-01T00:00:00.000Z"),
                createdAt: new Date("2026-01-01T00:00:00.000Z"),
              },
              {
                title: "Agent B secret task",
                status: "TODO",
                dueAt: new Date("2026-02-02T00:00:00.000Z"),
                createdAt: new Date("2026-01-02T00:00:00.000Z"),
              },
            ];
          }
          return [];
        }),
      },
      aiPromptTemplateVersion: {
        findFirst: jest.fn().mockResolvedValue({
          id: "tpl-1",
          userPromptText: "NOTES={{notesText}}; TASKS={{tasksText}}",
          systemPromptText: "sys",
        }),
      },
      aiLeadSummaryGeneration: {
        create: jest.fn().mockResolvedValue({ id: "gen-1" }),
        update: jest.fn().mockResolvedValue({ id: "gen-1" }),
      },
    };

    const openAiProvider: any = {
      generateJson: jest.fn().mockResolvedValue({
        json: {
          summaryEn: "summary",
          summaryEl: "summary",
          nextActionEn: "next",
          nextActionEl: "next",
        },
      }),
    };

    const svc = new AiService(prisma, openAiProvider);

    await svc.generateLeadSummary({
      agencyId: "agency-1",
      leadId: "lead-1",
      membershipId: "m-OWNER",
      actor: actorOwner,
      includeInquiries: false,
      maxNotes: 5,
      maxTasks: 5,
    });

    const call = openAiProvider.generateJson.mock.calls[0][0];
    const userPrompt: string = call.userPrompt;

    expect(userPrompt).toContain("Agent A secret note");
    expect(userPrompt).toContain("Agent B secret note");
    expect(userPrompt).toContain("Agent A secret task");
    expect(userPrompt).toContain("Agent B secret task");
  });
});

