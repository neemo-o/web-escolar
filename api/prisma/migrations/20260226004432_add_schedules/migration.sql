-- RenameIndex
ALTER INDEX "schedules_classroom_day_start_unique" RENAME TO "schedules_classroomId_dayOfWeek_startTime_key";

-- RenameIndex
ALTER INDEX "schedules_school_dayofweek_idx" RENAME TO "schedules_schoolId_dayOfWeek_idx";
