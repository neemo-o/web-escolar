/*
  Warnings:

  - You are about to drop the column `content` on the `activity_submissions` table. All the data in the column will be lost.
  - You are about to drop the column `reviewedAt` on the `activity_submissions` table. All the data in the column will be lost.
  - You are about to drop the column `content` on the `announcements` table. All the data in the column will be lost.
  - You are about to drop the column `justification` on the `attendance_records` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `attendance_records` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `attendance_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `calculatedAt` on the `final_grades` table. All the data in the column will be lost.
  - You are about to drop the column `finalGrade` on the `final_grades` table. All the data in the column will be lost.
  - You are about to drop the column `result` on the `final_grades` table. All the data in the column will be lost.
  - You are about to drop the column `subjectId` on the `final_grades` table. All the data in the column will be lost.
  - You are about to drop the column `totalAbsences` on the `final_grades` table. All the data in the column will be lost.
  - You are about to drop the column `absences` on the `period_grades` table. All the data in the column will be lost.
  - You are about to drop the column `calculatedAt` on the `period_grades` table. All the data in the column will be lost.
  - You are about to drop the column `grade` on the `period_grades` table. All the data in the column will be lost.
  - You are about to drop the column `subjectId` on the `period_grades` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `school_events` table. All the data in the column will be lost.
  - You are about to drop the column `address` on the `students` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[enrollmentId]` on the table `final_grades` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[periodId,enrollmentId]` on the table `period_grades` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `body` to the `announcements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `average` to the `final_grades` table without a default value. This is not possible if the table is not empty.
  - Added the required column `passed` to the `final_grades` table without a default value. This is not possible if the table is not empty.
  - Added the required column `average` to the `period_grades` table without a default value. This is not possible if the table is not empty.
  - Added the required column `passed` to the `period_grades` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "grade_audits" DROP CONSTRAINT "grade_audits_gradeId_fkey";

-- DropIndex
DROP INDEX "activities_schoolId_classroomId_dueDate_idx";

-- DropIndex
DROP INDEX "activities_schoolId_classroomId_status_idx";

-- DropIndex
DROP INDEX "activity_submissions_schoolId_enrollmentId_idx";

-- DropIndex
DROP INDEX "announcements_schoolId_createdAt_idx";

-- DropIndex
DROP INDEX "final_grades_enrollmentId_subjectId_key";

-- DropIndex
DROP INDEX "grade_audits_gradeId_idx";

-- DropIndex
DROP INDEX "grade_audits_schoolId_idx";

-- DropIndex
DROP INDEX "period_grades_schoolId_enrollmentId_periodId_subjectId_key";

-- DropIndex
DROP INDEX "school_events_schoolId_startDate_idx";

-- AlterTable
ALTER TABLE "activities" ALTER COLUMN "dueDate" SET DATA TYPE DATE;

-- AlterTable
ALTER TABLE "activity_submissions" DROP COLUMN "content",
DROP COLUMN "reviewedAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "submittedAt" DROP NOT NULL,
ALTER COLUMN "submittedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "announcements" DROP COLUMN "content",
ADD COLUMN     "body" TEXT NOT NULL,
ADD COLUMN     "targetRole" "Role";

-- AlterTable
ALTER TABLE "attendance_records" DROP COLUMN "justification",
DROP COLUMN "status",
ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "attendance_sessions" DROP COLUMN "deletedAt",
ALTER COLUMN "subjectId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "enrollment_history" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "final_grades" DROP COLUMN "calculatedAt",
DROP COLUMN "finalGrade",
DROP COLUMN "result",
DROP COLUMN "subjectId",
DROP COLUMN "totalAbsences",
ADD COLUMN     "average" DECIMAL(5,2) NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "passed" BOOLEAN NOT NULL;

-- AlterTable
ALTER TABLE "guardian_profiles" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "period_grades" DROP COLUMN "absences",
DROP COLUMN "calculatedAt",
DROP COLUMN "grade",
DROP COLUMN "subjectId",
ADD COLUMN     "average" DECIMAL(5,2) NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "passed" BOOLEAN NOT NULL;

-- AlterTable
ALTER TABLE "school_events" DROP COLUMN "location";

-- AlterTable
ALTER TABLE "student_documents" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "student_grades" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "launchedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "student_health" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "students" DROP COLUMN "address";

-- AlterTable
ALTER TABLE "teacher_profiles" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "activities_schoolId_classroomId_idx" ON "activities"("schoolId", "classroomId");

-- CreateIndex
CREATE INDEX "announcements_schoolId_idx" ON "announcements"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "final_grades_enrollmentId_key" ON "final_grades"("enrollmentId");

-- CreateIndex
CREATE INDEX "grade_audits_schoolId_gradeId_idx" ON "grade_audits"("schoolId", "gradeId");

-- CreateIndex
CREATE UNIQUE INDEX "period_grades_periodId_enrollmentId_key" ON "period_grades"("periodId", "enrollmentId");

-- CreateIndex
CREATE INDEX "school_events_schoolId_idx" ON "school_events"("schoolId");

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_audits" ADD CONSTRAINT "grade_audits_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "student_grades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
