/*
  Warnings:

  - You are about to drop the `StudentGuardian` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `roles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `school_user_roles` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[schoolId,email]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `attendance_sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `classroom_subjects` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `classroom_teachers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `grade_levels` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `periods` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `schedules` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN_GLOBAL', 'SECRETARY', 'TEACHER', 'STUDENT', 'GUARDIAN');

-- CreateEnum
CREATE TYPE "PeriodStatus" AS ENUM ('OPEN', 'CLOSED');

-- DropForeignKey
ALTER TABLE "StudentGuardian" DROP CONSTRAINT "StudentGuardian_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "StudentGuardian" DROP CONSTRAINT "StudentGuardian_studentId_fkey";

-- DropForeignKey
ALTER TABLE "school_user_roles" DROP CONSTRAINT "school_user_roles_roleId_fkey";

-- DropForeignKey
ALTER TABLE "school_user_roles" DROP CONSTRAINT "school_user_roles_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "school_user_roles" DROP CONSTRAINT "school_user_roles_userId_fkey";

-- DropIndex
DROP INDEX "users_email_key";

-- AlterTable
ALTER TABLE "attendance_sessions" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "classroom_subjects" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "classroom_teachers" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "grade_levels" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "periods" ADD COLUMN     "status" "PeriodStatus" NOT NULL DEFAULT 'OPEN',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "schedules" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "Role" NOT NULL,
ADD COLUMN     "schoolId" UUID;

-- DropTable
DROP TABLE "StudentGuardian";

-- DropTable
DROP TABLE "roles";

-- DropTable
DROP TABLE "school_user_roles";

-- CreateTable
CREATE TABLE "student_guardians" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "guardianId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_guardians_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grade_audits" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "studentGradeId" UUID NOT NULL,
    "oldValue" DECIMAL(5,2) NOT NULL,
    "newValue" DECIMAL(5,2) NOT NULL,
    "changedById" UUID NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grade_audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "student_guardians_schoolId_studentId_idx" ON "student_guardians"("schoolId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "student_guardians_studentId_guardianId_key" ON "student_guardians"("studentId", "guardianId");

-- CreateIndex
CREATE INDEX "grade_audits_schoolId_idx" ON "grade_audits"("schoolId");

-- CreateIndex
CREATE INDEX "grade_audits_studentGradeId_idx" ON "grade_audits"("studentGradeId");

-- CreateIndex
CREATE INDEX "users_schoolId_idx" ON "users"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "users_schoolId_email_key" ON "users"("schoolId", "email");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_guardians" ADD CONSTRAINT "student_guardians_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_guardians" ADD CONSTRAINT "student_guardians_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_guardians" ADD CONSTRAINT "student_guardians_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_audits" ADD CONSTRAINT "grade_audits_studentGradeId_fkey" FOREIGN KEY ("studentGradeId") REFERENCES "student_grades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_audits" ADD CONSTRAINT "grade_audits_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
