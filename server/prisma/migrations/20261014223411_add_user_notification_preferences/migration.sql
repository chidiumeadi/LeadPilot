-- AlterTable
ALTER TABLE "users" ADD COLUMN     "browser_notifications_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "in_app_notifications_enabled" BOOLEAN NOT NULL DEFAULT true;
