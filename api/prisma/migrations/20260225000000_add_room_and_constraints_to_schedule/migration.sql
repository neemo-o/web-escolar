-- Add room field and unique constraint to prevent schedule conflicts
ALTER TABLE "schedules" ADD COLUMN "room" VARCHAR(50);

CREATE UNIQUE INDEX "schedules_classroom_day_start_unique" 
ON "schedules" ("classroomId", "dayOfWeek", "startTime");

CREATE INDEX "schedules_school_dayofweek_idx" 
ON "schedules" ("schoolId", "dayOfWeek");
