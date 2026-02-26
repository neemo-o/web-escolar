import React from "react";
import {
  iconHome,
  iconSchool,
  iconUsers,
  iconChart,
  iconClipboard,
  iconBook,
  iconStar,
  iconKey,
  iconCalendar,
  iconHeart,
} from "./icons";

export type NavItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
};
export type NavGroup = { label: string; items: NavItem[] };

function iconLayers() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function iconSubject() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <line x1="8" y1="7" x2="16" y2="7" />
      <line x1="8" y1="11" x2="16" y2="11" />
      <line x1="8" y1="15" x2="13" y2="15" />
    </svg>
  );
}

function iconYear() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function iconDocuments() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

export function getNavGroups(role: string): NavGroup[] {
  switch (role) {
    case "ADMIN_GLOBAL":
      return [
        {
          label: "Visão Geral",
          items: [{ id: "overview", label: "Painel Geral", icon: iconHome() }],
        },
        {
          label: "Gestão de Sistema",
          items: [
            { id: "schools", label: "Escolas", icon: iconSchool() },
            { id: "global-users", label: "Usuários", icon: iconUsers() },
          ],
        },
        {
          label: "Monitoramento",
          items: [
            { id: "reports", label: "Relatórios", icon: iconChart() },
            { id: "audit", label: "Auditoria", icon: iconClipboard() },
          ],
        },
      ];

    case "SECRETARY":
      return [
        {
          label: "Visão Geral",
          items: [{ id: "overview", label: "Painel", icon: iconHome() }],
        },
        {
          label: "Cadastros",
          items: [
            { id: "students", label: "Alunos", icon: iconUsers() },
            { id: "users", label: "Usuários", icon: iconUsers() },
            { id: "classrooms", label: "Turmas", icon: iconBook() },
            { id: "enrollments", label: "Matrículas", icon: iconClipboard() },
          ],
        },
        {
          // FIX #11 #12 #13: Configuration section now visible in sidebar
          label: "Configuração",
          items: [
            { id: "academic-years", label: "Anos Letivos", icon: iconYear() },
            { id: "grade-levels", label: "Séries / Anos", icon: iconLayers() },
            { id: "subjects", label: "Disciplinas", icon: iconSubject() },
          ],
        },
        {
          label: "Acadêmico",
          items: [
            { id: "schedule", label: "Horário", icon: iconCalendar() },
            { id: "grades-view", label: "Notas", icon: iconStar() },
            { id: "reports", label: "Relatórios", icon: iconChart() },
            { id: "documents", label: "Documentos", icon: iconClipboard() },
          ],
        },
        {
          label: "Administração",
          items: [
            {
              id: "reset-password",
              label: "Redefinir Senhas",
              icon: iconKey(),
            },
          ],
        },
      ];

    case "TEACHER":
      return [
        {
          label: "Visão Geral",
          items: [{ id: "overview", label: "Painel", icon: iconHome() }],
        },
        {
          label: "Ensino",
          items: [
            { id: "my-classrooms", label: "Minhas Turmas", icon: iconBook() },
            { id: "my-students", label: "Meus Alunos", icon: iconUsers() },
            { id: "assessments", label: "Avaliações", icon: iconClipboard() },
            { id: "grades", label: "Notas", icon: iconStar() },
            { id: "progress", label: "Progresso", icon: iconChart() },
          ],
        },
        {
          label: "Agenda",
          items: [{ id: "schedule", label: "Horários", icon: iconCalendar() }],
        },
      ];

    case "STUDENT":
      return [
        {
          label: "Visão Geral",
          items: [{ id: "overview", label: "Painel", icon: iconHome() }],
        },
        {
          label: "Acadêmico",
          items: [
            { id: "my-grades", label: "Minhas Notas", icon: iconStar() },
            {
              id: "my-assessments",
              label: "Avaliações",
              icon: iconClipboard(),
            },
            { id: "my-progress", label: "Progresso", icon: iconChart() },
            // FIX #23: correct route for student classrooms (was pointing to guardian route)
            {
              id: "student-classrooms",
              label: "Minhas Turmas",
              icon: iconBook(),
            },
          ],
        },
      ];

    case "GUARDIAN":
      return [
        {
          label: "Visão Geral",
          items: [{ id: "overview", label: "Painel", icon: iconHome() }],
        },
        {
          label: "Acompanhamento",
          items: [
            { id: "student-classrooms", label: "Turmas", icon: iconBook() },
            { id: "student-grades", label: "Notas", icon: iconStar() },
            {
              id: "student-assessments",
              label: "Avaliações",
              icon: iconClipboard(),
            },
            { id: "student-progress", label: "Progresso", icon: iconChart() },
            { id: "student-health", label: "Frequência", icon: iconHeart() },
          ],
        },
      ];

    default:
      return [
        {
          label: "Visão Geral",
          items: [{ id: "overview", label: "Painel", icon: iconHome() }],
        },
      ];
  }
}

export const PAGE_TITLES: Record<string, string> = {
  overview: "Painel",
  schools: "Escolas",
  "global-users": "Usuários Globais",
  reports: "Relatórios",
  audit: "Auditoria",
  users: "Usuários",
  classrooms: "Turmas",
  enrollments: "Matrículas",
  "academic-years": "Anos Letivos",
  "grade-levels": "Séries / Anos",
  subjects: "Disciplinas",
  "grades-view": "Notas",
  "reset-password": "Redefinir Senhas",
  "my-classrooms": "Minhas Turmas",
  "my-students": "Meus Alunos",
  schedule: "Horários",
  assessments: "Avaliações",
  grades: "Notas",
  progress: "Progresso",
  students: "Alunos",
  documents: "Documentos",
  "my-grades": "Minhas Notas",
  "my-assessments": "Avaliações",
  "my-progress": "Progresso",
  "student-classrooms": "Turmas do Aluno",
  "student-grades": "Notas do Aluno",
  "student-assessments": "Avaliações do Aluno",
  "student-progress": "Progresso do Aluno",
  "student-health": "Frequência do Aluno",
  profile: "Perfil",
  settings: "Configurações",
};
