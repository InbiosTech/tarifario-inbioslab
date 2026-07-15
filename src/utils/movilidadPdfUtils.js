import { jsPDF } from "jspdf";
import ExcelJS from "exceljs";
import {
  AlignmentType,
  BorderStyle,
  Document,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

function drawLabeledLine(doc, label, xLabel, y, xLineStart, xLineEnd, value = "") {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(label, xLabel, y);
  doc.setDrawColor(80, 80, 80);
  doc.setLineWidth(0.2);
  doc.line(xLineStart, y + 0.5, xLineEnd, y + 0.5);
  if (value) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(String(value), xLineStart + 1, y - 0.5);
  }
}

async function imageUrlToDataUrl(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("No se pudo cargar la imagen");
  }
  const blob = await response.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("No se pudo convertir la imagen"));
    reader.readAsDataURL(blob);
  });
}

async function getImageDimensions(dataUrl) {
  return await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => reject(new Error("No se pudo leer el tamano de la imagen"));
    img.src = dataUrl;
  });
}

function getRowsWithData(rows) {
  return rows.filter((row) => row.fecha || row.destino || row.motivo || row.importe);
}

function getImporteTotal(rows) {
  return rows.reduce((acc, row) => {
    const amount = Number(row?.importe);
    return Number.isFinite(amount) ? acc + amount : acc;
  }, 0);
}

function formatDateForDisplay(dateText) {
  if (!dateText || !String(dateText).includes("-")) {
    return String(dateText || "");
  }
  const [year, month, day] = String(dateText).split("-");
  return `${day}/${month}/${year}`;
}

function getTodayStamp() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function imageUrlToUint8Array(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("No se pudo cargar la imagen");
  }
  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

