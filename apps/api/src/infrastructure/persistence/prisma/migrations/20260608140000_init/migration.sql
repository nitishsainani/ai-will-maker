-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "WillStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'FINALIZED');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('BANK_ACCOUNT', 'JEWELLERY', 'VEHICLE', 'PROPERTY', 'INVESTMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wills" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "status" "WillStatus" NOT NULL DEFAULT 'DRAFT',
    "revision" INTEGER NOT NULL DEFAULT 1,
    "testator_name" TEXT,
    "testator_age" INTEGER,
    "testator_address" TEXT,
    "sound_mind_declaration" BOOLEAN,
    "revokes_previous_wills" BOOLEAN,
    "execution_date" DATE,
    "execution_place" TEXT,
    "testator_signature_line" BOOLEAN,
    "witness_signature_lines" BOOLEAN,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "wills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beneficiaries" (
    "id" UUID NOT NULL,
    "will_id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "priority_order" INTEGER NOT NULL DEFAULT 0,
    "date_of_birth" DATE,
    "age" INTEGER,
    "is_minor" BOOLEAN,
    "contact_email" TEXT,
    "address_line1" TEXT,
    "city" TEXT,
    "state" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "beneficiaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" UUID NOT NULL,
    "will_id" UUID NOT NULL,
    "type" "AssetType" NOT NULL,
    "description" TEXT NOT NULL,
    "user_label" TEXT,
    "estimated_value" DECIMAL(15,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "location_or_account_details" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_allocations" (
    "id" UUID NOT NULL,
    "will_id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
    "beneficiary_id" UUID NOT NULL,
    "share_pct" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "asset_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "executors" (
    "id" UUID NOT NULL,
    "will_id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "relationship" TEXT,
    "address" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "executors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guardians" (
    "id" UUID NOT NULL,
    "will_id" UUID NOT NULL,
    "ward_beneficiary_id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "address" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "guardians_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "witnesses" (
    "id" UUID NOT NULL,
    "will_id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "address_line1" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "witness_order" INTEGER NOT NULL,
    "address" TEXT,
    "is_beneficiary" BOOLEAN,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "witnesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" UUID NOT NULL,
    "will_id" UUID NOT NULL,
    "status" "ConversationStatus" NOT NULL DEFAULT 'ACTIVE',
    "ai_provider" TEXT NOT NULL,
    "summary" TEXT,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMPTZ,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_memory_snapshots" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "summary" TEXT NOT NULL,
    "message_count" INTEGER NOT NULL,
    "fact_count" INTEGER NOT NULL,
    "strategy" TEXT NOT NULL,
    "estimated_tokens" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_memory_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_messages" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_memories" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "fact_key" TEXT NOT NULL,
    "fact_value" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'ai_extraction',
    "extracted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_memories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "will_versions" (
    "id" UUID NOT NULL,
    "will_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "will_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "will_id" UUID NOT NULL,
    "actor_user_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "occurred_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "wills_user_id_idx" ON "wills"("user_id");

-- CreateIndex
CREATE INDEX "wills_status_idx" ON "wills"("status");

-- CreateIndex
CREATE INDEX "beneficiaries_will_id_idx" ON "beneficiaries"("will_id");

-- CreateIndex
CREATE INDEX "assets_will_id_idx" ON "assets"("will_id");

-- CreateIndex
CREATE INDEX "asset_allocations_will_id_idx" ON "asset_allocations"("will_id");

-- CreateIndex
CREATE INDEX "asset_allocations_asset_id_idx" ON "asset_allocations"("asset_id");

-- CreateIndex
CREATE INDEX "asset_allocations_beneficiary_id_idx" ON "asset_allocations"("beneficiary_id");

-- CreateIndex
CREATE UNIQUE INDEX "asset_allocations_asset_id_beneficiary_id_key" ON "asset_allocations"("asset_id", "beneficiary_id");

-- CreateIndex
CREATE INDEX "executors_will_id_idx" ON "executors"("will_id");

-- CreateIndex
CREATE INDEX "guardians_will_id_idx" ON "guardians"("will_id");

-- CreateIndex
CREATE INDEX "guardians_ward_beneficiary_id_idx" ON "guardians"("ward_beneficiary_id");

-- CreateIndex
CREATE UNIQUE INDEX "guardians_will_id_ward_beneficiary_id_key" ON "guardians"("will_id", "ward_beneficiary_id");

-- CreateIndex
CREATE INDEX "witnesses_will_id_idx" ON "witnesses"("will_id");

-- CreateIndex
CREATE UNIQUE INDEX "witnesses_will_id_witness_order_key" ON "witnesses"("will_id", "witness_order");

-- CreateIndex
CREATE INDEX "conversations_will_id_idx" ON "conversations"("will_id");

-- CreateIndex
CREATE INDEX "conversations_status_idx" ON "conversations"("status");

-- CreateIndex
CREATE INDEX "conversation_memory_snapshots_conversation_id_idx" ON "conversation_memory_snapshots"("conversation_id");

-- CreateIndex
CREATE INDEX "conversation_memory_snapshots_created_at_idx" ON "conversation_memory_snapshots"("created_at");

-- CreateIndex
CREATE INDEX "conversation_messages_conversation_id_idx" ON "conversation_messages"("conversation_id");

-- CreateIndex
CREATE INDEX "conversation_memories_conversation_id_idx" ON "conversation_memories"("conversation_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_memories_conversation_id_fact_key_key" ON "conversation_memories"("conversation_id", "fact_key");

-- CreateIndex
CREATE INDEX "will_versions_will_id_idx" ON "will_versions"("will_id");

-- CreateIndex
CREATE UNIQUE INDEX "will_versions_will_id_version_number_key" ON "will_versions"("will_id", "version_number");

-- CreateIndex
CREATE INDEX "audit_logs_will_id_idx" ON "audit_logs"("will_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_user_id_idx" ON "audit_logs"("actor_user_id");

-- CreateIndex
CREATE INDEX "audit_logs_occurred_at_idx" ON "audit_logs"("occurred_at");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wills" ADD CONSTRAINT "wills_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiaries" ADD CONSTRAINT "beneficiaries_will_id_fkey" FOREIGN KEY ("will_id") REFERENCES "wills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_will_id_fkey" FOREIGN KEY ("will_id") REFERENCES "wills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_allocations" ADD CONSTRAINT "asset_allocations_will_id_fkey" FOREIGN KEY ("will_id") REFERENCES "wills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_allocations" ADD CONSTRAINT "asset_allocations_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_allocations" ADD CONSTRAINT "asset_allocations_beneficiary_id_fkey" FOREIGN KEY ("beneficiary_id") REFERENCES "beneficiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "executors" ADD CONSTRAINT "executors_will_id_fkey" FOREIGN KEY ("will_id") REFERENCES "wills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guardians" ADD CONSTRAINT "guardians_will_id_fkey" FOREIGN KEY ("will_id") REFERENCES "wills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guardians" ADD CONSTRAINT "guardians_ward_beneficiary_id_fkey" FOREIGN KEY ("ward_beneficiary_id") REFERENCES "beneficiaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "witnesses" ADD CONSTRAINT "witnesses_will_id_fkey" FOREIGN KEY ("will_id") REFERENCES "wills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_will_id_fkey" FOREIGN KEY ("will_id") REFERENCES "wills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_memory_snapshots" ADD CONSTRAINT "conversation_memory_snapshots_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_memories" ADD CONSTRAINT "conversation_memories_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "will_versions" ADD CONSTRAINT "will_versions_will_id_fkey" FOREIGN KEY ("will_id") REFERENCES "wills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_will_id_fkey" FOREIGN KEY ("will_id") REFERENCES "wills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
