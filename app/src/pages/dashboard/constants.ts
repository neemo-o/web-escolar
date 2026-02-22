export const ROLE_LABELS: Record<string, string> = {
  ADMIN_GLOBAL: "Administrador Global",
  SECRETARY: "Secretaria",
  TEACHER: "Professor",
  STUDENT: "Aluno",
  GUARDIAN: "Responsável",
};

export const ROLE_COLORS: Record<string, string> = {
  ADMIN_GLOBAL: "#7c3aed",
  SECRETARY: "#0891b2",
  TEACHER: "#059669",
  STUDENT: "#d97706",
  GUARDIAN: "#db2777",
};

export const MOCK_USER = {
  name: "Maria Fernanda",
  email: "maria@colegio.com",
  role: "SECRETARY",
  schoolId: "1",
  avatarUrl: null,
};

export const MOCK_SCHOOL = {
  name: "Colégio Alpha",
  color: "#4f46e5",
};

export default {};
