import { PropertiesService } from "../src/modules/catalog/properties/properties.service";
import { ListingsService } from "../src/modules/catalog/listings/listings.service";
import { UserRole } from "@prisma/client";

describe("Catalog tenant scoping", () => {
  test("PropertiesService.list always filters deletedAt:null and agencyId", async () => {
    const prisma: any = {
      contact: {
        findFirst: jest.fn().mockResolvedValue({ id: "owner-1" }),
      },
      property: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    };

    const svc = new PropertiesService(prisma);
    await svc.list({
      agencyId: "agency-1",
      actor: { membershipId: "m-1", role: UserRole.OWNER },
      skip: 0,
      take: 10,
      sort: "createdAt",
      q: "main",
    });

    expect(prisma.property.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ agencyId: "agency-1", deletedAt: null }),
      }),
    );
    expect(prisma.property.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ agencyId: "agency-1", deletedAt: null }),
      }),
    );
  });

  test("ListingsService.list always filters deletedAt:null, agencyId, and property.deletedAt:null", async () => {
    const prisma: any = {
      listing: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      property: {
        findFirst: jest.fn().mockResolvedValue({ id: "prop-1" }),
      },
    };

    const svc = new ListingsService(prisma);
    await svc.list({
      agencyId: "agency-1",
      actor: { membershipId: "m-1", role: UserRole.OWNER },
      skip: 0,
      take: 10,
      status: "ACTIVE" as any,
      listingType: "SALE" as any,
      q: "modern",
    });

    expect(prisma.listing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          agencyId: "agency-1",
          deletedAt: null,
          property: expect.objectContaining({ deletedAt: null }),
        }),
      }),
    );
  });

  test("PropertiesService.softDelete only updates non-deleted property for agency", async () => {
    const prisma: any = {
      property: {
        findFirst: jest.fn().mockResolvedValue({ id: "prop-1" }),
        update: jest.fn().mockResolvedValue({ id: "prop-1" }),
      },
    };

    const svc = new PropertiesService(prisma);
    await svc.softDelete({
      agencyId: "agency-1",
      actor: { membershipId: "m-1", role: UserRole.OWNER },
      actorMembershipId: "m-1",
      id: "prop-1",
    });

    expect(prisma.property.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ agencyId: "agency-1", deletedAt: null }) }),
    );
    expect(prisma.property.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "prop-1" },
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      }),
    );
  });
});

