import { Router } from "express";
import { authorize } from "../../middlewares/authorize";
import {
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  listIssuedDocuments,
  getIssuedDocument,
  createIssuedDocument,
  updateIssuedDocument,
  deleteIssuedDocument,
  generateDocumentPdf,
  generateStructuredPdf,
  resolveVariables,
} from "./documents.controller";

const router = Router();

router.get("/document-templates", authorize(["SECRETARY"]), listTemplates);
router.get("/document-templates/:id", authorize(["SECRETARY"]), getTemplate);
router.post("/document-templates", authorize(["SECRETARY"]), createTemplate);
router.patch(
  "/document-templates/:id",
  authorize(["SECRETARY"]),
  updateTemplate,
);
router.delete(
  "/document-templates/:id",
  authorize(["SECRETARY"]),
  deleteTemplate,
);

router.get("/issued-documents", authorize(["SECRETARY"]), listIssuedDocuments);
router.get(
  "/issued-documents/:id",
  authorize(["SECRETARY"]),
  getIssuedDocument,
);
router.post(
  "/issued-documents",
  authorize(["SECRETARY"]),
  createIssuedDocument,
);
router.patch(
  "/issued-documents/:id",
  authorize(["SECRETARY"]),
  updateIssuedDocument,
);
router.delete(
  "/issued-documents/:id",
  authorize(["SECRETARY"]),
  deleteIssuedDocument,
);

router.get(
  "/issued-documents/:id/pdf",
  authorize(["SECRETARY"]),
  generateDocumentPdf,
);

// Generate structured PDF directly (preview / quick emit)
router.post(
  "/documents/generate-structured",
  authorize(["SECRETARY"]),
  generateStructuredPdf,
);

router.post(
  "/documents/resolve-variables",
  authorize(["SECRETARY"]),
  resolveVariables,
);

export default router;
