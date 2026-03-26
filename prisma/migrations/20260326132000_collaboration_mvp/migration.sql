-- Collaboration MVP
-- Creates enums + tables: Notification, Comment, Attachment

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationType') THEN
    CREATE TYPE "NotificationType" AS ENUM (
      'INQUIRY_RECEIVED',
      'INQUIRY_CONVERTED',
      'LEAD_ASSIGNED',
      'TASK_DUE_SOON',
      'LISTING_PUBLISH_FAILED',
      'MENTION',
      'IMPORTANT_UPDATE'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CommentTargetType') THEN
    CREATE TYPE "CommentTargetType" AS ENUM ('LEAD', 'LISTING', 'TASK');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AttachmentTargetType') THEN
    CREATE TYPE "AttachmentTargetType" AS ENUM ('LEAD', 'LISTING', 'TASK');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT NOT NULL,
  "agencyId" TEXT NOT NULL,
  "membershipId" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT,
  "metadata" JSONB,
  "leadId" TEXT,
  "listingId" TEXT,
  "taskId" TEXT,
  "inquiryId" TEXT,
  "commentId" TEXT,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Comment" (
  "id" TEXT NOT NULL,
  "agencyId" TEXT NOT NULL,
  "targetType" "CommentTargetType" NOT NULL,
  "targetId" TEXT NOT NULL,
  "leadId" TEXT,
  "listingId" TEXT,
  "taskId" TEXT,
  "body" TEXT NOT NULL,
  "mentionedMembershipIds" JSONB,
  "createdByMembershipId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Attachment" (
  "id" TEXT NOT NULL,
  "agencyId" TEXT NOT NULL,
  "targetType" "AttachmentTargetType" NOT NULL,
  "targetId" TEXT NOT NULL,
  "leadId" TEXT,
  "listingId" TEXT,
  "taskId" TEXT,
  "uploadStatus" "MediaUploadStatus" NOT NULL DEFAULT 'UPLOADING',
  "storageKey" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "createdByMembershipId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- Foreign keys (guarded)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Notification_agencyId_fkey') THEN
    ALTER TABLE "Notification" ADD CONSTRAINT "Notification_agencyId_fkey"
      FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Notification_membershipId_fkey') THEN
    ALTER TABLE "Notification" ADD CONSTRAINT "Notification_membershipId_fkey"
      FOREIGN KEY ("membershipId") REFERENCES "AgencyMembership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Notification_leadId_fkey') THEN
    ALTER TABLE "Notification" ADD CONSTRAINT "Notification_leadId_fkey"
      FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Notification_listingId_fkey') THEN
    ALTER TABLE "Notification" ADD CONSTRAINT "Notification_listingId_fkey"
      FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Notification_taskId_fkey') THEN
    ALTER TABLE "Notification" ADD CONSTRAINT "Notification_taskId_fkey"
      FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Notification_inquiryId_fkey') THEN
    ALTER TABLE "Notification" ADD CONSTRAINT "Notification_inquiryId_fkey"
      FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Notification_commentId_fkey') THEN
    ALTER TABLE "Notification" ADD CONSTRAINT "Notification_commentId_fkey"
      FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Comment_agencyId_fkey') THEN
    ALTER TABLE "Comment" ADD CONSTRAINT "Comment_agencyId_fkey"
      FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Comment_createdByMembershipId_fkey') THEN
    ALTER TABLE "Comment" ADD CONSTRAINT "Comment_createdByMembershipId_fkey"
      FOREIGN KEY ("createdByMembershipId") REFERENCES "AgencyMembership"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Comment_leadId_fkey') THEN
    ALTER TABLE "Comment" ADD CONSTRAINT "Comment_leadId_fkey"
      FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Comment_listingId_fkey') THEN
    ALTER TABLE "Comment" ADD CONSTRAINT "Comment_listingId_fkey"
      FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Comment_taskId_fkey') THEN
    ALTER TABLE "Comment" ADD CONSTRAINT "Comment_taskId_fkey"
      FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Attachment_agencyId_fkey') THEN
    ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_agencyId_fkey"
      FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Attachment_createdByMembershipId_fkey') THEN
    ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_createdByMembershipId_fkey"
      FOREIGN KEY ("createdByMembershipId") REFERENCES "AgencyMembership"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Attachment_leadId_fkey') THEN
    ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_leadId_fkey"
      FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Attachment_listingId_fkey') THEN
    ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_listingId_fkey"
      FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Attachment_taskId_fkey') THEN
    ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_taskId_fkey"
      FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS "Notification_agencyId_membershipId_isRead_createdAt_idx" ON "Notification"("agencyId", "membershipId", "isRead", "createdAt");
CREATE INDEX IF NOT EXISTS "Notification_agencyId_membershipId_createdAt_idx" ON "Notification"("agencyId", "membershipId", "createdAt");

CREATE INDEX IF NOT EXISTS "Comment_agencyId_targetType_targetId_createdAt_idx" ON "Comment"("agencyId", "targetType", "targetId", "createdAt");
CREATE INDEX IF NOT EXISTS "Comment_agencyId_leadId_createdAt_idx" ON "Comment"("agencyId", "leadId", "createdAt");
CREATE INDEX IF NOT EXISTS "Comment_agencyId_listingId_createdAt_idx" ON "Comment"("agencyId", "listingId", "createdAt");
CREATE INDEX IF NOT EXISTS "Comment_agencyId_taskId_createdAt_idx" ON "Comment"("agencyId", "taskId", "createdAt");

CREATE INDEX IF NOT EXISTS "Attachment_agencyId_targetType_targetId_createdAt_idx" ON "Attachment"("agencyId", "targetType", "targetId", "createdAt");
CREATE INDEX IF NOT EXISTS "Attachment_agencyId_uploadStatus_idx" ON "Attachment"("agencyId", "uploadStatus");

