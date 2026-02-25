import { prisma } from "../../config/prisma";

export async function createNotificationsForUsers(
  schoolId: string,
  userIds: string[],
  input: { type: string; title: string; message: string },
) {
  if (!userIds || userIds.length === 0) return;
  const p: any = prisma as any;
  await p.notification.createMany({
    data: userIds.map((userId) => ({
      schoolId,
      userId,
      type: input.type,
      title: input.title,
      message: input.message,
    })),
  });
}

export async function listUserNotifications(params: {
  schoolId: string;
  userId: string;
  unreadOnly?: boolean;
  skip?: number;
  take?: number;
}) {
  const p: any = prisma as any;
  const where: any = { schoolId: params.schoolId, userId: params.userId };
  if (params.unreadOnly) where.readAt = null;
  const [items, total] = await Promise.all([
    p.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: params.skip ?? 0,
      take: params.take ?? 20,
    }),
    p.notification.count({ where }),
  ]);
  return { items, total };
}

export async function markNotificationRead(params: {
  schoolId: string;
  userId: string;
  id: string;
}) {
  const p: any = prisma as any;
  const existing = await p.notification.findFirst({
    where: { id: params.id, schoolId: params.schoolId, userId: params.userId },
  });
  if (!existing) return null;
  return await p.notification.update({
    where: { id: params.id },
    data: { readAt: new Date() },
  });
}

export async function markAllNotificationsRead(params: {
  schoolId: string;
  userId: string;
}) {
  const p: any = prisma as any;
  await p.notification.updateMany({
    where: { schoolId: params.schoolId, userId: params.userId, readAt: null },
    data: { readAt: new Date() },
  });
  return { ok: true };
}

