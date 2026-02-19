/*
  Warnings:

  - You are about to drop the `student_guardians` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[schoolId,classroomId,subjectId,sessionDate,startTime]` on the table `attendance_sessions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[schoolId,enrollmentId,periodId,subjectId]` on the table `period_grades` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "student_guardians" DROP CONSTRAINT "student_guardians_studentId_fkey";

-- DropIndex
DROP INDEX "attendance_sessions_classroomId_subjectId_sessionDate_start_key";

-- DropIndex
DROP INDEX "period_grades_enrollmentId_periodId_subjectId_key";

-- DropTable
DROP TABLE "student_guardians";

-- CreateTable
CREATE TABLE "StudentGuardian" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "relation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentGuardian_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudentGuardian_schoolId_idx" ON "StudentGuardian"("schoolId");

-- CreateIndex
CREATE INDEX "StudentGuardian_studentId_idx" ON "StudentGuardian"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_sessions_schoolId_classroomId_subjectId_sessionD_key" ON "attendance_sessions"("schoolId", "classroomId", "subjectId", "sessionDate", "startTime");

-- CreateIndex
CREATE UNIQUE INDEX "period_grades_schoolId_enrollmentId_periodId_subjectId_key" ON "period_grades"("schoolId", "enrollmentId", "periodId", "subjectId");

-- AddForeignKey
ALTER TABLE "StudentGuardian" ADD CONSTRAINT "StudentGuardian_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGuardian" ADD CONSTRAINT "StudentGuardian_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
