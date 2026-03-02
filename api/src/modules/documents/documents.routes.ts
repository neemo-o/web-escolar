import { Router } from "express";
import { authorize } from "../../middlewares/authorize";
import {
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  duplicateTemplate,
  listIssuedDocuments,
  getIssuedDocument,
  createIssuedDocument,
  updateIssuedDocument,
  deleteIssuedDocument,
  generateDocumentPdf,
  generateStructuredPdf,
  resolveVariables,
  listSignaturePresets,
  createSignaturePreset,
  deleteSignaturePreset,
  getSchoolConfig,
  updateSchoolDocumentConfig,
} from "./documents.controller";

const router = Router();

// ─── Templates
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
router.post(
  "/document-templates/:id/duplicate",
  authorize(["SECRETARY"]),
  duplicateTemplate,
);

// ─── Issued Documents
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

// ─── Generation / Utilities
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

// ─── Signature Presets
router.get(
  "/document-signature-presets",
  authorize(["SECRETARY"]),
  listSignaturePresets,
);
router.post(
  "/document-signature-presets",
  authorize(["SECRETARY"]),
  createSignaturePreset,
);
router.delete(
  "/document-signature-presets/:id",
  authorize(["SECRETARY"]),
  deleteSignaturePreset,
);

// ─── School Document Config
router.get(
  "/schools/me/document-config",
  authorize(["SECRETARY"]),
  getSchoolConfig,
);
router.patch(
  "/schools/me/document-config",
  authorize(["SECRETARY"]),
  updateSchoolDocumentConfig,
);

export default router;
