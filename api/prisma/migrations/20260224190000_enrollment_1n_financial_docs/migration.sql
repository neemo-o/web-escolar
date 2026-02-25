-- Allow multiple enrollments per student/year (1:N) and add private-school fields.

-- 1) Remove the constraint that prevents multiple enrollments per student+year
DROP INDEX IF EXISTS "enrollments_schoolId_studentId_academicYearId_key";

-- 2) Add financial responsible guardian reference (optional for legacy rows)
ALTER TABLE "enrollments"
ADD COLUMN IF NOT EXISTS "financialResponsibleGuardianId" UUID;

ALTER TABLE "enrollments"
ADD CONSTRAINT "enrollments_financialResponsibleGuardianId_fkey"
FOREIGN KEY ("financialResponsibleGuardianId") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- 3) Enrollment-level document checklist
CREATE TABLE "enrollment_documents" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "schoolId" UUID NOT NULL,
  "enrollmentId" UUID NOT NULL,
  "type" "DocumentType" NOT NULL,
  "name" VARCHAR(200) NOT NULL,
  "fileUrl" TEXT,
  "delivered" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "enrollment_documents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "enrollment_documents_schoolId_enrollmentId_idx"
ON "enrollment_documents"("schoolId", "enrollmentId");

ALTER TABLE "enrollment_documents"
ADD CONSTRAINT "enrollment_documents_enrollmentId_fkey"
FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id")
ON DELETE CASCADE ON UPDATE CASCADE;