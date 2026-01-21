-- CreateEnum
CREATE TYPE "CustomFieldType" AS ENUM ('text', 'number', 'date', 'select', 'multiselect', 'url', 'email', 'phone');

-- CreateEnum
CREATE TYPE "CustomFieldEntity" AS ENUM ('contact', 'company', 'deal');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('call', 'whatsapp', 'email', 'meeting', 'task', 'follow_up');

-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('pending', 'completed', 'skipped', 'overdue');

-- CreateTable
CREATE TABLE "custom_fields" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "type" "CustomFieldType" NOT NULL DEFAULT 'text',
    "entity" "CustomFieldEntity" NOT NULL,
    "options" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "placeholder" TEXT,
    "tenant_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_field_values" (
    "id" TEXT NOT NULL,
    "custom_field_id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "value" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_field_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playbooks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "stage_key" TEXT,
    "pipeline" "PipelineType",
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "tenant_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "playbooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_templates" (
    "id" TEXT NOT NULL,
    "playbook_id" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "days_from_start" INTEGER NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL DEFAULT 0,
    "message_template" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "due_date" TIMESTAMP(3) NOT NULL,
    "status" "ActivityStatus" NOT NULL DEFAULT 'pending',
    "completed_at" TIMESTAMP(3),
    "assigned_to" TEXT,
    "template_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loss_reasons" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "tenant_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loss_reasons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "custom_fields_entity_idx" ON "custom_fields"("entity");

-- CreateIndex
CREATE UNIQUE INDEX "custom_fields_key_entity_tenant_id_key" ON "custom_fields"("key", "entity", "tenant_id");

-- CreateIndex
CREATE INDEX "custom_field_values_lead_id_idx" ON "custom_field_values"("lead_id");

-- CreateIndex
CREATE UNIQUE INDEX "custom_field_values_custom_field_id_lead_id_key" ON "custom_field_values"("custom_field_id", "lead_id");

-- CreateIndex
CREATE INDEX "activity_templates_playbook_id_idx" ON "activity_templates"("playbook_id");

-- CreateIndex
CREATE INDEX "activities_lead_id_idx" ON "activities"("lead_id");

-- CreateIndex
CREATE INDEX "activities_due_date_idx" ON "activities"("due_date");

-- CreateIndex
CREATE INDEX "activities_status_idx" ON "activities"("status");

-- CreateIndex
CREATE INDEX "activities_assigned_to_idx" ON "activities"("assigned_to");

-- AddForeignKey
ALTER TABLE "custom_field_values" ADD CONSTRAINT "custom_field_values_custom_field_id_fkey" FOREIGN KEY ("custom_field_id") REFERENCES "custom_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_templates" ADD CONSTRAINT "activity_templates_playbook_id_fkey" FOREIGN KEY ("playbook_id") REFERENCES "playbooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
