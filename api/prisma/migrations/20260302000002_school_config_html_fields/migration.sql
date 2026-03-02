ALTER TABLE "school_configs"
  ADD COLUMN IF NOT EXISTS "headerHtml" TEXT,
  ADD COLUMN IF NOT EXISTS "footerHtml"  TEXT;
