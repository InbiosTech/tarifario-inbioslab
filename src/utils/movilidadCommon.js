export function getRowsWithData(rows) {
  return rows.filter((row) => row.fecha || row.destino || row.motivo || row.importe);
}

export function getImporteTotal(rows) {
  return rows.reduce((acc, row) => {
    const amount = Number(row?.importe);
    return Number.isFinite(amount) ? acc + amount : acc;
  }, 0);
}

export function formatDateForDisplay(dateText) {
  if (!dateText || !String(dateText).includes("-")) {
    return String(dateText || "");
  }
  const [year, month, day] = String(dateText).split("-");
  return `${day}/${month}/${year}`;
}

export function getTodayStamp() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function imageUrlToDataUrl(url) {
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

export async function getImageDimensions(dataUrl) {
  return await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => reject(new Error("No se pudo leer el tamano de la imagen"));
    img.src = dataUrl;
  });
}

export async function imageUrlToUint8Array(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("No se pudo cargar la imagen");
  }
  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}
