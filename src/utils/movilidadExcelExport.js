import ExcelJS from "exceljs";
import {
  downloadBlob,
  formatDateForDisplay,
  getImporteTotal,
  getRowsWithData,
  getTodayStamp,
  imageUrlToDataUrl,
} from "./movilidadCommon";

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
