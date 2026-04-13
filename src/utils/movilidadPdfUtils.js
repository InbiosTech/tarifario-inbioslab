import { jsPDF } from "jspdf";

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
  const colX = [8, 34, 80, 171, 202];

  doc.setLineWidth(0.4);
  doc.rect(colX[0], tableTop, colX[colX.length - 1] - colX[0], tableBottom - tableTop);

  for (let i = 1; i < colX.length - 1; i += 1) {
    doc.line(colX[i], tableTop, colX[i], tableBottom);
  }

  const headerHeight = 9;
  doc.line(colX[0], tableTop + headerHeight, colX[colX.length - 1], tableTop + headerHeight);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("FECHA", (colX[0] + colX[1]) / 2, tableTop + 5.5, { align: "center" });
  doc.text("DESTINO", (colX[1] + colX[2]) / 2, tableTop + 5.5, { align: "center" });
  doc.text("MOTIVO DEL DESPLAZAMIENTO", (colX[2] + colX[3]) / 2, tableTop + 5.5, { align: "center" });
  doc.text("IMPORTE", (colX[3] + colX[4]) / 2, tableTop + 5.5, { align: "center" });

  const bodyHeight = tableBottom - (tableTop + headerHeight);
  const rowCount = Math.max(14, rows.length);
  const rowHeight = bodyHeight / rowCount;

  doc.setLineWidth(0.2);
  for (let i = 1; i < rowCount; i += 1) {
    const rowY = tableTop + headerHeight + rowHeight * i;
    doc.line(colX[0], rowY, colX[colX.length - 1], rowY);
  }

  const cleanRows = rows.filter((row) => row.fecha || row.destino || row.motivo || row.importe);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  cleanRows.slice(0, rowCount).forEach((row, index) => {
    const textY = tableTop + headerHeight + rowHeight * index + rowHeight / 2 + 1;
    doc.text(String(row.fecha || ""), colX[0] + 1.2, textY);
    doc.text(String(row.destino || ""), colX[1] + 1.2, textY, { maxWidth: colX[2] - colX[1] - 2.5 });
    doc.text(String(row.motivo || ""), colX[2] + 1.2, textY, { maxWidth: colX[3] - colX[2] - 2.5 });
    const importeText = row.importe !== "" && row.importe !== null && row.importe !== undefined
      ? `S/ ${Number(row.importe || 0).toFixed(2)}`
      : "";
    doc.text(importeText, colX[4] - 1.5, textY, { align: "right" });
  });

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

  const fecha = new Date();
  const fechaStr = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
  doc.save(`planilla_movilidad_${fechaStr}.pdf`);
}
