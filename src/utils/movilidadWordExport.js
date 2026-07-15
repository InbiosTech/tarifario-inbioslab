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
import {
  downloadBlob,
  formatDateForDisplay,
  getImporteTotal,
  getRowsWithData,
  getTodayStamp,
  imageUrlToUint8Array,
} from "./movilidadCommon";

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
