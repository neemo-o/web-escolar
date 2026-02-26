/*
  Warnings:

  - You are about to drop the column `logoUrl` on the `document_templates` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "TemplateType" AS ENUM ('FREE', 'BOLETIM', 'COMPROVANTE_MATRICULA', 'HISTORICO_ESCOLAR', 'DECLARACAO_FREQUENCIA', 'FICHA_ALUNO');

-- AlterTable
ALTER TABLE "document_templates" DROP COLUMN "logoUrl",
ADD COLUMN     "showLogo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "structuredConfig" JSONB,
ADD COLUMN     "templateType" "TemplateType" NOT NULL DEFAULT 'FREE';

-- AlterTable
ALTER TABLE "issued_documents" ADD COLUMN     "structuredPayload" JSONB;

-- CreateIndex
CREATE INDEX "document_templates_schoolId_templateType_idx" ON "document_templates"("schoolId", "templateType");
