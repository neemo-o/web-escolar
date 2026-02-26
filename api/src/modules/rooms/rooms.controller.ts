import { Request, Response } from "express";
import { roomService } from "./rooms.service";

// GET /rooms - List all rooms
export const list = async (req: Request, res: Response) => {
  try {
    const schoolId = (req as any).user?.schoolId;
    if (!schoolId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const rooms = await roomService.findAll(schoolId);
    res.json(rooms);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    res.status(500).json({ message: "Erro ao buscar salas" });
  }
};

// GET /rooms/all - List all rooms including inactive
export const listAll = async (req: Request, res: Response) => {
  try {
    const schoolId = (req as any).user?.schoolId;
    if (!schoolId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const rooms = await roomService.findAllIncludingInactive(schoolId);
    res.json(rooms);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    res.status(500).json({ message: "Erro ao buscar salas" });
  }
};

// GET /rooms/:id - Get a specific room
export const getById = async (req: Request, res: Response) => {
  try {
    const schoolId = (req as any).user?.schoolId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!schoolId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // FIX #9: Validate schoolId before fetching
    const room = await roomService.findById(id, schoolId);

    if (!room) {
      res.status(404).json({ message: "Sala não encontrada" });
      return;
    }

    res.json(room);
  } catch (error) {
    console.error("Error fetching room:", error);
    res.status(500).json({ message: "Erro ao buscar sala" });
  }
};

// POST /rooms - Create a new room
export const create = async (req: Request, res: Response) => {
  try {
    const schoolId = (req as any).user?.schoolId;
    const { name, capacity } = req.body;

    if (!schoolId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!name) {
      res.status(400).json({ message: "Nome da sala é obrigatório" });
      return;
    }

    const room = await roomService.create({
      schoolId,
      name,
      capacity,
    });

    res.status(201).json(room);
  } catch (error) {
    console.error("Error creating room:", error);
    res.status(500).json({ message: "Erro ao criar sala" });
  }
};

// PATCH /rooms/:id - Update a room
export const update = async (req: Request, res: Response) => {
  try {
    const schoolId = (req as any).user?.schoolId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { name, capacity, active } = req.body;

    if (!schoolId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // FIX #5: Validate schoolId before updating
    const room = await roomService.update(id, schoolId, {
      name,
      capacity,
      active,
    });

    if (!room) {
      res.status(404).json({ message: "Sala não encontrada" });
      return;
    }

    res.json(room);
  } catch (error: any) {
    console.error("Error updating room:", error);
    if (error.message === "ACCESS_DENIED") {
      res.status(403).json({ message: "Acesso negado" });
      return;
    }
    res.status(500).json({ message: "Erro ao atualizar sala" });
  }
};

// DELETE /rooms/:id - Deactivate a room
export const remove = async (req: Request, res: Response) => {
  try {
    const schoolId = (req as any).user?.schoolId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!schoolId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // FIX #5: Validate schoolId before deleting
    // Check if room has schedules
    const hasSchedules = await roomService.hasSchedules(id, schoolId);
    if (hasSchedules) {
      res.status(400).json({
        message:
          "Não é possível desativar uma sala que possui aulas vinculadas",
      });
      return;
    }

    const deleted = await roomService.delete(id, schoolId);
    if (!deleted) {
      res.status(404).json({ message: "Sala não encontrada" });
      return;
    }
    res.status(204).send();
  } catch (error: any) {
    console.error("Error deleting room:", error);
    if (error.message === "ACCESS_DENIED") {
      res.status(403).json({ message: "Acesso negado" });
      return;
    }
    res.status(500).json({ message: "Erro ao desativar sala" });
  }
};

export default {
  list,
  listAll,
  getById,
  create,
  update,
  delete: remove,
};
