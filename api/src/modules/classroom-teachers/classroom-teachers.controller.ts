import { Request, Response } from "express";
import { getSchoolId } from "../../middlewares/tenant";
import { prisma } from "../../config/prisma";
import getParam from "../../utils/getParam";
import * as service from "./classroom-teachers.service";

export async function addTeacherToClassroom(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  if (!schoolId)
    return res.status(403).json({ error: "Escola não associada" });
  const classroomId = getParam(req, "classroomId");
  const { teacherId, subjectId, dateFrom } = req.body;

  if (!teacherId || !subjectId || !dateFrom) {
    return res
      .status(400)
      .json({ error: "teacherId, subjectId e dateFrom são obrigatórios" });
  }

  // validate classroom belongs to school
  const classroom = await prisma.classroom.findFirst({
    where: { id: classroomId, schoolId },
  });
  if (!classroom)
    return res
      .status(404)
      .json({ error: "Classroom não encontrado para a escola" });

  // validate teacher exists, role TEACHER and same school
  const teacher = await prisma.user.findFirst({
    where: { id: teacherId, role: "TEACHER", schoolId, deletedAt: null },
  });
  if (!teacher)
    return res
      .status(404)
      .json({ error: "Professor não encontrado na escola" });

  // validate subject belongs to school
  const subject = await prisma.subject.findFirst({
    where: { id: subjectId, schoolId, deletedAt: null },
  });
  if (!subject)
    return res
      .status(404)
      .json({ error: "Disciplina não encontrada na escola" });

  try {
    const created = await service.createClassroomTeacher({
      schoolId,
      classroomId,
      subjectId,
      teacherId,
      dateFrom: new Date(dateFrom),
    });
    return res.status(201).json(created);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao vincular professor" });
  }
}

export async function listClassroomTeachers(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const classroomId = getParam(req, "classroomId");

  // ensure classroom belongs to school
  const classroom = await prisma.classroom.findFirst({
    where: { id: classroomId, schoolId },
  });
  if (!classroom)
    return res
      .status(404)
      .json({ error: "Classroom não encontrado para a escola" });

  const items = await service.findActiveTeachersByClassroom(
    classroomId,
    schoolId,
  );
  return res.json({ data: items });
}

export async function removeClassroomTeacher(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const classroomId = getParam(req, "classroomId");
  const id = getParam(req, "id");
  const { reasonChange } = req.body;

  const record = await service.findClassroomTeacherById(id, classroomId);
  if (!record || record.schoolId !== schoolId)
    return res.status(404).json({ error: "Vínculo não encontrado" });

  const updated = await service.updateClassroomTeacherById(id, {
    dateTo: new Date(),
    reasonChange: reasonChange ?? null,
  });
  return res.json(updated);
}
