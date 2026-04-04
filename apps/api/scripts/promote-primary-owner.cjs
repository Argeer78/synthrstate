/* eslint-disable no-console */
const { PrismaClient, UserRole, UserStatus } = require("@prisma/client");

async function main() {
  const prisma = new PrismaClient();
  try {
    const email = (process.env.PRIMARY_OWNER_EMAIL || "sgouros2305@gmail.com").trim().toLowerCase();
    const agencySlug = (process.env.DEMO_AGENCY_SLUG || "demo-agency").trim();
    const legacyEmailFromEnv = (process.env.LEGACY_DEMO_OWNER_EMAIL || "").trim().toLowerCase();

    if (!email) throw new Error("PRIMARY_OWNER_EMAIL is required");
    if (!agencySlug) throw new Error("DEMO_AGENCY_SLUG is required");

    const agency = await prisma.agency.findUnique({ where: { slug: agencySlug }, select: { id: true, slug: true, name: true } });
    if (!agency) throw new Error(`Agency not found for slug=${agencySlug}`);

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, status: true } });
    if (!user) {
      throw new Error(
        `User not found for email=${email}. Create the user first (signup or invite), then rerun this script.`,
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { status: UserStatus.ACTIVE },
    });

    await prisma.agencyMembership.upsert({
      where: { agencyId_userId: { agencyId: agency.id, userId: user.id } },
      update: { role: UserRole.OWNER },
      create: { agencyId: agency.id, userId: user.id, role: UserRole.OWNER },
    });

    // Safe decommission of old demo owner: disable (do not delete).
    // - If LEGACY_DEMO_OWNER_EMAIL is set, disable that user.
    // - Otherwise, if the historical "owner@demo.local" exists, disable it.
    const candidateLegacyEmails = [
      legacyEmailFromEnv || null,
      "owner@demo.local",
    ].filter(Boolean);

    const legacyEmailsToDisable = candidateLegacyEmails.filter((e) => e && e !== email);
    if (legacyEmailsToDisable.length > 0) {
      await prisma.user.updateMany({
        where: { email: { in: legacyEmailsToDisable } },
        data: { status: UserStatus.DISABLED },
      });
    }

    console.log("OK");
    console.log({
      agency: { id: agency.id, slug: agency.slug, name: agency.name },
      primaryOwnerEmail: email,
      legacyDemoEmailDisabled: legacyEmailsToDisable.length > 0 ? legacyEmailsToDisable : [],
    });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