export async function generateMovilidadPdf(header, rows, signatureUrl) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const pageWidth = 210;
  const startX = 8;
  const endX = 202;

  doc.setFillColor(236, 223, 223);
  doc.rect(startX, 8, endX - startX, 5, "F");
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.3);
  doc.rect(startX, 8, endX - startX, 5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("PLANILLA DE MOVILIDAD", pageWidth / 2, 11.6, { align: "center" });

  doc.setFontSize(8);
  doc.text("Fecha de Emision :", 156, 17);
  doc.rect(182, 13.5, 20, 6);
  doc.setFont("helvetica", "normal");
  doc.text(header.fechaEmision || "", 192, 17.6, { align: "center" });

  let y = 24;
  drawLabeledLine(doc, "RAZON SOCIAL", 8, y, 38, 147, (header.razonSocial || "").toUpperCase());
  drawLabeledLine(doc, "RUC", 132, y, 140, 202, header.ruc || "");

  y += 7;
  drawLabeledLine(doc, "TRABAJADOR", 8, y, 38, 202, (header.trabajador || "").toUpperCase());

  y += 7;
  drawLabeledLine(doc, "DNI", 8, y, 38, 202, header.dni || "");

  y += 7;
  drawLabeledLine(doc, "AREA", 8, y, 38, 127, (header.area || "").toUpperCase());
  drawLabeledLine(doc, "CARGO:", 130, y, 142, 202, (header.cargo || "").toUpperCase());

  y += 5;

  const tableTop = y;
  const tableBottom = 268;
  const colX = [8, 20, 46, 92, 171, 202];

  doc.setLineWidth(0.4);
  doc.rect(colX[0], tableTop, colX[colX.length - 1] - colX[0], tableBottom - tableTop);

  for (let i = 1; i < colX.length - 1; i += 1) {
    doc.line(colX[i], tableTop, colX[i], tableBottom);
  }

  const headerHeight = 9;
  doc.line(colX[0], tableTop + headerHeight, colX[colX.length - 1], tableTop + headerHeight);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("N°", (colX[0] + colX[1]) / 2, tableTop + 5.5, { align: "center" });
  doc.text("FECHA", (colX[1] + colX[2]) / 2, tableTop + 5.5, { align: "center" });
  doc.text("DESTINO", (colX[2] + colX[3]) / 2, tableTop + 5.5, { align: "center" });
  doc.text("MOTIVO DEL DESPLAZAMIENTO", (colX[3] + colX[4]) / 2, tableTop + 5.5, { align: "center" });
  doc.text("IMPORTE", (colX[4] + colX[5]) / 2, tableTop + 5.5, { align: "center" });

  const bodyHeight = tableBottom - (tableTop + headerHeight);
  const dataCapacity = Math.max(14, rows.length);
  const rowCount = dataCapacity + 1;
  const rowHeight = bodyHeight / rowCount;

  doc.setLineWidth(0.2);
  for (let i = 1; i < rowCount; i += 1) {
    const rowY = tableTop + headerHeight + rowHeight * i;
    doc.line(colX[0], rowY, colX[colX.length - 1], rowY);
  }

  const cleanRows = getRowsWithData(rows);
  const importeTotal = getImporteTotal(cleanRows);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  cleanRows.slice(0, dataCapacity).forEach((row, index) => {
    const textY = tableTop + headerHeight + rowHeight * index + rowHeight / 2 + 1;
    doc.text(String(index + 1), (colX[0] + colX[1]) / 2, textY, { align: "center" });
    doc.text(String(row.fecha || ""), colX[1] + 1.2, textY);
    doc.text(String(row.destino || ""), colX[2] + 1.2, textY, { maxWidth: colX[3] - colX[2] - 2.5 });
    doc.text(String(row.motivo || ""), colX[3] + 1.2, textY, { maxWidth: colX[4] - colX[3] - 2.5 });
    const importeText = row.importe !== "" && row.importe !== null && row.importe !== undefined
      ? `S/ ${Number(row.importe || 0).toFixed(2)}`
      : "";
    doc.text(importeText, colX[5] - 1.5, textY, { align: "right" });
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  const totalTextY = tableTop + headerHeight + rowHeight * dataCapacity + rowHeight / 2 + 1;
  doc.text("TOTAL", colX[4] - 2, totalTextY, { align: "right" });
  doc.text(`S/ ${importeTotal.toFixed(2)}`, colX[5] - 1.5, totalTextY, { align: "right" });

  const signatureLineY = 283;
  const signatureLineStartX = 12;
  const signatureLineEndX = 78;
  const signatureBox = {
    x: 8,
    y: 266.5,
    maxWidth: 74,
    maxHeight: 15,
  };

  doc.setLineWidth(0.25);
  doc.line(signatureLineStartX, signatureLineY, signatureLineEndX, signatureLineY);

  if (signatureUrl) {
    try {
      const signatureBase64 = await imageUrlToDataUrl(signatureUrl);
      const { width, height } = await getImageDimensions(signatureBase64);
      const safeWidth = Math.max(1, width);
      const safeHeight = Math.max(1, height);
      const ratio = Math.min(signatureBox.maxWidth / safeWidth, signatureBox.maxHeight / safeHeight);
      const drawWidth = safeWidth * ratio;
      const drawHeight = safeHeight * ratio;
      const drawX = signatureBox.x + (signatureBox.maxWidth - drawWidth) / 2;
      const drawY = signatureBox.y + (signatureBox.maxHeight - drawHeight) / 2;
      doc.addImage(signatureBase64, "PNG", drawX, drawY, drawWidth, drawHeight);
    } catch {
      // Si no hay firma disponible, el PDF igual se genera con la línea de firma.
    }
  }

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.text("Firma del trabajador", 28, 286.5);

  doc.save(`planilla_movilidad_${getTodayStamp()}.pdf`);
}

export async function generateMovilidadWord(header, rows, signatureUrl) {
  const cleanRows = getRowsWithData(rows);
  const importeTotal = getImporteTotal(cleanRows);

  const defaultCellBorder = {
    top: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
    bottom: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
    left: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
    right: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
  };

  const makeCell = (text, options = {}) => {
    const textRun = new TextRun({
      text: String(text || ""),
      bold: Boolean(options.bold),
      size: options.size,
    });

    return new TableCell({
      columnSpan: options.columnSpan,
      borders: defaultCellBorder,
      width: options.width ? { size: options.width, type: WidthType.PERCENTAGE } : undefined,
      children: [
        new Paragraph({
          alignment: options.alignment || AlignmentType.LEFT,
          children: [textRun],
        }),
      ],
    });
  };

  const headerTable = new Table({
    style: "TableGrid",
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({
        children: [
          makeCell("Fecha de Emision", { bold: true, width: 30 }),
          makeCell(formatDateForDisplay(header.fechaEmision || ""), { width: 70 }),
        ],
      }),
      new TableRow({
        children: [
          makeCell("Razon Social", { bold: true, width: 30 }),
          makeCell(String(header.razonSocial || ""), { width: 70 }),
        ],
      }),
      new TableRow({
        children: [
          makeCell("RUC", { bold: true, width: 30 }),
          makeCell(String(header.ruc || ""), { width: 70 }),
        ],
      }),
      new TableRow({
        children: [
          makeCell("Trabajador", { bold: true, width: 30 }),
          makeCell(String(header.trabajador || ""), { width: 70 }),
        ],
      }),
      new TableRow({
        children: [
          makeCell("DNI", { bold: true, width: 30 }),
          makeCell(String(header.dni || ""), { width: 70 }),
        ],
      }),
      new TableRow({
        children: [
          makeCell("Area", { bold: true, width: 30 }),
          makeCell(String(header.area || ""), { width: 70 }),
        ],
      }),
      new TableRow({
        children: [
          makeCell("Cargo", { bold: true, width: 30 }),
          makeCell(String(header.cargo || ""), { width: 70 }),
        ],
      }),
    ],
  });

  const detailRows = cleanRows.length > 0 ? cleanRows : [{ fecha: "", destino: "", motivo: "", importe: "" }];
  const minDetailRows = 14;
  while (detailRows.length < minDetailRows) {
    detailRows.push({ fecha: "", destino: "", motivo: "", importe: "" });
  }

  const detailTableRows = [
    new TableRow({
      tableHeader: true,
      children: [
        makeCell("N°", { bold: true, alignment: AlignmentType.CENTER, width: 8, size: 20 }),
        makeCell("FECHA", { bold: true, alignment: AlignmentType.CENTER, width: 16, size: 20 }),
        makeCell("DESTINO", { bold: true, alignment: AlignmentType.CENTER, width: 22, size: 20 }),
        makeCell("MOTIVO DEL DESPLAZAMIENTO", { bold: true, alignment: AlignmentType.CENTER, width: 34, size: 20 }),
        makeCell("IMPORTE", { bold: true, alignment: AlignmentType.CENTER, width: 20, size: 20 }),
      ],
    }),
  ];

  detailRows.forEach((row, index) => {
    const hasData = row.fecha || row.destino || row.motivo || row.importe;
    const importeText = row.importe !== "" && row.importe !== null && row.importe !== undefined
      ? `S/ ${Number(row.importe || 0).toFixed(2)}`
      : "";

    detailTableRows.push(
      new TableRow({
        children: [
          makeCell(hasData ? String(index + 1) : "", { alignment: AlignmentType.CENTER, width: 8 }),
          makeCell(formatDateForDisplay(row.fecha), { width: 16 }),
          makeCell(String(row.destino || ""), { width: 22 }),
          makeCell(String(row.motivo || ""), { width: 34 }),
          makeCell(importeText, { alignment: AlignmentType.RIGHT, width: 20 }),
        ],
      }),
    );
  });

  detailTableRows.push(
    new TableRow({
      children: [
        makeCell("TOTAL", { bold: true, alignment: AlignmentType.RIGHT, columnSpan: 4 }),
        makeCell(`S/ ${importeTotal.toFixed(2)}`, { bold: true, alignment: AlignmentType.RIGHT, width: 20 }),
      ],
    }),
  );

  const detailTable = new Table({
    style: "TableGrid",
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: detailTableRows,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
      bottom: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
      left: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
      right: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
      insideVertical: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
    },
  });

  const signatureParagraphs = [];
  if (signatureUrl) {
    try {
      const signatureBytes = await imageUrlToUint8Array(signatureUrl);
      signatureParagraphs.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [
            new ImageRun({
              data: signatureBytes,
              transformation: { width: 180, height: 60 },
            }),
          ],
        }),
      );
    } catch {
      // Si no hay firma disponible, el Word igual se genera.
    }
  }

  signatureParagraphs.push(
    new Paragraph({
      children: [new TextRun("______________________________")],
    }),
  );
  signatureParagraphs.push(new Paragraph("Firma del trabajador"));

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [new TextRun({ text: "PLANILLA DE MOVILIDAD", bold: true, size: 32 })],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph(""),
          headerTable,
          new Paragraph(""),
          detailTable,
          new Paragraph(""),
          ...signatureParagraphs,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `planilla_movilidad_${getTodayStamp()}.docx`);
}

