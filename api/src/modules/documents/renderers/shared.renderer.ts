import type PDFDocument from "pdfkit";
import { prisma } from "../../../config/prisma";
import https from "https";
import http from "http";

export type DocConfig = {
  showLogo: boolean;
  headerHtml?: string | null;
  footerHtml?: string | null;
  directorName?: string | null;
  directorTitle?: string | null;
  schoolName: string;
  logoUrl?: string | null;
};

// ─── Fetch logo as buffer ──────────────────────────────────────────────────────

export async function fetchLogoBuffer(url: string): Promise<Buffer | null> {
  try {
    return await new Promise((resolve, reject) => {
      const client = url.startsWith("https") ? https : http;
      client
        .get(url, (res) => {
          const chunks: Buffer[] = [];
          res.on("data", (chunk) => chunks.push(chunk));
          res.on("end", () => resolve(Buffer.concat(chunks)));
          res.on("error", reject);
        })
        .on("error", reject);
    });
  } catch {
    return null;
  }
}

// ─── Load school config ───────────────────────────────────────────────────────

export async function loadSchoolConfig(schoolId: string): Promise<DocConfig> {
  const [school, config] = await Promise.all([
    prisma.school.findFirst({
      where: { id: schoolId },
      select: { name: true },
    }),
    (prisma as any).schoolConfig.findFirst({
      where: { schoolId },
      select: {
        logoUrl: true,
        displayName: true,
        directorName: true,
        directorTitle: true,
      },
    }),
  ]);

  return {
    schoolName: config?.displayName || school?.name || "Escola",
    logoUrl: config?.logoUrl ?? null,
    directorName: config?.directorName ?? null,
    directorTitle: config?.directorTitle ?? "Diretor(a)",
    showLogo: true,
    headerHtml: null,
    footerHtml: null,
  };
}

// ─── Draw document header ─────────────────────────────────────────────────────

export async function drawHeader(
  doc: InstanceType<typeof PDFDocument>,
  cfg: DocConfig,
  title: string,
  subtitle?: string,
): Promise<void> {
  const pageWidth = doc.page.width;
  const marginLeft = 45;
  const marginRight = 45;
  const contentWidth = pageWidth - marginLeft - marginRight;

  let y = 40;

  if (cfg.showLogo && cfg.logoUrl) {
    const logoBuffer = await fetchLogoBuffer(cfg.logoUrl);
    if (logoBuffer) {
      try {
        doc.image(logoBuffer, marginLeft, y, { height: 48, fit: [120, 48] });
      } catch {
        // logo failed, skip
      }
    }
  }

  const textX = cfg.showLogo && cfg.logoUrl ? marginLeft + 130 : marginLeft;
  const textWidth =
    cfg.showLogo && cfg.logoUrl ? contentWidth - 130 : contentWidth;

  doc
    .font("Helvetica-Bold")
    .fontSize(13)
    .fillColor("#111827")
    .text(cfg.schoolName, textX, y + 2, { width: textWidth });

  if (cfg.directorName) {
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#6b7280")
      .text(`${cfg.directorTitle}: ${cfg.directorName}`, textX, y + 20, {
        width: textWidth,
      });
  }

  const lineY = Math.max(y + 52, doc.y + 6);
  doc
    .moveTo(marginLeft, lineY)
    .lineTo(pageWidth - marginRight, lineY)
    .strokeColor("#d1d5db")
    .lineWidth(0.5)
    .stroke();

  const titleY = lineY + 10;
  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor("#111827")
    .text(title, marginLeft, titleY, { align: "center", width: contentWidth });

  if (subtitle) {
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#6b7280")
      .text(subtitle, marginLeft, titleY + 20, {
        align: "center",
        width: contentWidth,
      });
  }

  doc.moveDown(0.5);
}

// ─── Draw footer ──────────────────────────────────────────────────────────────

export function drawFooter(
  doc: InstanceType<typeof PDFDocument>,
  cfg: DocConfig,
  docId?: string,
): void {
  const pageWidth = doc.page.width;
  const marginLeft = 45;
  const marginRight = 45;
  const contentWidth = pageWidth - marginLeft - marginRight;
  const footerY = doc.page.height - 50;

  doc
    .moveTo(marginLeft, footerY)
    .lineTo(pageWidth - marginRight, footerY)
    .strokeColor("#e5e7eb")
    .lineWidth(0.5)
    .stroke();

  const today = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#9ca3af")
    .text(
      `Emitido em ${today}${docId ? ` · ID: ${docId.slice(0, 8).toUpperCase()}` : ""}`,
      marginLeft,
      footerY + 8,
      { width: contentWidth, align: "left" },
    );

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#9ca3af")
    .text(cfg.schoolName, marginLeft, footerY + 8, {
      width: contentWidth,
      align: "right",
    });
}

