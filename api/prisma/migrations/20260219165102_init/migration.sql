-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ATIVA', 'CONCLUIDA', 'CANCELADA', 'TRANSFERIDA', 'SUSPENSA', 'TRANCADA');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('RASCUNHO', 'PUBLICADA', 'ENCERRADA', 'ANULADA');

-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('RASCUNHO', 'PUBLICADA', 'ENCERRADA', 'ACEITA_ATRASO', 'ARQUIVADA');

-- CreateEnum
CREATE TYPE "AcademicYearStatus" AS ENUM ('PLANEJAMENTO', 'EM_ANDAMENTO', 'ENCERRADO', 'ARQUIVADO');

-- CreateEnum
CREATE TYPE "Shift" AS ENUM ('MANHA', 'TARDE', 'NOTURNO', 'INTEGRAL');

-- CreateTable
CREATE TABLE "schools" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "cnpj" VARCHAR(18) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_configs" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "timezone" VARCHAR(60) NOT NULL DEFAULT 'America/Sao_Paulo',
    "locale" VARCHAR(10) NOT NULL DEFAULT 'pt-BR',
    "primaryColor" VARCHAR(7),
    "secondaryColor" VARCHAR(7),
    "logoUrl" TEXT,
    "displayName" VARCHAR(200),
    "periodType" VARCHAR(20) NOT NULL DEFAULT 'bimestre',
    "periodsPerYear" INTEGER NOT NULL DEFAULT 4,
    "passingGrade" DECIMAL(5,2) NOT NULL DEFAULT 60.0,
    "gradeScale" DECIMAL(5,2) NOT NULL DEFAULT 100.0,
    "recoveryGrade" DECIMAL(5,2),
    "decimalPlaces" INTEGER NOT NULL DEFAULT 1,
    "minAttendancePct" DECIMAL(5,2) NOT NULL DEFAULT 75.0,
    "countAbsenceType" VARCHAR(20) NOT NULL DEFAULT 'por_aula',
    "justifyAbsenceLimit" INTEGER NOT NULL DEFAULT 10,
    "allowGradeEditAfterClose" BOOLEAN NOT NULL DEFAULT false,
    "allowLateEnrollment" BOOLEAN NOT NULL DEFAULT false,
    "requireGuardianApproval" BOOLEAN NOT NULL DEFAULT false,
    "notifyGradeLaunch" BOOLEAN NOT NULL DEFAULT true,
    "notifyAbsence" BOOLEAN NOT NULL DEFAULT true,
    "notifyFrequencyThreshold" DECIMAL(5,2) NOT NULL DEFAULT 80.0,
    "directorName" VARCHAR(200),
    "directorTitle" VARCHAR(100) DEFAULT 'Diretor(a)',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "phone" VARCHAR(20),
    "avatarUrl" TEXT,
    "emailVerifiedAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_user_roles" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "school_user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_years" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "status" "AcademicYearStatus" NOT NULL DEFAULT 'PLANEJAMENTO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "periods" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "academicYearId" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "sequence" INTEGER NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grade_levels" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "description" VARCHAR(255),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grade_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "description" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classrooms" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "academicYearId" UUID NOT NULL,
    "gradeLevelId" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "shift" "Shift" NOT NULL,
    "capacity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "classrooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classroom_subjects" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "classroomId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "workloadHours" INTEGER,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "dateFrom" DATE NOT NULL,
    "dateTo" DATE,
    "removedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "classroom_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classroom_teachers" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "classroomId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "teacherId" UUID NOT NULL,
    "dateFrom" DATE NOT NULL,
    "dateTo" DATE,
    "reasonChange" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "classroom_teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedules" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "classroomId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TIME NOT NULL,
    "endTime" TIME NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "cpf" VARCHAR(14),
    "birthDate" DATE,
    "email" VARCHAR(255),
    "phone" VARCHAR(20),
    "address" VARCHAR(500),
    "avatarUrl" TEXT,
    "userId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_guardians" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "relationship" VARCHAR(50) NOT NULL,
    "phone" VARCHAR(20),
    "email" VARCHAR(255),
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_guardians_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "classroomId" UUID NOT NULL,
    "academicYearId" UUID NOT NULL,
    "enrollmentNumber" VARCHAR(20) NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ATIVA',
    "enrolledAt" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessments" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "classroomId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "periodId" UUID NOT NULL,
    "createdById" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'RASCUNHO',
    "maxScore" DECIMAL(5,2) NOT NULL,
    "weight" DECIMAL(4,2) NOT NULL DEFAULT 1.0,
    "date" DATE NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_grades" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "assessmentId" UUID NOT NULL,
    "enrollmentId" UUID NOT NULL,
    "score" DECIMAL(5,2),
    "status" VARCHAR(30) NOT NULL DEFAULT 'lancada',
    "recordedById" UUID NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "period_grades" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "enrollmentId" UUID NOT NULL,
    "periodId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "grade" DECIMAL(5,2) NOT NULL,
    "absences" INTEGER NOT NULL DEFAULT 0,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "period_grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "final_grades" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "enrollmentId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "finalGrade" DECIMAL(5,2) NOT NULL,
    "totalAbsences" INTEGER NOT NULL DEFAULT 0,
    "result" VARCHAR(30) NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "final_grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_sessions" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "classroomId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "createdById" UUID NOT NULL,
    "sessionDate" DATE NOT NULL,
    "startTime" TIME NOT NULL,
    "endTime" TIME NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_records" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "enrollmentId" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "justification" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "classroomId" UUID NOT NULL,
    "createdById" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "status" "ActivityStatus" NOT NULL DEFAULT 'RASCUNHO',
    "dueDate" TIMESTAMP(3),
    "maxScore" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_submissions" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "activityId" UUID NOT NULL,
    "enrollmentId" UUID NOT NULL,
    "content" TEXT,
    "fileUrl" TEXT,
    "score" DECIMAL(5,2),
    "feedback" TEXT,
    "feedbackById" UUID,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_events" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "location" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "schools_cnpj_key" ON "schools"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "schools_slug_key" ON "schools"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "school_configs_schoolId_key" ON "school_configs"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE INDEX "school_user_roles_schoolId_userId_idx" ON "school_user_roles"("schoolId", "userId");

