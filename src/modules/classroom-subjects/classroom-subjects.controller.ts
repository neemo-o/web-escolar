import { Request, Response } from "express";
import { getSchoolId } from "../../middlewares/tenant";
import { prisma } from "../../config/prisma";
import * as service from "./classroom-subjects.service";

export async function addSubjectToClassroom(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const classroomId = Array.isArray(req.params.classroomId)
    ? req.params.classroomId[0]
    : req.params.classroomId;
  const { subjectId, workloadHours, isRequired, dateFrom } = req.body;

  if (!subjectId || !dateFrom)
    return res
      .status(400)
      .json({ error: "subjectId e dateFrom são obrigatórios" });

  const classroom = await prisma.classroom.findFirst({
    where: { id: classroomId, schoolId },
  });
  if (!classroom)
    return res
      .status(404)
      .json({ error: "Classroom não encontrado para a escola" });

  const subject = await prisma.subject.findFirst({
    where: { id: subjectId, schoolId, deletedAt: null },
  });
  if (!subject)
    return res
      .status(404)
      .json({ error: "Disciplina não encontrada na escola" });

  try {
    const created = await service.createClassroomSubject({
      schoolId,
      classroomId,
      subjectId,
      workloadHours: workloadHours ?? null,
      isRequired: isRequired ?? true,
      dateFrom: new Date(dateFrom),
    });

    return res.status(201).json(created);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao vincular disciplina" });
  }
}

export async function listClassroomSubjects(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const classroomId = Array.isArray(req.params.classroomId)
    ? req.params.classroomId[0]
    : req.params.classroomId;

  const classroom = await prisma.classroom.findFirst({
    where: { id: classroomId, schoolId },
  });
  if (!classroom)
    return res
      .status(404)
      .json({ error: "Classroom não encontrado para a escola" });

  const items = await service.findActiveSubjectsByClassroom(
    classroomId,
    schoolId,
  );
  return res.json({ data: items });
}

export async function removeClassroomSubject(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const classroomId = Array.isArray(req.params.classroomId)
    ? req.params.classroomId[0]
    : req.params.classroomId;
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { removedReason } = req.body;

  const record = await service.findClassroomSubjectById(id, classroomId);
  if (!record || record.schoolId !== schoolId)
    return res.status(404).json({ error: "Vínculo não encontrado" });

  const updated = await service.updateClassroomSubjectById(id, {
    dateTo: new Date(),
    removedReason: removedReason ?? null,
  });
  return res.json(updated);
}
