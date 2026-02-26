import { Request, Response } from "express";
import { timeBlockService } from "./time-blocks.service";

// GET /time-blocks - List all time blocks
export const list = async (req: Request, res: Response) => {
  try {
    const schoolId = (req as any).user?.schoolId;
    if (!schoolId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const timeBlocks = await timeBlockService.findAll(schoolId);
    res.json(timeBlocks);
  } catch (error) {
    console.error("Error fetching time blocks:", error);
    res.status(500).json({ message: "Erro ao buscar blocos de horário" });
  }
};

// GET /time-blocks/all - List all time blocks including inactive
export const listAll = async (req: Request, res: Response) => {
  try {
    const schoolId = (req as any).user?.schoolId;
    if (!schoolId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const timeBlocks =
      await timeBlockService.findAllIncludingInactive(schoolId);
    res.json(timeBlocks);
  } catch (error) {
    console.error("Error fetching time blocks:", error);
    res.status(500).json({ message: "Erro ao buscar blocos de horário" });
  }
};

// GET /time-blocks/:id - Get a specific time block
export const getById = async (req: Request, res: Response) => {
  try {
    const schoolId = (req as any).user?.schoolId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!schoolId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // FIX #9: Validate schoolId before fetching
    const timeBlock = await timeBlockService.findById(id, schoolId);

    if (!timeBlock) {
      res.status(404).json({ message: "Bloco de horário não encontrado" });
      return;
    }

    res.json(timeBlock);
  } catch (error) {
    console.error("Error fetching time block:", error);
    res.status(500).json({ message: "Erro ao buscar bloco de horário" });
  }
};

// POST /time-blocks - Create a new time block
export const create = async (req: Request, res: Response) => {
  try {
    const schoolId = (req as any).user?.schoolId;
    const { name, startTime, endTime, order } = req.body;

    if (!schoolId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!name || !startTime || !endTime) {
      res
        .status(400)
        .json({ message: "Nome, horário de início e fim são obrigatórios" });
      return;
    }

    const timeBlock = await timeBlockService.create({
      schoolId,
      name,
      startTime,
      endTime,
      order,
    });

    res.status(201).json(timeBlock);
  } catch (error) {
    console.error("Error creating time block:", error);
    res.status(500).json({ message: "Erro ao criar bloco de horário" });
  }
};

// PATCH /time-blocks/:id - Update a time block
export const update = async (req: Request, res: Response) => {
  try {
    const schoolId = (req as any).user?.schoolId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { name, startTime, endTime, order, active } = req.body;

    if (!schoolId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // FIX #4: Validate schoolId before updating
    const timeBlock = await timeBlockService.update(id, schoolId, {
      name,
      startTime,
      endTime,
      order,
      active,
    });

    if (!timeBlock) {
      res.status(404).json({ message: "Bloco de horário não encontrado" });
      return;
    }

    res.json(timeBlock);
  } catch (error: any) {
    console.error("Error updating time block:", error);
    if (error.message === "ACCESS_DENIED") {
      res.status(403).json({ message: "Acesso negado" });
      return;
    }
    res.status(500).json({ message: "Erro ao atualizar bloco de horário" });
  }
};

// DELETE /time-blocks/:id - Deactivate a time block
export const remove = async (req: Request, res: Response) => {
  try {
    const schoolId = (req as any).user?.schoolId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!schoolId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // FIX #4: Validate schoolId before deleting
    // Check if block has schedules
    const hasSchedules = await timeBlockService.hasSchedules(id, schoolId);
    if (hasSchedules) {
      res.status(400).json({
        message:
          "Não é possível desativar um bloco de horário que possui aulas vinculadas",
      });
      return;
    }

    const deleted = await timeBlockService.delete(id, schoolId);
    if (!deleted) {
      res.status(404).json({ message: "Bloco de horário não encontrado" });
      return;
    }
    res.status(204).send();
  } catch (error: any) {
    console.error("Error deleting time block:", error);
    if (error.message === "ACCESS_DENIED") {
      res.status(403).json({ message: "Acesso negado" });
      return;
    }
    res.status(500).json({ message: "Erro ao desativar bloco de horário" });
  }
};

// POST /time-blocks/reorder - Reorder time blocks
export const reorder = async (req: Request, res: Response) => {
  try {
    const schoolId = (req as any).user?.schoolId;
    const { orderedIds } = req.body;

    if (!schoolId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!orderedIds || !Array.isArray(orderedIds)) {
      res.status(400).json({ message: "Lista de IDs é obrigatória" });
      return;
    }

    // FIX #6: Pass schoolId to reorder
    await timeBlockService.reorder(schoolId, orderedIds);
    res.json({ message: "Blocos de horário reordenados com sucesso" });
  } catch (error) {
    console.error("Error reordering time blocks:", error);
    res.status(500).json({ message: "Erro ao reordenar blocos de horário" });
  }
};

export default {
  list,
  listAll,
  getById,
  create,
  update,
  delete: remove,
  reorder,
};
