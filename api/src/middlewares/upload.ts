import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

// Configure upload directory
const UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

// Allowed MIME types
const ALLOWED_MIMETYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

// Max file size: 5MB
const MAX_SIZE = 5 * 1024 * 1024;

// Ensure directories exist
function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// File filter function
const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Tipo de arquivo inválido. Apenas imagens são permitidas."));
  }
};

// Generate unique filename
const getFilename = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: (error: Error | null, filename: string) => void,
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const filename = `${uuidv4()}${ext}`;
  cb(null, filename);
};

// Avatar destination
const getAvatarDestination = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: (error: Error | null, destination: string) => void,
) => {
  const dest = path.join(UPLOAD_DIR, "avatars");
  ensureDir(dest);
  cb(null, dest);
};

// Logo destination
const getLogoDestination = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: (error: Error | null, destination: string) => void,
) => {
  const dest = path.join(UPLOAD_DIR, "logos");
  ensureDir(dest);
  cb(null, dest);
};

// Configure multer for avatars
const avatarStorage = multer.diskStorage({
  destination: getAvatarDestination,
  filename: getFilename,
});

// Configure multer for logos
const logoStorage = multer.diskStorage({
  destination: getLogoDestination,
  filename: getFilename,
});

// Export middleware for single file upload with field name "file"
export const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter,
  limits: {
    fileSize: MAX_SIZE,
  },
}).single("file");

export const uploadLogo = multer({
  storage: logoStorage,
  fileFilter,
  limits: {
    fileSize: MAX_SIZE,
  },
}).single("file");

// Alias for compatibility
export const uploadSingle = uploadAvatar;

// Delete file from disk silently
export function deleteFile(filePath: string): void {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    // Silently ignore errors during deletion
    console.error("Error deleting file:", error);
  }
}

// Generate public URL from filename (avatars)
export function fileToUrl(filename: string): string {
  const baseUrl = process.env.API_BASE_URL || "http://localhost:3333";
  return `${baseUrl}/uploads/avatars/${filename}`;
}

// Generate public URL from filename (logos)
export function logoFileToUrl(filename: string): string {
  const baseUrl = process.env.API_BASE_URL || "http://localhost:3333";
  return `${baseUrl}/uploads/logos/${filename}`;
}

// Extract absolute path from avatar URL
export function urlToPath(url: string): string | null {
  if (!url) return null;

  // Extract filename from URL
  const match = url.match(/\/uploads\/avatars\/(.+)$/);
  if (!match) return null;

  const filename = match[1];
  return path.join(UPLOAD_DIR, "avatars", filename);
}

// Extract absolute path from logo URL
export function logoUrlToPath(url: string): string | null {
  if (!url) return null;

  const match = url.match(/\/uploads\/logos\/(.+)$/);
  if (!match) return null;

  const filename = match[1];
  return path.join(UPLOAD_DIR, "logos", filename);
}
