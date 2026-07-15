import PropTypes from "prop-types";
import { jsPDF } from "jspdf";
import { FaCheck } from "react-icons/fa6";
import { useEffect, useMemo, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || "").trim();
const INVENTORY_UPDATED_STORAGE_KEY = "inbioslab_inventory_updated_at";

const EMPTY_FORM = {
  id: "",
  companyName: "united_trading_sac",
  equipmentType: "laboratorio",
  brand: "",
  model: "",
  serialNumber: "",
  invoiceNumber: "",
  importDate: "",
  installLocation: "",
  areaName: "",
  ingressDate: "",
  conditionStatus: "cesion_en_uso",
  operationalStatus: "operativo",
  nextMaintenanceDate: "",
  maintenanceAlertDays: "30",
  notes: "",
};

const STATUS_LABELS = {
  operativo: "Operativo",
  inoperativo: "Inoperativo",
  malogrado: "Malogrado",
  en_observacion: "En observacion",
};

const CONDITION_OPTIONS = [
  "cesion_en_uso",
  "venta",
  "pendiente_revision",
  "pendiente_aprobacion",
  "disponible",
  "en_desuso",
  "pendiente_recojo",
  "malogrado",
  "repuestos",
];

const CONDITION_LABELS = {
  cesion_en_uso: "Cesion en uso",
  venta: "Venta",
  pendiente_revision: "Pendiente de revision",
  pendiente_aprobacion: "Pendiente de aprobacion",
  disponible: "Disponible",
  en_desuso: "En desuso",
  pendiente_recojo: "Pendiente de recojo",
  malogrado: "Malogrado",
  repuestos: "Para repuestos",
};

const COMPANY_OPTIONS = [
  { value: "united_trading_sac", label: "United Trading SAC" },
  { value: "comercial_importadora_sudamericana_sac", label: "Comercial Importadora Sudamericana S.A.C" },
];

const MONTH_LABELS_SHORT = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Set", "Oct", "Nov", "Dic"];

function getCompanyLabel(value) {
  const normalized = String(value || "").trim().toLowerCase();
  const found = COMPANY_OPTIONS.find((item) => item.value === normalized);
  return found?.label || "Sin empresa";
}

function formatDate(value) {
  const raw = String(value || "").slice(0, 10);
  if (!raw || !raw.includes("-")) return "";
  const [y, m, d] = raw.split("-");
  return `${d}/${m}/${y}`;
}

function formatDateTime(value) {
  const raw = String(value || "").replace("T", " ").slice(0, 16);
  if (!raw.includes("-")) return "";
  const [datePart, timePart = ""] = raw.split(" ");
  const [y, m, d] = datePart.split("-");
  if (!y || !m || !d) return "";
  return `${d}/${m}/${y}${timePart ? ` ${timePart}` : ""}`;
}

