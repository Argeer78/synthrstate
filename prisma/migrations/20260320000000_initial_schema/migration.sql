CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'MANAGER', 'AGENT', 'STAFF');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('PERSON', 'ORGANIZATION');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'VIEWING', 'OFFER', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ListingType" AS ENUM ('SALE', 'RENT');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('APARTMENT', 'HOUSE', 'VILLA', 'STUDIO', 'LAND', 'COMMERCIAL', 'PARKING', 'OTHER');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED', 'SOLD', 'RENTED');

-- CreateEnum
CREATE TYPE "TranslationSource" AS ENUM ('AI', 'HUMAN');

-- CreateEnum
CREATE TYPE "TranslationReviewStatus" AS ENUM ('DRAFT', 'REVIEWED', 'APPROVED');

-- CreateEnum
CREATE TYPE "EnergyClass" AS ENUM ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'FLOORPLAN', 'OTHER');

-- CreateEnum
CREATE TYPE "MediaUploadStatus" AS ENUM ('UPLOADING', 'ACTIVE');

-- CreateEnum
CREATE TYPE "NoteTargetType" AS ENUM ('CONTACT', 'LEAD');

-- CreateEnum
CREATE TYPE "ActivityEntityType" AS ENUM ('CONTACT', 'LEAD', 'TASK', 'NOTE');

-- CreateEnum
CREATE TYPE "ActivityAction" AS ENUM ('CREATED', 'UPDATED', 'STATUS_CHANGED', 'ASSIGNED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INQUIRY_RECEIVED', 'INQUIRY_CONVERTED', 'LEAD_ASSIGNED', 'TASK_DUE_SOON', 'LISTING_PUBLISH_FAILED', 'MENTION', 'IMPORTANT_UPDATE');

-- CreateEnum
CREATE TYPE "CommentTargetType" AS ENUM ('LEAD', 'LISTING', 'TASK');

-- CreateEnum
CREATE TYPE "AttachmentTargetType" AS ENUM ('LEAD', 'LISTING', 'TASK');

