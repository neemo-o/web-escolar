import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import schoolsRoutes from "./modules/schools/schools.routes";
import authRoutes from "./modules/auth/auth.routes";
import usersRoutes from "./modules/users/users.routes";
import academicYearsRoutes from "./modules/academic-years/academic-years.routes";
import periodsRoutes from "./modules/periods/periods.routes";
import gradeLevelsRoutes from "./modules/grade-levels/grade-levels.routes";
import subjectsRoutes from "./modules/subjects/subjects.routes";
import classroomsRoutes from "./modules/classrooms/classrooms.routes";
import classroomTeachersRoutes from "./modules/classroom-teachers/classroom-teachers.routes";
import classroomSubjectsRoutes from "./modules/classroom-subjects/classroom-subjects.routes";
import studentsRoutes from "./modules/students/students.routes";
import enrollmentsRoutes from "./modules/enrollments/enrollments.routes";
import assessmentsRoutes from "./modules/assessments/assessments.routes";
import profileRoutes from "./modules/profile/profiles.routes";
import gradesRoutes from "./modules/grades/grades.routes";
import attendanceRoutes from "./modules/attendance/attendance.routes";
import notificationsRoutes from "./modules/notifications/notifications.routes";
import schedulesRoutes from "./modules/schedules/schedules.routes";
import timeBlocksRoutes from "./modules/time-blocks/time-blocks.routes";
import roomsRoutes from "./modules/rooms/rooms.routes";
import documentsRoutes from "./modules/documents/documents.routes";
import { authenticate } from "./middlewares/authenticate";
import { requireActiveSchool } from "./middlewares/requireActiveSchool";
import { requireTenantMatch } from "./middlewares/tenant";


const app = express();

// global body parser with reasonable limit
app.use(express.json({ limit: "100kb" }));

// security and CORS middlewares
app.use(helmet());
const corsOrigin = process.env.CORS_ORIGIN;
if (!corsOrigin) {
  console.error("FATAL: CORS_ORIGIN não configurado");
  process.exit(1);
}
app.use(cors({ origin: corsOrigin, credentials: true }));

// Public routes that must run before tenant middlewares
app.use(schoolsRoutes);
app.use(authRoutes);

// Global authentication/tenant middlewares
app.use(authenticate);
app.use(requireActiveSchool);
app.use(requireTenantMatch);

// Routes that require authentication/tenant
app.use(academicYearsRoutes);
app.use(periodsRoutes);
app.use(gradeLevelsRoutes);
app.use(subjectsRoutes);
app.use(classroomsRoutes);
app.use(classroomTeachersRoutes);
app.use(classroomSubjectsRoutes);
app.use(studentsRoutes);
app.use(enrollmentsRoutes);
app.use(assessmentsRoutes);
app.use(gradesRoutes);
app.use(attendanceRoutes);
app.use(profileRoutes);
app.use(usersRoutes);
app.use(notificationsRoutes);
app.use(schedulesRoutes);
app.use(timeBlocksRoutes);
app.use(roomsRoutes);
app.use(documentsRoutes);

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Erro interno do servidor" });
});

export { app };
