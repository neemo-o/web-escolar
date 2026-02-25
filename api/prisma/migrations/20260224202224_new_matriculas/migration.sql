-- AlterTable
ALTER TABLE "enrollment_documents" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "guardian_profiles" ALTER COLUMN "cpf" SET DATA TYPE VARCHAR(20);

-- AlterTable
ALTER TABLE "notifications" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "students" ALTER COLUMN "cpf" SET DATA TYPE VARCHAR(20);

-- AlterTable
ALTER TABLE "teacher_profiles" ALTER COLUMN "cpf" SET DATA TYPE VARCHAR(20);
