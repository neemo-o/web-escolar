import { Request, Response } from "express";
import { getSchoolId } from "../../middlewares/tenant";
import getParam from "../../utils/getParam";
import { prisma } from "../../config/prisma";
import { cleanCpf, isValidCpf } from "../../utils/cpf";

// ── TEACHER PROFILE ───────────────────────────────────────────────────────────

export async function getTeacherProfile(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  if (!schoolId)
    return res.status(403).json({ error: "Escola não associada" });
  const userId = getParam(req, "userId");

  const user = await prisma.user.findFirst({
    where: { id: userId, schoolId, role: "TEACHER", deletedAt: null },
  });
  if (!user) return res.status(404).json({ error: "Professor não encontrado" });

  const profile = (await prisma.teacherProfile.findUnique({
    where: { userId },
  })) as any;
  if (!profile) return res.json({});

  delete profile.cpf;

  return res.json(profile);
}

export async function upsertTeacherProfile(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  if (!schoolId)
    return res.status(403).json({ error: "Escola não associada" });
  const userId = getParam(req, "userId");

  const user = await prisma.user.findFirst({
    where: { id: userId, schoolId, role: "TEACHER", deletedAt: null },
  });
  if (!user) return res.status(404).json({ error: "Professor não encontrado" });

  const {
    internalCode,
    cpf,
    rg,
    birthDate,
    gender,
    nationality,
    formation,
    specialization,
    workloadHours,
    admissionDate,
    status,
    zipCode,
    street,
    addressNumber,
    neighborhood,
    city,
    state,
    canGrade,
    canAttendance,
    canEditContent,
    canViewReports,
  } = req.body;

  if (cpf && !isValidCpf(cpf)) {
    return res.status(400).json({ error: "CPF inválido" });
  }
  const cleanedCpf = cpf !== undefined && cpf ? cleanCpf(cpf) : cpf;

  const profile = await prisma.teacherProfile.upsert({
    where: { userId },
    create: {
      schoolId,
      userId,
      internalCode: internalCode ?? null,
      cpf: cleanedCpf ?? null,
      rg: rg ?? null,
      birthDate: birthDate ? new Date(birthDate) : null,
      gender: gender ?? null,
      nationality: nationality ?? null,
      formation: formation ?? null,
      specialization: specialization ?? null,
      workloadHours: workloadHours ?? null,
      admissionDate: admissionDate ? new Date(admissionDate) : null,
      status: status ?? "ATIVO",
      zipCode: zipCode ?? null,
      street: street ?? null,
      addressNumber: addressNumber ?? null,
      neighborhood: neighborhood ?? null,
      city: city ?? null,
      state: state ?? null,
      canGrade: canGrade !== undefined ? canGrade : true,
      canAttendance: canAttendance !== undefined ? canAttendance : true,
      canEditContent: canEditContent !== undefined ? canEditContent : true,
      canViewReports: canViewReports !== undefined ? canViewReports : true,
    },
    update: {
      internalCode:
        internalCode !== undefined ? internalCode || null : undefined,
      cpf: cpf !== undefined ? (cleanedCpf ? cleanedCpf : null) : undefined,
      rg: rg !== undefined ? rg || null : undefined,
      birthDate:
        birthDate !== undefined
          ? birthDate
            ? new Date(birthDate)
            : null
          : undefined,
      gender: gender !== undefined ? gender || null : undefined,
      nationality: nationality !== undefined ? nationality || null : undefined,
      formation: formation !== undefined ? formation || null : undefined,
      specialization:
        specialization !== undefined ? specialization || null : undefined,
      workloadHours:
        workloadHours !== undefined ? workloadHours || null : undefined,
      admissionDate:
        admissionDate !== undefined
          ? admissionDate
            ? new Date(admissionDate)
            : null
          : undefined,
      status: status ?? undefined,
      zipCode: zipCode !== undefined ? zipCode || null : undefined,
      street: street !== undefined ? street || null : undefined,
      addressNumber:
        addressNumber !== undefined ? addressNumber || null : undefined,
      neighborhood:
        neighborhood !== undefined ? neighborhood || null : undefined,
      city: city !== undefined ? city || null : undefined,
      state: state !== undefined ? state || null : undefined,
      canGrade: canGrade !== undefined ? canGrade : undefined,
      canAttendance: canAttendance !== undefined ? canAttendance : undefined,
      canEditContent: canEditContent !== undefined ? canEditContent : undefined,
      canViewReports: canViewReports !== undefined ? canViewReports : undefined,
    },
  });

  const out: any = { ...profile };
  delete out.cpf;
  return res.json(out);
}

