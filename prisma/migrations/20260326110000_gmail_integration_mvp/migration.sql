-- Gmail integration MVP
-- Creates: GmailConnection, GmailThread, GmailMessage
-- Safe to run on an existing schema; does not modify existing tables.

CREATE TABLE IF NOT EXISTS "GmailConnection" (
  "id" TEXT NOT NULL,
  "agencyId" TEXT NOT NULL,
  "membershipId" TEXT NOT NULL,
  "gmailUserEmail" TEXT NOT NULL,
  "accessTokenEnc" TEXT,
  "refreshTokenEnc" TEXT,
  "tokenExpiryAt" TIMESTAMP(3),
  "scope" TEXT,
  "gmailHistoryId" TEXT,
  "lastSyncedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "GmailConnection_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'GmailConnection_membershipId_key') THEN
    ALTER TABLE "GmailConnection" ADD CONSTRAINT "GmailConnection_membershipId_key" UNIQUE ("membershipId");
  END IF;
END $$;

-- FKs
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'GmailConnection_agencyId_fkey') THEN
    ALTER TABLE "GmailConnection"
      ADD CONSTRAINT "GmailConnection_agencyId_fkey"
      FOREIGN KEY ("agencyId") REFERENCES "Agency"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'GmailConnection_membershipId_fkey') THEN
    ALTER TABLE "GmailConnection"
      ADD CONSTRAINT "GmailConnection_membershipId_fkey"
      FOREIGN KEY ("membershipId") REFERENCES "AgencyMembership"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS "GmailConnection_agencyId_gmailUserEmail_idx" ON "GmailConnection"("agencyId", "gmailUserEmail");
CREATE INDEX IF NOT EXISTS "GmailConnection_agencyId_membershipId_idx" ON "GmailConnection"("agencyId", "membershipId");


CREATE TABLE IF NOT EXISTS "GmailThread" (
  "id" TEXT NOT NULL,
  "agencyId" TEXT NOT NULL,
  "membershipId" TEXT NOT NULL,
  "connectionId" TEXT NOT NULL,
  "gmailThreadId" TEXT NOT NULL,
  "subject" TEXT,
  "snippet" TEXT,
  "fromEmail" TEXT,
  "toEmails" JSONB,
  "contactId" TEXT,
  "leadId" TEXT,
  "listingId" TEXT,
  "lastMessageAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "GmailThread_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'GmailThread_agencyId_gmailThreadId_membershipId_key') THEN
    ALTER TABLE "GmailThread"
      ADD CONSTRAINT "GmailThread_agencyId_gmailThreadId_membershipId_key"
      UNIQUE ("agencyId", "gmailThreadId", "membershipId");
  END IF;
END $$;

-- FKs
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'GmailThread_agencyId_fkey') THEN
    ALTER TABLE "GmailThread"
      ADD CONSTRAINT "GmailThread_agencyId_fkey"
      FOREIGN KEY ("agencyId") REFERENCES "Agency"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'GmailThread_membershipId_fkey') THEN
    ALTER TABLE "GmailThread"
      ADD CONSTRAINT "GmailThread_membershipId_fkey"
      FOREIGN KEY ("membershipId") REFERENCES "AgencyMembership"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'GmailThread_connectionId_fkey') THEN
    ALTER TABLE "GmailThread"
      ADD CONSTRAINT "GmailThread_connectionId_fkey"
      FOREIGN KEY ("connectionId") REFERENCES "GmailConnection"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'GmailThread_contactId_fkey') THEN
    ALTER TABLE "GmailThread"
      ADD CONSTRAINT "GmailThread_contactId_fkey"
      FOREIGN KEY ("contactId") REFERENCES "Contact"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'GmailThread_leadId_fkey') THEN
    ALTER TABLE "GmailThread"
      ADD CONSTRAINT "GmailThread_leadId_fkey"
      FOREIGN KEY ("leadId") REFERENCES "Lead"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'GmailThread_listingId_fkey') THEN
    ALTER TABLE "GmailThread"
      ADD CONSTRAINT "GmailThread_listingId_fkey"
      FOREIGN KEY ("listingId") REFERENCES "Listing"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS "GmailThread_agencyId_membershipId_lastMessageAt_idx" ON "GmailThread"("agencyId", "membershipId", "lastMessageAt");
CREATE INDEX IF NOT EXISTS "GmailThread_agencyId_contactId_lastMessageAt_idx" ON "GmailThread"("agencyId", "contactId", "lastMessageAt");
CREATE INDEX IF NOT EXISTS "GmailThread_agencyId_leadId_lastMessageAt_idx" ON "GmailThread"("agencyId", "leadId", "lastMessageAt");


CREATE TABLE IF NOT EXISTS "GmailMessage" (
  "id" TEXT NOT NULL,
  "agencyId" TEXT NOT NULL,
  "membershipId" TEXT NOT NULL,
  "threadId" TEXT NOT NULL,
  "gmailMessageId" TEXT NOT NULL,
  "internalDate" TIMESTAMP(3),
  "fromEmail" TEXT,
  "toEmails" JSONB,
  "subject" TEXT,
  "snippet" TEXT,
  "bodyText" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "GmailMessage_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'GmailMessage_agencyId_gmailMessageId_membershipId_key') THEN
    ALTER TABLE "GmailMessage"
      ADD CONSTRAINT "GmailMessage_agencyId_gmailMessageId_membershipId_key"
      UNIQUE ("agencyId", "gmailMessageId", "membershipId");
  END IF;
END $$;

-- FKs
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'GmailMessage_agencyId_fkey') THEN
    ALTER TABLE "GmailMessage"
      ADD CONSTRAINT "GmailMessage_agencyId_fkey"
      FOREIGN KEY ("agencyId") REFERENCES "Agency"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'GmailMessage_membershipId_fkey') THEN
    ALTER TABLE "GmailMessage"
      ADD CONSTRAINT "GmailMessage_membershipId_fkey"
      FOREIGN KEY ("membershipId") REFERENCES "AgencyMembership"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'GmailMessage_threadId_fkey') THEN
    ALTER TABLE "GmailMessage"
      ADD CONSTRAINT "GmailMessage_threadId_fkey"
      FOREIGN KEY ("threadId") REFERENCES "GmailThread"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS "GmailMessage_agencyId_membershipId_internalDate_idx" ON "GmailMessage"("agencyId", "membershipId", "internalDate");
CREATE INDEX IF NOT EXISTS "GmailMessage_agencyId_threadId_internalDate_idx" ON "GmailMessage"("agencyId", "threadId", "internalDate");

