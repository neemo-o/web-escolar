-- Migration: expand_student_profiles
-- Gerado para aplicar via: npx prisma migrate dev --create-only
-- Cole este conteúdo no arquivo migration.sql gerado e rode: npx prisma migrate dev

-- ============================================================
-- ENUMS NOVOS
-- ============================================================

CREATE TYPE "Gender" AS ENUM ('MASCULINO', 'FEMININO', 'OUTRO', 'NAO_INFORMADO');
CREATE TYPE "StudentStatus" AS ENUM ('ATIVO', 'TRANSFERIDO', 'TRANCADO', 'CONCLUIDO', 'CANCELADO');
CREATE TYPE "TeacherStatus" AS ENUM ('ATIVO', 'AFASTADO', 'DESLIGADO');
CREATE TYPE "GuardianRelationType" AS ENUM ('PAI', 'MAE', 'TUTOR_LEGAL', 'OUTRO');
CREATE TYPE "DocumentType" AS ENUM ('RG', 'CPF', 'CERTIDAO_NASCIMENTO', 'COMPROVANTE_RESIDENCIA', 'HISTORICO_ESCOLAR', 'LAUDO_MEDICO', 'FOTO', 'OUTRO');
CREATE TYPE "MovementType" AS ENUM ('MATRICULA', 'TRANSFERENCIA_TURMA', 'TRANSFERENCIA_SERIE', 'TRANCAMENTO', 'REATIVACAO', 'CONCLUSAO', 'CANCELAMENTO', 'OUTRO');

-- ============================================================
-- EXPANDIR: students
-- ============================================================

ALTER TABLE "students"
  ADD COLUMN "socialName"       VARCHAR(200),
  ADD COLUMN "rg"               VARCHAR(20),
  ADD COLUMN "birthCertificate" VARCHAR(50),
  ADD COLUMN "gender"           "Gender",
  ADD COLUMN "nationality"      VARCHAR(100),
  ADD COLUMN "naturalidade"     VARCHAR(100),
  ADD COLUMN "zipCode"          VARCHAR(9),
  ADD COLUMN "street"           VARCHAR(200),
  ADD COLUMN "addressNumber"    VARCHAR(20),
  ADD COLUMN "neighborhood"     VARCHAR(100),
  ADD COLUMN "city"             VARCHAR(100),
  ADD COLUMN "state"            VARCHAR(2),
  ADD COLUMN "exitDate"         DATE;

-- status com default para não quebrar linhas existentes
ALTER TABLE "students"
  ADD COLUMN "status" "StudentStatus" NOT NULL DEFAULT 'ATIVO';

-- ============================================================
-- EXPANDIR: student_guardians
-- Tabela tem 1 linha existente — adicionamos com DEFAULT e removemos depois
-- ============================================================

ALTER TABLE "student_guardians"
  ADD COLUMN "relationType"            "GuardianRelationType" NOT NULL DEFAULT 'OUTRO',
  ADD COLUMN "isFinancialResponsible"  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "canPickUp"               BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "notes"                   TEXT;

-- updatedAt: add com DEFAULT, depois remove o default (Prisma gerencia via @updatedAt)
ALTER TABLE "student_guardians"
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();
ALTER TABLE "student_guardians"
  ALTER COLUMN "updatedAt" DROP DEFAULT;

-- ============================================================
-- EXPANDIR: attendance_records
-- Tabela tem 2 linhas existentes — mesmo tratamento
-- ============================================================

ALTER TABLE "attendance_records"
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();
ALTER TABLE "attendance_records"
  ALTER COLUMN "updatedAt" DROP DEFAULT;

-- Renomear status → present/justified para alinhar com novo schema
-- (se quiser manter retrocompatibilidade, pule este bloco)
ALTER TABLE "attendance_records"
  ADD COLUMN "present"   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "justified" BOOLEAN NOT NULL DEFAULT false;

-- Migrar dados existentes de status → present
UPDATE "attendance_records" SET "present" = true WHERE "status" = 'presente';

-- ============================================================
-- EXPANDIR: attendance_sessions
-- Tabela tem 1 linha existente — sessionDate já existe, renomear para date
-- ============================================================

-- O campo já se chama "sessionDate" no schema original.
-- O novo schema usa "date". Renomeamos:
ALTER TABLE "attendance_sessions"
  RENAME COLUMN "sessionDate" TO "date";

-- Remover colunas que não existem mais no novo schema
ALTER TABLE "attendance_sessions"
  DROP COLUMN IF EXISTS "startTime",
  DROP COLUMN IF EXISTS "endTime";