// ─── Draw signature lines ─────────────────────────────────────────────────────

export function drawSignatureLines(
  doc: InstanceType<typeof PDFDocument>,
  labels: string[],
): void {
  const pageWidth = doc.page.width;
  const marginLeft = 45;
  const marginRight = 45;
  const contentWidth = pageWidth - marginLeft - marginRight;
  const colWidth = contentWidth / labels.length;

  doc.moveDown(2);
  const y = doc.y;

  labels.forEach((label, i) => {
    const x = marginLeft + i * colWidth + colWidth * 0.1;
    const lineWidth = colWidth * 0.8;

    doc
      .moveTo(x, y)
      .lineTo(x + lineWidth, y)
      .strokeColor("#374151")
      .lineWidth(0.5)
      .stroke();

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#6b7280")
      .text(label, x, y + 5, { width: lineWidth, align: "center" });
  });
}

// ─── Table helpers ────────────────────────────────────────────────────────────

export type TableColumn = {
  header: string;
  width: number;
  align?: "left" | "center" | "right";
};

export function drawTable(
  doc: InstanceType<typeof PDFDocument>,
  columns: TableColumn[],
  rows: (string | number | null | undefined)[][],
  options?: {
    headerBg?: string;
    rowBg?: string;
    altRowBg?: string;
    fontSize?: number;
    headerFontSize?: number;
    rowHeight?: number;
    startX?: number;
    startY?: number;
  },
): void {
  const {
    headerBg = "#f1f5f9",
    rowBg = "#ffffff",
    altRowBg = "#f9fafb",
    fontSize = 9,
    headerFontSize = 9,
    rowHeight = 18,
    startX = 45,
    startY,
  } = options ?? {};

  const x = startX;
  let y = startY ?? doc.y;
  const totalWidth = columns.reduce((s, c) => s + c.width, 0);
  const pageHeight = doc.page.height;
  const bottomMargin = 70;

  function drawRow(
    cells: (string | number | null | undefined)[],
    isHeader: boolean,
    rowIndex: number,
  ) {
    const bg = isHeader ? headerBg : rowIndex % 2 === 0 ? rowBg : altRowBg;

    doc.rect(x, y, totalWidth, rowHeight).fill(bg);
    doc
      .rect(x, y, totalWidth, rowHeight)
      .strokeColor("#e5e7eb")
      .lineWidth(0.3)
      .stroke();

    let cx = x;
    columns.forEach((col, ci) => {
      const cell = String(cells[ci] ?? "");
      doc
        .font(isHeader ? "Helvetica-Bold" : "Helvetica")
        .fontSize(isHeader ? headerFontSize : fontSize)
        .fillColor(isHeader ? "#374151" : "#111827")
        .text(
          cell,
          cx + 4,
          y + (rowHeight - (isHeader ? headerFontSize : fontSize)) / 2,
          {
            width: col.width - 8,
            align: col.align ?? "left",
            lineBreak: false,
            ellipsis: true,
          },
        );
      cx += col.width;
    });

    y += rowHeight;
  }

  // Header
  drawRow(
    columns.map((c) => c.header),
    true,
    -1,
  );

  // Rows
  rows.forEach((row, i) => {
    if (y + rowHeight > pageHeight - bottomMargin) {
      doc.addPage();
      y = 45;
      drawRow(
        columns.map((c) => c.header),
        true,
        -1,
      );
    }
    drawRow(row, false, i);
  });

  doc.y = y + 4;
}

// ─── Section title ────────────────────────────────────────────────────────────

export function sectionTitle(
  doc: InstanceType<typeof PDFDocument>,
  text: string,
  color = "#4f46e5",
): void {
  doc.moveDown(0.6);
  const x = 45;
  const y = doc.y;
  const pageWidth = doc.page.width;

  doc.rect(x, y, pageWidth - 90, 18).fill(color + "18");
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(color)
    .text(text.toUpperCase(), x + 6, y + 4, { width: pageWidth - 102 });

  doc.y = y + 22;
}

// ─── Info block (label: value pairs) ─────────────────────────────────────────

export function drawInfoGrid(
  doc: InstanceType<typeof PDFDocument>,
  fields: { label: string; value: string }[],
  cols = 2,
): void {
  const pageWidth = doc.page.width;
  const marginLeft = 45;
  const contentWidth = pageWidth - 90;
  const colWidth = contentWidth / cols;

  let startY = doc.y;
  let maxY = startY;

  fields.forEach((field, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = marginLeft + col * colWidth;
    const y = startY + row * 26;

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#6b7280")
      .text(field.label, x, y, { width: colWidth - 8 });
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("#111827")
      .text(field.value || "—", x, y + 10, { width: colWidth - 8 });

    maxY = Math.max(maxY, y + 24);
  });

  doc.y = maxY + 8;
}
