-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('DECLARACAO', 'COMUNICADO', 'ADVERTENCIA', 'SUSPENSAO', 'BOLETIM', 'CONTRATO', 'COMPROVANTE', 'OUTRO');

-- CreateEnum
CREATE TYPE "IssuedDocumentStatus" AS ENUM ('RASCUNHO', 'EMITIDO', 'ENTREGUE', 'CANCELADO');

-- CreateTable
CREATE TABLE "document_templates" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "category" "DocumentCategory" NOT NULL DEFAULT 'OUTRO',
    "description" TEXT,
    "headerHtml" TEXT,
    "footerHtml" TEXT,
    "bodyTemplate" TEXT NOT NULL DEFAULT '',
    "logoUrl" TEXT,
    "requiresSignature" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "document_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issued_documents" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "templateId" UUID,
    "studentId" UUID,
    "enrollmentId" UUID,
    "title" VARCHAR(300) NOT NULL,
    "bodySnapshot" TEXT NOT NULL DEFAULT '',
    "headerSnapshot" TEXT,
    "footerSnapshot" TEXT,
    "category" "DocumentCategory" NOT NULL DEFAULT 'OUTRO',
    "status" "IssuedDocumentStatus" NOT NULL DEFAULT 'RASCUNHO',
    "fileUrl" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "deliveredById" UUID,
    "notes" TEXT,
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "issued_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "document_templates_schoolId_idx" ON "document_templates"("schoolId");

-- CreateIndex
CREATE INDEX "document_templates_schoolId_category_idx" ON "document_templates"("schoolId", "category");

-- CreateIndex
CREATE INDEX "issued_documents_schoolId_idx" ON "issued_documents"("schoolId");

-- CreateIndex
CREATE INDEX "issued_documents_schoolId_studentId_idx" ON "issued_documents"("schoolId", "studentId");

-- CreateIndex
CREATE INDEX "issued_documents_schoolId_status_idx" ON "issued_documents"("schoolId", "status");

-- CreateIndex
CREATE INDEX "issued_documents_schoolId_category_idx" ON "issued_documents"("schoolId", "category");

-- AddForeignKey
ALTER TABLE "document_templates" ADD CONSTRAINT "document_templates_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_templates" ADD CONSTRAINT "document_templates_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issued_documents" ADD CONSTRAINT "issued_documents_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issued_documents" ADD CONSTRAINT "issued_documents_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "document_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issued_documents" ADD CONSTRAINT "issued_documents_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issued_documents" ADD CONSTRAINT "issued_documents_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issued_documents" ADD CONSTRAINT "issued_documents_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issued_documents" ADD CONSTRAINT "issued_documents_deliveredById_fkey" FOREIGN KEY ("deliveredById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
