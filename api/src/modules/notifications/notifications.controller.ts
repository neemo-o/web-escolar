import { Request, Response } from "express";
import { getSchoolId } from "../../middlewares/tenant";
import getParam from "../../utils/getParam";
import { prisma } from "../../config/prisma";
import * as service from "./notifications.service";

export async function listNotifications(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  if (!schoolId) return res.status(403).json({ error: "Escola não associada" });
  const requester = req.user!;

  const page = parseInt(String(req.query.page || "1"), 10) || 1;
  const limit = Math.min(
    parseInt(String(req.query.limit || "20"), 10) || 20,
    100,
  );
  const skip = (page - 1) * limit;
  const unreadOnly = req.query.unread === "true";

  const { items, total } = await service.listUserNotifications({
    schoolId,
    userId: requester.id,
    unreadOnly,
    skip,
    take: limit,
  });

  return res.json({ data: items, meta: { total, page, limit } });
}

export async function getUnreadCount(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  if (!schoolId) return res.status(403).json({ error: "Escola não associada" });
  const requester = req.user!;

  const p: any = prisma as any;
  const count = await p.notification.count({
    where: { schoolId, userId: requester.id, readAt: null },
  });
  return res.json({ unread: count });
}

export async function markRead(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  if (!schoolId) return res.status(403).json({ error: "Escola não associada" });
  const requester = req.user!;
  const id = getParam(req, "id");

  const updated = await service.markNotificationRead({
    schoolId,
    userId: requester.id,
    id,
  });
  if (!updated)
    return res.status(404).json({ error: "Notificação não encontrada" });
  return res.json(updated);
}

export async function markAllRead(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  if (!schoolId) return res.status(403).json({ error: "Escola não associada" });
  const requester = req.user!;

  const result = await service.markAllNotificationsRead({
    schoolId,
    userId: requester.id,
  });
  return res.json(result);
}

export async function createNotification(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  if (!schoolId) return res.status(403).json({ error: "Escola não associada" });

  const requester = req.user!;
  if (requester.role !== "SECRETARY" && requester.role !== "ADMIN_GLOBAL") {
    return res.status(403).json({
      error: "Apenas secretários e administradores podem enviar notificações",
    });
  }

  const { userIds, type, title, message } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res
      .status(400)
      .json({ error: "userIds é obrigatório e deve ser um array" });
  }
  if (!type) return res.status(400).json({ error: "type é obrigatório" });
  if (!title) return res.status(400).json({ error: "title é obrigatório" });
  if (!message) return res.status(400).json({ error: "message é obrigatório" });

  try {
    await service.createNotificationsForUsers(schoolId, userIds, {
      type,
      title,
      message,
    });
    return res.status(201).json({ ok: true, sent: userIds.length });
  } catch (err: any) {
    return res.status(500).json({ error: "Erro ao enviar notificações" });
  }
}