// ── GUARDIAN PROFILE ──────────────────────────────────────────────────────────

export async function getGuardianProfile(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  if (!schoolId)
    return res.status(403).json({ error: "Escola não associada" });
  const userId = getParam(req, "userId");

  const user = await prisma.user.findFirst({
    where: { id: userId, schoolId, role: "GUARDIAN", deletedAt: null },
  });
  if (!user)
    return res.status(404).json({ error: "Responsável não encontrado" });

  const profile = (await prisma.guardianProfile.findUnique({
    where: { userId },
  })) as any;
  if (!profile) return res.json({});

  delete profile.cpf;

  return res.json(profile);
}

export async function upsertGuardianProfile(req: Request, res: Response) {
  const schoolId = getSchoolId(req);
  if (!schoolId)
    return res.status(403).json({ error: "Escola não associada" });
  const userId = getParam(req, "userId");

  const user = await prisma.user.findFirst({
    where: { id: userId, schoolId, role: "GUARDIAN", deletedAt: null },
  });
  if (!user)
    return res.status(404).json({ error: "Responsável não encontrado" });

  const {
    cpf,
    rg,
    birthDate,
    maritalStatus,
    profession,
    phoneSecondary,
    zipCode,
    street,
    addressNumber,
    neighborhood,
    city,
    state,
  } = req.body;

  if (cpf && !isValidCpf(cpf)) {
    return res.status(400).json({ error: "CPF inválido" });
  }
  const cleanedCpf = cpf !== undefined && cpf ? cleanCpf(cpf) : cpf;

  const profile = await prisma.guardianProfile.upsert({
    where: { userId },
    create: {
      schoolId,
      userId,
      cpf: cleanedCpf ?? null,
      rg: rg ?? null,
      birthDate: birthDate ? new Date(birthDate) : null,
      maritalStatus: maritalStatus ?? null,
      profession: profession ?? null,
      phoneSecondary: phoneSecondary ?? null,
      zipCode: zipCode ?? null,
      street: street ?? null,
      addressNumber: addressNumber ?? null,
      neighborhood: neighborhood ?? null,
      city: city ?? null,
      state: state ?? null,
    },
    update: {
      cpf: cpf !== undefined ? (cleanedCpf ? cleanedCpf : null) : undefined,
      rg: rg !== undefined ? rg || null : undefined,
      birthDate:
        birthDate !== undefined
          ? birthDate
            ? new Date(birthDate)
            : null
          : undefined,
      maritalStatus:
        maritalStatus !== undefined ? maritalStatus || null : undefined,
      profession: profession !== undefined ? profession || null : undefined,
      phoneSecondary:
        phoneSecondary !== undefined ? phoneSecondary || null : undefined,
      zipCode: zipCode !== undefined ? zipCode || null : undefined,
      street: street !== undefined ? street || null : undefined,
      addressNumber:
        addressNumber !== undefined ? addressNumber || null : undefined,
      neighborhood:
        neighborhood !== undefined ? neighborhood || null : undefined,
      city: city !== undefined ? city || null : undefined,
      state: state !== undefined ? state || null : undefined,
    },
  });

  const out: any = { ...profile };
  delete out.cpf;
  return res.json(out);
}