-- Adicionar totalSlots
ALTER TABLE "attendance_sessions"
  ADD COLUMN "totalSlots" INTEGER NOT NULL DEFAULT 1;

-- Recriar index com novo nome de coluna
DROP INDEX IF EXISTS "attendance_sessions_schoolId_classroomId_sessionDate_idx";
CREATE INDEX "attendance_sessions_schoolId_classroomId_date_idx"
  ON "attendance_sessions"("schoolId", "classroomId", "date");

DROP INDEX IF EXISTS "attendance_sessions_schoolId_classroomId_subjectId_sessionD_key";

-- ============================================================
-- EXPANDIR: grade_audits
-- Tabela tem 1 linha existente com studentGradeId — o novo schema
-- usa gradeId como FK para student_grades. Renomear a coluna.
-- ============================================================

ALTER TABLE "grade_audits"
  RENAME COLUMN "studentGradeId" TO "gradeId";

-- Ajustar FK
ALTER TABLE "grade_audits"
  DROP CONSTRAINT IF EXISTS "grade_audits_studentGradeId_fkey";

ALTER TABLE "grade_audits"
  ADD CONSTRAINT "grade_audits_gradeId_fkey"
  FOREIGN KEY ("gradeId") REFERENCES "student_grades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Renomear oldValue/newValue → oldScore/newScore e tornar nullable
ALTER TABLE "grade_audits"
  RENAME COLUMN "oldValue" TO "oldScore";
ALTER TABLE "grade_audits"
  RENAME COLUMN "newValue" TO "newScore";
ALTER TABLE "grade_audits"
  ALTER COLUMN "oldScore" DROP NOT NULL;
ALTER TABLE "grade_audits"
  ALTER COLUMN "newScore" DROP NOT NULL;

-- Adicionar reason
ALTER TABLE "grade_audits"
  ADD COLUMN "reason" TEXT;

-- Recriar index
DROP INDEX IF EXISTS "grade_audits_studentGradeId_idx";
CREATE INDEX "grade_audits_gradeId_idx" ON "grade_audits"("gradeId");

-- ============================================================
-- EXPANDIR: student_grades
-- Remover status (não existe no novo schema), adicionar launchedById/launchedAt/notes
-- ============================================================

-- recordedById → launchedById
ALTER TABLE "student_grades"
  RENAME COLUMN "recordedById" TO "launchedById";
ALTER TABLE "student_grades"
  ALTER COLUMN "launchedById" DROP NOT NULL;

-- recordedAt → launchedAt
ALTER TABLE "student_grades"
  RENAME COLUMN "recordedAt" TO "launchedAt";
ALTER TABLE "student_grades"
  ALTER COLUMN "launchedAt" DROP NOT NULL;

-- Remover status (não existe mais)
ALTER TABLE "student_grades"
  DROP COLUMN IF EXISTS "status";

-- Adicionar notes
ALTER TABLE "student_grades"
  ADD COLUMN "notes" TEXT;

-- Ajustar FK
ALTER TABLE "student_grades"
  DROP CONSTRAINT IF EXISTS "student_grades_recordedById_fkey";
