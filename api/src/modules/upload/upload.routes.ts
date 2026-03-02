import { Router, Request, Response, NextFunction } from "express";
import { authorize } from "../../middlewares/authorize";
import { uploadAvatar, uploadLogo } from "../../middlewares/upload";
import {
  uploadOwnAvatar,
  uploadUserAvatar,
  uploadStudentAvatar,
  uploadMySchoolLogo,
  uploadSchoolLogo,
} from "./upload.controller";

const router = Router();

// Wrapper to handle multer errors
function handleMulterError(
  uploadFn: (req: Request, res: Response, next: NextFunction) => void,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    uploadFn(req, res, (err: any) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res
            .status(400)
            .json({ error: "Arquivo muito grande. Máximo 5MB." });
        }
        return res
          .status(400)
          .json({ error: err.message || "Erro ao processar upload" });
      }
      next();
    });
  };
}

// POST /upload/avatar/me
// Roles: ADMIN_GLOBAL, SECRETARY, TEACHER, GUARDIAN
router.post(
  "/upload/avatar/me",
  authorize(["ADMIN_GLOBAL", "SECRETARY", "TEACHER", "GUARDIAN"]),
  handleMulterError(uploadAvatar),
  uploadOwnAvatar,
);

// POST /upload/avatar/user/:userId
// Roles: ADMIN_GLOBAL, SECRETARY
router.post(
  "/upload/avatar/user/:userId",
  authorize(["ADMIN_GLOBAL", "SECRETARY"]),
  handleMulterError(uploadAvatar),
  uploadUserAvatar,
);

// POST /upload/avatar/student/:studentId
// Roles: ADMIN_GLOBAL, SECRETARY
router.post(
  "/upload/avatar/student/:studentId",
  authorize(["ADMIN_GLOBAL", "SECRETARY"]),
  handleMulterError(uploadAvatar),
  uploadStudentAvatar,
);

// POST /upload/logo/school/me
// Role: SECRETARY
router.post(
  "/upload/logo/school/me",
  authorize(["SECRETARY"]),
  handleMulterError(uploadLogo),
  uploadMySchoolLogo,
);

// POST /upload/logo/school/:schoolId
// Role: ADMIN_GLOBAL
router.post(
  "/upload/logo/school/:schoolId",
  authorize(["ADMIN_GLOBAL"]),
  handleMulterError(uploadLogo),
  uploadSchoolLogo,
);

export default router;
