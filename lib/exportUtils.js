"use client";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, HeadingLevel, WidthType } from "docx";

export function exportExcel(filename, headers, rows) {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  XLSX.writeFile(wb, filename + ".xlsx");
}

// Note: jsPDF's built-in fonts do not support Khmer Unicode glyphs.
// Khmer text in the PDF export may show as blank boxes.
// For fully correct Khmer output, prefer the Excel or Word export.
export function exportPDF(filename, title, headers, rows) {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(title, 10, 15);
  let y = 25;
  doc.setFontSize(9);
  doc.text(headers.join("  |  "), 10, y);
  y += 7;
  doc.setLineWidth(0.1);
  doc.line(10, y - 4, 200, y - 4);
  rows.forEach((r) => {
    const line = r.map((c) => (c === null || c === undefined ? "" : String(c))).join("  |  ");
    doc.text(line, 10, y);
    y += 7;
    if (y > 280) {
      doc.addPage();
      y = 15;
    }
  });
  doc.save(filename + ".pdf");
}

export async function exportWord(filename, title, headers, rows) {
  const headerRow = new TableRow({
    children: headers.map(
      (h) =>
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: String(h), bold: true })] })],
        })
    ),
  });

  const bodyRows = rows.map(
    (r) =>
      new TableRow({
        children: r.map(
          (c) =>
            new TableCell({
              children: [new Paragraph(c === null || c === undefined ? "" : String(c))],
            })
        ),
      })
  );

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: title, heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ text: "" }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [headerRow, ...bodyRows],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename + ".docx";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
