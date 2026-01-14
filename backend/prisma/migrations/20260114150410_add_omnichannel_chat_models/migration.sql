-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'sdr', 'closer_ht', 'closer_lt', 'production', 'post_sales', 'manager_sales', 'manager_production', 'strategic');

-- CreateEnum
CREATE TYPE "PipelineType" AS ENUM ('high_ticket', 'low_ticket', 'sales', 'production', 'post_sales');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('website', 'instagram', 'whatsapp', 'facebook', 'google_ads', 'indicacao', 'outro');

-- CreateEnum
CREATE TYPE "HighTicketStatus" AS ENUM ('novo', 'qualificado', 'call_agendada', 'proposta', 'negociacao', 'fechado', 'perdido');

-- CreateEnum
CREATE TYPE "LowTicketStatus" AS ENUM ('novo', 'atribuido', 'em_negociacao', 'fechado', 'perdido');

-- CreateEnum
CREATE TYPE "ProductionStatus" AS ENUM ('backlog', 'fazendo', 'revisao', 'concluido');

-- CreateEnum
CREATE TYPE "PostSalesStatus" AS ENUM ('novo', 'onboarding', 'acompanhamento', 'renovacao', 'encerrado');

-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('note', 'call', 'whatsapp', 'email', 'status_change', 'assignment');

-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('in', 'out');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('text', 'image', 'audio', 'video', 'document', 'template');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('pending', 'sent', 'delivered', 'read', 'failed');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('queued', 'active', 'closed');

-- CreateEnum
CREATE TYPE "ConversationChannel" AS ENUM ('whatsapp', 'instagram', 'email', 'manual');

-- CreateEnum
CREATE TYPE "ClosedReason" AS ENUM ('payment', 'no_interest', 'transferred', 'resolved', 'timeout');

-- CreateEnum
CREATE TYPE "QueueStatus" AS ENUM ('waiting', 'assigned', 'expired');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "pipeline_type" "PipelineType",
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "max_concurrent_chats" INTEGER NOT NULL DEFAULT 5,
    "current_chat_count" INTEGER NOT NULL DEFAULT 0,
    "is_online" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "company" TEXT,
    "source" "LeadSource" NOT NULL DEFAULT 'website',
    "pipeline" "PipelineType" NOT NULL DEFAULT 'high_ticket',
    "status_ht" "HighTicketStatus",
    "status_lt" "LowTicketStatus",
    "status_production" "ProductionStatus",
    "status_post_sales" "PostSalesStatus",
    "assigned_to" TEXT,
    "assigned_at" TIMESTAMP(3),
    "estimated_value" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interactions" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "user_id" TEXT,
    "type" "InteractionType" NOT NULL,
    "content" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "wa_message_id" TEXT,
    "lead_id" TEXT,
    "conversation_id" TEXT,
    "phone" TEXT NOT NULL,
    "direction" "MessageDirection" NOT NULL,
    "type" "MessageType" NOT NULL DEFAULT 'text',
    "text" TEXT,
    "media_url" TEXT,
    "template_name" TEXT,
    "status" "MessageStatus" NOT NULL DEFAULT 'pending',
    "sent_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "assigned_agent_id" TEXT,
    "channel" "ConversationChannel" NOT NULL DEFAULT 'whatsapp',
    "status" "ConversationStatus" NOT NULL DEFAULT 'queued',
    "closed_reason" "ClosedReason",
    "pipeline" "PipelineType" NOT NULL DEFAULT 'high_ticket',
    "last_message_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "queue" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "pipeline" "PipelineType" NOT NULL,
    "status" "QueueStatus" NOT NULL DEFAULT 'waiting',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_at" TIMESTAMP(3),

    CONSTRAINT "queue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "messages_wa_message_id_key" ON "messages"("wa_message_id");

-- CreateIndex
CREATE INDEX "messages_phone_idx" ON "messages"("phone");

-- CreateIndex
CREATE INDEX "messages_lead_id_idx" ON "messages"("lead_id");

-- CreateIndex
CREATE INDEX "messages_conversation_id_idx" ON "messages"("conversation_id");

-- CreateIndex
CREATE INDEX "conversations_lead_id_idx" ON "conversations"("lead_id");

-- CreateIndex
CREATE INDEX "conversations_assigned_agent_id_idx" ON "conversations"("assigned_agent_id");

-- CreateIndex
CREATE INDEX "conversations_status_idx" ON "conversations"("status");

-- CreateIndex
CREATE INDEX "conversations_pipeline_idx" ON "conversations"("pipeline");

-- CreateIndex
CREATE INDEX "queue_pipeline_idx" ON "queue"("pipeline");

-- CreateIndex
CREATE INDEX "queue_status_idx" ON "queue"("status");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sent_by_user_id_fkey" FOREIGN KEY ("sent_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_assigned_agent_id_fkey" FOREIGN KEY ("assigned_agent_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue" ADD CONSTRAINT "queue_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
