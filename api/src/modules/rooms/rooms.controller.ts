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
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const room = await roomService.findById(id);

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
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { name, capacity, active } = req.body;

    const room = await roomService.update(id, {
      name,
      capacity,
      active,
    });

    res.json(room);
  } catch (error) {
    console.error("Error updating room:", error);
    res.status(500).json({ message: "Erro ao atualizar sala" });
  }
};

// DELETE /rooms/:id - Deactivate a room
export const remove = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    // Check if room has schedules
    const hasSchedules = await roomService.hasSchedules(id);
    if (hasSchedules) {
      res.status(400).json({
        message:
          "Não é possível desativar uma sala que possui aulas vinculadas",
      });
      return;
    }

    await roomService.delete(id);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting room:", error);
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
