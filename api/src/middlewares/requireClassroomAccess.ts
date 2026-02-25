import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma";
import getParam from "../utils/getParam";

export async function requireClassroomAccess(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  let classroomId =
    (req.params && getParam(req, "classroomId")) ||
    (req.query && (req.query.classroomId as string)) ||
    (req.body && req.body.classroomId);

  if (!classroomId) {
    const hasAttendanceInPath = req.path.includes("/attendance/");
    const explicitSessionId = (req.params as any).sessionId;
    const explicitAssessmentId = (req.params as any).assessmentId;
    const routeId = (req.params as any).id;
    const enrollmentId = (req.params as any).enrollmentId;

    if (hasAttendanceInPath || explicitSessionId) {
      const sessionId = explicitSessionId || routeId;
      if (sessionId) {
        const session = await prisma.attendanceSession.findFirst({
          where: { id: sessionId },
        });
        if (session) classroomId = session.classroomId;
        else return res.status(404).json({ error: "Sessão não encontrada" });
      }
    }

    if (!classroomId) {
      const assessmentId = explicitAssessmentId || routeId;
      if (assessmentId) {
        const assessment = await prisma.assessment.findFirst({
          where: { id: assessmentId },
        });
        if (assessment) classroomId = assessment.classroomId;
      }
    }

    if (!classroomId && enrollmentId) {
      const enrollment = await prisma.enrollment.findFirst({
        where: { id: enrollmentId },
        select: { classroomId: true },
      });
      if (enrollment) classroomId = enrollment.classroomId;
    }
  }
  if (!classroomId) return next();

  const user = req.user!;
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  if (user.role === "SECRETARY") return next();

  if (user.role === "TEACHER") {
    const link = await prisma.classroomTeacher.findFirst({
      where: {
        teacherId: user.id,
        classroomId,
        dateTo: null,
        ...(user.schoolId ? { schoolId: user.schoolId } : {}),
      },
    });
    if (!link)
      return res
        .status(403)
        .json({ error: "Acesso negado: professor não vinculado a esta turma" });
    return next();
  }

  if (user.role === "STUDENT") {
    const student = await prisma.student.findFirst({
      where: {
        userId: user.id,
        ...(user.schoolId ? { schoolId: user.schoolId } : {}),
      },
      select: { id: true },
    });
    if (!student)
      return res.status(403).json({ error: "Perfil de aluno não encontrado" });
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: student.id,
        classroomId,
        ...(user.schoolId ? { schoolId: user.schoolId } : {}),
        status: "ATIVA",
      },
    });
    if (!enrollment)
      return res
        .status(403)
        .json({ error: "Acesso negado: aluno não matriculado nesta turma" });
    return next();
  }

  if (user.role === "GUARDIAN") {
    const links = await prisma.studentGuardian.findMany({
      where: {
        guardianId: user.id,
        ...(user.schoolId ? { schoolId: user.schoolId } : {}),
      },
      select: { studentId: true },
    });
    if (!links || links.length === 0)
      return res
        .status(403)
        .json({ error: "Nenhum aluno vinculado a este responsável" });
    const studentIds = links.map((l) => l.studentId);
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: { in: studentIds },
        classroomId,
        ...(user.schoolId ? { schoolId: user.schoolId } : {}),
        status: "ATIVA",
      },
    });
    if (!enrollment)
      return res
        .status(403)
        .json({ error: "Acesso negado: nenhum aluno vinculado nesta turma" });
    return next();
  }

  return res.status(403).json({ error: "Acesso negado" });
}
