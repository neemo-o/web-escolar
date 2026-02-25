-- Internal notifications (per-user inbox)

CREATE TABLE "notifications" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "schoolId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "type" VARCHAR(60) NOT NULL,
  "title" VARCHAR(120) NOT NULL,
  "message" VARCHAR(500) NOT NULL,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX  "notifications_schoolId_userId_readAt_idx"
ON "notifications"("schoolId", "userId", "readAt");

CREATE INDEX  "notifications_schoolId_createdAt_idx"
ON "notifications"("schoolId", "createdAt");

ALTER TABLE "notifications"
ADD CONSTRAINT "notifications_schoolId_fkey"
FOREIGN KEY ("schoolId") REFERENCES "schools"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notifications"
ADD CONSTRAINT "notifications_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

