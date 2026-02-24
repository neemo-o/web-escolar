import { PAGE_TITLES } from './nav'
import { ROLE_COLORS, ROLE_LABELS } from './constants'
import { iconHome, iconSchool, iconUsers, iconBook, iconStar, iconClipboard, iconChart, iconCalendar, iconGrid, iconKey } from './icons'

export function PagePlaceholder({ pageId, user }: { pageId: string; user: any }) {
  const title = PAGE_TITLES[pageId] || pageId
  const role = user?.role || ''
  const accentColor = ROLE_COLORS[role] || '#6366f1'

  const placeholderData: Record<string, { icon: React.ReactNode; description: string; hint: string }> = {
    overview: { icon: iconHome(), description: 'Visão geral das suas atividades e notificações.', hint: 'Cards de resumo, gráficos e avisos recentes serão exibidos aqui.' },
    schools: { icon: iconSchool(), description: 'Gerenciar todas as escolas cadastradas no sistema.', hint: 'Lista de escolas com status, filtros e ações de ativar/desativar.' },
    'global-users': { icon: iconUsers(), description: 'Administrar usuários de todas as escolas.', hint: 'Tabela paginada com filtros por role e escola.' },
    classrooms: { icon: iconBook(), description: 'Criar, editar e gerenciar turmas da escola.', hint: 'Lista de turmas com professores vinculados e quantidade de alunos.' },
    grades: { icon: iconStar(), description: 'Lançar e editar notas dos alunos.', hint: 'Tabela de alunos por turma e avaliação para preenchimento.' },
    assessments: { icon: iconClipboard(), description: 'Criar e gerenciar avaliações das suas turmas.', hint: 'Lista de avaliações com datas, pesos e status.' },
    progress: { icon: iconChart(), description: 'Acompanhar o progresso dos alunos ao longo do período.', hint: 'Gráficos de desempenho por turma, aluno e disciplina.' },
    schedule: { icon: iconCalendar(), description: 'Calendário de aulas e avaliações.', hint: 'Visualização mensal e semanal de eventos acadêmicos.' },
    enrollments: { icon: iconClipboard(), description: 'Gerenciar matrículas de alunos em turmas.', hint: 'Vincular alunos a turmas, acompanhar status de matrícula.' },
    'reset-password': { icon: iconKey(), description: 'Redefinir senhas de professores, alunos e responsáveis.', hint: 'Buscar usuário e gerar senha temporária.' },
  }

  const data = placeholderData[pageId] || { icon: iconGrid(), description: `Conteúdo de ${title}.`, hint: 'Esta seção está em desenvolvimento.' }

  return (
    <div style={{ padding: '28px 28px 40px', flex: 1, overflowY: 'auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.5px' }}>{title}</h1>
        <p style={{ color: '#6b7280', fontSize: 13, margin: '3px 0 0' }}>{data.description}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 340, background: '#f9fafb', borderRadius: 16, border: '1.5px dashed #e5e7eb', gap: 12 }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: `${accentColor}15`, border: `1.5px solid ${accentColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentColor }}>
          <div style={{ transform: 'scale(1.6)' }}>{data.icon}</div>
        </div>
        <div style={{ textAlign: 'center', maxWidth: 340 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#374151', marginBottom: 4 }}>{title}</div>
          <div style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.6 }}>{data.hint}</div>
        </div>
        <div style={{ marginTop: 8, padding: '6px 14px', borderRadius: 8, background: `${accentColor}12`, color: accentColor, fontSize: 12, fontWeight: 600 }}>Em desenvolvimento</div>
      </div>
    </div>
  )
}

export default PagePlaceholder
