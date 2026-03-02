-- AlterTable: SchoolConfig — campos de identidade para documentos
ALTER TABLE "school_configs"
  ADD COLUMN IF NOT EXISTS "footerDefault"  TEXT,
  ADD COLUMN IF NOT EXISTS "address"        VARCHAR(300),
  ADD COLUMN IF NOT EXISTS "phone"          VARCHAR(50),
  ADD COLUMN IF NOT EXISTS "contactEmail"   VARCHAR(150),
  ADD COLUMN IF NOT EXISTS "website"        VARCHAR(150);

-- AlterTable: DocumentTemplate — assinaturas configuráveis
ALTER TABLE "document_templates"
  ADD COLUMN IF NOT EXISTS "signatureLines" JSONB;

-- AlterTable: IssuedDocument — campos críticos para MVP
ALTER TABLE "issued_documents"
  ADD COLUMN IF NOT EXISTS "templateTypeSaved" TEXT NOT NULL DEFAULT 'FREE',
  ADD COLUMN IF NOT EXISTS "signatureLines"     JSONB,
  ADD COLUMN IF NOT EXISTS "resolvedBody"       TEXT,
  ADD COLUMN IF NOT EXISTS "resolvedHeader"     TEXT,
  ADD COLUMN IF NOT EXISTS "resolvedFooter"     TEXT,
  ADD COLUMN IF NOT EXISTS "emittedAt"          TIMESTAMP(3);

-- Backfill templateTypeSaved para documentos existentes
UPDATE "issued_documents" d
SET "templateTypeSaved" = COALESCE(
  (SELECT t."templateType"::TEXT FROM "document_templates" t WHERE t.id = d."templateId"),
  'FREE'
);

-- CreateTable: presets de assinaturas reutilizáveis
CREATE TABLE IF NOT EXISTS "document_signature_presets" (
  "id"        UUID         NOT NULL DEFAULT gen_random_uuid(),
  "schoolId"  UUID         NOT NULL,
  "label"     VARCHAR(100) NOT NULL,
  "isDefault" BOOLEAN      NOT NULL DEFAULT false,
  "sortOrder" INT          NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "document_signature_presets_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "document_signature_presets_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "document_signature_presets_schoolId_idx"
  ON "document_signature_presets"("schoolId");