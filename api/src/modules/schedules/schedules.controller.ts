import { Request, Response } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { schedulesService } from "./schedules.service";

// Middleware wrappers
const authenticateMiddleware = authenticate;
const authorizeMiddleware = authorize;

// Middleware that adds auth to controller functions
const auth = [
  authenticateMiddleware,
  authorizeMiddleware(["SECRETARY", "TEACHER"]),
] as any;
const authWrite = [
  authenticateMiddleware,
  authorizeMiddleware(["SECRETARY"]),
] as any;

// GET /schedules - List all schedules
export const list = async (req: Request, res: Response) => {
  try {
    const schoolId = (req as any).user?.schoolId;
    const classroomId = req.query.classroomId as string | undefined;
    const gradeLevelId = req.query.gradeLevelId as string | undefined;

    if (!schoolId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    let schedules;
    if (classroomId) {
      schedules = await schedulesService.findByClassroom(classroomId, schoolId);
    } else if (gradeLevelId) {
      schedules = await schedulesService.findByGradeLevel(
        gradeLevelId,
        schoolId,
      );
    } else {
      schedules = await schedulesService.findAll(schoolId);
    }

    // Get teachers for each schedule
    const { prisma } = await import("../../config/prisma");
    const schedulesWithTeachers = await Promise.all(
      schedules.map(async (schedule: any) => {
        const classroomTeacher = await prisma.classroomTeacher.findFirst({
          where: {
            classroomId: schedule.classroomId,
            subjectId: schedule.subjectId,
            dateFrom: { lte: new Date() },
            OR: [{ dateTo: null }, { dateTo: { gte: new Date() } }],
          },
          include: {
            teacher: {
              select: { id: true, name: true },
            },
          },
        });

        return {
          ...schedule,
          teacher: classroomTeacher?.teacher || null,
        };
      }),
    );

    res.json(schedulesWithTeachers);
  } catch (error) {
    console.error("Error fetching schedules:", error);
    res.status(500).json({ message: "Erro ao buscar horários" });
  }
};

// POST /schedules - Create a new schedule
export const create = async (req: Request, res: Response) => {
  try {
    const schoolId = (req as any).user?.schoolId;
    const { classroomId, subjectId, dayOfWeek, startTime, endTime, room } =
      req.body;

    if (!schoolId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (
      !classroomId ||
      !subjectId ||
      dayOfWeek === undefined ||
      !startTime ||
      !endTime
    ) {
      res.status(400).json({ message: "Todos os campos são obrigatórios" });
      return;
    }

    const schedule = await schedulesService.create({
      schoolId,
      classroomId,
      subjectId,
      dayOfWeek,
      startTime,
      endTime,
      room,
    });

    res.status(201).json(schedule);
  } catch (error: any) {
    console.error("Error creating schedule:", error);
    if (error.message?.startsWith("CONFLICT_")) {
      const [, message] = error.message.split(":");
      res
        .status(409)
        .json({ message: message?.trim() || "Conflito de horário" });
      return;
    }
    res.status(500).json({ message: "Erro ao criar horário" });
  }
};

// PATCH /schedules/:id - Update a schedule
export const update = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { subjectId, dayOfWeek, startTime, endTime, room } = req.body;

    const schedule = await schedulesService.update(id, {
      subjectId,
      dayOfWeek,
      startTime,
      endTime,
      room,
    });

    res.json(schedule);
  } catch (error: any) {
    console.error("Error updating schedule:", error);
    if (error.message?.startsWith("CONFLICT_")) {
      const [, message] = error.message.split(":");
      res
        .status(409)
        .json({ message: message?.trim() || "Conflito de horário" });
      return;
    }
    res.status(500).json({ message: "Erro ao atualizar horário" });
  }
};

// DELETE /schedules/:id - Delete a schedule
export const remove = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await schedulesService.delete(id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting schedule:", error);
    res.status(500).json({ message: "Erro ao excluir horário" });
  }
};

// Default export for backward compatibility
export default {
  list,
  create,
  update,
  delete: remove,
};
