import { PDFDocument } from "pdf-lib";

export async function exportPdf(image: Blob): Promise<Blob> {
  const pdf = await PDFDocument.create(); const bytes = await image.arrayBuffer();
  const png = await pdf.embedPng(bytes); const ratio = png.width / png.height;
  // A4, choosing orientation from the scanned certificate.
  const landscape = ratio >= 1; const page = pdf.addPage(landscape ? [841.89, 595.28] : [595.28, 841.89]);
  const margin = 18; const availableWidth = page.getWidth() - margin * 2; const availableHeight = page.getHeight() - margin * 2;
  const scale = Math.min(availableWidth / png.width, availableHeight / png.height);
  const width = png.width * scale, height = png.height * scale;
  page.drawImage(png, { x: (page.getWidth() - width) / 2, y: (page.getHeight() - height) / 2, width, height });
  const output = await pdf.save();
  return new Blob([output.buffer as ArrayBuffer], { type: "application/pdf" });
}