-- CreateEnum
CREATE TYPE "InquiryPreferredContactMethod" AS ENUM ('EMAIL', 'PHONE', 'CALLBACK', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "InquirySource" AS ENUM ('WEBSITE_FORM', 'IMPORT', 'API');

-- CreateEnum
CREATE TYPE "AiTone" AS ENUM ('STANDARD', 'PREMIUM', 'CONCISE');

-- CreateEnum
CREATE TYPE "AiGenerationType" AS ENUM ('LISTING_DESCRIPTION', 'LEAD_SUMMARY', 'BUYER_PROPERTY_MATCH');

-- CreateEnum
CREATE TYPE "AiGenerationStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'EDITED_SAVED');

-- CreateEnum
CREATE TYPE "AiLeadSummaryTone" AS ENUM ('STANDARD', 'ACTIONABLE');

-- CreateEnum
CREATE TYPE "PublicationChannelType" AS ENUM ('WEBSITE', 'PORTAL', 'EXTRANET');

-- CreateEnum
CREATE TYPE "ListingPublicationStatus" AS ENUM ('QUEUED', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'RETRYING', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PublicationAttemptStatus" AS ENUM ('STARTED', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "SubscriptionPlanCode" AS ENUM ('STARTER', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'UNPAID', 'INCOMPLETE', 'INCOMPLETE_EXPIRED');

-- CreateEnum
CREATE TYPE "StripeWebhookEventType" AS ENUM ('CUSTOMER_SUBSCRIPTION_CREATED', 'CUSTOMER_SUBSCRIPTION_UPDATED', 'CUSTOMER_SUBSCRIPTION_DELETED', 'INVOICE_PAYMENT_FAILED', 'INVOICE_PAID', 'CHECKOUT_SESSION_COMPLETED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "AgencySubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'UNPAID', 'INCOMPLETE', 'INCOMPLETE_EXPIRED');

-- CreateTable
CREATE TABLE "Agency" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "officeCount" INTEGER NOT NULL DEFAULT 1,
    "phone" TEXT,
    "email" TEXT,
    "descriptionShort" TEXT,
    "officeAddress" TEXT,
    "brandColorHex" VARCHAR(16),
    "logoUrl" TEXT,
    "onboardingCompletedAt" TIMESTAMP(3),
    "onboardingDismissedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT,
    "passwordHash" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgencyMembership" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "phone" TEXT,
    "titleLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgencyMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "type" "ContactType" NOT NULL DEFAULT 'PERSON',
    "firstName" TEXT,
    "lastName" TEXT,
    "organizationName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "createdByMembershipId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "title" TEXT,
    "assignedToMembershipId" TEXT,
    "createdByMembershipId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "buyerListingType" "ListingType",
    "buyerMinPrice" DECIMAL(12,2),
    "buyerMaxPrice" DECIMAL(12,2),
    "buyerMinBedrooms" INTEGER,
    "buyerCity" TEXT,
    "buyerArea" TEXT,
    "buyerFeatureKeywords" JSONB,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "dueAt" TIMESTAMP(3),
    "leadId" TEXT,
    "assignedToMembershipId" TEXT,
    "createdByMembershipId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contactId" TEXT,
    "leadId" TEXT,
    "taskId" TEXT,
    "createdByMembershipId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "ownerContactId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT,
    "area" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "energyClass" "EnergyClass" NOT NULL DEFAULT 'UNKNOWN',
    "propertyType" "PropertyType" NOT NULL DEFAULT 'OTHER',
    "features" JSONB,
    "createdByMembershipId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedByMembershipId" TEXT,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "listingType" "ListingType" NOT NULL,
    "status" "ListingStatus" NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "descriptionEl" TEXT,
    "originalLanguageCode" VARCHAR(8) NOT NULL DEFAULT 'en',
    "price" DECIMAL(12,2),
    "currency" VARCHAR(3),
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "sqm" DECIMAL(10,2),
    "createdByMembershipId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedByMembershipId" TEXT,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingContentTranslation" (
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

-- CreateTable
CREATE TABLE "AiPromptTemplate" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiPromptTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiPromptTemplateVersion" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "promptTemplateId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "systemPromptText" TEXT,
    "userPromptText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiPromptTemplateVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiListingDescriptionGeneration" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "tone" "AiTone" NOT NULL,
    "type" "AiGenerationType" NOT NULL DEFAULT 'LISTING_DESCRIPTION',
    "status" "AiGenerationStatus" NOT NULL DEFAULT 'PENDING',
    "promptTemplateVersionId" TEXT NOT NULL,
    "provider" TEXT,
    "model" TEXT,
    "providerRaw" JSONB,
    "inputJson" JSONB,
    "outputJson" JSONB,
    "generatedDescriptionEn" TEXT,
    "generatedDescriptionEl" TEXT,
    "errorMessage" TEXT,
    "savedDescriptionEn" TEXT,
    "savedDescriptionEl" TEXT,
    "savedAt" TIMESTAMP(3),
    "savedByMembershipId" TEXT,
    "createdByMembershipId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiListingDescriptionGeneration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiLeadSummaryGeneration" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "status" "AiGenerationStatus" NOT NULL DEFAULT 'PENDING',
    "type" "AiGenerationType" NOT NULL DEFAULT 'LEAD_SUMMARY',
    "promptTemplateVersionId" TEXT NOT NULL,
    "inputJson" JSONB,
    "outputJson" JSONB,
    "generatedSummaryEn" TEXT,
    "generatedSummaryEl" TEXT,
    "generatedNextActionEn" TEXT,
    "generatedNextActionEl" TEXT,
    "errorMessage" TEXT,
    "createdByMembershipId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiLeadSummaryGeneration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiBuyerPropertyMatchGeneration" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "buyerLeadId" TEXT NOT NULL,
    "status" "AiGenerationStatus" NOT NULL DEFAULT 'PENDING',
    "type" "AiGenerationType" NOT NULL DEFAULT 'BUYER_PROPERTY_MATCH',
    "promptTemplateVersionId" TEXT NOT NULL,
    "inputJson" JSONB,
    "outputJson" JSONB,
    "errorMessage" TEXT,
    "createdByMembershipId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiBuyerPropertyMatchGeneration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiBuyerPropertyMatchRecommendation" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "matchGenerationId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "reasonsEn" JSONB,
    "reasonsEl" JSONB,
    "baseScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiBuyerPropertyMatchRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyInternalNote" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdByMembershipId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyInternalNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingInternalNote" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdByMembershipId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListingInternalNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedByMembershipId" TEXT,
    "mediaType" "MediaType" NOT NULL,
    "uploadStatus" "MediaUploadStatus" NOT NULL DEFAULT 'UPLOADING',
    "storageKey" TEXT NOT NULL,
    "fileName" TEXT,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "listingId" TEXT,
    "propertyId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "createdByMembershipId" TEXT,
    "uploadedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inquiry" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "source" "InquirySource" NOT NULL,
    "status" "InquiryStatus" NOT NULL DEFAULT 'NEW',
    "listingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "message" TEXT,
    "preferredContactMethod" "InquiryPreferredContactMethod",
    "leadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityEvent" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "entityType" "ActivityEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" "ActivityAction" NOT NULL,
    "contactId" TEXT,
    "leadId" TEXT,
    "taskId" TEXT,
    "noteId" TEXT,
    "actorMembershipId" TEXT,
    "message" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "code" "SubscriptionPlanCode" NOT NULL,
    "name" TEXT NOT NULL,
    "currency" TEXT,
    "amountCents" INTEGER,
    "officeAmountCents" INTEGER,
    "seatAmountCents" INTEGER,
    "trialDays" INTEGER,
    "seatLimit" INTEGER NOT NULL,
    "features" JSONB NOT NULL,
    "stripePriceIdMonthly" TEXT,
    "stripePriceIdOfficeMonthly" TEXT,
    "stripePriceIdSeatMonthly" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgencySubscription" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "planCode" "SubscriptionPlanCode" NOT NULL,
    "status" "AgencySubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "currentPeriodEnd" TIMESTAMP(3),
    "trialEndsAt" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "seatGraceEndsAt" TIMESTAMP(3),
    "pendingPlanCode" "SubscriptionPlanCode",
    "pendingSeatLimit" INTEGER,
    "pendingEffectiveAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgencySubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StripeWebhookEvent" (
    "id" TEXT NOT NULL,
    "stripeEventId" TEXT NOT NULL,
    "agencyId" TEXT,
    "subscriptionAgencyId" TEXT,
    "eventType" "StripeWebhookEventType" NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "payload" JSONB NOT NULL,

    CONSTRAINT "StripeWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GmailConnection" (
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

-- CreateTable
CREATE TABLE "GmailThread" (
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

-- CreateTable
CREATE TABLE "GmailMessage" (
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

-- CreateTable
CREATE TABLE "Notification" (
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

-- CreateTable
CREATE TABLE "Comment" (
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

-- CreateTable
CREATE TABLE "Attachment" (
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

-- CreateTable
CREATE TABLE "PublicationChannel" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "channelType" "PublicationChannelType" NOT NULL,
    "code" TEXT NOT NULL,
    "displayName" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicationChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedMapping" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "mappingVersion" INTEGER NOT NULL,
    "adapterCode" TEXT NOT NULL,
    "mapping" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingPublication" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "languageCode" VARCHAR(8) NOT NULL DEFAULT 'en',
    "mappingVersion" INTEGER NOT NULL,
    "status" "ListingPublicationStatus" NOT NULL DEFAULT 'QUEUED',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),
    "sourceListingUpdatedAt" TIMESTAMP(3),
    "externalReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListingPublication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicationLog" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "listingPublicationId" TEXT NOT NULL,
    "attemptNo" INTEGER NOT NULL,
    "status" "PublicationAttemptStatus" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "externalStatusCode" INTEGER,
    "errorMessage" TEXT,
    "requestPayload" JSONB,
    "responsePayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Agency_slug_key" ON "Agency"("slug");

-- CreateIndex
CREATE INDEX "Agency_slug_idx" ON "Agency"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "AgencyMembership_agencyId_role_idx" ON "AgencyMembership"("agencyId", "role");

-- CreateIndex
CREATE INDEX "AgencyMembership_userId_idx" ON "AgencyMembership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AgencyMembership_agencyId_userId_key" ON "AgencyMembership"("agencyId", "userId");

-- CreateIndex
CREATE INDEX "Contact_agencyId_email_idx" ON "Contact"("agencyId", "email");

-- CreateIndex
CREATE INDEX "Contact_agencyId_phone_idx" ON "Contact"("agencyId", "phone");

-- CreateIndex
CREATE INDEX "Contact_agencyId_lastName_idx" ON "Contact"("agencyId", "lastName");

-- CreateIndex
CREATE INDEX "Contact_agencyId_organizationName_idx" ON "Contact"("agencyId", "organizationName");

-- CreateIndex
CREATE INDEX "Contact_agencyId_createdAt_idx" ON "Contact"("agencyId", "createdAt");

-- CreateIndex
CREATE INDEX "Lead_agencyId_status_idx" ON "Lead"("agencyId", "status");

-- CreateIndex
CREATE INDEX "Lead_agencyId_assignedToMembershipId_idx" ON "Lead"("agencyId", "assignedToMembershipId");

-- CreateIndex
CREATE INDEX "Lead_agencyId_contactId_idx" ON "Lead"("agencyId", "contactId");

-- CreateIndex
CREATE INDEX "Lead_agencyId_buyerListingType_idx" ON "Lead"("agencyId", "buyerListingType");

-- CreateIndex
CREATE INDEX "Lead_agencyId_buyerCity_idx" ON "Lead"("agencyId", "buyerCity");

-- CreateIndex
CREATE INDEX "Lead_agencyId_createdAt_idx" ON "Lead"("agencyId", "createdAt");

-- CreateIndex
CREATE INDEX "Task_agencyId_status_idx" ON "Task"("agencyId", "status");

-- CreateIndex
CREATE INDEX "Task_agencyId_dueAt_idx" ON "Task"("agencyId", "dueAt");

-- CreateIndex
CREATE INDEX "Task_agencyId_assignedToMembershipId_status_idx" ON "Task"("agencyId", "assignedToMembershipId", "status");

-- CreateIndex
CREATE INDEX "Task_agencyId_leadId_idx" ON "Task"("agencyId", "leadId");

-- CreateIndex
CREATE INDEX "Task_agencyId_createdAt_idx" ON "Task"("agencyId", "createdAt");

-- CreateIndex
CREATE INDEX "Note_agencyId_contactId_idx" ON "Note"("agencyId", "contactId");

-- CreateIndex
CREATE INDEX "Note_agencyId_leadId_idx" ON "Note"("agencyId", "leadId");

-- CreateIndex
CREATE INDEX "Note_agencyId_createdAt_idx" ON "Note"("agencyId", "createdAt");

-- CreateIndex
CREATE INDEX "Property_agencyId_ownerContactId_idx" ON "Property"("agencyId", "ownerContactId");

-- CreateIndex
CREATE INDEX "Property_agencyId_address_idx" ON "Property"("agencyId", "address");

-- CreateIndex
CREATE INDEX "Property_agencyId_city_idx" ON "Property"("agencyId", "city");

-- CreateIndex
CREATE INDEX "Property_agencyId_area_idx" ON "Property"("agencyId", "area");

-- CreateIndex
CREATE INDEX "Property_agencyId_propertyType_idx" ON "Property"("agencyId", "propertyType");

-- CreateIndex
CREATE INDEX "Property_agencyId_latitude_idx" ON "Property"("agencyId", "latitude");

-- CreateIndex
CREATE INDEX "Property_agencyId_longitude_idx" ON "Property"("agencyId", "longitude");

-- CreateIndex
CREATE INDEX "Property_agencyId_deletedAt_idx" ON "Property"("agencyId", "deletedAt");

-- CreateIndex
CREATE INDEX "Listing_agencyId_propertyId_idx" ON "Listing"("agencyId", "propertyId");

-- CreateIndex
CREATE INDEX "Listing_agencyId_listingType_status_idx" ON "Listing"("agencyId", "listingType", "status");

-- CreateIndex
CREATE INDEX "Listing_agencyId_price_idx" ON "Listing"("agencyId", "price");

-- CreateIndex
CREATE INDEX "Listing_agencyId_deletedAt_idx" ON "Listing"("agencyId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Listing_agencyId_slug_key" ON "Listing"("agencyId", "slug");

-- CreateIndex
CREATE INDEX "ListingContentTranslation_agencyId_listingId_languageCode_idx" ON "ListingContentTranslation"("agencyId", "listingId", "languageCode");

-- CreateIndex
CREATE INDEX "ListingContentTranslation_agencyId_languageCode_reviewStatu_idx" ON "ListingContentTranslation"("agencyId", "languageCode", "reviewStatus");

-- CreateIndex
CREATE UNIQUE INDEX "ListingContentTranslation_agencyId_listingId_languageCode_key" ON "ListingContentTranslation"("agencyId", "listingId", "languageCode");

-- CreateIndex
CREATE INDEX "AiPromptTemplate_agencyId_code_idx" ON "AiPromptTemplate"("agencyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "AiPromptTemplate_agencyId_code_key" ON "AiPromptTemplate"("agencyId", "code");

-- CreateIndex
CREATE INDEX "AiPromptTemplateVersion_agencyId_promptTemplateId_versionNu_idx" ON "AiPromptTemplateVersion"("agencyId", "promptTemplateId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "AiPromptTemplateVersion_agencyId_promptTemplateId_versionNu_key" ON "AiPromptTemplateVersion"("agencyId", "promptTemplateId", "versionNumber");

-- CreateIndex
CREATE INDEX "AiListingDescriptionGeneration_agencyId_listingId_status_cr_idx" ON "AiListingDescriptionGeneration"("agencyId", "listingId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "AiListingDescriptionGeneration_agencyId_listingId_idx" ON "AiListingDescriptionGeneration"("agencyId", "listingId");

-- CreateIndex
CREATE INDEX "AiListingDescriptionGeneration_agencyId_tone_createdAt_idx" ON "AiListingDescriptionGeneration"("agencyId", "tone", "createdAt");

-- CreateIndex
CREATE INDEX "AiLeadSummaryGeneration_agencyId_leadId_status_createdAt_idx" ON "AiLeadSummaryGeneration"("agencyId", "leadId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "AiLeadSummaryGeneration_agencyId_leadId_idx" ON "AiLeadSummaryGeneration"("agencyId", "leadId");

-- CreateIndex
CREATE INDEX "AiBuyerPropertyMatchGeneration_agencyId_buyerLeadId_status__idx" ON "AiBuyerPropertyMatchGeneration"("agencyId", "buyerLeadId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "AiBuyerPropertyMatchGeneration_agencyId_buyerLeadId_idx" ON "AiBuyerPropertyMatchGeneration"("agencyId", "buyerLeadId");

-- CreateIndex
CREATE INDEX "AiBuyerPropertyMatchRecommendation_agencyId_matchGeneration_idx" ON "AiBuyerPropertyMatchRecommendation"("agencyId", "matchGenerationId", "score");

-- CreateIndex
CREATE INDEX "AiBuyerPropertyMatchRecommendation_agencyId_listingId_idx" ON "AiBuyerPropertyMatchRecommendation"("agencyId", "listingId");

-- CreateIndex
CREATE INDEX "PropertyInternalNote_agencyId_propertyId_createdAt_idx" ON "PropertyInternalNote"("agencyId", "propertyId", "createdAt");

-- CreateIndex
CREATE INDEX "ListingInternalNote_agencyId_listingId_createdAt_idx" ON "ListingInternalNote"("agencyId", "listingId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_storageKey_key" ON "MediaAsset"("storageKey");

-- CreateIndex
CREATE INDEX "MediaAsset_agencyId_listingId_deletedAt_idx" ON "MediaAsset"("agencyId", "listingId", "deletedAt");

-- CreateIndex
CREATE INDEX "MediaAsset_agencyId_propertyId_deletedAt_idx" ON "MediaAsset"("agencyId", "propertyId", "deletedAt");

-- CreateIndex
CREATE INDEX "MediaAsset_agencyId_mediaType_uploadStatus_idx" ON "MediaAsset"("agencyId", "mediaType", "uploadStatus");

-- CreateIndex
CREATE INDEX "MediaAsset_agencyId_listingId_sortOrder_idx" ON "MediaAsset"("agencyId", "listingId", "sortOrder");

-- CreateIndex
CREATE INDEX "MediaAsset_agencyId_listingId_isCover_deletedAt_idx" ON "MediaAsset"("agencyId", "listingId", "isCover", "deletedAt");

-- CreateIndex
CREATE INDEX "Inquiry_agencyId_listingId_status_idx" ON "Inquiry"("agencyId", "listingId", "status");

-- CreateIndex
CREATE INDEX "Inquiry_agencyId_createdAt_idx" ON "Inquiry"("agencyId", "createdAt");

-- CreateIndex
CREATE INDEX "Inquiry_agencyId_email_idx" ON "Inquiry"("agencyId", "email");

-- CreateIndex
CREATE INDEX "ActivityEvent_agencyId_createdAt_idx" ON "ActivityEvent"("agencyId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityEvent_agencyId_entityType_entityId_idx" ON "ActivityEvent"("agencyId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "ActivityEvent_agencyId_contactId_createdAt_idx" ON "ActivityEvent"("agencyId", "contactId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityEvent_agencyId_leadId_createdAt_idx" ON "ActivityEvent"("agencyId", "leadId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_code_key" ON "SubscriptionPlan"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_stripePriceIdMonthly_key" ON "SubscriptionPlan"("stripePriceIdMonthly");

-- CreateIndex
CREATE INDEX "SubscriptionPlan_code_idx" ON "SubscriptionPlan"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AgencySubscription_agencyId_key" ON "AgencySubscription"("agencyId");

-- CreateIndex
CREATE UNIQUE INDEX "AgencySubscription_stripeSubscriptionId_key" ON "AgencySubscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "AgencySubscription_agencyId_status_idx" ON "AgencySubscription"("agencyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "StripeWebhookEvent_stripeEventId_key" ON "StripeWebhookEvent"("stripeEventId");

-- CreateIndex
CREATE INDEX "StripeWebhookEvent_agencyId_eventType_receivedAt_idx" ON "StripeWebhookEvent"("agencyId", "eventType", "receivedAt");

-- CreateIndex
CREATE INDEX "StripeWebhookEvent_subscriptionAgencyId_eventType_receivedA_idx" ON "StripeWebhookEvent"("subscriptionAgencyId", "eventType", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "GmailConnection_membershipId_key" ON "GmailConnection"("membershipId");

-- CreateIndex
CREATE INDEX "GmailConnection_agencyId_gmailUserEmail_idx" ON "GmailConnection"("agencyId", "gmailUserEmail");

-- CreateIndex
CREATE INDEX "GmailConnection_agencyId_membershipId_idx" ON "GmailConnection"("agencyId", "membershipId");

-- CreateIndex
CREATE INDEX "GmailThread_agencyId_membershipId_lastMessageAt_idx" ON "GmailThread"("agencyId", "membershipId", "lastMessageAt");

-- CreateIndex
CREATE INDEX "GmailThread_agencyId_contactId_lastMessageAt_idx" ON "GmailThread"("agencyId", "contactId", "lastMessageAt");

-- CreateIndex
CREATE INDEX "GmailThread_agencyId_leadId_lastMessageAt_idx" ON "GmailThread"("agencyId", "leadId", "lastMessageAt");

-- CreateIndex
CREATE UNIQUE INDEX "GmailThread_agencyId_gmailThreadId_membershipId_key" ON "GmailThread"("agencyId", "gmailThreadId", "membershipId");

-- CreateIndex
CREATE INDEX "GmailMessage_agencyId_membershipId_internalDate_idx" ON "GmailMessage"("agencyId", "membershipId", "internalDate");

-- CreateIndex
CREATE INDEX "GmailMessage_agencyId_threadId_internalDate_idx" ON "GmailMessage"("agencyId", "threadId", "internalDate");

-- CreateIndex
CREATE UNIQUE INDEX "GmailMessage_agencyId_gmailMessageId_membershipId_key" ON "GmailMessage"("agencyId", "gmailMessageId", "membershipId");

-- CreateIndex
CREATE INDEX "Notification_agencyId_membershipId_isRead_createdAt_idx" ON "Notification"("agencyId", "membershipId", "isRead", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_agencyId_membershipId_createdAt_idx" ON "Notification"("agencyId", "membershipId", "createdAt");

-- CreateIndex
CREATE INDEX "Comment_agencyId_targetType_targetId_createdAt_idx" ON "Comment"("agencyId", "targetType", "targetId", "createdAt");

-- CreateIndex
CREATE INDEX "Comment_agencyId_leadId_createdAt_idx" ON "Comment"("agencyId", "leadId", "createdAt");

-- CreateIndex
CREATE INDEX "Comment_agencyId_listingId_createdAt_idx" ON "Comment"("agencyId", "listingId", "createdAt");

-- CreateIndex
CREATE INDEX "Comment_agencyId_taskId_createdAt_idx" ON "Comment"("agencyId", "taskId", "createdAt");

-- CreateIndex
CREATE INDEX "Attachment_agencyId_targetType_targetId_createdAt_idx" ON "Attachment"("agencyId", "targetType", "targetId", "createdAt");

-- CreateIndex
CREATE INDEX "Attachment_agencyId_uploadStatus_idx" ON "Attachment"("agencyId", "uploadStatus");

-- CreateIndex
CREATE INDEX "PublicationChannel_agencyId_channelType_isEnabled_idx" ON "PublicationChannel"("agencyId", "channelType", "isEnabled");

-- CreateIndex
CREATE UNIQUE INDEX "PublicationChannel_agencyId_code_key" ON "PublicationChannel"("agencyId", "code");

-- CreateIndex
CREATE INDEX "FeedMapping_agencyId_channelId_mappingVersion_idx" ON "FeedMapping"("agencyId", "channelId", "mappingVersion");

-- CreateIndex
CREATE UNIQUE INDEX "FeedMapping_agencyId_channelId_mappingVersion_key" ON "FeedMapping"("agencyId", "channelId", "mappingVersion");

-- CreateIndex
CREATE INDEX "ListingPublication_agencyId_channelId_status_idx" ON "ListingPublication"("agencyId", "channelId", "status");

-- CreateIndex
CREATE INDEX "ListingPublication_agencyId_channelId_requestedAt_idx" ON "ListingPublication"("agencyId", "channelId", "requestedAt");

-- CreateIndex
CREATE INDEX "ListingPublication_agencyId_listingId_idx" ON "ListingPublication"("agencyId", "listingId");

-- CreateIndex
CREATE UNIQUE INDEX "ListingPublication_agencyId_channelId_listingId_languageCod_key" ON "ListingPublication"("agencyId", "channelId", "listingId", "languageCode");

-- CreateIndex
CREATE INDEX "PublicationLog_agencyId_listingPublicationId_startedAt_idx" ON "PublicationLog"("agencyId", "listingPublicationId", "startedAt");

-- CreateIndex
CREATE INDEX "PublicationLog_agencyId_status_startedAt_idx" ON "PublicationLog"("agencyId", "status", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PublicationLog_agencyId_listingPublicationId_attemptNo_key" ON "PublicationLog"("agencyId", "listingPublicationId", "attemptNo");

-- AddForeignKey
ALTER TABLE "AgencyMembership" ADD CONSTRAINT "AgencyMembership_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyMembership" ADD CONSTRAINT "AgencyMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_createdByMembershipId_fkey" FOREIGN KEY ("createdByMembershipId") REFERENCES "AgencyMembership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedToMembershipId_fkey" FOREIGN KEY ("assignedToMembershipId") REFERENCES "AgencyMembership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_createdByMembershipId_fkey" FOREIGN KEY ("createdByMembershipId") REFERENCES "AgencyMembership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedToMembershipId_fkey" FOREIGN KEY ("assignedToMembershipId") REFERENCES "AgencyMembership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdByMembershipId_fkey" FOREIGN KEY ("createdByMembershipId") REFERENCES "AgencyMembership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_createdByMembershipId_fkey" FOREIGN KEY ("createdByMembershipId") REFERENCES "AgencyMembership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_ownerContactId_fkey" FOREIGN KEY ("ownerContactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingContentTranslation" ADD CONSTRAINT "ListingContentTranslation_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingContentTranslation" ADD CONSTRAINT "ListingContentTranslation_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiPromptTemplate" ADD CONSTRAINT "AiPromptTemplate_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiPromptTemplateVersion" ADD CONSTRAINT "AiPromptTemplateVersion_promptTemplateId_fkey" FOREIGN KEY ("promptTemplateId") REFERENCES "AiPromptTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiListingDescriptionGeneration" ADD CONSTRAINT "AiListingDescriptionGeneration_promptTemplateVersionId_fkey" FOREIGN KEY ("promptTemplateVersionId") REFERENCES "AiPromptTemplateVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiListingDescriptionGeneration" ADD CONSTRAINT "AiListingDescriptionGeneration_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiListingDescriptionGeneration" ADD CONSTRAINT "AiListingDescriptionGeneration_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiLeadSummaryGeneration" ADD CONSTRAINT "AiLeadSummaryGeneration_promptTemplateVersionId_fkey" FOREIGN KEY ("promptTemplateVersionId") REFERENCES "AiPromptTemplateVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiLeadSummaryGeneration" ADD CONSTRAINT "AiLeadSummaryGeneration_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiLeadSummaryGeneration" ADD CONSTRAINT "AiLeadSummaryGeneration_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiBuyerPropertyMatchGeneration" ADD CONSTRAINT "AiBuyerPropertyMatchGeneration_promptTemplateVersionId_fkey" FOREIGN KEY ("promptTemplateVersionId") REFERENCES "AiPromptTemplateVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiBuyerPropertyMatchGeneration" ADD CONSTRAINT "AiBuyerPropertyMatchGeneration_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiBuyerPropertyMatchGeneration" ADD CONSTRAINT "AiBuyerPropertyMatchGeneration_buyerLeadId_fkey" FOREIGN KEY ("buyerLeadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiBuyerPropertyMatchRecommendation" ADD CONSTRAINT "AiBuyerPropertyMatchRecommendation_matchGenerationId_fkey" FOREIGN KEY ("matchGenerationId") REFERENCES "AiBuyerPropertyMatchGeneration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiBuyerPropertyMatchRecommendation" ADD CONSTRAINT "AiBuyerPropertyMatchRecommendation_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiBuyerPropertyMatchRecommendation" ADD CONSTRAINT "AiBuyerPropertyMatchRecommendation_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyInternalNote" ADD CONSTRAINT "PropertyInternalNote_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyInternalNote" ADD CONSTRAINT "PropertyInternalNote_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingInternalNote" ADD CONSTRAINT "ListingInternalNote_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingInternalNote" ADD CONSTRAINT "ListingInternalNote_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_actorMembershipId_fkey" FOREIGN KEY ("actorMembershipId") REFERENCES "AgencyMembership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencySubscription" ADD CONSTRAINT "AgencySubscription_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencySubscription" ADD CONSTRAINT "AgencySubscription_planCode_fkey" FOREIGN KEY ("planCode") REFERENCES "SubscriptionPlan"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StripeWebhookEvent" ADD CONSTRAINT "StripeWebhookEvent_subscriptionAgencyId_fkey" FOREIGN KEY ("subscriptionAgencyId") REFERENCES "AgencySubscription"("agencyId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StripeWebhookEvent" ADD CONSTRAINT "StripeWebhookEvent_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GmailConnection" ADD CONSTRAINT "GmailConnection_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GmailConnection" ADD CONSTRAINT "GmailConnection_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "AgencyMembership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GmailThread" ADD CONSTRAINT "GmailThread_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GmailThread" ADD CONSTRAINT "GmailThread_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "AgencyMembership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GmailThread" ADD CONSTRAINT "GmailThread_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "GmailConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GmailThread" ADD CONSTRAINT "GmailThread_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GmailThread" ADD CONSTRAINT "GmailThread_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GmailThread" ADD CONSTRAINT "GmailThread_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GmailMessage" ADD CONSTRAINT "GmailMessage_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GmailMessage" ADD CONSTRAINT "GmailMessage_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "AgencyMembership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GmailMessage" ADD CONSTRAINT "GmailMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "GmailThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "AgencyMembership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_createdByMembershipId_fkey" FOREIGN KEY ("createdByMembershipId") REFERENCES "AgencyMembership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_createdByMembershipId_fkey" FOREIGN KEY ("createdByMembershipId") REFERENCES "AgencyMembership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationChannel" ADD CONSTRAINT "PublicationChannel_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedMapping" ADD CONSTRAINT "FeedMapping_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedMapping" ADD CONSTRAINT "FeedMapping_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "PublicationChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingPublication" ADD CONSTRAINT "ListingPublication_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingPublication" ADD CONSTRAINT "ListingPublication_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "PublicationChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingPublication" ADD CONSTRAINT "ListingPublication_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingPublication" ADD CONSTRAINT "ListingPublication_agencyId_channelId_mappingVersion_fkey" FOREIGN KEY ("agencyId", "channelId", "mappingVersion") REFERENCES "FeedMapping"("agencyId", "channelId", "mappingVersion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationLog" ADD CONSTRAINT "PublicationLog_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationLog" ADD CONSTRAINT "PublicationLog_listingPublicationId_fkey" FOREIGN KEY ("listingPublicationId") REFERENCES "ListingPublication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

