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

export { app };
