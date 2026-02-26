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
  // ESCOLA 1 - Escola São José
  // =========================================================================
  const school1 = await prisma.school.create({
    data: {
      name: "Escola São José",
      cnpj: "12.345.678/0001-99",
      slug: "escola-sao-jose",
      active: true,
    },
  });

  await prisma.schoolConfig.create({
    data: { schoolId: school1.id },
  });

  console.log("🏫 Escola 1 criada:", school1.name);

  // Usuários da Escola 1
  const secretary1 = await prisma.user.create({
    data: {
      schoolId: school1.id,
      email: "secretaria@saojose.com",
      passwordHash: await hash("secretaria123"),
      name: "Maria Secretária",
      role: "SECRETARY",
    },
  });

  const teacher1_escola1 = await prisma.user.create({
    data: {
      schoolId: school1.id,
      email: "professor.joao@saojose.com",
      passwordHash: await hash("professor123"),
      name: "João Professor",
      role: "TEACHER",
    },
  });

  const teacher2_escola1 = await prisma.user.create({
    data: {
      schoolId: school1.id,
      email: "professor.ana@saojose.com",
      passwordHash: await hash("professor123"),
      name: "Ana Professora",
      role: "TEACHER",
    },
  });

  const teacher3_escola1 = await prisma.user.create({
    data: {
      schoolId: school1.id,
      email: "professor.carlos@saojose.com",
      passwordHash: await hash("professor123"),
      name: "Carlos Professor",
      role: "TEACHER",
    },
  });

  // Responsáveis da Escola 1
  const guardian1_escola1 = await prisma.user.create({
    data: {
      schoolId: school1.id,
      email: "responsavel1@saojose.com",
      passwordHash: await hash("resp123456"),
      name: "Carlos Pai",
      role: "GUARDIAN",
    },
  });

  const guardian2_escola1 = await prisma.user.create({
    data: {
      schoolId: school1.id,
      email: "responsavel2@saojose.com",
      passwordHash: await hash("resp123456"),
      name: "Mãe Maria",
      role: "GUARDIAN",
    },
  });

  // Alunos da Escola 1
  const studentUser1_escola1 = await prisma.user.create({
    data: {
      schoolId: school1.id,
      email: "aluno.pedro@saojose.com",
      passwordHash: await hash("aluno123"),
      name: "Pedro Aluno",
      role: "STUDENT",
    },
  });

  const student1_escola1 = await prisma.student.create({
    data: {
      schoolId: school1.id,
      name: "Pedro Aluno",
      cpf: "111.111.111-11",
      birthDate: new Date("2010-05-10"),
      email: "aluno.pedro@saojose.com",
      userId: studentUser1_escola1.id,
    },
  });

  const studentUser2_escola1 = await prisma.user.create({
    data: {
      schoolId: school1.id,
      email: "aluna.julia@saojose.com",
      passwordHash: await hash("aluno123"),
      name: "Júlia Aluna",
      role: "STUDENT",
    },
  });

  const student2_escola1 = await prisma.student.create({
    data: {
      schoolId: school1.id,
      name: "Júlia Aluna",
      cpf: "222.222.222-22",
      birthDate: new Date("2010-09-20"),
      email: "aluna.julia@saojose.com",
      userId: studentUser2_escola1.id,
    },
  });

  const studentUser3_escola1 = await prisma.user.create({
    data: {
      schoolId: school1.id,
      email: "aluno.lucas@saojose.com",
      passwordHash: await hash("aluno123"),
      name: "Lucas Aluno",
      role: "STUDENT",
    },
  });

  const student3_escola1 = await prisma.student.create({
    data: {
      schoolId: school1.id,
      name: "Lucas Aluno",
      cpf: "333.333.333-33",
      birthDate: new Date("2010-03-15"),
      email: "aluno.lucas@saojose.com",
      userId: studentUser3_escola1.id,
    },
  });

  // Vínculos Responsável → Aluno (Escola 1)
  await prisma.studentGuardian.create({
    data: {
      schoolId: school1.id,
      studentId: student1_escola1.id,
      guardianId: guardian1_escola1.id,
      relationType: "PAI",
    },
  });

  await prisma.studentGuardian.create({
    data: {
      schoolId: school1.id,
      studentId: student2_escola1.id,
      guardianId: guardian2_escola1.id,
      relationType: "MAE",
    },
  });

  await prisma.studentGuardian.create({
    data: {
      schoolId: school1.id,
      studentId: student3_escola1.id,
      guardianId: guardian1_escola1.id,
      relationType: "TUTOR_LEGAL",
    },
  });

  console.log("👥 Escola 1: 1 secretary, 3 teachers, 2 guardians, 3 students");

  // =========================================================================
  // ESCOLA 2 - Escola Pedro II
  // =========================================================================
  const school2 = await prisma.school.create({
    data: {
      name: "Escola Pedro II",
      cnpj: "98.765.432/0001-11",
      slug: "escola-pedro-ii",
      active: true,
    },
  });

  await prisma.schoolConfig.create({
    data: { schoolId: school2.id },
  });

  console.log("🏫 Escola 2 criada:", school2.name);

  // Usuários da Escola 2
  const secretary2 = await prisma.user.create({
    data: {
      schoolId: school2.id,
      email: "secretaria@pedroii.com",
      passwordHash: await hash("secretaria123"),
      name: "José Secretária",
      role: "SECRETARY",
    },
  });

  const teacher1_escola2 = await prisma.user.create({
    data: {
      schoolId: school2.id,
      email: "professor.pedro@pedroii.com",
      passwordHash: await hash("professor123"),
      name: "Pedro Professor",
      role: "TEACHER",
    },
  });

  const teacher2_escola2 = await prisma.user.create({
    data: {
      schoolId: school2.id,
      email: "professora.lucia@pedroii.com",
      passwordHash: await hash("professor123"),
      name: "Lúcia Professora",
      role: "TEACHER",
    },
  });

  const teacher3_escola2 = await prisma.user.create({
    data: {
      schoolId: school2.id,
      email: "professor.marco@pedroii.com",
      passwordHash: await hash("professor123"),
      name: "Marco Professor",
      role: "TEACHER",
    },
  });

  // Responsáveis da Escola 2
  const guardian1_escola2 = await prisma.user.create({
    data: {
      schoolId: school2.id,
      email: "responsavel1@pedroii.com",
      passwordHash: await hash("resp123456"),
      name: "Paulo Pai",
      role: "GUARDIAN",
    },
  });

  const guardian2_escola2 = await prisma.user.create({
    data: {
      schoolId: school2.id,
      email: "responsavel2@pedroii.com",
      passwordHash: await hash("resp123456"),
      name: "Sofia Mãe",
      role: "GUARDIAN",
    },
  });

  // Alunos da Escola 2
  const studentUser1_escola2 = await prisma.user.create({
    data: {
      schoolId: school2.id,
      email: "aluno.andre@pedroii.com",
      passwordHash: await hash("aluno123"),
      name: "André Aluno",
      role: "STUDENT",
    },
  });

  const student1_escola2 = await prisma.student.create({
    data: {
      schoolId: school2.id,
      name: "André Aluno",
      cpf: "444.444.444-44",
      birthDate: new Date("2011-02-15"),
      email: "aluno.andre@pedroii.com",
      userId: studentUser1_escola2.id,
    },
  });

  const studentUser2_escola2 = await prisma.user.create({
    data: {
      schoolId: school2.id,
      email: "aluna.beatriz@pedroii.com",
      passwordHash: await hash("aluno123"),
      name: "Beatriz Aluna",
      role: "STUDENT",
    },
  });

  const student2_escola2 = await prisma.student.create({
    data: {
      schoolId: school2.id,
      name: "Beatriz Aluna",
      cpf: "555.555.555-55",
      birthDate: new Date("2011-07-22"),
      email: "aluna.beatriz@pedroii.com",
      userId: studentUser2_escola2.id,
    },
  });

  const studentUser3_escola2 = await prisma.user.create({
    data: {
      schoolId: school2.id,
      email: "aluno.gabriel@pedroii.com",
      passwordHash: await hash("aluno123"),
      name: "Gabriel Aluno",
      role: "STUDENT",
    },
  });

  const student3_escola2 = await prisma.student.create({
    data: {
      schoolId: school2.id,
      name: "Gabriel Aluno",
      cpf: "666.666.666-66",
      birthDate: new Date("2011-11-08"),
      email: "aluno.gabriel@pedroii.com",
      userId: studentUser3_escola2.id,
    },
  });

  // Vínculos Responsável → Aluno (Escola 2)
  await prisma.studentGuardian.create({
    data: {
      schoolId: school2.id,
      studentId: student1_escola2.id,
      guardianId: guardian1_escola2.id,
      relationType: "PAI",
    },
  });

  await prisma.studentGuardian.create({
    data: {
      schoolId: school2.id,
      studentId: student2_escola2.id,
      guardianId: guardian2_escola2.id,
      relationType: "MAE",
    },
  });

  await prisma.studentGuardian.create({
    data: {
      schoolId: school2.id,
      studentId: student3_escola2.id,
      guardianId: guardian2_escola2.id,
      relationType: "TUTOR_LEGAL",
    },
  });

  console.log("👥 Escola 2: 1 secretary, 3 teachers, 2 guardians, 3 students");

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log("\n" + "=".repeat(60));
  console.log("✅ SEED CONCLUÍDO\n");

  console.log("🔑 CREDENCIAIS DE LOGIN:\n");

  console.log("ADMIN_GLOBAL:");
  console.log("  email: admin@sistema.com");
  console.log("  password: admin123\n");

  console.log("ESCOLA 1 - Escola São José:");
  console.log(`  schoolId: ${school1.id}`);
  console.log("  SECRETARY:  secretaria@saojose.com / secretaria123");
  console.log("  TEACHERS:   professor.joao@saojose.com / professor123");
  console.log("              professor.ana@saojose.com / professor123");
  console.log("              professor.carlos@saojose.com / professor123");
  console.log("  STUDENTS:   aluno.pedro@saojose.com / aluno123");
  console.log("              aluno.julia@saojose.com / aluno123");
  console.log("              aluno.lucas@saojose.com / aluno123");
  console.log("  GUARDIANS:  responsavel1@saojose.com / resp123456");
  console.log("              responsavel2@saojose.com / resp123456\n");

  console.log("ESCOLA 2 - Escola Pedro II:");
  console.log(`  schoolId: ${school2.id}`);
  console.log("  SECRETARY:  secretaria@pedroii.com / secretaria123");
  console.log("  TEACHERS:   professor.pedro@pedroii.com / professor123");
  console.log("              professora.lucia@pedroii.com / professor123");
  console.log("              professor.marco@pedroii.com / professor123");
  console.log("  STUDENTS:   aluno.andre@pedroii.com / aluno123");
  console.log("              aluno.beatriz@pedroii.com / aluno123");
  console.log("              aluno.gabriel@pedroii.com / aluno123");
  console.log("  GUARDIANS:  responsavel1@pedroii.com / resp123456");
  console.log("              responsavel2@pedroii.com / resp123456\n");

  console.log("=".repeat(60));
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