export async function generateMovilidadExcel(header, rows, signatureUrl) {
  const cleanRows = getRowsWithData(rows);
  const importeTotal = getImporteTotal(cleanRows);
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Movilidad");

  worksheet.columns = [
    { header: "N°", key: "numero", width: 8 },
    { header: "FECHA", key: "fecha", width: 16 },
    { header: "DESTINO", key: "destino", width: 26 },
    { header: "MOTIVO DEL DESPLAZAMIENTO", key: "motivo", width: 38 },
    { header: "IMPORTE", key: "importe", width: 16 },
  ];

  worksheet.mergeCells("A1:E1");
  const titleCell = worksheet.getCell("A1");
  titleCell.value = "PLANILLA DE MOVILIDAD";
  titleCell.font = { bold: true, size: 14 };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE8D9D9" },
  };

  worksheet.getCell("A3").value = "Fecha de Emision";
  worksheet.getCell("B3").value = formatDateForDisplay(header.fechaEmision || "");
  worksheet.getCell("A4").value = "Razon Social";
  worksheet.getCell("B4").value = String(header.razonSocial || "");
  worksheet.getCell("A5").value = "RUC";
  worksheet.getCell("B5").value = String(header.ruc || "");
  worksheet.getCell("A6").value = "Trabajador";
  worksheet.getCell("B6").value = String(header.trabajador || "");
  worksheet.getCell("D6").value = "DNI";
  worksheet.getCell("E6").value = String(header.dni || "");
  worksheet.getCell("A7").value = "Area";
  worksheet.getCell("B7").value = String(header.area || "");
  worksheet.getCell("D7").value = "Cargo";
  worksheet.getCell("E7").value = String(header.cargo || "");

  for (let rowIndex = 3; rowIndex <= 7; rowIndex += 1) {
    worksheet.getCell(`A${rowIndex}`).font = { bold: true };
    worksheet.getCell(`D${rowIndex}`).font = { bold: true };
  }

  const tableHeaderRowIndex = 9;
  const tableHeaderRow = worksheet.getRow(tableHeaderRowIndex);
  tableHeaderRow.values = ["N°", "FECHA", "DESTINO", "MOTIVO DEL DESPLAZAMIENTO", "IMPORTE"];
  tableHeaderRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFEAF6F6" },
    };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  let currentRow = tableHeaderRowIndex + 1;
  const dataRows = cleanRows.length > 0 ? cleanRows : [{ fecha: "", destino: "", motivo: "", importe: "" }];
  dataRows.forEach((row, index) => {
    const hasData = row.fecha || row.destino || row.motivo || row.importe;
    const excelRow = worksheet.getRow(currentRow);
    excelRow.getCell(1).value = hasData ? index + 1 : "";
    excelRow.getCell(1).alignment = { vertical: "middle", horizontal: "center" };
    excelRow.getCell(2).value = formatDateForDisplay(row.fecha);
    excelRow.getCell(3).value = String(row.destino || "");
    excelRow.getCell(4).value = String(row.motivo || "");
    excelRow.getCell(5).value = row.importe !== "" && row.importe !== null && row.importe !== undefined
      ? Number(row.importe || 0)
      : "";

    excelRow.getCell(5).numFmt = '"S/" #,##0.00';
    excelRow.eachCell((cell) => {
      cell.alignment = {
        vertical: "middle",
        horizontal: cell.col === 5 ? "right" : cell.col === 1 ? "center" : "left",
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
    currentRow += 1;
  });

  worksheet.mergeCells(`A${currentRow}:D${currentRow}`);
  worksheet.getCell(`A${currentRow}`).value = "TOTAL";
  worksheet.getCell(`A${currentRow}`).font = { bold: true };
  worksheet.getCell(`A${currentRow}`).alignment = { horizontal: "right", vertical: "middle" };
  worksheet.getCell(`E${currentRow}`).value = importeTotal;
  worksheet.getCell(`E${currentRow}`).numFmt = '"S/" #,##0.00';
  worksheet.getCell(`E${currentRow}`).font = { bold: true };
  worksheet.getCell(`E${currentRow}`).alignment = { horizontal: "right", vertical: "middle" };

  for (let col = 1; col <= 5; col += 1) {
    worksheet.getCell(currentRow, col).border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  }

  currentRow += 1;

  const signatureRow = currentRow + 4;
  worksheet.mergeCells(`A${signatureRow}:C${signatureRow}`);
  worksheet.getCell(`A${signatureRow}`).value = "Firma del trabajador";
  worksheet.getCell(`A${signatureRow}`).alignment = { horizontal: "center" };
  worksheet.getCell(`A${signatureRow}`).font = { italic: true };
  worksheet.getCell(`A${signatureRow}`).border = {
    top: { style: "thin" },
  };

  if (signatureUrl) {
    try {
      const signatureBase64DataUrl = await imageUrlToDataUrl(signatureUrl);
      const signatureBase64 = String(signatureBase64DataUrl).split(",")[1];
      const imageId = workbook.addImage({
        base64: signatureBase64,
        extension: "png",
      });

      worksheet.addImage(imageId, {
        tl: { col: 0.15, row: signatureRow - 4.4 },
        ext: { width: 220, height: 70 },
      });
    } catch {
      // Si no hay firma disponible, el Excel igual se genera.
    }
  }

  const excelBuffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  downloadBlob(blob, `planilla_movilidad_${getTodayStamp()}.xlsx`);
}
