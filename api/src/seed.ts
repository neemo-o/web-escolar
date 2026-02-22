import { prisma } from "./config/prisma";
import bcrypt from "bcrypt";

async function hash(password: string) {
  return bcrypt.hash(password, 12);
}

async function main() {
  console.log("🌱 Iniciando seed...\n");

  // =========================================================================
  // LIMPEZA (ordem inversa das FK)
  // =========================================================================
  await prisma.gradeAudit.deleteMany();
  await prisma.studentGrade.deleteMany();
  await prisma.periodGrade.deleteMany();
  await prisma.finalGrade.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.attendanceSession.deleteMany();
  await prisma.activitySubmission.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.enrollmentCounter.deleteMany();
  await prisma.studentGuardian.deleteMany();
  await prisma.student.deleteMany();
  await prisma.classroomTeacher.deleteMany();
  await prisma.classroomSubject.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.classroom.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.gradeLevel.deleteMany();
  await prisma.period.deleteMany();
  await prisma.academicYear.deleteMany();
  await prisma.schoolConfig.deleteMany();
  await prisma.user.deleteMany();
  await prisma.school.deleteMany();

  console.log("✅ Banco limpo\n");

  // =========================================================================
  // ADMIN GLOBAL (sem schoolId)
  // =========================================================================
  const adminGlobal = await prisma.user.create({
    data: {
      schoolId: null,
      email: "admin@sistema.com",
      passwordHash: await hash("admin123"),
      name: "Admin Global",
      role: "ADMIN_GLOBAL",
    },
  });
  console.log("👑 ADMIN_GLOBAL criado");

  // =========================================================================
  // ESCOLA ATIVA
  // =========================================================================
  const school = await prisma.school.create({
    data: {
      name: "Escola São José",
      cnpj: "12.345.678/0001-99",
      slug: "escola-sao-jose",
      active: true,
    },
  });

  await prisma.schoolConfig.create({
    data: { schoolId: school.id },
  });

  console.log("🏫 Escola ativa criada:", school.name);

  // =========================================================================
  // ESCOLA INATIVA (para testar bloqueio)
  // =========================================================================
  const schoolInactive = await prisma.school.create({
    data: {
      name: "Escola Inativa",
      cnpj: "99.999.999/0001-99",
      slug: "escola-inativa",
      active: false,
    },
  });

  await prisma.schoolConfig.create({
    data: { schoolId: schoolInactive.id },
  });

  const secretaryInactive = await prisma.user.create({
    data: {
      schoolId: schoolInactive.id,
      email: "secretaria@inativa.com",
      passwordHash: await hash("senha123"),
      name: "Secretária Escola Inativa",
      role: "SECRETARY",
    },
  });

  console.log("🚫 Escola inativa criada (secretária para testar bloqueio)");

  // =========================================================================
  // USUÁRIOS DA ESCOLA ATIVA
  // =========================================================================
  const secretary = await prisma.user.create({
    data: {
      schoolId: school.id,
      email: "secretaria@saojose.com",
      passwordHash: await hash("secretaria123"),
      name: "Maria Secretária",
      role: "SECRETARY",
    },
  });

  const teacher1 = await prisma.user.create({
    data: {
      schoolId: school.id,
      email: "professor.joao@saojose.com",
      passwordHash: await hash("professor123"),
      name: "João Professor",
      role: "TEACHER",
    },
  });

  const teacher2 = await prisma.user.create({
    data: {
      schoolId: school.id,
      email: "professor.ana@saojose.com",
      passwordHash: await hash("professor123"),
      name: "Ana Professora",
      role: "TEACHER",
    },
  });

  const guardian = await prisma.user.create({
    data: {
      schoolId: school.id,
      email: "responsavel@saojose.com",
      passwordHash: await hash("responsavel123"),
      name: "Carlos Responsável",
      role: "GUARDIAN",
    },
  });

  console.log("👥 Usuários criados (secretary, 2 teachers, guardian)");

  // =========================================================================
  // ALUNOS + USER vinculado
  // =========================================================================
  const studentUser1 = await prisma.user.create({
    data: {
      schoolId: school.id,
      email: "aluno.pedro@saojose.com",
      passwordHash: await hash("aluno123"),
      name: "Pedro Aluno",
      role: "STUDENT",
    },
  });

  const student1 = await prisma.student.create({
    data: {
      schoolId: school.id,
      name: "Pedro Aluno",
      cpf: "111.111.111-11",
      birthDate: new Date("2008-05-10"),
      email: "aluno.pedro@saojose.com",
      userId: studentUser1.id,
    },
  });

  const studentUser2 = await prisma.user.create({
    data: {
      schoolId: school.id,
      email: "aluna.julia@saojose.com",
      passwordHash: await hash("aluno123"),
      name: "Júlia Aluna",
      role: "STUDENT",
    },
  });

  const student2 = await prisma.student.create({
    data: {
      schoolId: school.id,
      name: "Júlia Aluna",
      cpf: "222.222.222-22",
      birthDate: new Date("2008-09-20"),
      email: "aluna.julia@saojose.com",
      userId: studentUser2.id,
    },
  });

  // Aluno de outra turma (para testar isolamento do teacher)
  const studentUser3 = await prisma.user.create({
    data: {
      schoolId: school.id,
      email: "aluno.lucas@saojose.com",
      passwordHash: await hash("aluno123"),
      name: "Lucas Outro Aluno",
      role: "STUDENT",
    },
  });

  const student3 = await prisma.student.create({
    data: {
      schoolId: school.id,
      name: "Lucas Outro Aluno",
      cpf: "333.333.333-33",
      birthDate: new Date("2007-03-15"),
      userId: studentUser3.id,
    },
  });

  console.log("🎓 Alunos criados (3)");

  // =========================================================================
  // VÍNCULO GUARDIAN → ALUNO
  // =========================================================================
  await prisma.studentGuardian.create({
    data: {
      schoolId: school.id,
      studentId: student1.id,
      guardianId: guardian.id,
    },
  });

  console.log("🔗 Guardian vinculado ao aluno Pedro");

  // =========================================================================
  // ESTRUTURA ACADÊMICA
  // =========================================================================

  // Ano letivo
  const academicYear = await prisma.academicYear.create({
    data: {
      schoolId: school.id,
      year: 2025,
      startDate: new Date("2025-02-01"),
      endDate: new Date("2025-12-15"),
      active: true,
      status: "EM_ANDAMENTO",
    },
  });

  // Períodos (bimestres)
  const period1 = await prisma.period.create({
    data: {
      schoolId: school.id,
      academicYearId: academicYear.id,
      name: "1º Bimestre",
      sequence: 1,
      startDate: new Date("2025-02-01"),
      endDate: new Date("2025-04-30"),
      status: "CLOSED",
    },
  });

  const period2 = await prisma.period.create({
    data: {
      schoolId: school.id,
      academicYearId: academicYear.id,
      name: "2º Bimestre",
      sequence: 2,
      startDate: new Date("2025-05-01"),
      endDate: new Date("2025-07-31"),
      status: "OPEN",
    },
  });

  // Grade levels
  const gradeLevel = await prisma.gradeLevel.create({
    data: {
      schoolId: school.id,
      name: "7º Ano",
      code: "7ANO",
      sortOrder: 1,
    },
  });

  const gradeLevel2 = await prisma.gradeLevel.create({
    data: {
      schoolId: school.id,
      name: "8º Ano",
      code: "8ANO",
      sortOrder: 2,
    },
  });

  // Disciplinas
  const subjectMath = await prisma.subject.create({
    data: { schoolId: school.id, name: "Matemática", code: "MAT" },
  });

  const subjectPort = await prisma.subject.create({
    data: { schoolId: school.id, name: "Português", code: "PORT" },
  });

  const subjectSci = await prisma.subject.create({
    data: { schoolId: school.id, name: "Ciências", code: "CIE" },
  });

  console.log(
    "📚 Estrutura acadêmica criada (ano, períodos, séries, disciplinas)",
  );

  // =========================================================================
  // TURMAS
  // =========================================================================
  const classroom1 = await prisma.classroom.create({
    data: {
      schoolId: school.id,
      academicYearId: academicYear.id,
      gradeLevelId: gradeLevel.id,
      name: "7A",
      shift: "MANHA",
      capacity: 30,
    },
  });

  // Turma de OUTRO professor (para testar isolamento)
  const classroom2 = await prisma.classroom.create({
    data: {
      schoolId: school.id,
      academicYearId: academicYear.id,
      gradeLevelId: gradeLevel2.id,
      name: "8A",
      shift: "TARDE",
      capacity: 25,
    },
  });

  console.log("🏛 Turmas criadas (7A - teacher1, 8A - teacher2)");

  // =========================================================================
  // VÍNCULOS DISCIPLINA → TURMA
  // =========================================================================
  await prisma.classroomSubject.createMany({
    data: [
      {
        schoolId: school.id,
        classroomId: classroom1.id,
        subjectId: subjectMath.id,
        isRequired: true,
        dateFrom: new Date("2025-02-01"),
        workloadHours: 80,
      },
      {
        schoolId: school.id,
        classroomId: classroom1.id,
        subjectId: subjectPort.id,
        isRequired: true,
        dateFrom: new Date("2025-02-01"),
        workloadHours: 80,
      },
      {
        schoolId: school.id,
        classroomId: classroom2.id,
        subjectId: subjectSci.id,
        isRequired: true,
        dateFrom: new Date("2025-02-01"),
        workloadHours: 60,
      },
    ],
  });

  // =========================================================================
  // VÍNCULOS PROFESSOR → TURMA
  // =========================================================================
  await prisma.classroomTeacher.create({
    data: {
      schoolId: school.id,
      classroomId: classroom1.id,
      subjectId: subjectMath.id,
      teacherId: teacher1.id,
      dateFrom: new Date("2025-02-01"),
    },
  });

  await prisma.classroomTeacher.create({
    data: {
      schoolId: school.id,
      classroomId: classroom1.id,
      subjectId: subjectPort.id,
      teacherId: teacher1.id,
      dateFrom: new Date("2025-02-01"),
    },
  });

  await prisma.classroomTeacher.create({
    data: {
      schoolId: school.id,
      classroomId: classroom2.id,
      subjectId: subjectSci.id,
      teacherId: teacher2.id,
      dateFrom: new Date("2025-02-01"),
    },
  });

  console.log("🔗 Professores vinculados às turmas");

  // =========================================================================
  // MATRÍCULAS
  // =========================================================================
  const enrollment1 = await prisma.enrollment.create({
    data: {
      schoolId: school.id,
      studentId: student1.id,
      classroomId: classroom1.id,
      academicYearId: academicYear.id,
      enrollmentNumber: "2025-0001",
      status: "ATIVA",
      enrolledAt: new Date("2025-02-01"),
    },
  });

  const enrollment2 = await prisma.enrollment.create({
    data: {
      schoolId: school.id,
      studentId: student2.id,
      classroomId: classroom1.id,
      academicYearId: academicYear.id,
      enrollmentNumber: "2025-0002",
      status: "ATIVA",
      enrolledAt: new Date("2025-02-01"),
    },
  });

  // Aluno 3 na turma do teacher2 (para testar isolamento)
  const enrollment3 = await prisma.enrollment.create({
    data: {
      schoolId: school.id,
      studentId: student3.id,
      classroomId: classroom2.id,
      academicYearId: academicYear.id,
      enrollmentNumber: "2025-0003",
      status: "ATIVA",
      enrolledAt: new Date("2025-02-01"),
    },
  });

  await prisma.enrollmentCounter.create({
    data: {
      schoolId: school.id,
      year: 2025,
      lastNumber: 3,
    },
  });

  console.log("📋 Matrículas criadas");

  // =========================================================================
  // AVALIAÇÕES
  // =========================================================================
  const assessment1 = await prisma.assessment.create({
    data: {
      schoolId: school.id,
      classroomId: classroom1.id,
      subjectId: subjectMath.id,
      periodId: period1.id,
      createdById: teacher1.id,
      title: "Prova de Matemática - 1º Bimestre",
      type: "prova",
      status: "PUBLICADA",
      maxScore: 10,
      weight: 1,
      date: new Date("2025-04-10"),
    },
  });

  const assessment2 = await prisma.assessment.create({
    data: {
      schoolId: school.id,
      classroomId: classroom1.id,
      subjectId: subjectPort.id,
      periodId: period1.id,
      createdById: teacher1.id,
      title: "Redação - 1º Bimestre",
      type: "trabalho",
      status: "PUBLICADA",
      maxScore: 10,
      weight: 1,
      date: new Date("2025-04-20"),
    },
  });

  // Avaliação da turma 2 (teacher2) — para testar isolamento
  const assessment3 = await prisma.assessment.create({
    data: {
      schoolId: school.id,
      classroomId: classroom2.id,
      subjectId: subjectSci.id,
      periodId: period1.id,
      createdById: teacher2.id,
      title: "Prova de Ciências - 8A",
      type: "prova",
      status: "PUBLICADA",
      maxScore: 10,
      weight: 1,
      date: new Date("2025-04-15"),
    },
  });

  console.log("📝 Avaliações criadas");

  // =========================================================================
  // NOTAS
  // =========================================================================
  const grade1 = await prisma.studentGrade.create({
    data: {
      schoolId: school.id,
      assessmentId: assessment1.id,
      enrollmentId: enrollment1.id,
      score: 8.5,
      recordedById: teacher1.id,
      status: "lancada",
    },
  });

  await prisma.studentGrade.create({
    data: {
      schoolId: school.id,
      assessmentId: assessment1.id,
      enrollmentId: enrollment2.id,
      score: 7.0,
      recordedById: teacher1.id,
      status: "lancada",
    },
  });

  await prisma.studentGrade.create({
    data: {
      schoolId: school.id,
      assessmentId: assessment2.id,
      enrollmentId: enrollment1.id,
      score: 9.0,
      recordedById: teacher1.id,
      status: "lancada",
    },
  });

  await prisma.studentGrade.create({
    data: {
      schoolId: school.id,
      assessmentId: assessment3.id,
      enrollmentId: enrollment3.id,
      score: 6.5,
      recordedById: teacher2.id,
      status: "lancada",
    },
  });

  // Audit de nota editada
  await prisma.gradeAudit.create({
    data: {
      schoolId: school.id,
      studentGradeId: grade1.id,
      oldValue: 7.5,
      newValue: 8.5,
      changedById: teacher1.id,
    },
  });

  console.log("🎯 Notas lançadas (com audit)");

  // =========================================================================
  // SESSÃO DE FREQUÊNCIA + REGISTROS
  // =========================================================================
  const session = await prisma.attendanceSession.create({
    data: {
      schoolId: school.id,
      classroomId: classroom1.id,
      subjectId: subjectMath.id,
      createdById: teacher1.id,
      sessionDate: new Date("2025-04-08"),
      startTime: new Date("1970-01-01T08:00:00.000Z"),
      endTime: new Date("1970-01-01T09:00:00.000Z"),
      notes: "Aula de álgebra",
    },
  });

  await prisma.attendanceRecord.createMany({
    data: [
      {
        schoolId: school.id,
        sessionId: session.id,
        enrollmentId: enrollment1.id,
        status: "presente",
      },
      {
        schoolId: school.id,
        sessionId: session.id,
        enrollmentId: enrollment2.id,
        status: "falta",
      },
    ],
  });

  console.log("📅 Sessão de frequência criada");

  // =========================================================================
  // ATIVIDADE
  // =========================================================================
  await prisma.activity.create({
    data: {
      schoolId: school.id,
      classroomId: classroom1.id,
      createdById: teacher1.id,
      title: "Lista de Exercícios - Equações",
      description: "Resolver os exercícios 1 a 10 do livro",
      status: "PUBLICADA",
      dueDate: new Date("2025-05-15"),
      maxScore: 5,
    },
  });

  console.log("📌 Atividade criada");

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log("\n" + "=".repeat(60));
  console.log("✅ SEED CONCLUÍDO\n");

  console.log("🔑 CREDENCIAIS DE LOGIN:\n");

  console.log("ADMIN_GLOBAL (sem schoolId no body):");
  console.log("  email: admin@sistema.com");
  console.log("  password: admin123\n");

  console.log("SECRETARY:");
  console.log(`  schoolId: ${school.id}`);
  console.log("  email: secretaria@saojose.com");
  console.log("  password: secretaria123\n");

  console.log("TEACHER (vinculado à turma 7A):");
  console.log(`  schoolId: ${school.id}`);
  console.log("  email: professor.joao@saojose.com");
  console.log("  password: professor123\n");

  console.log("TEACHER 2 (vinculado à turma 8A - para testar isolamento):");
  console.log(`  schoolId: ${school.id}`);
  console.log("  email: professor.ana@saojose.com");
  console.log("  password: professor123\n");

  console.log("STUDENT (Pedro - turma 7A, guardian vinculado):");
  console.log(`  schoolId: ${school.id}`);
  console.log("  email: aluno.pedro@saojose.com");
  console.log("  password: aluno123\n");

  console.log("STUDENT 2 (Júlia - turma 7A):");
  console.log(`  schoolId: ${school.id}`);
  console.log("  email: aluna.julia@saojose.com");
  console.log("  password: aluno123\n");

  console.log("STUDENT 3 (Lucas - turma 8A, sem guardian):");
  console.log(`  schoolId: ${school.id}`);
  console.log("  email: aluno.lucas@saojose.com");
  console.log("  password: aluno123\n");

  console.log("GUARDIAN (vinculado ao Pedro):");
  console.log(`  schoolId: ${school.id}`);
  console.log("  email: responsavel@saojose.com");
  console.log("  password: responsavel123\n");

  console.log("ESCOLA INATIVA (login deve retornar erro):");
  console.log(`  schoolId: ${schoolInactive.id}`);
  console.log("  email: secretaria@inativa.com");
  console.log("  password: senha123\n");

  console.log("=".repeat(60));
  console.log("\n📋 IDs ÚTEIS PARA O ENVIRONMENT DO POSTMAN:\n");
  console.log(`schoolId:                  ${school.id}`);
  console.log(`schoolId_inactive:         ${schoolInactive.id}`);
  console.log(`teacherId:                 ${teacher1.id}`);
  console.log(`studentId:                 ${student1.id}`);
  console.log(`studentId_other (turma 8A):${student3.id}`);
  console.log(`guardianId:                ${guardian.id}`);
  console.log(`classId (7A):              ${classroom1.id}`);
  console.log(`classId_other_teacher (8A):${classroom2.id}`);
  console.log(`assessmentId:              ${assessment1.id}`);
  console.log(`enrollmentId:              ${enrollment1.id}`);
  console.log(`gradeId:                   ${grade1.id}`);
  console.log(`academicYearId:            ${academicYear.id}`);
  console.log(`periodId:                  ${period1.id}`);
  console.log(`subjectId (MAT):           ${subjectMath.id}`);
  console.log(`gradeLevelId:              ${gradeLevel.id}`);
  console.log(`sessionId (frequência):    ${session.id}`);
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
