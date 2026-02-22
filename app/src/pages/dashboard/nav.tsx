import React from 'react'
import { iconHome, iconSchool, iconUsers, iconChart, iconClipboard, iconBook, iconStar, iconKey, iconCalendar, iconHeart } from './icons'

export type NavItem = { id: string; label: string; icon: React.ReactNode; badge?: number }
export type NavGroup = { label: string; items: NavItem[] }

export function getNavGroups(role: string): NavGroup[] {
  switch (role) {
    case 'ADMIN_GLOBAL':
      return [
        { label: 'Visão Geral', items: [{ id: 'overview', label: 'Painel Geral', icon: iconHome() }] },
        { label: 'Gestão de Sistema', items: [{ id: 'schools', label: 'Escolas', icon: iconSchool() }, { id: 'global-users', label: 'Usuários', icon: iconUsers() }] },
        { label: 'Monitoramento', items: [{ id: 'reports', label: 'Relatórios', icon: iconChart() }, { id: 'audit', label: 'Auditoria', icon: iconClipboard() }] },
      ]

    case 'SECRETARY':
      return [
        { label: 'Visão Geral', items: [{ id: 'overview', label: 'Painel', icon: iconHome() }] },
        { label: 'Gestão Escolar', items: [{ id: 'users', label: 'Usuários', icon: iconUsers() }, { id: 'classrooms', label: 'Turmas', icon: iconBook() }, { id: 'enrollments', label: 'Matrículas', icon: iconClipboard() }] },
        { label: 'Acadêmico', items: [{ id: 'grades-view', label: 'Notas', icon: iconStar() }, { id: 'reports', label: 'Relatórios', icon: iconChart() }] },
        { label: 'Administração', items: [{ id: 'reset-password', label: 'Redefinir Senhas', icon: iconKey() }] },
      ]

    case 'TEACHER':
      return [
        { label: 'Visão Geral', items: [{ id: 'overview', label: 'Painel', icon: iconHome() }] },
        { label: 'Minhas Turmas', items: [{ id: 'my-classrooms', label: 'Turmas', icon: iconBook() }, { id: 'my-students', label: 'Alunos', icon: iconUsers() }, { id: 'schedule', label: 'Calendário', icon: iconCalendar() }] },
        { label: 'Avaliações', items: [{ id: 'assessments', label: 'Avaliações', icon: iconClipboard() }, { id: 'grades', label: 'Lançar Notas', icon: iconStar() }, { id: 'progress', label: 'Progresso', icon: iconChart() }] },
      ]

    case 'STUDENT':
      return [
        { label: 'Visão Geral', items: [{ id: 'overview', label: 'Painel', icon: iconHome() }] },
        { label: 'Minha Vida Escolar', items: [{ id: 'my-classrooms', label: 'Minhas Turmas', icon: iconBook() }, { id: 'my-grades', label: 'Minhas Notas', icon: iconStar() }, { id: 'my-assessments', label: 'Avaliações', icon: iconClipboard() }] },
        { label: 'Acompanhamento', items: [{ id: 'my-progress', label: 'Meu Progresso', icon: iconChart() }, { id: 'schedule', label: 'Calendário', icon: iconCalendar() }] },
      ]

    case 'GUARDIAN':
      return [
        { label: 'Visão Geral', items: [{ id: 'overview', label: 'Painel', icon: iconHome() }] },
        { label: 'Meu Filho', items: [{ id: 'student-classrooms', label: 'Turmas', icon: iconBook() }, { id: 'student-grades', label: 'Notas', icon: iconStar() }, { id: 'student-assessments', label: 'Avaliações', icon: iconClipboard() }] },
        { label: 'Acompanhamento', items: [{ id: 'student-progress', label: 'Progresso do Aluno', icon: iconChart() }, { id: 'student-health', label: 'Frequência', icon: iconHeart() }] },
      ]

    default:
      return []
  }
}

export const PAGE_TITLES: Record<string, string> = {
  overview: 'Painel',
  schools: 'Escolas',
  'global-users': 'Usuários do Sistema',
  reports: 'Relatórios',
  audit: 'Auditoria',
  users: 'Usuários',
  classrooms: 'Turmas',
  enrollments: 'Matrículas',
  'grades-view': 'Notas',
  'reset-password': 'Redefinir Senhas',
  'my-classrooms': 'Minhas Turmas',
  'my-students': 'Meus Alunos',
  schedule: 'Calendário',
  assessments: 'Avaliações',
  grades: 'Lançar Notas',
  progress: 'Progresso',
  'my-grades': 'Minhas Notas',
  'my-assessments': 'Avaliações',
  'my-progress': 'Meu Progresso',
  'student-classrooms': 'Turmas do Aluno',
  'student-grades': 'Notas do Aluno',
  'student-assessments': 'Avaliações do Aluno',
  'student-progress': 'Progresso do Aluno',
  'student-health': 'Frequência',
  profile: 'Meu Perfil',
  settings: 'Configurações',
}

export default {}