-- CreateIndex
CREATE INDEX "school_user_roles_schoolId_active_idx" ON "school_user_roles"("schoolId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "school_user_roles_schoolId_userId_roleId_key" ON "school_user_roles"("schoolId", "userId", "roleId");

-- CreateIndex
CREATE INDEX "academic_years_schoolId_active_idx" ON "academic_years"("schoolId", "active");

-- CreateIndex
CREATE INDEX "academic_years_schoolId_status_idx" ON "academic_years"("schoolId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "academic_years_schoolId_year_key" ON "academic_years"("schoolId", "year");

-- CreateIndex
CREATE INDEX "periods_schoolId_academicYearId_idx" ON "periods"("schoolId", "academicYearId");

-- CreateIndex
CREATE UNIQUE INDEX "periods_academicYearId_sequence_key" ON "periods"("academicYearId", "sequence");

-- CreateIndex
CREATE INDEX "grade_levels_schoolId_idx" ON "grade_levels"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "grade_levels_schoolId_code_key" ON "grade_levels"("schoolId", "code");

-- CreateIndex
CREATE INDEX "subjects_schoolId_idx" ON "subjects"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_schoolId_code_key" ON "subjects"("schoolId", "code");

-- CreateIndex
CREATE INDEX "classrooms_schoolId_academicYearId_idx" ON "classrooms"("schoolId", "academicYearId");

-- CreateIndex
CREATE INDEX "classrooms_schoolId_gradeLevelId_idx" ON "classrooms"("schoolId", "gradeLevelId");

-- CreateIndex
CREATE UNIQUE INDEX "classrooms_schoolId_academicYearId_name_key" ON "classrooms"("schoolId", "academicYearId", "name");

-- CreateIndex
CREATE INDEX "classroom_subjects_schoolId_classroomId_idx" ON "classroom_subjects"("schoolId", "classroomId");

-- CreateIndex
CREATE INDEX "classroom_teachers_schoolId_classroomId_idx" ON "classroom_teachers"("schoolId", "classroomId");

-- CreateIndex
CREATE INDEX "classroom_teachers_schoolId_teacherId_idx" ON "classroom_teachers"("schoolId", "teacherId");

-- CreateIndex
CREATE INDEX "schedules_schoolId_classroomId_idx" ON "schedules"("schoolId", "classroomId");

-- CreateIndex
CREATE UNIQUE INDEX "students_userId_key" ON "students"("userId");

-- CreateIndex
CREATE INDEX "students_schoolId_idx" ON "students"("schoolId");

-- CreateIndex
CREATE INDEX "students_schoolId_name_idx" ON "students"("schoolId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "students_schoolId_cpf_key" ON "students"("schoolId", "cpf");

-- CreateIndex
CREATE INDEX "student_guardians_studentId_idx" ON "student_guardians"("studentId");

-- CreateIndex
CREATE INDEX "enrollments_schoolId_academicYearId_status_idx" ON "enrollments"("schoolId", "academicYearId", "status");

-- CreateIndex
CREATE INDEX "enrollments_schoolId_studentId_idx" ON "enrollments"("schoolId", "studentId");

-- CreateIndex
CREATE INDEX "enrollments_schoolId_classroomId_idx" ON "enrollments"("schoolId", "classroomId");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_schoolId_enrollmentNumber_key" ON "enrollments"("schoolId", "enrollmentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_schoolId_studentId_academicYearId_key" ON "enrollments"("schoolId", "studentId", "academicYearId");

-- CreateIndex
CREATE INDEX "assessments_schoolId_classroomId_periodId_idx" ON "assessments"("schoolId", "classroomId", "periodId");

-- CreateIndex
CREATE INDEX "assessments_schoolId_classroomId_status_idx" ON "assessments"("schoolId", "classroomId", "status");

-- CreateIndex
CREATE INDEX "student_grades_schoolId_assessmentId_idx" ON "student_grades"("schoolId", "assessmentId");

-- CreateIndex
CREATE INDEX "student_grades_schoolId_enrollmentId_idx" ON "student_grades"("schoolId", "enrollmentId");

-- CreateIndex
CREATE UNIQUE INDEX "student_grades_assessmentId_enrollmentId_key" ON "student_grades"("assessmentId", "enrollmentId");

-- CreateIndex
CREATE INDEX "period_grades_schoolId_enrollmentId_idx" ON "period_grades"("schoolId", "enrollmentId");

-- CreateIndex
CREATE UNIQUE INDEX "period_grades_enrollmentId_periodId_subjectId_key" ON "period_grades"("enrollmentId", "periodId", "subjectId");

-- CreateIndex
CREATE INDEX "final_grades_schoolId_enrollmentId_idx" ON "final_grades"("schoolId", "enrollmentId");

-- CreateIndex
CREATE UNIQUE INDEX "final_grades_enrollmentId_subjectId_key" ON "final_grades"("enrollmentId", "subjectId");

-- CreateIndex
CREATE INDEX "attendance_sessions_schoolId_classroomId_sessionDate_idx" ON "attendance_sessions"("schoolId", "classroomId", "sessionDate");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_sessions_classroomId_subjectId_sessionDate_start_key" ON "attendance_sessions"("classroomId", "subjectId", "sessionDate", "startTime");

-- CreateIndex
CREATE INDEX "attendance_records_schoolId_enrollmentId_idx" ON "attendance_records"("schoolId", "enrollmentId");

-- CreateIndex
CREATE INDEX "attendance_records_schoolId_sessionId_idx" ON "attendance_records"("schoolId", "sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_sessionId_enrollmentId_key" ON "attendance_records"("sessionId", "enrollmentId");

-- CreateIndex
CREATE INDEX "activities_schoolId_classroomId_status_idx" ON "activities"("schoolId", "classroomId", "status");

-- CreateIndex
CREATE INDEX "activities_schoolId_classroomId_dueDate_idx" ON "activities"("schoolId", "classroomId", "dueDate");

-- CreateIndex
CREATE INDEX "activity_submissions_schoolId_activityId_idx" ON "activity_submissions"("schoolId", "activityId");

-- CreateIndex
CREATE INDEX "activity_submissions_schoolId_enrollmentId_idx" ON "activity_submissions"("schoolId", "enrollmentId");

-- CreateIndex
CREATE UNIQUE INDEX "activity_submissions_activityId_enrollmentId_key" ON "activity_submissions"("activityId", "enrollmentId");

-- CreateIndex
CREATE INDEX "announcements_schoolId_createdAt_idx" ON "announcements"("schoolId", "createdAt");

-- CreateIndex
CREATE INDEX "school_events_schoolId_startDate_idx" ON "school_events"("schoolId", "startDate");

-- AddForeignKey
ALTER TABLE "school_configs" ADD CONSTRAINT "school_configs_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_user_roles" ADD CONSTRAINT "school_user_roles_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_user_roles" ADD CONSTRAINT "school_user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_user_roles" ADD CONSTRAINT "school_user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_years" ADD CONSTRAINT "academic_years_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "periods" ADD CONSTRAINT "periods_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_levels" ADD CONSTRAINT "grade_levels_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classrooms" ADD CONSTRAINT "classrooms_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classrooms" ADD CONSTRAINT "classrooms_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classrooms" ADD CONSTRAINT "classrooms_gradeLevelId_fkey" FOREIGN KEY ("gradeLevelId") REFERENCES "grade_levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_subjects" ADD CONSTRAINT "classroom_subjects_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "classrooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_subjects" ADD CONSTRAINT "classroom_subjects_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_teachers" ADD CONSTRAINT "classroom_teachers_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "classrooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_teachers" ADD CONSTRAINT "classroom_teachers_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_teachers" ADD CONSTRAINT "classroom_teachers_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "classrooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_guardians" ADD CONSTRAINT "student_guardians_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "classrooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "classrooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_grades" ADD CONSTRAINT "student_grades_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_grades" ADD CONSTRAINT "student_grades_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_grades" ADD CONSTRAINT "student_grades_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "period_grades" ADD CONSTRAINT "period_grades_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "period_grades" ADD CONSTRAINT "period_grades_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "final_grades" ADD CONSTRAINT "final_grades_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "classrooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "attendance_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "classrooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_submissions" ADD CONSTRAINT "activity_submissions_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_submissions" ADD CONSTRAINT "activity_submissions_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_submissions" ADD CONSTRAINT "activity_submissions_feedbackById_fkey" FOREIGN KEY ("feedbackById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_events" ADD CONSTRAINT "school_events_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
