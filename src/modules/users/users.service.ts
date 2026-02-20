import { prisma } from "../../config/prisma";

export const createUserRecord = (data: any) =>
  prisma.user.create({
    data,
    select: {
      id: true,
      schoolId: true,
      email: true,
      name: true,
      phone: true,
      avatarUrl: true,
      role: true,
      active: true,
      createdAt: true,
      updatedAt: true,
    },
  });

export const findUsers = (where: any, skip = 0, take = 20) =>
  prisma.user.findMany({
    where,
    skip,
    take,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      schoolId: true,
      email: true,
      name: true,
      phone: true,
      avatarUrl: true,
      role: true,
      active: true,
      createdAt: true,
      updatedAt: true,
    },
  });

export const countUsers = (where: any) => prisma.user.count({ where });

export const findUserById = (id: string, extraWhere: any = {}) =>
  prisma.user.findFirst({
    where: { id, ...extraWhere },
    select: {
      id: true,
      schoolId: true,
      email: true,
      name: true,
      phone: true,
      avatarUrl: true,
      role: true,
      active: true,
      createdAt: true,
      updatedAt: true,
    },
  });

export const updateUserById = (id: string, data: any) =>
  prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      schoolId: true,
      email: true,
      name: true,
      phone: true,
      avatarUrl: true,
      role: true,
      active: true,
      createdAt: true,
      updatedAt: true,
    },
  });

export const deactivateUserById = (id: string) =>
  prisma.user.update({
    where: { id },
    data: { active: false },
    select: { id: true, active: true, updatedAt: true },
  });
