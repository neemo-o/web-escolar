export const ROUTE_ROLES: Record<string, string[]> = {
  // common
  overview: ["ADMIN_GLOBAL", "SECRETARY", "TEACHER", "STUDENT", "GUARDIAN"],
  profile: ["ADMIN_GLOBAL", "SECRETARY", "TEACHER", "STUDENT", "GUARDIAN"],
  settings: ["ADMIN_GLOBAL", "SECRETARY", "TEACHER", "STUDENT", "GUARDIAN"],

  // admin
  schools: ["ADMIN_GLOBAL"],
  "global-users": ["ADMIN_GLOBAL"],
  audit: ["ADMIN_GLOBAL"],

  // secretary
  users: ["SECRETARY"],
  classrooms: ["SECRETARY"],
  enrollments: ["SECRETARY"],
  "grades-view": ["SECRETARY"],
  "reset-password": ["SECRETARY"],
  reports: ["ADMIN_GLOBAL", "SECRETARY"],

  // teacher
  "my-classrooms": ["TEACHER"],
  "my-students": ["TEACHER"],
  schedule: ["TEACHER", "SECRETARY"],
  assessments: ["TEACHER"],
  grades: ["TEACHER"],
  progress: ["TEACHER"],

  // student
  "my-grades": ["STUDENT"],
  "my-assessments": ["STUDENT"],
  "my-progress": ["STUDENT"],

  // guardian
  "student-classrooms": ["GUARDIAN"],
  "student-grades": ["GUARDIAN"],
  "student-assessments": ["GUARDIAN"],
  "student-progress": ["GUARDIAN"],
  "student-health": ["GUARDIAN"],
};

export default ROUTE_ROLES;
