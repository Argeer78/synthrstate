import { ContactsService } from "../src/modules/crm/contacts/contacts.service";
import { ActivityService } from "../src/modules/crm/timeline/activity.service";
import { UserRole } from "@prisma/client";

describe("CRM tenant scoping", () => {
  test("ContactsService.list always scopes by agencyId", async () => {
    const prisma: any = {
      contact: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    };
    const activity: any = new ActivityService({} as any);

    const svc = new ContactsService(prisma, activity);

    await svc.list({
      agencyId: "agency-1",
      actor: { membershipId: "m-1", role: UserRole.OWNER },
      skip: 0,
      take: 10,
      sort: "createdAt",
      q: "john",
    });

    expect(prisma.contact.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ agencyId: "agency-1" }),
      }),
    );
    expect(prisma.contact.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ agencyId: "agency-1" }),
      }),
    );
  });
});

