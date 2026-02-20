-- CreateTable
CREATE TABLE "enrollment_counters" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enrollment_counters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "enrollment_counters_schoolId_idx" ON "enrollment_counters"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "enrollment_counters_schoolId_year_key" ON "enrollment_counters"("schoolId", "year");
