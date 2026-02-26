/*
  Warnings:

  - You are about to drop the column `endTime` on the `schedules` table. All the data in the column will be lost.
  - You are about to drop the column `room` on the `schedules` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `schedules` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[classroomId,dayOfWeek,timeBlockId]` on the table `schedules` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "schedules_classroomId_dayOfWeek_startTime_key";

-- AlterTable
ALTER TABLE "schedules" DROP COLUMN "endTime",
DROP COLUMN "room",
DROP COLUMN "startTime",
ADD COLUMN     "roomId" UUID,
ADD COLUMN     "teacherId" UUID,
ADD COLUMN     "timeBlockId" UUID;

-- CreateTable
CREATE TABLE "time_blocks" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "startTime" TIME NOT NULL,
    "endTime" TIME NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "time_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "capacity" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "time_blocks_schoolId_order_idx" ON "time_blocks"("schoolId", "order");

-- CreateIndex
CREATE INDEX "time_blocks_schoolId_active_idx" ON "time_blocks"("schoolId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "time_blocks_schoolId_name_key" ON "time_blocks"("schoolId", "name");

-- CreateIndex
CREATE INDEX "rooms_schoolId_active_idx" ON "rooms"("schoolId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_schoolId_name_key" ON "rooms"("schoolId", "name");

-- CreateIndex
CREATE INDEX "schedules_schoolId_timeBlockId_idx" ON "schedules"("schoolId", "timeBlockId");

-- CreateIndex
CREATE INDEX "schedules_schoolId_teacherId_idx" ON "schedules"("schoolId", "teacherId");

-- CreateIndex
CREATE INDEX "schedules_schoolId_roomId_idx" ON "schedules"("schoolId", "roomId");

-- CreateIndex
CREATE UNIQUE INDEX "schedules_classroomId_dayOfWeek_timeBlockId_key" ON "schedules"("classroomId", "dayOfWeek", "timeBlockId");

-- AddForeignKey
ALTER TABLE "time_blocks" ADD CONSTRAINT "time_blocks_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_timeBlockId_fkey" FOREIGN KEY ("timeBlockId") REFERENCES "time_blocks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
