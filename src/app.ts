import express from "express";
import schoolsRoutes from "./modules/schools/schools.routes";
import authRoutes from "./modules/auth/auth.routes";
import usersRoutes from "./modules/users/users.routes";
import { authenticate } from "./middlewares/authenticate";
import { requireActiveSchool } from "./middlewares/requireActiveSchool";
import { requireTenantMatch } from "./middlewares/tenant";

const app = express();

app.use(express.json());

// Schools routes must be registered before global tenant middlewares
app.use(schoolsRoutes);
app.use(authRoutes);
app.use(usersRoutes);
app.use(authenticate);
app.use(requireActiveSchool);
app.use(requireTenantMatch);

// Routes that require authentication/tenant
import academicYearsRoutes from "./modules/academic-years/academic-years.routes";
app.use(academicYearsRoutes);
import periodsRoutes from "./modules/periods/periods.routes";
app.use(periodsRoutes);
import gradeLevelsRoutes from "./modules/grade-levels/grade-levels.routes";
app.use(gradeLevelsRoutes);
import subjectsRoutes from "./modules/subjects/subjects.routes";
app.use(subjectsRoutes);
import classroomsRoutes from "./modules/classrooms/classrooms.routes";
app.use(classroomsRoutes);
import classroomTeachersRoutes from "./modules/classroom-teachers/classroom-teachers.routes";
app.use(classroomTeachersRoutes);
import classroomSubjectsRoutes from "./modules/classroom-subjects/classroom-subjects.routes";
app.use(classroomSubjectsRoutes);
import studentsRoutes from "./modules/students/students.routes";
app.use(studentsRoutes);
import enrollmentsRoutes from "./modules/enrollments/enrollments.routes";
app.use(enrollmentsRoutes);
import assessmentsRoutes from "./modules/assessments/assessments.routes";
app.use(assessmentsRoutes);
import gradesRoutes from "./modules/grades/grades.routes";
app.use(gradesRoutes);
import attendanceRoutes from "./modules/attendance/attendance.routes";
app.use(attendanceRoutes);

export { app };
