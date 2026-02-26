/*
  Warnings:

  - Made the column `timeBlockId` on table `schedules` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "schedules" DROP CONSTRAINT "schedules_timeBlockId_fkey";

-- AlterTable
ALTER TABLE "schedules" ALTER COLUMN "timeBlockId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_timeBlockId_fkey" FOREIGN KEY ("timeBlockId") REFERENCES "time_blocks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
