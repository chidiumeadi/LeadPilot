-- CreateEnum
CREATE TYPE "CommunicationType" AS ENUM ('CALL', 'EMAIL', 'SMS', 'WHATSAPP', 'NOTE');

-- CreateEnum
CREATE TYPE "CommunicationOutcome" AS ENUM ('CONNECTED', 'NO_ANSWER', 'INTERESTED', 'NOT_INTERESTED', 'NEEDS_FOLLOW_UP', 'OTHER');

-- AlterEnum
ALTER TYPE "LeadActivityType" ADD VALUE 'COMMUNICATION_LOGGED';

-- AlterTable
ALTER TABLE "lead_activities" ADD COLUMN     "communication_outcome" "CommunicationOutcome",
ADD COLUMN     "communication_type" "CommunicationType",
ADD COLUMN     "occurred_at" TIMESTAMP(3);
