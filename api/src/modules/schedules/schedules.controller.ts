import { Request, Response } from "express";
import { schedulesService } from "./schedules.service";

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

    res.json(schedules);
  } catch (error) {
    console.error("Error fetching schedules:", error);
    res.status(500).json({ message: "Erro ao buscar horários" });
  }
};

// POST /schedules - Create a new schedule
export const create = async (req: Request, res: Response) => {
  try {
    const schoolId = (req as any).user?.schoolId;
    const {
      classroomId,
      subjectId,
      teacherId,
      roomId,
      timeBlockId,
      dayOfWeek,
    } = req.body;

    if (!schoolId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!classroomId || !subjectId || dayOfWeek === undefined || !timeBlockId) {
      res
        .status(400)
        .json({
          message: "Todos os campos obrigatórios devem ser preenchidos",
        });
      return;
    }

    const schedule = await schedulesService.create({
      schoolId,
      classroomId,
      subjectId,
      teacherId,
      roomId,
      timeBlockId,
      dayOfWeek,
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
    const { subjectId, teacherId, roomId, timeBlockId, dayOfWeek } = req.body;

    const schedule = await schedulesService.update(id, {
      subjectId,
      teacherId,
      roomId,
      timeBlockId,
      dayOfWeek,
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

// GET /schedules/by-block - Get schedules by day and time block
export const findByBlock = async (req: Request, res: Response) => {
  try {
    const schoolId = (req as any).user?.schoolId;
    const dayOfWeek = parseInt(req.query.dayOfWeek as string);
    const timeBlockId = req.query.timeBlockId as string;

    if (!schoolId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (isNaN(dayOfWeek) || !timeBlockId) {
      res
        .status(400)
        .json({ message: "Dia da semana e bloco de horário são obrigatórios" });
      return;
    }

    const schedules = await schedulesService.findByDayAndBlock(
      schoolId,
      dayOfWeek,
      timeBlockId,
    );

    res.json(schedules);
  } catch (error) {
    console.error("Error fetching schedules by block:", error);
    res.status(500).json({ message: "Erro ao buscar horários" });
  }
};

// Default export for backward compatibility
export default {
  list,
  create,
  update,
  delete: remove,
  findByBlock,
};
