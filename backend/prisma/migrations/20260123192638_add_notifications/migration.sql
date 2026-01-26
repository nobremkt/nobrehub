-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "email_leads" BOOLEAN NOT NULL DEFAULT true,
    "email_deals" BOOLEAN NOT NULL DEFAULT true,
    "email_activities" BOOLEAN NOT NULL DEFAULT true,
    "email_system" BOOLEAN NOT NULL DEFAULT true,
    "push_leads" BOOLEAN NOT NULL DEFAULT true,
    "push_deals" BOOLEAN NOT NULL DEFAULT true,
    "push_activities" BOOLEAN NOT NULL DEFAULT true,
    "push_mentions" BOOLEAN NOT NULL DEFAULT true,
    "whatsapp_leads" BOOLEAN NOT NULL DEFAULT false,
    "whatsapp_urgent" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_key" ON "notification_preferences"("user_id");

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