ALTER TABLE "student_grades"
  ADD CONSTRAINT "student_grades_launchedById_fkey"
  FOREIGN KEY ("launchedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================
-- EXPANDIR: enrollments
-- ============================================================

ALTER TABLE "enrollments"
  ADD COLUMN "exitDate" DATE;

-- ============================================================
-- NOVA TABELA: teacher_profiles
-- ============================================================

CREATE TABLE "teacher_profiles" (
  "id"             UUID NOT NULL DEFAULT gen_random_uuid(),
  "schoolId"       UUID NOT NULL,
  "userId"         UUID NOT NULL,
  "internalCode"   VARCHAR(30),
  "cpf"            VARCHAR(14),
  "rg"             VARCHAR(20),
  "birthDate"      DATE,
  "gender"         "Gender",
  "nationality"    VARCHAR(100),
  "formation"      VARCHAR(200),
  "specialization" VARCHAR(200),
  "workloadHours"  INTEGER,
  "admissionDate"  DATE,
  "status"         "TeacherStatus" NOT NULL DEFAULT 'ATIVO',
  "zipCode"        VARCHAR(9),
  "street"         VARCHAR(200),
  "addressNumber"  VARCHAR(20),
  "neighborhood"   VARCHAR(100),
  "city"           VARCHAR(100),
  "state"          VARCHAR(2),
  "canGrade"       BOOLEAN NOT NULL DEFAULT true,
  "canAttendance"  BOOLEAN NOT NULL DEFAULT true,
  "canEditContent" BOOLEAN NOT NULL DEFAULT true,
  "canViewReports" BOOLEAN NOT NULL DEFAULT true,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "teacher_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "teacher_profiles_userId_key" ON "teacher_profiles"("userId");
CREATE INDEX "teacher_profiles_schoolId_idx" ON "teacher_profiles"("schoolId");

ALTER TABLE "teacher_profiles"
  ADD CONSTRAINT "teacher_profiles_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- NOVA TABELA: guardian_profiles
-- ============================================================

CREATE TABLE "guardian_profiles" (
  "id"              UUID NOT NULL DEFAULT gen_random_uuid(),
  "schoolId"        UUID NOT NULL,
  "userId"          UUID NOT NULL,
  "cpf"             VARCHAR(14),
  "rg"              VARCHAR(20),
  "birthDate"       DATE,
  "maritalStatus"   VARCHAR(50),
  "profession"      VARCHAR(100),
  "phoneSecondary"  VARCHAR(20),
  "zipCode"         VARCHAR(9),
  "street"          VARCHAR(200),
  "addressNumber"   VARCHAR(20),
  "neighborhood"    VARCHAR(100),
  "city"            VARCHAR(100),
  "state"           VARCHAR(2),
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "guardian_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "guardian_profiles_userId_key" ON "guardian_profiles"("userId");
CREATE INDEX "guardian_profiles_schoolId_idx" ON "guardian_profiles"("schoolId");

ALTER TABLE "guardian_profiles"
  ADD CONSTRAINT "guardian_profiles_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- NOVA TABELA: student_health
-- ============================================================

CREATE TABLE "student_health" (
  "id"                   UUID NOT NULL DEFAULT gen_random_uuid(),
  "schoolId"             UUID NOT NULL,
  "studentId"            UUID NOT NULL,
  "allergies"            TEXT,
  "dietaryRestrictions"  TEXT,
  "specialNeeds"         TEXT,
  "medication"           TEXT,
  "bloodType"            VARCHAR(5),
  "healthNotes"          TEXT,
  "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "student_health_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "student_health_studentId_key" ON "student_health"("studentId");
CREATE INDEX "student_health_schoolId_studentId_idx" ON "student_health"("schoolId", "studentId");

ALTER TABLE "student_health"
  ADD CONSTRAINT "student_health_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- NOVA TABELA: student_documents
-- ============================================================

CREATE TABLE "student_documents" (
  "id"        UUID NOT NULL DEFAULT gen_random_uuid(),
  "schoolId"  UUID NOT NULL,
  "studentId" UUID NOT NULL,
  "type"      "DocumentType" NOT NULL,
  "name"      VARCHAR(200) NOT NULL,
  "fileUrl"   TEXT,
  "delivered" BOOLEAN NOT NULL DEFAULT false,
  "notes"     TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "student_documents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "student_documents_schoolId_studentId_idx" ON "student_documents"("schoolId", "studentId");

ALTER TABLE "student_documents"
  ADD CONSTRAINT "student_documents_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- NOVA TABELA: enrollment_history
-- ============================================================

CREATE TABLE "enrollment_history" (
  "id"           UUID NOT NULL DEFAULT gen_random_uuid(),
  "schoolId"     UUID NOT NULL,
  "studentId"    UUID NOT NULL,
  "enrollmentId" UUID,
  "type"         "MovementType" NOT NULL,
  "description"  TEXT,
  "fromValue"    VARCHAR(200),
  "toValue"      VARCHAR(200),
  "createdById"  UUID,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "enrollment_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "enrollment_history_schoolId_studentId_idx" ON "enrollment_history"("schoolId", "studentId");

ALTER TABLE "enrollment_history"
  ADD CONSTRAINT "enrollment_history_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "enrollment_history"
  ADD CONSTRAINT "enrollment_history_enrollmentId_fkey"
  FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "enrollment_history"
  ADD CONSTRAINT "enrollment_history_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================
-- EXPANDIR: users (relações novas — sem coluna nova, só para o Prisma saber)
-- As relações teacherProfile, guardianProfile e enrollmentHistories
-- são apenas referências inversas; não precisam de coluna em users.
-- ============================================================

-- Nada a fazer em users para as novas relações (são relações inversas).