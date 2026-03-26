-- Onboarding wizard MVP
-- Adds optional agency + membership fields to support setup wizard.

ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "descriptionShort" TEXT;
ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "officeAddress" TEXT;
ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "brandColorHex" VARCHAR(16);
ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;
ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "onboardingCompletedAt" TIMESTAMP(3);
ALTER TABLE "Agency" ADD COLUMN IF NOT EXISTS "onboardingDismissedAt" TIMESTAMP(3);

ALTER TABLE "AgencyMembership" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "AgencyMembership" ADD COLUMN IF NOT EXISTS "titleLabel" TEXT;

