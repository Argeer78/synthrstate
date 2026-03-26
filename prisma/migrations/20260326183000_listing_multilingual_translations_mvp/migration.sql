-- Multilingual listing content + language-aware publication
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TranslationSource') THEN
    CREATE TYPE "TranslationSource" AS ENUM ('AI', 'HUMAN');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TranslationReviewStatus') THEN
    CREATE TYPE "TranslationReviewStatus" AS ENUM ('DRAFT', 'REVIEWED', 'APPROVED');
  END IF;
END
$$;

ALTER TABLE "Listing"
  ADD COLUMN IF NOT EXISTS "originalLanguageCode" VARCHAR(8) NOT NULL DEFAULT 'en';

ALTER TABLE "ListingPublication"
  ADD COLUMN IF NOT EXISTS "languageCode" VARCHAR(8) NOT NULL DEFAULT 'en';

CREATE TABLE IF NOT EXISTS "ListingContentTranslation" (
  "id" TEXT NOT NULL,
  "agencyId" TEXT NOT NULL,
  "listingId" TEXT NOT NULL,
  "languageCode" VARCHAR(8) NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "shortDescription" TEXT,
  "translatedBy" "TranslationSource" NOT NULL DEFAULT 'AI',
  "translatedAt" TIMESTAMP(3),
  "reviewStatus" "TranslationReviewStatus" NOT NULL DEFAULT 'DRAFT',
  "reviewedAt" TIMESTAMP(3),
  "reviewedByMembershipId" TEXT,
  "createdByMembershipId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ListingContentTranslation_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ListingContentTranslation_agencyId_fkey'
  ) THEN
    ALTER TABLE "ListingContentTranslation"
      ADD CONSTRAINT "ListingContentTranslation_agencyId_fkey"
      FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ListingContentTranslation_listingId_fkey'
  ) THEN
    ALTER TABLE "ListingContentTranslation"
      ADD CONSTRAINT "ListingContentTranslation_listingId_fkey"
      FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS "ListingContentTranslation_agencyId_listingId_languageCode_key"
  ON "ListingContentTranslation"("agencyId", "listingId", "languageCode");
CREATE INDEX IF NOT EXISTS "ListingContentTranslation_agencyId_listingId_languageCode_idx"
  ON "ListingContentTranslation"("agencyId", "listingId", "languageCode");
CREATE INDEX IF NOT EXISTS "ListingContentTranslation_agencyId_languageCode_reviewStatus_idx"
  ON "ListingContentTranslation"("agencyId", "languageCode", "reviewStatus");

DROP INDEX IF EXISTS "ListingPublication_agencyId_channelId_listingId_key";
CREATE UNIQUE INDEX IF NOT EXISTS "ListingPublication_agencyId_channelId_listingId_languageCode_key"
  ON "ListingPublication"("agencyId", "channelId", "listingId", "languageCode");

