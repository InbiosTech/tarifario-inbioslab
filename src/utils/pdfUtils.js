// Funciones utilitarias para generación de PDF con jsPDF

export function drawPdfHeader(doc, logoBase64) {
  doc.setFont('helvetica', 'bold');
  doc.addImage(logoBase64, 'PNG', 20, 12, 22, 22);
  doc.setFontSize(15);
  doc.text('LABORATORIO CLÍNICO INBIOSLAB', 45, 20);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('RUC 20603096046', 45, 26);
  doc.text('Jr Calleria 135', 45, 30);
  doc.text('Referencia: por la polleria la shapajita', 45, 34);
  doc.text('Cel: 945241093 / 945241682', 45, 38);
  doc.setDrawColor(60, 60, 60);
  doc.setLineWidth(0.5);
  doc.line(20, 42, 190, 42);
}

export function drawPdfPatientData(doc, paciente, tipoCotizacion) {
  let y = 48;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Paciente:`, 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${(paciente.nombre || "-").toUpperCase()}` , 45, y);
  doc.setFont('helvetica', 'bold');
  doc.text(`Sexo:`, 140, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${paciente.sexo || "-"}` , 155, y);
  doc.setFont('helvetica', 'bold');
  doc.text(`Edad:`, 170, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${paciente.edad || "-"}` , 185, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text(`Código/DNI:`, 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${paciente.codigo || "-"}` , 45, y);
  if (tipoCotizacion === "convenio") {
    doc.setFont('helvetica', 'bold');
    doc.text(`Empresa:`, 100, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`${paciente.empresa || "-"}` , 120, y);
  }
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text(`Fecha:`, 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${new Date().toLocaleDateString()}` , 45, y);
  doc.setFont('helvetica', 'bold');
  doc.text(`Hora:`, 100, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${new Date().toLocaleTimeString()}` , 115, y);
  return y + 10;
}

export function drawPdfQuotationTable(doc, cart, tipoCotizacion, cuponDescuento, startY) {
  doc.setFontSize(9); // fuente más pequeña
  doc.setFont('helvetica', 'bold');
  doc.text('Cotización:', 20, startY);
  let y = startY + 6;
  // Encabezado tabla
  doc.setFillColor(224, 231, 255);
  doc.rect(20, y - 5, 170, 8, 'F');
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.2);
  doc.rect(20, y - 5, 170, 8);
  doc.text('#', 23, y);
  doc.text('Examen', 30, y);
  doc.text('Cant.', 120, y);
  doc.text('Precio', 135, y);
  doc.text('Subtotal', 155, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  cart.forEach((item, idx) => {
    doc.rect(20, y - 5, 170, 8);
    doc.text(String(idx + 1), 23, y);
    doc.text(item.name.toUpperCase(), 30, y, { maxWidth: 85 });
    doc.text(String(item.qty), 120, y);
    const precio = ((tipoCotizacion === "convenio" ? item.price2 : item.price1) * (1 - cuponDescuento)).toFixed(2);
    doc.text(`S/ ${precio}`, 135, y);
    doc.text(`S/ ${(item.qty * (tipoCotizacion === "convenio" ? item.price2 : item.price1) * (1 - cuponDescuento)).toFixed(2)}`, 155, y);
    y += 8;
  });
  // Total
  doc.setFont('helvetica', 'bold');
  doc.text('Total', 135, y);
  doc.text(`S/ ${cart.reduce((acc, item) => acc + ((tipoCotizacion === "convenio" ? item.price2 : item.price1) * (tipoCotizacion === "publico" ? (1 - cuponDescuento) : 1)) * item.qty, 0).toFixed(2)}`, 155, y);
  return y + 10;
}

export function drawPdfFooter(doc, tipoCotizacion, cuponDescuento, cuponInput, y) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  // Nota de cupón si corresponde
  if (tipoCotizacion === "publico" && cuponDescuento > 0) {
    doc.setTextColor(0, 128, 0);
    doc.text(`Cupón aplicado: ${cuponInput.trim().toUpperCase()} (${(cuponDescuento * 100).toFixed(0)}% de descuento)`, 20, y);
    doc.setTextColor(0, 0, 0);
    y += 6;
  }
  doc.text('Esta cotización es referencial y válida solo para el día de emisión.', 20, y);
}