function nowDateTimeLocal() {
  const date = new Date();
  const pad = (num) => String(num).padStart(2, "0");
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

function sanitizeCsv(value) {
  const text = String(value ?? "").replace(/\r?\n/g, " ").trim();
  return `"${text.replace(/"/g, '""')}"`;
}

function toPlainDate(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return raw.slice(0, 10);
}

function formatDateOrDash(value) {
  const formatted = formatDate(value);
  return formatted || "-";
}

function clipPdfText(doc, text, maxWidth) {
  const value = String(text || "");
  if (!value) return "";
  if (doc.getTextWidth(value) <= maxWidth) return value;

  const ellipsis = "...";
  let result = value;
  while (result.length > 0 && doc.getTextWidth(`${result}${ellipsis}`) > maxWidth) {
    result = result.slice(0, -1);
  }

  return result ? `${result}${ellipsis}` : ellipsis;
}

let checkIconPngPromise = null;

function getAspaIconPngDataUrl() {
  if (checkIconPngPromise) return checkIconPngPromise;

  checkIconPngPromise = new Promise((resolve) => {
    if (typeof document === "undefined") {
      resolve("");
      return;
    }

    const iconSvg = renderToStaticMarkup(<FaCheck size={84} color="#233657" />);
    const svgMarkup = iconSvg.includes("xmlns=")
      ? iconSvg
      : iconSvg.replace("<svg ", "<svg xmlns=\"http://www.w3.org/2000/svg\" ");
    const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`;

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 96;
      canvas.height = 96;
      const context = canvas.getContext("2d");
      if (!context) {
        resolve("");
        return;
      }

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/png"));
    };
    image.onerror = () => resolve("");
    image.src = svgDataUrl;
  });

  return checkIconPngPromise;
}

function splitLines(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function toDateInputValue(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return raw.slice(0, 10);
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("No se pudo leer archivo"));
    reader.readAsDataURL(file);
  });
}

function cropTopImageDataUrl(dataUrl, cropTopRatio = 0.22) {
  return new Promise((resolve) => {
    const src = String(dataUrl || "").trim();
    if (!src) {
      resolve("");
      return;
    }

    const image = new Image();
    image.onload = () => {
      try {
        const width = image.naturalWidth || image.width;
        const height = image.naturalHeight || image.height;
        if (!width || !height) {
          resolve(src);
          return;
        }

        const startY = Math.max(0, Math.floor(height * cropTopRatio));
        const cropHeight = Math.max(1, height - startY);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = cropHeight;
        const context = canvas.getContext("2d");
        if (!context) {
          resolve(src);
          return;
        }

        context.drawImage(image, 0, startY, width, cropHeight, 0, 0, width, cropHeight);
        resolve(canvas.toDataURL("image/png"));
      } catch (_error) {
        resolve(src);
      }
    };
    image.onerror = () => resolve(src);
    image.src = src;
  });
}

function detectImageFormat(dataUrl) {
  const raw = String(dataUrl || "").toLowerCase();
  if (raw.startsWith("data:image/jpeg") || raw.startsWith("data:image/jpg")) return "JPEG";
  if (raw.startsWith("data:image/webp")) return "WEBP";
  return "PNG";
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function notifyInventoryUpdated() {
  window.dispatchEvent(new Event("inbioslab:inventory-updated"));
  try {
    window.localStorage.setItem(INVENTORY_UPDATED_STORAGE_KEY, String(Date.now()));
  } catch (_error) {
    // ignore storage errors
  }
}

function InventoryAdmin({ onBackHome }) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [equipmentType, setEquipmentType] = useState("");
  const [operationalStatus, setOperationalStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 15, totalItems: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState(0);
  const [accessories, setAccessories] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [upcomingMaintenance, setUpcomingMaintenance] = useState([]);
  const [serviceCalls, setServiceCalls] = useState([]);
  const [scheduleTemplates, setScheduleTemplates] = useState([]);
  const [schedulePlans, setSchedulePlans] = useState([]);
  const [selectedSchedulePlanId, setSelectedSchedulePlanId] = useState(0);
  const [selectedSchedulePlanDetail, setSelectedSchedulePlanDetail] = useState(null);
  const [schedulePendingAction, setSchedulePendingAction] = useState("");
  const [scheduleFeedback, setScheduleFeedback] = useState({ type: "", text: "" });
  const [scheduleActionHistory, setScheduleActionHistory] = useState([]);
  const [templateForm, setTemplateForm] = useState({
    companyName: "united_trading_sac",
    hospitalName: "",
    year: String(new Date().getFullYear()),
    title: "CRONOGRAMA DE MANTENIMIENTO",
    institutionName: "",
    actionsText: "Limpieza de Camara de Reaccion\nLimpieza del Sistema de Tuberia\nLimpieza de Cubetas y Compartimientos",
    logoData: "",
    sealLeftData: "",
    sealRightData: "",
    signatureData: "",
    stampData: "",
    footerLeft: "",
    footerCenter: "",
    footerRight: "",
  });
  const [planForm, setPlanForm] = useState({
    companyName: "united_trading_sac",
    hospitalName: "",
    year: String(new Date().getFullYear()),
    equipmentId: "",
    templateId: "",
    frequencyMonths: "4",
    startDate: toDateInputValue(new Date().toISOString()),
  });
  const [executionForm, setExecutionForm] = useState({
    performedAt: toDateInputValue(new Date().toISOString()),
    notes: "",
  });
  const [serviceCallForm, setServiceCallForm] = useState({
    companyName: "united_trading_sac",
    equipmentId: "",
    reportedAt: nowDateTimeLocal(),
    issueDescription: "",
    actionTaken: "",
  });
  const [accessoryForm, setAccessoryForm] = useState({ accessoryName: "", brand: "", serialNumber: "", ingressDate: "", notes: "" });
  const [maintenanceForm, setMaintenanceForm] = useState({ plannedDate: "", notes: "" });

  const canUseApi = useMemo(() => Boolean(API_BASE_URL), []);

  const writeHeaders = useMemo(() => ({ "Content-Type": "application/json" }), []);

  const setScheduleStatus = (type, text, actionLabel = "") => {
    setScheduleFeedback({ type, text });
    if (!actionLabel) return;

    const entry = {
      id: `${Date.now()}-${Math.random()}`,
      at: formatDateTime(new Date().toISOString()),
      action: actionLabel,
      type,
      text,
    };

    setScheduleActionHistory((prev) => [entry, ...prev].slice(0, 10));
  };

  const loadEquipment = async (targetPage = page) => {
    if (!canUseApi) return;

    setLoading(true);
    setMessage("");
    try {
      const params = new URLSearchParams({
        page: String(targetPage),
        pageSize: "15",
        search: search.trim(),
      });

      if (equipmentType) params.set("equipmentType", equipmentType);
      if (operationalStatus) params.set("operationalStatus", operationalStatus);
      if (companyFilter) params.set("companyName", companyFilter);

      const res = await fetch(`${API_BASE_URL}/inventory/equipment?${params.toString()}`, {
        credentials: "include",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Error ${res.status}`);

      setItems(Array.isArray(body?.items) ? body.items : []);
      setPagination(body?.pagination || { page: 1, pageSize: 15, totalItems: 0, totalPages: 1 });
      setPage(targetPage);
    } catch (error) {
      setMessage(`No se pudo cargar inventario: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadUpcomingMaintenance = async () => {
    if (!canUseApi) return;

    try {
      const params = new URLSearchParams({ days: "45" });
      if (companyFilter) params.set("companyName", companyFilter);

      const res = await fetch(`${API_BASE_URL}/inventory/maintenance/upcoming?${params.toString()}`, {
        credentials: "include",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return;
      setUpcomingMaintenance(Array.isArray(body?.items) ? body.items : []);
    } catch (_error) {
      setUpcomingMaintenance([]);
    }
  };

  const loadServiceCalls = async () => {
    if (!canUseApi) return;

    try {
      const params = new URLSearchParams({ page: "1", pageSize: "50", search: search.trim() });
      if (companyFilter) params.set("companyName", companyFilter);

      const res = await fetch(`${API_BASE_URL}/inventory/service-calls?${params.toString()}`, {
        credentials: "include",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return;
      setServiceCalls(Array.isArray(body?.items) ? body.items : []);
    } catch (_error) {
      setServiceCalls([]);
    }
  };

  const loadScheduleTemplates = async () => {
    if (!canUseApi) return;

    try {
      const params = new URLSearchParams();
      if (companyFilter) params.set("companyName", companyFilter);
      const res = await fetch(`${API_BASE_URL}/inventory/schedule/templates?${params.toString()}`, {
        credentials: "include",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return;
      setScheduleTemplates(Array.isArray(body?.items) ? body.items : []);
    } catch (_error) {
      setScheduleTemplates([]);
    }
  };

  const loadSchedulePlans = async () => {
    if (!canUseApi) return;

    try {
      const params = new URLSearchParams();
      if (companyFilter) params.set("companyName", companyFilter);
      const res = await fetch(`${API_BASE_URL}/inventory/schedule/plans?${params.toString()}`, {
        credentials: "include",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return;
      setSchedulePlans(Array.isArray(body?.items) ? body.items : []);
    } catch (_error) {
      setSchedulePlans([]);
    }
  };

  const loadSchedulePlanDetail = async (planId) => {
    if (!canUseApi || !planId) {
      setSelectedSchedulePlanDetail(null);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/inventory/schedule/plans/${planId}`, {
        credentials: "include",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Error ${res.status}`);
      setSelectedSchedulePlanDetail(body);
    } catch (error) {
      setSelectedSchedulePlanDetail(null);
      setMessage(error.message || "No se pudo cargar cronograma.");
    }
  };

  const onUploadTemplateAsset = async (field, file) => {
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      setTemplateForm((prev) => ({ ...prev, [field]: dataUrl }));
    } catch (error) {
      setMessage(error.message || "No se pudo cargar imagen.");
    }
  };

  const onSaveScheduleTemplate = async (event) => {
    event.preventDefault();
    if (!canUseApi) return;

    setSchedulePendingAction("template");
    setScheduleFeedback({ type: "", text: "" });

    try {
      const payload = {
        companyName: templateForm.companyName,
        hospitalName: templateForm.hospitalName,
        year: Number(templateForm.year),
        title: templateForm.title,
        institutionName: templateForm.institutionName,
        actions: splitLines(templateForm.actionsText),
        logoData: templateForm.logoData || null,
        sealLeftData: templateForm.sealLeftData || null,
        sealRightData: templateForm.sealRightData || null,
        signatureData: templateForm.signatureData || null,
        stampData: templateForm.stampData || null,
        footerLeft: templateForm.footerLeft,
        footerCenter: templateForm.footerCenter,
        footerRight: templateForm.footerRight,
      };

      const res = await fetch(`${API_BASE_URL}/inventory/schedule/templates`, {
        method: "POST",
        headers: writeHeaders,
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Error ${res.status}`);

      setMessage("Plantilla de cronograma guardada.");
      setScheduleStatus("success", "Plantilla guardada correctamente.", "Guardar plantilla");
      await loadScheduleTemplates();
    } catch (error) {
      setMessage(error.message || "No se pudo guardar plantilla.");
      setScheduleStatus("error", error.message || "Error al guardar plantilla.", "Guardar plantilla");
    } finally {
      setSchedulePendingAction("");
    }
  };

  const onCreateSchedulePlan = async (event) => {
    event.preventDefault();
    if (!canUseApi) return;

    setSchedulePendingAction("plan");
    setScheduleFeedback({ type: "", text: "" });

    try {
      const payload = {
        companyName: planForm.companyName,
        hospitalName: planForm.hospitalName,
        year: Number(planForm.year),
        equipmentId: Number(planForm.equipmentId),
        templateId: Number(planForm.templateId),
        frequencyMonths: Number(planForm.frequencyMonths),
        startDate: planForm.startDate,
      };

      const res = await fetch(`${API_BASE_URL}/inventory/schedule/plans`, {
        method: "POST",
        headers: writeHeaders,
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Error ${res.status}`);

      setMessage("Cronograma del equipo creado.");
      await loadSchedulePlans();
      if (body?.plan?.id) {
        setSelectedSchedulePlanId(Number(body.plan.id));
        await loadSchedulePlanDetail(Number(body.plan.id));
      }
      setScheduleStatus("success", "Cronograma creado correctamente.", "Crear cronograma");
    } catch (error) {
      setMessage(error.message || "No se pudo crear cronograma.");
      setScheduleStatus("error", error.message || "Error al crear cronograma.", "Crear cronograma");
    } finally {
      setSchedulePendingAction("");
    }
  };

  const onAddPlanActionRow = () => {
    if (!selectedSchedulePlanDetail) return;
    const next = { ...selectedSchedulePlanDetail };
    next.actions = [...(next.actions || []), { id: `new-${Date.now()}`, action_name: "", checks: Array.from({ length: 12 }, () => false) }];
    setSelectedSchedulePlanDetail(next);
    setScheduleStatus("success", "Fila agregada. Recuerda guardar filas para confirmar.", "Agregar fila");
  };

  const onRemovePlanActionRow = (index) => {
    if (!selectedSchedulePlanDetail) return;
    const current = [...(selectedSchedulePlanDetail.actions || [])];
    if (current.length <= 1) {
      setScheduleStatus("error", "Debe existir al menos una fila de actividad.", "Quitar fila");
      return;
    }

    current.splice(index, 1);
    setSelectedSchedulePlanDetail({ ...selectedSchedulePlanDetail, actions: current });
    setScheduleStatus("success", "Fila eliminada. Recuerda guardar filas para confirmar.", "Quitar fila");
  };

  const onSavePlanActions = async () => {
    if (!canUseApi || !selectedSchedulePlanId || !selectedSchedulePlanDetail) return;

    setSchedulePendingAction("actions");
    setScheduleFeedback({ type: "", text: "" });

    try {
      const actions = (selectedSchedulePlanDetail.actions || [])
        .map((item) => String(item.action_name || "").trim())
        .filter(Boolean);

      const res = await fetch(`${API_BASE_URL}/inventory/schedule/plans/${selectedSchedulePlanId}/actions`, {
        method: "PUT",
        headers: writeHeaders,
        credentials: "include",
        body: JSON.stringify({ actions }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Error ${res.status}`);

      setSelectedSchedulePlanDetail(body);
      setMessage("Acciones del cronograma actualizadas.");
      setScheduleStatus("success", "Filas de actividades guardadas.", "Guardar filas");
    } catch (error) {
      setMessage(error.message || "No se pudo actualizar acciones.");
      setScheduleStatus("error", error.message || "Error al guardar filas.", "Guardar filas");
    } finally {
      setSchedulePendingAction("");
    }
  };

  const onRegisterScheduleExecution = async (event) => {
    event.preventDefault();
    if (!canUseApi || !selectedSchedulePlanId) return;

    setSchedulePendingAction("execution");
    setScheduleFeedback({ type: "", text: "" });

    try {
      const res = await fetch(`${API_BASE_URL}/inventory/schedule/plans/${selectedSchedulePlanId}/executions`, {
        method: "POST",
        headers: writeHeaders,
        credentials: "include",
        body: JSON.stringify({
          performedAt: executionForm.performedAt,
          notes: executionForm.notes,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Error ${res.status}`);

      setSelectedSchedulePlanDetail(body);
      setExecutionForm((prev) => ({ ...prev, notes: "" }));
      setMessage("Mantenimiento preventivo registrado y check actualizado.");
      setScheduleStatus("success", "Mantenimiento registrado y check actualizado.", "Registrar mantenimiento");
    } catch (error) {
      setMessage(error.message || "No se pudo registrar mantenimiento preventivo.");
      setScheduleStatus("error", error.message || "Error al registrar mantenimiento.", "Registrar mantenimiento");
    } finally {
      setSchedulePendingAction("");
    }
  };

  const exportSchedulePlanPdf = async () => {
    if (!selectedSchedulePlanDetail?.plan) {
      setMessage("Selecciona un cronograma para exportar PDF.");
      setScheduleStatus("error", "Selecciona un cronograma antes de exportar.", "Exportar PDF");
      return;
    }

    const { plan, actions, executedMonths } = selectedSchedulePlanDetail;
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const template = plan;
    const cleanedLogoData = await cropTopImageDataUrl(template.logo_data, 0.2);
    const aspaIconDataUrl = await getAspaIconPngDataUrl();

    const LAYOUT = {
      logo: { x: 36, y: 16, w: 168, h: 58 },
      sealLeft: { x: 676, y: 6, w: 66, h: 66 },
      sealRight: { x: 744, y: 6, w: 66, h: 66 },
      titleY: 90,
      infoLabelX: 40,
      infoValueX: 124,
      infoStartY: 122,
      infoStepY: 20,
      table: {
        x: 40,
        y: 248,
        actionColW: 218,
        monthColW: 45,
        rowH: 27,
      },
      footerY: 545,
      signature: { x: 212, y: 492, w: 160, h: 64 },
      stamp: { x: 458, y: 486, w: 96, h: 78 },
      dateX: 698,
      footerTextY: 574,
      footerTextLineGap: 11,
    };

    const safeAddImage = (dataUrl, x, y, w, h) => {
      if (!dataUrl) return;
      try {
        const format = detectImageFormat(dataUrl);
        const props = doc.getImageProperties(dataUrl);
        const srcW = Number(props?.width || 1);
        const srcH = Number(props?.height || 1);
        const scale = Math.min(w / srcW, h / srcH);
        const drawW = srcW * scale;
        const drawH = srcH * scale;
        const drawX = x + ((w - drawW) / 2);
        const drawY = y + ((h - drawH) / 2);
        doc.addImage(dataUrl, format, drawX, drawY, drawW, drawH);
      } catch (_error) {
        // ignore invalid image
      }
    };

    const drawAspa = (x, y, w, h) => {
      const size = Math.min(w, h) * 0.56;
      const drawX = x + ((w - size) / 2);
      const drawY = y + ((h - size) / 2);

      if (aspaIconDataUrl) {
        doc.addImage(aspaIconDataUrl, "PNG", drawX, drawY, size, size);
        return;
      }

      // Fallback in case icon image creation fails.
      const x1 = x + (w * 0.28);
      const y1 = y + (h * 0.58);
      const x2 = x + (w * 0.44);
      const y2 = y + (h * 0.76);
      const x3 = x + (w * 0.73);
      const y3 = y + (h * 0.3);
      doc.setDrawColor(35, 54, 87);
      doc.setLineCap(1);
      doc.setLineJoin(1);
      doc.setLineWidth(1.4);
      doc.line(x1, y1, x2, y2);
      doc.line(x2, y2, x3, y3);
    };

    safeAddImage(cleanedLogoData || template.logo_data, LAYOUT.logo.x, LAYOUT.logo.y, LAYOUT.logo.w, LAYOUT.logo.h);
    safeAddImage(template.seal_left_data, LAYOUT.sealLeft.x, LAYOUT.sealLeft.y, LAYOUT.sealLeft.w, LAYOUT.sealLeft.h);
    safeAddImage(template.seal_right_data, LAYOUT.sealRight.x, LAYOUT.sealRight.y, LAYOUT.sealRight.w, LAYOUT.sealRight.h);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(36, 86, 139);
    doc.setFontSize(35 / 2);
    doc.text(String(template.template_title || "CRONOGRAMA DE MANTENIMIENTO").slice(0, 60), 420, LAYOUT.titleY, { align: "center" });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Institucion:", LAYOUT.infoLabelX, LAYOUT.infoStartY);
    doc.text("Equipo:", LAYOUT.infoLabelX, LAYOUT.infoStartY + (LAYOUT.infoStepY * 1));
    doc.text("Marca:", LAYOUT.infoLabelX, LAYOUT.infoStartY + (LAYOUT.infoStepY * 2));
    doc.text("Modelo:", LAYOUT.infoLabelX, LAYOUT.infoStartY + (LAYOUT.infoStepY * 3));
    doc.text("N. de Serie:", LAYOUT.infoLabelX, LAYOUT.infoStartY + (LAYOUT.infoStepY * 4));

    doc.setFont("helvetica", "normal");
    doc.text(clipPdfText(doc, String(template.institution_name || template.hospital_name || ""), 510), LAYOUT.infoValueX, LAYOUT.infoStartY);
    doc.text(clipPdfText(doc, String(template.equipment_type || ""), 500), LAYOUT.infoValueX, LAYOUT.infoStartY + (LAYOUT.infoStepY * 1));
    doc.text(clipPdfText(doc, String(template.brand || ""), 500), LAYOUT.infoValueX, LAYOUT.infoStartY + (LAYOUT.infoStepY * 2));
    doc.text(clipPdfText(doc, String(template.model || ""), 500), LAYOUT.infoValueX, LAYOUT.infoStartY + (LAYOUT.infoStepY * 3));
    doc.text(clipPdfText(doc, String(template.serial_number || ""), 470), LAYOUT.infoValueX, LAYOUT.infoStartY + (LAYOUT.infoStepY * 4));

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Cronograma de Mantenimiento Preventivo", 420, 232, { align: "center" });

    const tableX = LAYOUT.table.x;
    const tableY = LAYOUT.table.y;
    const actionColW = LAYOUT.table.actionColW;
    const monthColW = LAYOUT.table.monthColW;
    const rowH = LAYOUT.table.rowH;

    doc.setFillColor(61, 106, 180);
    doc.rect(tableX, tableY, actionColW + (monthColW * 12), rowH, "F");
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text("Actividad a Realizar", tableX + 6, tableY + 16);

    for (let month = 0; month < 12; month += 1) {
      const x = tableX + actionColW + (month * monthColW);
      doc.text(MONTH_LABELS_SHORT[month], x + 11, tableY + 16);
    }

    doc.setTextColor(0, 0, 0);
    let y = tableY + rowH;
    const rows = Array.isArray(actions) ? actions : [];

    rows.forEach((row, index) => {
      const isEven = index % 2 === 0;
      doc.setFillColor(isEven ? 223 : 241, isEven ? 229 : 245, isEven ? 240 : 250);
      doc.rect(tableX, y, actionColW + (monthColW * 12), rowH, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(clipPdfText(doc, row.action_name, actionColW - 12), tableX + 6, y + 16);

      for (let month = 1; month <= 12; month += 1) {
        const x = tableX + actionColW + ((month - 1) * monthColW);
        doc.setDrawColor(132, 165, 218);
        doc.setLineWidth(0.7);
        doc.rect(x, y, monthColW, rowH);
        if (Array.isArray(executedMonths) && executedMonths.includes(month)) {
          drawAspa(x, y, monthColW, rowH);
        }
      }

      doc.setDrawColor(132, 165, 218);
      doc.setLineWidth(0.7);
      doc.rect(tableX, y, actionColW, rowH);
      y += rowH;
    });

    const footerY = LAYOUT.footerY;
    safeAddImage(template.signature_data, LAYOUT.signature.x, LAYOUT.signature.y, LAYOUT.signature.w, LAYOUT.signature.h);
    safeAddImage(template.stamp_data, LAYOUT.stamp.x, LAYOUT.stamp.y, LAYOUT.stamp.w, LAYOUT.stamp.h);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`Fecha: ${formatDate(new Date().toISOString())}`, LAYOUT.dateX, footerY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const drawFooterTextBlock = (value, x, maxWidth) => {
      const lines = splitLines(value).slice(0, 2);
      if (!lines.length) return;

      lines.forEach((line, index) => {
        doc.text(clipPdfText(doc, line, maxWidth), x, LAYOUT.footerTextY + (index * LAYOUT.footerTextLineGap));
      });
    };

    drawFooterTextBlock(template.footer_left || "", 40, 245);
    drawFooterTextBlock(template.footer_center || "", 300, 260);
    drawFooterTextBlock(template.footer_right || "", 560, 245);

    const fileName = `cronograma_${String(plan.serial_number || "equipo")}_${plan.year}.pdf`.replace(/\s+/g, "_");
    doc.save(fileName);
    setScheduleStatus("success", "PDF generado correctamente.", "Exportar PDF");
  };

  const loadEquipmentDetails = async (equipmentId) => {
    if (!canUseApi || !equipmentId) {
      setAccessories([]);
      setMaintenance([]);
      return;
    }

    try {
      const [accRes, mtRes] = await Promise.all([
        fetch(`${API_BASE_URL}/inventory/equipment/${equipmentId}/accessories`, { credentials: "include" }),
        fetch(`${API_BASE_URL}/inventory/equipment/${equipmentId}/maintenance`, { credentials: "include" }),
      ]);

      const accBody = await accRes.json().catch(() => ({}));
      const mtBody = await mtRes.json().catch(() => ({}));

      setAccessories(Array.isArray(accBody?.items) ? accBody.items : []);
      setMaintenance(Array.isArray(mtBody?.items) ? mtBody.items : []);
    } catch (_error) {
      setAccessories([]);
      setMaintenance([]);
    }
  };

  useEffect(() => {
    loadEquipment(1);
    loadUpcomingMaintenance();
    loadServiceCalls();
    loadScheduleTemplates();
    loadSchedulePlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, equipmentType, operationalStatus, companyFilter]);

  useEffect(() => {
    if (!companyFilter) return;
    setServiceCallForm((prev) => ({ ...prev, companyName: companyFilter }));
    setTemplateForm((prev) => ({ ...prev, companyName: companyFilter }));
    setPlanForm((prev) => ({ ...prev, companyName: companyFilter }));
  }, [companyFilter]);

  useEffect(() => {
    if (!selectedSchedulePlanId) {
      setSelectedSchedulePlanDetail(null);
      return;
    }

    loadSchedulePlanDetail(selectedSchedulePlanId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSchedulePlanId]);

  useEffect(() => {
    loadEquipmentDetails(selectedEquipmentId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEquipmentId]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setSelectedEquipmentId(0);
    setAccessories([]);
    setMaintenance([]);
  };

  const selectForEdit = (item) => {
    setForm({
      id: String(item.id),
      companyName: item.company_name || "united_trading_sac",
      equipmentType: item.equipment_type || "laboratorio",
      brand: item.brand || "",
      model: item.model || "",
      serialNumber: item.serial_number || "",
      invoiceNumber: item.invoice_number || "",
      importDate: String(item.import_date || "").slice(0, 10),
      installLocation: item.install_location || "",
      areaName: item.area_name || "",
      ingressDate: String(item.ingress_date || "").slice(0, 10),
      conditionStatus: item.condition_status || "cesion_en_uso",
      operationalStatus: item.operational_status || "operativo",
      nextMaintenanceDate: String(item.next_maintenance_date || "").slice(0, 10),
      maintenanceAlertDays: String(item.maintenance_alert_days || 30),
      notes: item.notes || "",
    });
    setSelectedEquipmentId(Number(item.id));
  };

  const buildPayload = () => ({
    companyName: form.companyName,
    equipmentType: form.equipmentType,
    brand: form.brand,
    model: form.model,
    serialNumber: form.serialNumber,
    invoiceNumber: form.invoiceNumber,
    importDate: form.importDate || null,
    installLocation: form.installLocation,
    areaName: form.areaName,
    ingressDate: form.ingressDate || null,
    conditionStatus: form.conditionStatus,
    operationalStatus: form.operationalStatus,
    nextMaintenanceDate: form.nextMaintenanceDate || null,
    maintenanceAlertDays: Number(form.maintenanceAlertDays || 30),
    notes: form.notes,
  });

  const onSubmitEquipment = async (event) => {
    event.preventDefault();
    if (!canUseApi) return;

    setMessage("");
    try {
      const isEditing = Boolean(form.id);
      const url = isEditing
        ? `${API_BASE_URL}/inventory/equipment/${form.id}`
        : `${API_BASE_URL}/inventory/equipment`;
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: writeHeaders,
        credentials: "include",
        body: JSON.stringify(buildPayload()),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Error ${res.status}`);

      setMessage(isEditing ? "Equipo actualizado." : "Equipo registrado.");
      await loadEquipment(isEditing ? page : 1);
      await loadUpcomingMaintenance();
      notifyInventoryUpdated();

      if (!isEditing) {
        resetForm();
      }
    } catch (error) {
      setMessage(error.message || "No se pudo guardar equipo.");
    }
  };

  const onQuickChangeStatus = async (item, status) => {
    if (!canUseApi) return;

    try {
      const res = await fetch(`${API_BASE_URL}/inventory/equipment/${item.id}/status`, {
        method: "PATCH",
        headers: writeHeaders,
        credentials: "include",
        body: JSON.stringify({ operationalStatus: status }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Error ${res.status}`);

      setItems((prev) => prev.map((row) => (row.id === item.id ? { ...row, operational_status: status } : row)));
      if (Number(form.id) === Number(item.id)) {
        setForm((prev) => ({ ...prev, operationalStatus: status }));
      }
      notifyInventoryUpdated();
    } catch (error) {
      setMessage(error.message || "No se pudo cambiar estado.");
    }
  };

  const onDeleteEquipment = async (item) => {
    if (!canUseApi) return;
    if (!window.confirm(`Eliminar equipo ${item.brand} ${item.model}?`)) return;

    try {
      const res = await fetch(`${API_BASE_URL}/inventory/equipment/${item.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Error ${res.status}`);
      }

      if (Number(selectedEquipmentId) === Number(item.id)) {
        resetForm();
      }
      await loadEquipment(page);
      await loadUpcomingMaintenance();
      notifyInventoryUpdated();
    } catch (error) {
      setMessage(error.message || "No se pudo eliminar equipo.");
    }
  };

  const onAddAccessory = async (event) => {
    event.preventDefault();
    if (!canUseApi || !selectedEquipmentId) return;

    try {
      const res = await fetch(`${API_BASE_URL}/inventory/equipment/${selectedEquipmentId}/accessories`, {
        method: "POST",
        headers: writeHeaders,
        credentials: "include",
        body: JSON.stringify(accessoryForm),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Error ${res.status}`);

      setAccessoryForm({ accessoryName: "", brand: "", serialNumber: "", ingressDate: "", notes: "" });
      await loadEquipmentDetails(selectedEquipmentId);
      await loadEquipment(page);
      notifyInventoryUpdated();
    } catch (error) {
      setMessage(error.message || "No se pudo registrar accesorio.");
    }
  };

  const onDeleteAccessory = async (accessoryId) => {
    if (!canUseApi || !selectedEquipmentId) return;

    try {
      const res = await fetch(`${API_BASE_URL}/inventory/equipment/${selectedEquipmentId}/accessories/${accessoryId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Error ${res.status}`);
      }

      await loadEquipmentDetails(selectedEquipmentId);
      await loadEquipment(page);
      notifyInventoryUpdated();
    } catch (error) {
      setMessage(error.message || "No se pudo eliminar accesorio.");
    }
  };

  const onAddMaintenance = async (event) => {
    event.preventDefault();
    if (!canUseApi || !selectedEquipmentId) return;

    try {
      const res = await fetch(`${API_BASE_URL}/inventory/equipment/${selectedEquipmentId}/maintenance`, {
        method: "POST",
        headers: writeHeaders,
        credentials: "include",
        body: JSON.stringify(maintenanceForm),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Error ${res.status}`);

      setMaintenanceForm({ plannedDate: "", notes: "" });
      await loadEquipmentDetails(selectedEquipmentId);
      await loadUpcomingMaintenance();
      notifyInventoryUpdated();
    } catch (error) {
      setMessage(error.message || "No se pudo programar mantenimiento.");
    }
  };

  const onCompleteMaintenance = async (maintenanceId) => {
    if (!canUseApi || !selectedEquipmentId) return;

    try {
      const res = await fetch(`${API_BASE_URL}/inventory/maintenance/${maintenanceId}/complete`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Error ${res.status}`);
      }

      await loadEquipmentDetails(selectedEquipmentId);
      await loadUpcomingMaintenance();
      notifyInventoryUpdated();
    } catch (error) {
      setMessage(error.message || "No se pudo completar mantenimiento.");
    }
  };

  const onSubmitServiceCall = async (event) => {
    event.preventDefault();
    if (!canUseApi) return;

    if (!serviceCallForm.issueDescription.trim()) {
      setMessage("Describe el problema reportado.");
      return;
    }

    try {
      const payload = {
        companyName: serviceCallForm.companyName,
        equipmentId: serviceCallForm.equipmentId ? Number(serviceCallForm.equipmentId) : null,
        reportedAt: serviceCallForm.reportedAt || null,
        issueDescription: serviceCallForm.issueDescription,
        actionTaken: serviceCallForm.actionTaken || null,
        status: "abierto",
      };

      const res = await fetch(`${API_BASE_URL}/inventory/service-calls`, {
        method: "POST",
        headers: writeHeaders,
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Error ${res.status}`);

      setServiceCallForm((prev) => ({
        ...prev,
        equipmentId: "",
        reportedAt: nowDateTimeLocal(),
        issueDescription: "",
        actionTaken: "",
      }));
      setMessage("Atencion espontanea registrada.");
      await loadServiceCalls();
      notifyInventoryUpdated();
    } catch (error) {
      setMessage(error.message || "No se pudo registrar la atencion espontanea.");
    }
  };

  const onResolveServiceCall = async (call) => {
    if (!canUseApi) return;

    const resolution = window.prompt("Accion tomada para resolver la atencion:", call.action_taken || "");
    if (resolution === null) return;

    try {
      const res = await fetch(`${API_BASE_URL}/inventory/service-calls/${call.id}/resolve`, {
        method: "PATCH",
        headers: writeHeaders,
        credentials: "include",
        body: JSON.stringify({ actionTaken: resolution }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Error ${res.status}`);

      await loadServiceCalls();
      setMessage("Atencion marcada como resuelta.");
      notifyInventoryUpdated();
    } catch (error) {
      setMessage(error.message || "No se pudo resolver la atencion.");
    }
  };

  const exportInventoryCsv = async () => {
    if (!canUseApi) return;

    try {
      const params = new URLSearchParams({
        page: "1",
        pageSize: "1000",
        search: search.trim(),
      });
      if (equipmentType) params.set("equipmentType", equipmentType);
      if (operationalStatus) params.set("operationalStatus", operationalStatus);
      if (companyFilter) params.set("companyName", companyFilter);

      const res = await fetch(`${API_BASE_URL}/inventory/equipment?${params.toString()}`, {
        credentials: "include",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Error ${res.status}`);

      const callsParams = new URLSearchParams({ page: "1", pageSize: "1000", search: search.trim() });
      if (companyFilter) callsParams.set("companyName", companyFilter);
      const callsRes = await fetch(`${API_BASE_URL}/inventory/service-calls?${callsParams.toString()}`, {
        credentials: "include",
      });
      const callsBody = await callsRes.json().catch(() => ({}));
      const serviceCallRows = callsRes.ok && Array.isArray(callsBody?.items) ? callsBody.items : [];

      const rows = (Array.isArray(body?.items) ? body.items : []).slice().sort((left, right) => {
        const typeCompare = String(left?.equipment_type || "").localeCompare(String(right?.equipment_type || ""));
        if (typeCompare !== 0) return typeCompare;

        const brandCompare = String(left?.brand || "").localeCompare(String(right?.brand || ""));
        if (brandCompare !== 0) return brandCompare;

        return String(left?.model || "").localeCompare(String(right?.model || ""));
      });
      const header = [
        "Empresa",
        "Tipo",
        "Marca",
        "Modelo",
        "Serie",
        "Factura",
        "Importacion",
        "Ubicacion",
        "Area",
        "Ingreso",
        "Estado",
        "Condicion",
        "Proximo mantenimiento",
      ];
      const delimiter = ";";

      const lines = [header.map(sanitizeCsv).join(delimiter)];
      rows.forEach((item) => {
        lines.push([
          getCompanyLabel(item.company_name),
          item.equipment_type,
          item.brand,
          item.model,
          item.serial_number,
          item.invoice_number,
          toPlainDate(item.import_date),
          item.install_location,
          item.area_name,
          toPlainDate(item.ingress_date),
          item.operational_status,
          item.condition_status,
          toPlainDate(item.next_maintenance_date),
        ].map(sanitizeCsv).join(delimiter));
      });

      lines.push("");
      lines.push(["ATENCIONES ESPONTANEAS"].map(sanitizeCsv).join(delimiter));
      lines.push([
        "Empresa",
        "Fecha atencion",
        "Equipo",
        "Problema reportado",
        "Accion tomada",
        "Estado",
        "Fecha resuelto",
      ].map(sanitizeCsv).join(delimiter));

      serviceCallRows.forEach((call) => {
        const equipmentName = [call.brand, call.model, call.serial_number ? `(${call.serial_number})` : ""].filter(Boolean).join(" ");
        lines.push([
          getCompanyLabel(call.company_name),
          formatDateTime(call.reported_at),
          equipmentName || "Sin equipo",
          call.issue_description || "",
          call.action_taken || "",
          call.status || "abierto",
          formatDateTime(call.resolved_at),
        ].map(sanitizeCsv).join(delimiter));
      });

      const csvContent = `\uFEFF${lines.join("\n")}`;
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const fileStamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
      downloadBlob(blob, `inventario_${fileStamp}.csv`);
    } catch (error) {
      setMessage(error.message || "No se pudo exportar CSV.");
    }
  };

  const exportInventoryPdf = async () => {
    if (!canUseApi) return;

    try {
      const params = new URLSearchParams({
        page: "1",
        pageSize: "1000",
        search: search.trim(),
      });
      if (equipmentType) params.set("equipmentType", equipmentType);
      if (operationalStatus) params.set("operationalStatus", operationalStatus);
      if (companyFilter) params.set("companyName", companyFilter);

      const res = await fetch(`${API_BASE_URL}/inventory/equipment?${params.toString()}`, {
        credentials: "include",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Error ${res.status}`);

      const callsParams = new URLSearchParams({ page: "1", pageSize: "1000", search: search.trim() });
      if (companyFilter) callsParams.set("companyName", companyFilter);
      const callsRes = await fetch(`${API_BASE_URL}/inventory/service-calls?${callsParams.toString()}`, {
        credentials: "include",
      });
      const callsBody = await callsRes.json().catch(() => ({}));
      const serviceCallRows = callsRes.ok && Array.isArray(callsBody?.items) ? callsBody.items : [];

      const rows = Array.isArray(body?.items) ? body.items : [];
      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Inventario de Equipos", 40, 40);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      let y = 70;
      doc.text("Empresa", 40, y);
      doc.text("Marca / Modelo", 170, y);
      doc.text("Serie", 370, y);
      doc.text("Tipo", 510, y);
      doc.text("Estado", 590, y);
      doc.text("Prox. Mant.", 680, y);
      y += 14;
      doc.line(40, y, 800, y);
      y += 12;

      rows.forEach((item) => {
        if (y > 540) {
          doc.addPage();
          y = 60;
        }

        const model = `${item.brand || ""} ${item.model || ""}`.trim();
        doc.text(clipPdfText(doc, getCompanyLabel(item.company_name), 120), 40, y);
        doc.text(clipPdfText(doc, model, 190), 170, y);
        doc.text(clipPdfText(doc, String(item.serial_number || ""), 130), 370, y);
        doc.text(clipPdfText(doc, String(item.equipment_type || ""), 70), 510, y);
        doc.text(clipPdfText(doc, String(STATUS_LABELS[item.operational_status] || item.operational_status || ""), 80), 590, y);
        doc.text(clipPdfText(doc, formatDateOrDash(item.next_maintenance_date), 90), 680, y);
        y += 16;
      });

      y += 8;
      if (y > 520) {
        doc.addPage();
        y = 60;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Atenciones espontaneas", 40, y);
      y += 14;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("Fecha", 40, y);
      doc.text("Empresa", 130, y);
      doc.text("Equipo", 280, y);
      doc.text("Problema", 480, y);
      doc.text("Estado", 705, y);
      y += 10;
      doc.line(40, y, 800, y);
      y += 12;

      serviceCallRows.forEach((call) => {
        if (y > 540) {
          doc.addPage();
          y = 60;
        }

        const equipmentName = [call.brand, call.model, call.serial_number ? `(${call.serial_number})` : ""].filter(Boolean).join(" ") || "Sin equipo";
        doc.text(clipPdfText(doc, formatDateTime(call.reported_at), 85), 40, y);
        doc.text(clipPdfText(doc, getCompanyLabel(call.company_name), 140), 130, y);
        doc.text(clipPdfText(doc, equipmentName, 190), 280, y);
        doc.text(clipPdfText(doc, String(call.issue_description || ""), 220), 480, y);
        doc.text(clipPdfText(doc, String(call.status || "abierto"), 70), 705, y);
        y += 14;
      });

      const fileStamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
      doc.save(`inventario_${fileStamp}.pdf`);
    } catch (error) {
      setMessage(error.message || "No se pudo exportar PDF.");
    }
  };

  const canManageChildren = Number(selectedEquipmentId) > 0;

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 bg-white rounded-xl shadow-2xl border border-[#b2e4e5]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#01878A]">Inventario de Equipos</h2>
        <div className="flex flex-wrap gap-2">
          <button
            className="px-3 py-2 rounded border border-[#01878A] text-[#017f82] font-semibold hover:bg-[#eff9f9]"
            onClick={exportInventoryCsv}
            type="button"
          >
            Exportar Excel
          </button>
          <button
            className="px-3 py-2 rounded border border-[#01878A] text-[#017f82] font-semibold hover:bg-[#eff9f9]"
            onClick={exportInventoryPdf}
            type="button"
          >
            Exportar PDF
          </button>
          <button
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 font-semibold"
            onClick={onBackHome}
            type="button"
          >
            Volver al panel
          </button>
        </div>
      </div>

      {!canUseApi && (
        <div className="mb-4 p-3 rounded border border-red-300 bg-red-50 text-red-700 text-sm font-medium">
          Configura VITE_API_BASE_URL para usar el modulo de inventario.
        </div>
      )}

      {upcomingMaintenance.length > 0 && (
        <div className="mb-4 p-3 rounded border border-amber-300 bg-amber-50 text-amber-800 text-sm">
          <div className="font-bold mb-1">Recordatorios de mantenimiento ({upcomingMaintenance.length})</div>
          <div className="grid gap-1">
            {upcomingMaintenance.slice(0, 6).map((item) => (
              <div key={item.id}>
                {formatDate(item.planned_date)} - {getCompanyLabel(item.company_name)} - {item.brand} {item.model} ({item.serial_number})
                {Number.isFinite(Number(item.daysLeft)) && (
                  <span className="font-semibold"> | vence en {item.daysLeft} dias</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 mb-4">
        <input
          className="border border-gray-300 rounded px-3 py-2"
          placeholder="Buscar por marca, modelo, serie o ubicacion"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          className="border border-gray-300 rounded px-3 py-2"
          value={companyFilter}
          onChange={(event) => setCompanyFilter(event.target.value)}
        >
          <option value="">Todas las empresas</option>
          {COMPANY_OPTIONS.map((company) => (
            <option key={company.value} value={company.value}>{company.label}</option>
          ))}
        </select>
        <select
          className="border border-gray-300 rounded px-3 py-2"
          value={equipmentType}
          onChange={(event) => setEquipmentType(event.target.value)}
        >
          <option value="">Todos los tipos</option>
          <option value="laboratorio">Laboratorio</option>
          <option value="aire_acondicionado">Aire acondicionado</option>
        </select>
        <select
          className="border border-gray-300 rounded px-3 py-2"
          value={operationalStatus}
          onChange={(event) => setOperationalStatus(event.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="operativo">Operativo</option>
          <option value="inoperativo">Inoperativo</option>
          <option value="malogrado">Malogrado</option>
          <option value="en_observacion">En observacion</option>
        </select>
      </div>

      <form onSubmit={onSubmitEquipment} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-3 rounded-lg border border-[#b2e4e5] bg-[#f8ffff] mb-4">
        <div className="md:col-span-2 lg:col-span-3 p-3 rounded-lg border border-[#d7efef] bg-white">
          <div className="text-xs font-bold tracking-wide text-[#017f82]">[ID] Identificacion del equipo</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
            <select
              className="border border-gray-300 rounded px-3 py-2"
              value={form.companyName}
              onChange={(event) => setForm((prev) => ({ ...prev, companyName: event.target.value }))}
            >
              {COMPANY_OPTIONS.map((company) => (
                <option key={company.value} value={company.value}>{company.label}</option>
              ))}
            </select>
            <select
              className="border border-gray-300 rounded px-3 py-2"
              value={form.equipmentType}
              onChange={(event) => setForm((prev) => ({ ...prev, equipmentType: event.target.value }))}
            >
              <option value="laboratorio">Laboratorio</option>
              <option value="aire_acondicionado">Aire acondicionado</option>
            </select>
            <input className="border border-gray-300 rounded px-3 py-2" placeholder="Marca" value={form.brand} onChange={(event) => setForm((prev) => ({ ...prev, brand: event.target.value }))} required />
            <input className="border border-gray-300 rounded px-3 py-2" placeholder="Modelo" value={form.model} onChange={(event) => setForm((prev) => ({ ...prev, model: event.target.value }))} required />
            <input className="border border-gray-300 rounded px-3 py-2" placeholder="Serie" value={form.serialNumber} onChange={(event) => setForm((prev) => ({ ...prev, serialNumber: event.target.value }))} required />
            <input className="border border-gray-300 rounded px-3 py-2" placeholder="Factura" value={form.invoiceNumber} onChange={(event) => setForm((prev) => ({ ...prev, invoiceNumber: event.target.value }))} />
          </div>
        </div>

        <div className="md:col-span-2 lg:col-span-3 p-3 rounded-lg border border-[#d7efef] bg-white">
          <div className="text-xs font-bold tracking-wide text-[#017f82]">[UBI] Ubicacion y fechas de ingreso</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
            <input className="border border-gray-300 rounded px-3 py-2" placeholder="Localizacion" value={form.installLocation} onChange={(event) => setForm((prev) => ({ ...prev, installLocation: event.target.value }))} />
            <input className="border border-gray-300 rounded px-3 py-2" placeholder="Area" value={form.areaName} onChange={(event) => setForm((prev) => ({ ...prev, areaName: event.target.value }))} />
            <div>
              <label className="block text-xs text-gray-600 mb-1">Fecha de importacion</label>
              <input className="w-full border border-gray-300 rounded px-3 py-2" type="date" value={form.importDate} onChange={(event) => setForm((prev) => ({ ...prev, importDate: event.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Fecha de ingreso</label>
              <input className="w-full border border-gray-300 rounded px-3 py-2" type="date" value={form.ingressDate} onChange={(event) => setForm((prev) => ({ ...prev, ingressDate: event.target.value }))} />
            </div>
          </div>
        </div>

        <div className="md:col-span-2 lg:col-span-3 p-3 rounded-lg border border-[#d7efef] bg-white">
          <div className="text-xs font-bold tracking-wide text-[#017f82]">[MANT] Estado, mantenimiento y notas</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
            <select className="border border-gray-300 rounded px-3 py-2" value={form.operationalStatus} onChange={(event) => setForm((prev) => ({ ...prev, operationalStatus: event.target.value }))}>
              <option value="operativo">Operativo</option>
              <option value="inoperativo">Inoperativo</option>
              <option value="malogrado">Malogrado</option>
              <option value="en_observacion">En observacion</option>
            </select>
            <select className="border border-gray-300 rounded px-3 py-2" value={form.conditionStatus} onChange={(event) => setForm((prev) => ({ ...prev, conditionStatus: event.target.value }))}>
              {CONDITION_OPTIONS.map((value) => (
                <option key={value} value={value}>{CONDITION_LABELS[value] || value}</option>
              ))}
            </select>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Proximo mantenimiento</label>
              <input className="w-full border border-gray-300 rounded px-3 py-2" type="date" value={form.nextMaintenanceDate} onChange={(event) => setForm((prev) => ({ ...prev, nextMaintenanceDate: event.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Alerta previa (dias)</label>
              <input className="w-full border border-gray-300 rounded px-3 py-2" type="number" min="1" placeholder="Ejemplo: 30" value={form.maintenanceAlertDays} onChange={(event) => setForm((prev) => ({ ...prev, maintenanceAlertDays: event.target.value }))} />
            </div>
            <textarea className="border border-gray-300 rounded px-3 py-2 md:col-span-2 lg:col-span-3" placeholder="Notas" rows={3} value={form.notes} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} />
          </div>
        </div>

        <div className="md:col-span-2 lg:col-span-3 flex gap-2">
          <button className="px-4 py-2 rounded bg-[#01878A] text-white font-semibold hover:bg-[#016b6d]" type="submit">
            {form.id ? "Actualizar equipo" : "Registrar equipo"}
          </button>
          <button className="px-4 py-2 rounded border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100" type="button" onClick={resetForm}>
            Limpiar
          </button>
        </div>
      </form>

      {message && (
        <div className="mb-3 p-2 rounded border border-[#b2e4e5] bg-[#f4ffff] text-[#015d5f] text-sm">{message}</div>
      )}

      <div className="overflow-x-auto rounded border border-[#d6ecec] mb-4">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="bg-[#f1fbfb] text-[#016b6d]">
            <tr>
              <th className="text-left p-2">Tipo</th>
              <th className="text-left p-2">Empresa</th>
              <th className="text-left p-2">Marca / Modelo</th>
              <th className="text-left p-2">Serie</th>
              <th className="text-left p-2">Ubicacion</th>
              <th className="text-left p-2">Estado</th>
              <th className="text-left p-2">Mantenimiento</th>
              <th className="text-left p-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-[#e3f4f4]">
                <td className="p-2">{item.equipment_type === "aire_acondicionado" ? "Aire" : "Lab"}</td>
                <td className="p-2">{getCompanyLabel(item.company_name)}</td>
                <td className="p-2 font-semibold text-[#024f50]">{item.brand} {item.model}</td>
                <td className="p-2">{item.serial_number}</td>
                <td className="p-2">{item.install_location || "-"}</td>
                <td className="p-2">
                  <span className={`inline-flex px-2 py-1 rounded text-xs font-bold ${item.operational_status === "operativo" ? "bg-green-100 text-green-700" : item.operational_status === "inoperativo" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                    {STATUS_LABELS[item.operational_status] || item.operational_status}
                  </span>
                </td>
                <td className="p-2">{formatDate(item.next_maintenance_date) || "-"}</td>
                <td className="p-2">
                  <div className="flex flex-wrap gap-1">
                    <button className="px-2 py-1 rounded border border-[#01878A] text-[#017f82] hover:bg-[#eff9f9]" type="button" onClick={() => selectForEdit(item)}>Editar</button>
                    <button className="px-2 py-1 rounded border border-green-300 text-green-700 hover:bg-green-50" type="button" onClick={() => onQuickChangeStatus(item, "operativo")}>Operativo</button>
                    <button className="px-2 py-1 rounded border border-red-300 text-red-700 hover:bg-red-50" type="button" onClick={() => onQuickChangeStatus(item, "inoperativo")}>Inoperativo</button>
                    <button className="px-2 py-1 rounded border border-amber-300 text-amber-700 hover:bg-amber-50" type="button" onClick={() => onQuickChangeStatus(item, "malogrado")}>Malogrado</button>
                    <button className="px-2 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-100" type="button" onClick={() => onDeleteEquipment(item)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td className="p-4 text-center text-gray-500" colSpan={8}>{loading ? "Cargando..." : "Sin registros"}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mb-6">
        <button
          className="px-3 py-1 rounded border border-gray-300 text-gray-700 disabled:opacity-50"
          type="button"
          disabled={page <= 1}
          onClick={() => loadEquipment(page - 1)}
        >
          Anterior
        </button>
        <div className="text-sm text-gray-600">Pagina {pagination.page || 1} de {pagination.totalPages || 1} | Total {pagination.totalItems || 0}</div>
        <button
          className="px-3 py-1 rounded border border-gray-300 text-gray-700 disabled:opacity-50"
          type="button"
          disabled={page >= Number(pagination.totalPages || 1)}
          onClick={() => loadEquipment(page + 1)}
        >
          Siguiente
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-3 rounded-lg border border-[#d6ecec] bg-[#fbffff]">
          <h3 className="font-bold text-[#017f82] mb-2">Accesorios del equipo seleccionado</h3>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3" onSubmit={onAddAccessory}>
            <input className="border border-gray-300 rounded px-2 py-2" placeholder="Nombre accesorio" value={accessoryForm.accessoryName} onChange={(event) => setAccessoryForm((prev) => ({ ...prev, accessoryName: event.target.value }))} required disabled={!canManageChildren} />
            <input className="border border-gray-300 rounded px-2 py-2" placeholder="Marca" value={accessoryForm.brand} onChange={(event) => setAccessoryForm((prev) => ({ ...prev, brand: event.target.value }))} disabled={!canManageChildren} />
            <input className="border border-gray-300 rounded px-2 py-2" placeholder="Serie" value={accessoryForm.serialNumber} onChange={(event) => setAccessoryForm((prev) => ({ ...prev, serialNumber: event.target.value }))} disabled={!canManageChildren} />
            <input className="border border-gray-300 rounded px-2 py-2" type="date" value={accessoryForm.ingressDate} onChange={(event) => setAccessoryForm((prev) => ({ ...prev, ingressDate: event.target.value }))} disabled={!canManageChildren} />
            <textarea className="border border-gray-300 rounded px-2 py-2 md:col-span-2" rows={2} placeholder="Notas" value={accessoryForm.notes} onChange={(event) => setAccessoryForm((prev) => ({ ...prev, notes: event.target.value }))} disabled={!canManageChildren} />
            <button className="px-3 py-2 rounded bg-[#01878A] text-white font-semibold disabled:opacity-50" type="submit" disabled={!canManageChildren}>Agregar accesorio</button>
          </form>
          <div className="space-y-2 max-h-56 overflow-auto">
            {accessories.map((item) => (
              <div key={item.id} className="p-2 rounded border border-[#e2f0f0] bg-white flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-[#015f61]">{item.accessory_name}</div>
                  <div className="text-xs text-gray-600">{item.brand || "-"} | {item.serial_number || "-"}</div>
                </div>
                <button className="px-2 py-1 rounded border border-red-300 text-red-700 text-xs" type="button" onClick={() => onDeleteAccessory(item.id)}>Eliminar</button>
              </div>
            ))}
            {accessories.length === 0 && <div className="text-sm text-gray-500">No hay accesorios registrados.</div>}
          </div>
        </div>

        <div className="p-3 rounded-lg border border-[#d6ecec] bg-[#fbffff]">
          <h3 className="font-bold text-[#017f82] mb-2">Mantenimientos programados</h3>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3" onSubmit={onAddMaintenance}>
            <input className="border border-gray-300 rounded px-2 py-2" type="date" value={maintenanceForm.plannedDate} onChange={(event) => setMaintenanceForm((prev) => ({ ...prev, plannedDate: event.target.value }))} required disabled={!canManageChildren} />
            <input className="border border-gray-300 rounded px-2 py-2" placeholder="Nota" value={maintenanceForm.notes} onChange={(event) => setMaintenanceForm((prev) => ({ ...prev, notes: event.target.value }))} disabled={!canManageChildren} />
            <button className="px-3 py-2 rounded bg-[#01878A] text-white font-semibold disabled:opacity-50" type="submit" disabled={!canManageChildren}>Programar mantenimiento</button>
          </form>
          <div className="space-y-2 max-h-56 overflow-auto">
            {maintenance.map((item) => (
              <div key={item.id} className="p-2 rounded border border-[#e2f0f0] bg-white flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-[#015f61]">{formatDate(item.planned_date)}</div>
                  <div className="text-xs text-gray-600">{item.notes || "Sin nota"}</div>
                  <div className="text-xs text-gray-500">{item.completed_at ? `Completado: ${String(item.completed_at).slice(0, 10)}` : "Pendiente"}</div>
                </div>
                {!item.completed_at && (
                  <button className="px-2 py-1 rounded border border-green-300 text-green-700 text-xs" type="button" onClick={() => onCompleteMaintenance(item.id)}>
                    Completar
                  </button>
                )}
              </div>
            ))}
            {maintenance.length === 0 && <div className="text-sm text-gray-500">No hay mantenimientos programados.</div>}
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 rounded-lg border border-[#d6ecec] bg-[#fbffff]">
        <h3 className="font-bold text-[#017f82] mb-2">Atenciones espontaneas</h3>
        <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-3" onSubmit={onSubmitServiceCall}>
          <select
            className="border border-gray-300 rounded px-2 py-2"
            value={serviceCallForm.companyName}
            onChange={(event) => setServiceCallForm((prev) => ({ ...prev, companyName: event.target.value }))}
          >
            {COMPANY_OPTIONS.map((company) => (
              <option key={company.value} value={company.value}>{company.label}</option>
            ))}
          </select>
          <select
            className="border border-gray-300 rounded px-2 py-2"
            value={serviceCallForm.equipmentId}
            onChange={(event) => setServiceCallForm((prev) => ({ ...prev, equipmentId: event.target.value }))}
          >
            <option value="">Sin equipo especifico</option>
            {items
              .filter((item) => !serviceCallForm.companyName || item.company_name === serviceCallForm.companyName)
              .map((item) => (
                <option key={item.id} value={item.id}>{item.brand} {item.model} ({item.serial_number})</option>
              ))}
          </select>
          <input
            className="border border-gray-300 rounded px-2 py-2"
            type="datetime-local"
            value={serviceCallForm.reportedAt}
            onChange={(event) => setServiceCallForm((prev) => ({ ...prev, reportedAt: event.target.value }))}
          />
          <input
            className="border border-gray-300 rounded px-2 py-2 md:col-span-2"
            placeholder="Problema reportado"
            value={serviceCallForm.issueDescription}
            onChange={(event) => setServiceCallForm((prev) => ({ ...prev, issueDescription: event.target.value }))}
            required
          />
          <input
            className="border border-gray-300 rounded px-2 py-2 md:col-span-2"
            placeholder="Accion tomada (opcional al registrar)"
            value={serviceCallForm.actionTaken}
            onChange={(event) => setServiceCallForm((prev) => ({ ...prev, actionTaken: event.target.value }))}
          />
          <button className="px-3 py-2 rounded bg-[#01878A] text-white font-semibold" type="submit">
            Registrar atencion
          </button>
        </form>

        <div className="space-y-2 max-h-64 overflow-auto">
          {serviceCalls.map((call) => (
            <div key={call.id} className="p-2 rounded border border-[#e2f0f0] bg-white flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-gray-600">{formatDateTime(call.reported_at)} | {getCompanyLabel(call.company_name)}</div>
                <div className="font-semibold text-[#015f61]">{call.issue_description}</div>
                <div className="text-xs text-gray-600">
                  {[call.brand, call.model, call.serial_number ? `(${call.serial_number})` : ""].filter(Boolean).join(" ") || "Sin equipo especifico"}
                </div>
                <div className="text-xs text-gray-600">Accion: {call.action_taken || "Pendiente"}</div>
                <div className="text-xs text-gray-500">Resuelto: {call.resolved_at ? formatDateTime(call.resolved_at) : "No"}</div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-2 py-1 rounded text-xs font-bold ${call.status === "resuelto" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                  {call.status === "resuelto" ? "Resuelto" : "Abierto"}
                </span>
                {call.status !== "resuelto" && (
                  <button
                    className="px-2 py-1 rounded border border-green-300 text-green-700 text-xs"
                    type="button"
                    onClick={() => onResolveServiceCall(call)}
                  >
                    Marcar resuelto
                  </button>
                )}
              </div>
            </div>
          ))}
          {serviceCalls.length === 0 && <div className="text-sm text-gray-500">No hay atenciones espontaneas registradas.</div>}
        </div>
      </div>

      <div className="mt-4 p-3 rounded-lg border border-[#d6ecec] bg-[#fbffff]">
        <h3 className="font-bold text-[#017f82] mb-2">Cronograma preventivo anual (vista dedicada)</h3>

        {scheduleFeedback.text && (
          <div className={`mb-3 p-2 rounded text-sm font-medium ${scheduleFeedback.type === "success" ? "bg-green-50 border border-green-300 text-green-700" : "bg-red-50 border border-red-300 text-red-700"}`}>
            {scheduleFeedback.text}
          </div>
        )}

        {scheduleActionHistory.length > 0 && (
          <div className="mb-3 p-2 rounded border border-[#d8ecec] bg-white">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="text-xs font-semibold text-[#016b6d]">Historial de acciones recientes</div>
              <button
                className="px-2 py-1 rounded border border-gray-300 text-gray-700 text-xs hover:bg-gray-100"
                type="button"
                onClick={() => setScheduleActionHistory([])}
              >
                Limpiar historial
              </button>
            </div>
            <div className="space-y-1 max-h-28 overflow-auto">
              {scheduleActionHistory.map((entry) => (
                <div key={entry.id} className="text-xs text-gray-700">
                  <span className="font-semibold">{entry.at}</span>
                  <span> | {entry.action} | </span>
                  <span className={entry.type === "success" ? "text-green-700 font-semibold" : "text-red-700 font-semibold"}>{entry.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <form className="p-3 rounded border border-[#d8ecec] bg-white" onSubmit={onSaveScheduleTemplate}>
            <div className="font-semibold text-[#016b6d] mb-2">1) Configuracion de plantilla por hospital y anio</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <select
                className="border border-gray-300 rounded px-2 py-2"
                value={templateForm.companyName}
                onChange={(event) => setTemplateForm((prev) => ({ ...prev, companyName: event.target.value }))}
              >
                {COMPANY_OPTIONS.map((company) => (
                  <option key={company.value} value={company.value}>{company.label}</option>
                ))}
              </select>
              <input className="border border-gray-300 rounded px-2 py-2" placeholder="Hospital" value={templateForm.hospitalName} onChange={(event) => setTemplateForm((prev) => ({ ...prev, hospitalName: event.target.value }))} required />
              <input className="border border-gray-300 rounded px-2 py-2" type="number" min="2024" max="2100" value={templateForm.year} onChange={(event) => setTemplateForm((prev) => ({ ...prev, year: event.target.value }))} required />
              <input className="border border-gray-300 rounded px-2 py-2" placeholder="Titulo PDF" value={templateForm.title} onChange={(event) => setTemplateForm((prev) => ({ ...prev, title: event.target.value }))} required />
              <input className="border border-gray-300 rounded px-2 py-2 md:col-span-2" placeholder="Institucion" value={templateForm.institutionName} onChange={(event) => setTemplateForm((prev) => ({ ...prev, institutionName: event.target.value }))} />
              <textarea className="border border-gray-300 rounded px-2 py-2 md:col-span-2" rows={5} placeholder="Acciones (una fila por linea)" value={templateForm.actionsText} onChange={(event) => setTemplateForm((prev) => ({ ...prev, actionsText: event.target.value }))} required />
              <div className="md:col-span-2 text-xs text-gray-500">Escribe una actividad por linea para crear nuevas filas del cronograma.</div>

              <label className="text-xs text-gray-600">Logo principal</label>
              <input className="border border-gray-300 rounded px-2 py-2" type="file" accept="image/*" onChange={(event) => onUploadTemplateAsset("logoData", event.target.files?.[0])} />
              <label className="text-xs text-gray-600">Sello izquierdo</label>
              <input className="border border-gray-300 rounded px-2 py-2" type="file" accept="image/*" onChange={(event) => onUploadTemplateAsset("sealLeftData", event.target.files?.[0])} />
              <label className="text-xs text-gray-600">Sello derecho</label>
              <input className="border border-gray-300 rounded px-2 py-2" type="file" accept="image/*" onChange={(event) => onUploadTemplateAsset("sealRightData", event.target.files?.[0])} />
              <label className="text-xs text-gray-600">Firma</label>
              <input className="border border-gray-300 rounded px-2 py-2" type="file" accept="image/*" onChange={(event) => onUploadTemplateAsset("signatureData", event.target.files?.[0])} />
              <label className="text-xs text-gray-600">Sello firma</label>
              <input className="border border-gray-300 rounded px-2 py-2" type="file" accept="image/*" onChange={(event) => onUploadTemplateAsset("stampData", event.target.files?.[0])} />

              <textarea className="border border-gray-300 rounded px-2 py-2 md:col-span-2 resize-none" rows={2} placeholder="Footer izquierdo (hasta 2 lineas)" value={templateForm.footerLeft} onChange={(event) => setTemplateForm((prev) => ({ ...prev, footerLeft: event.target.value }))} />
              <textarea className="border border-gray-300 rounded px-2 py-2 md:col-span-2 resize-none" rows={2} placeholder="Footer centro (hasta 2 lineas)" value={templateForm.footerCenter} onChange={(event) => setTemplateForm((prev) => ({ ...prev, footerCenter: event.target.value }))} />
              <textarea className="border border-gray-300 rounded px-2 py-2 md:col-span-2 resize-none" rows={2} placeholder="Footer derecho (hasta 2 lineas)" value={templateForm.footerRight} onChange={(event) => setTemplateForm((prev) => ({ ...prev, footerRight: event.target.value }))} />
            </div>
            <button className="mt-3 px-3 py-2 rounded bg-[#01878A] text-white font-semibold disabled:opacity-60" type="submit" disabled={schedulePendingAction === "template"}>
              {schedulePendingAction === "template" ? "Guardando plantilla..." : "Guardar plantilla"}
            </button>
          </form>

          <form className="p-3 rounded border border-[#d8ecec] bg-white" onSubmit={onCreateSchedulePlan}>
            <div className="font-semibold text-[#016b6d] mb-2">2) Crear cronograma por equipo (frecuencia 3/4/6 meses)</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <select className="border border-gray-300 rounded px-2 py-2" value={planForm.companyName} onChange={(event) => setPlanForm((prev) => ({ ...prev, companyName: event.target.value }))}>
                {COMPANY_OPTIONS.map((company) => (
                  <option key={company.value} value={company.value}>{company.label}</option>
                ))}
              </select>
              <input className="border border-gray-300 rounded px-2 py-2" placeholder="Hospital" value={planForm.hospitalName} onChange={(event) => setPlanForm((prev) => ({ ...prev, hospitalName: event.target.value }))} required />
              <input className="border border-gray-300 rounded px-2 py-2" type="number" min="2024" max="2100" value={planForm.year} onChange={(event) => setPlanForm((prev) => ({ ...prev, year: event.target.value }))} required />
              <select className="border border-gray-300 rounded px-2 py-2" value={planForm.frequencyMonths} onChange={(event) => setPlanForm((prev) => ({ ...prev, frequencyMonths: event.target.value }))}>
                <option value="3">Cada 3 meses</option>
                <option value="4">Cada 4 meses</option>
                <option value="6">Cada 6 meses</option>
              </select>
              <select className="border border-gray-300 rounded px-2 py-2 md:col-span-2" value={planForm.templateId} onChange={(event) => setPlanForm((prev) => ({ ...prev, templateId: event.target.value }))} required>
                <option value="">Selecciona plantilla</option>
                {scheduleTemplates
                  .filter((tpl) => !planForm.companyName || tpl.company_name === planForm.companyName)
                  .map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>{tpl.hospital_name} - {tpl.year}</option>
                  ))}
              </select>
              <select className="border border-gray-300 rounded px-2 py-2 md:col-span-2" value={planForm.equipmentId} onChange={(event) => setPlanForm((prev) => ({ ...prev, equipmentId: event.target.value }))} required>
                <option value="">Selecciona equipo</option>
                {items
                  .filter((item) => !planForm.companyName || item.company_name === planForm.companyName)
                  .map((item) => (
                    <option key={item.id} value={item.id}>{item.brand} {item.model} ({item.serial_number})</option>
                  ))}
              </select>
              <input className="border border-gray-300 rounded px-2 py-2 md:col-span-2" type="date" value={planForm.startDate} onChange={(event) => setPlanForm((prev) => ({ ...prev, startDate: event.target.value }))} required />
            </div>
            <button className="mt-3 px-3 py-2 rounded bg-[#01878A] text-white font-semibold disabled:opacity-60" type="submit" disabled={schedulePendingAction === "plan"}>
              {schedulePendingAction === "plan" ? "Creando cronograma..." : "Crear cronograma"}
            </button>
          </form>
        </div>

        <div className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="p-3 rounded border border-[#d8ecec] bg-white">
            <div className="font-semibold text-[#016b6d] mb-2">3) Cronogramas creados</div>
            <select className="w-full border border-gray-300 rounded px-2 py-2 mb-3" value={selectedSchedulePlanId || ""} onChange={(event) => setSelectedSchedulePlanId(Number(event.target.value) || 0)}>
              <option value="">Selecciona un cronograma</option>
              {schedulePlans.map((plan) => (
                <option key={plan.id} value={plan.id}>{plan.hospital_name} | {plan.brand} {plan.model} | {plan.year}</option>
              ))}
            </select>

            {selectedSchedulePlanDetail?.plan && (
              <div className="space-y-2">
                <div className="text-sm text-gray-700">Equipo: <span className="font-semibold">{selectedSchedulePlanDetail.plan.brand} {selectedSchedulePlanDetail.plan.model}</span></div>
                <div className="text-sm text-gray-700">Serie: <span className="font-semibold">{selectedSchedulePlanDetail.plan.serial_number}</span></div>
                <div className="text-sm text-gray-700">Meses con check acumulado: <span className="font-semibold">{(selectedSchedulePlanDetail.executedMonths || []).map((num) => MONTH_LABELS_SHORT[num - 1]).join(", ") || "Ninguno"}</span></div>

                <div className="text-sm font-semibold text-[#016b6d] mt-2">Filas editables</div>
                <div className="flex gap-2 mb-2">
                  <button className="px-2 py-1 rounded border border-[#01878A] text-[#017f82] text-xs font-semibold hover:bg-[#eff9f9]" type="button" onClick={onAddPlanActionRow}>Agregar fila</button>
                </div>
                <div className="space-y-2 max-h-56 overflow-auto pr-1">
                  {(selectedSchedulePlanDetail.actions || []).map((action, index) => (
                    <div key={action.id || index} className="flex items-center gap-2">
                      <input
                        className="w-full border border-gray-300 rounded px-2 py-2"
                        value={action.action_name || ""}
                        onChange={(event) => {
                          const next = { ...selectedSchedulePlanDetail };
                          next.actions = [...(next.actions || [])];
                          next.actions[index] = { ...next.actions[index], action_name: event.target.value };
                          setSelectedSchedulePlanDetail(next);
                        }}
                      />
                      <button className="px-2 py-1 rounded border border-red-300 text-red-700 text-xs hover:bg-red-50" type="button" onClick={() => onRemovePlanActionRow(index)}>Quitar</button>
                    </div>
                  ))}
                </div>
                <button className="px-3 py-2 rounded border border-[#01878A] text-[#017f82] font-semibold hover:bg-[#eff9f9] disabled:opacity-60" type="button" onClick={onSavePlanActions} disabled={schedulePendingAction === "actions"}>
                  {schedulePendingAction === "actions" ? "Guardando filas..." : "Guardar filas"}
                </button>
              </div>
            )}
          </div>

          <div className="p-3 rounded border border-[#d8ecec] bg-white">
            <div className="font-semibold text-[#016b6d] mb-2">4) Registrar mantenimiento realizado e imprimir</div>
            <form className="grid grid-cols-1 gap-2 mb-3" onSubmit={onRegisterScheduleExecution}>
              <input className="border border-gray-300 rounded px-2 py-2" type="date" value={executionForm.performedAt} onChange={(event) => setExecutionForm((prev) => ({ ...prev, performedAt: event.target.value }))} required disabled={!selectedSchedulePlanId} />
              <input className="border border-gray-300 rounded px-2 py-2" placeholder="Nota del mantenimiento realizado" value={executionForm.notes} onChange={(event) => setExecutionForm((prev) => ({ ...prev, notes: event.target.value }))} disabled={!selectedSchedulePlanId} />
              <button className="px-3 py-2 rounded bg-[#01878A] text-white font-semibold disabled:opacity-50" type="submit" disabled={!selectedSchedulePlanId || schedulePendingAction === "execution"}>
                {schedulePendingAction === "execution" ? "Registrando mantenimiento..." : "Registrar y marcar check del mes"}
              </button>
            </form>

            <button className="px-3 py-2 rounded border border-[#01878A] text-[#017f82] font-semibold hover:bg-[#eff9f9] disabled:opacity-50" type="button" onClick={exportSchedulePlanPdf} disabled={!selectedSchedulePlanDetail?.plan}>
              Exportar cronograma PDF para impresion
            </button>

            <div className="mt-3 text-xs text-gray-600">
              El PDF se imprime acumulando checks por mes real de ejecucion, sin mezclar atenciones espontaneas.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

InventoryAdmin.propTypes = {
  onBackHome: PropTypes.func.isRequired,
};

export default InventoryAdmin;
