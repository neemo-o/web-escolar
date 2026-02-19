import express from "express";
import authRoutes from "./modules/auth/auth.routes";
import { authenticate } from "./middlewares/authenticate";
import { requireActiveSchool } from "./middlewares/requireActiveSchool";
import { requireTenantMatch } from "./middlewares/tenant";

const app = express();

app.use(express.json());

app.use(authRoutes);

app.use(authenticate);
app.use(requireActiveSchool);
app.use(requireTenantMatch);

export { app };
