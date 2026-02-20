import { Request, Response } from "express";
import { getSchoolId } from "../../middlewares/tenant";
import * as service from "./grades.service";

export async function createOrUpdateGrade(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const changedById = (req.user as any)?.id;
  const { assessmentId, enrollmentId, score } = req.body;
  if (!assessmentId || !enrollmentId)
    return res
      .status(400)
      .json({ error: "assessmentId and enrollmentId required" });

  try {
    const result = await service.createOrUpdateGrade(
      { schoolId, assessmentId, enrollmentId, score },
      changedById,
    );
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: "Error saving grade" });
  }
}

export async function listGrades(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const page = parseInt(String(req.query.page || "1"), 10) || 1;
  const limit = Math.min(
    parseInt(String(req.query.limit || "20"), 10) || 20,
    100,
  );
  const skip = (page - 1) * limit;

  const filters: any = {};
  if (req.query.assessmentId)
    filters.assessmentId = String(req.query.assessmentId);
  if (req.query.enrollmentId)
    filters.enrollmentId = String(req.query.enrollmentId);

  const [items, total] = await Promise.all([
    service.findGrades(schoolId, filters, skip, limit),
    service.countGrades(schoolId, filters),
  ]);
  return res.json({ data: items, meta: { total, page, limit } });
}

export async function getGrade(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const item = await service.findGradeById(id, schoolId);
  if (!item) return res.status(404).json({ error: "Grade not found" });
  return res.json(item);
}
