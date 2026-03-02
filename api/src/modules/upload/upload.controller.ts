import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import {
  deleteFile,
  fileToUrl,
  urlToPath,
  logoFileToUrl,
  logoUrlToPath,
} from "../../middlewares/upload";

// Helper to extract filename from multer file
function getFilename(req: Express.Request): string | undefined {
  const file = (req as any).file;
  return file?.filename;
}

// Helper to get string param
function getParam(param: string | string[] | undefined): string {
  return Array.isArray(param) ? param[0] : param || "";
}

// ─── Upload Own Avatar ──────────────────────────────────────────────────────
export async function uploadOwnAvatar(req: Request, res: Response) {
  try {
    const user = req.user!;

    // STUDENT cannot change their own avatar
    if (user.role === "STUDENT") {
      return res
        .status(403)
        .json({ error: "Aluno não pode alterar o próprio avatar" });
    }

    // Roles allowed: ADMIN_GLOBAL, SECRETARY, TEACHER, GUARDIAN
    const allowedRoles = ["ADMIN_GLOBAL", "SECRETARY", "TEACHER", "GUARDIAN"];
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    const filename = getFilename(req);
    if (!filename) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }

    const newUrl = fileToUrl(filename);

    // Get current avatar to delete old file
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { avatarUrl: true },
    });

    if (currentUser?.avatarUrl) {
      const oldPath = urlToPath(currentUser.avatarUrl);
      if (oldPath) deleteFile(oldPath);
    }

    // Update user avatar
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl: newUrl },
      select: { avatarUrl: true },
    });

    return res.json({ avatarUrl: updated.avatarUrl });
  } catch (error) {
    console.error("Error uploading own avatar:", error);
    return res.status(500).json({ error: "Erro ao fazer upload do avatar" });
  }
}

// ─── Upload User Avatar (admin) ───────────────────────────────────────────────
export async function uploadUserAvatar(req: Request, res: Response) {
  try {
    const userId = getParam(req.params.userId);
    const requester = req.user!;

    // Roles allowed: ADMIN_GLOBAL, SECRETARY
    if (!["ADMIN_GLOBAL", "SECRETARY"].includes(requester.role)) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    const filename = getFilename(req);
    if (!filename) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }

    const newUrl = fileToUrl(filename);

    // Find target user
    const targetUser = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null, active: true },
    });

    if (!targetUser) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    // SECRETARY can only modify users in their school
    if (requester.role === "SECRETARY") {
      if (targetUser.schoolId !== requester.schoolId) {
        return res
          .status(403)
          .json({ error: "Acesso negado: usuário de outra escola" });
      }
      if (targetUser.role === "ADMIN_GLOBAL") {
        return res
          .status(403)
          .json({
            error: "Secretário não pode alterar avatar de ADMIN_GLOBAL",
          });
      }
    }

    // Delete old avatar if exists
    if (targetUser.avatarUrl) {
      const oldPath = urlToPath(targetUser.avatarUrl);
      if (oldPath) deleteFile(oldPath);
    }

    // Update user avatar
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: newUrl },
      select: { avatarUrl: true },
    });

    return res.json({ avatarUrl: updated.avatarUrl });
  } catch (error) {
    console.error("Error uploading user avatar:", error);
    return res.status(500).json({ error: "Erro ao fazer upload do avatar" });
  }
}

// ─── Upload Student Avatar ──────────────────────────────────────────────────
export async function uploadStudentAvatar(req: Request, res: Response) {
  try {
    const studentId = getParam(req.params.studentId);
    const requester = req.user!;

    // Roles allowed: ADMIN_GLOBAL, SECRETARY
    if (!["ADMIN_GLOBAL", "SECRETARY"].includes(requester.role)) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    const filename = getFilename(req);
    if (!filename) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }

    const newUrl = fileToUrl(filename);

    // Find target student
    let student;
    if (requester.role === "ADMIN_GLOBAL") {
      student = await prisma.student.findUnique({
        where: { id: studentId },
      });
    } else {
      // SECRETARY can only modify students in their school
      student = await prisma.student.findFirst({
        where: { id: studentId, schoolId: requester.schoolId! },
      });
    }

    if (!student) {
      return res.status(404).json({ error: "Aluno não encontrado" });
    }

    // Delete old avatar if exists
    if (student.avatarUrl) {
      const oldPath = urlToPath(student.avatarUrl);
      if (oldPath) deleteFile(oldPath);
    }

    // Update student avatar
    const updated = await prisma.student.update({
      where: { id: studentId },
      data: { avatarUrl: newUrl },
      select: { avatarUrl: true },
    });

    return res.json({ avatarUrl: updated.avatarUrl });
  } catch (error) {
    console.error("Error uploading student avatar:", error);
    return res.status(500).json({ error: "Erro ao fazer upload do avatar" });
  }
}

// ─── Upload My School Logo (Secretary) ────────────────────────────────────────
export async function uploadMySchoolLogo(req: Request, res: Response) {
  try {
    const requester = req.user!;

    // Only SECRETARY can upload their school's logo
    if (requester.role !== "SECRETARY") {
      return res.status(403).json({ error: "Acesso negado" });
    }

    const filename = getFilename(req);
    if (!filename) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }

    const newUrl = logoFileToUrl(filename);
    const schoolId = requester.schoolId!;

    // Get current logo to delete old file
    const currentConfig = await prisma.schoolConfig.findUnique({
      where: { schoolId },
      select: { logoUrl: true },
    });

    if (currentConfig?.logoUrl) {
      const oldPath = logoUrlToPath(currentConfig.logoUrl);
      if (oldPath) deleteFile(oldPath);
    }

    // Update or create school config with logo
    const updated = await prisma.schoolConfig.upsert({
      where: { schoolId },
      update: { logoUrl: newUrl },
      create: { schoolId, logoUrl: newUrl },
      select: { logoUrl: true },
    });

    return res.json({ logoUrl: updated.logoUrl });
  } catch (error) {
    console.error("Error uploading school logo:", error);
    return res.status(500).json({ error: "Erro ao fazer upload do logo" });
  }
}

// ─── Upload School Logo (Admin Global) ───────────────────────────────────────
export async function uploadSchoolLogo(req: Request, res: Response) {
  try {
    const schoolId = getParam(req.params.schoolId);
    const requester = req.user!;

    // Only ADMIN_GLOBAL can upload logo for any school
    if (requester.role !== "ADMIN_GLOBAL") {
      return res.status(403).json({ error: "Acesso negado" });
    }

    const filename = getFilename(req);
    if (!filename) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }

    const newUrl = logoFileToUrl(filename);

    // Verify school exists
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true },
    });

    if (!school) {
      return res.status(404).json({ error: "Escola não encontrada" });
    }

    // Get current logo to delete old file
    const currentConfig = await prisma.schoolConfig.findUnique({
      where: { schoolId },
      select: { logoUrl: true },
    });

    if (currentConfig?.logoUrl) {
      const oldPath = logoUrlToPath(currentConfig.logoUrl);
      if (oldPath) deleteFile(oldPath);
    }

    // Update or create school config with logo
    const updated = await prisma.schoolConfig.upsert({
      where: { schoolId },
      update: { logoUrl: newUrl },
      create: { schoolId, logoUrl: newUrl },
      select: { logoUrl: true },
    });

    return res.json({ logoUrl: updated.logoUrl });
  } catch (error) {
    console.error("Error uploading school logo:", error);
    return res.status(500).json({ error: "Erro ao fazer upload do logo" });
  }
}
