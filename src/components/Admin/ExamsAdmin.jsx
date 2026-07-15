import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";

const EMPTY_FORM = {
  id: "",
  name: "",
  sample: "",
  method: "",
  price1: "",
  price2: "",
  tube: "",
  info: "",
  time: "",
  quantity: "1",
  active: "1",
};

const EXPORT_PREFS_STORAGE_KEY = "inbioslab_exams_export_price_prefs";
const EXAMS_UPDATED_STORAGE_KEY = "inbioslab_exams_updated_at";
const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || "").trim();

function formatMoney(value) {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) return "0.00";
  return num.toFixed(2);
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function buildExportFileName(prefix) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  return `${prefix}_${year}${month}${day}_${hour}${minute}`;
}

function truncateText(value, maxLen) {
  const text = String(value || "");
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen - 1)}...`;
}

function notifyExamsUpdated() {
  window.dispatchEvent(new Event("inbioslab:exams-updated"));
  try {
    window.localStorage.setItem(EXAMS_UPDATED_STORAGE_KEY, String(Date.now()));
  } catch (_error) {
    // Ignore storage sync errors (private mode/quota issues).
  }
}

function ExamsAdmin({ onBackHome }) {
  const apiBaseUrl = API_BASE_URL;

  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalItems: 0 });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [importText, setImportText] = useState("");
  const [truncateImport, setTruncateImport] = useState(false);
  const [exportPricePublico, setExportPricePublico] = useState(() => {
    try {
      const raw = window.localStorage.getItem(EXPORT_PREFS_STORAGE_KEY);
      if (!raw) return true;
      const parsed = JSON.parse(raw);
      return parsed?.publico !== false;
    } catch {
      return true;
    }
  });
  const [exportPriceConvenio, setExportPriceConvenio] = useState(() => {
    try {
      const raw = window.localStorage.getItem(EXPORT_PREFS_STORAGE_KEY);
      if (!raw) return true;
      const parsed = JSON.parse(raw);
      return parsed?.convenio !== false;
    } catch {
      return true;
    }
  });

  const canUseApi = useMemo(() => Boolean(apiBaseUrl), [apiBaseUrl]);
  const writeHeaders = useMemo(
    () => ({
      "Content-Type": "application/json",
    }),
    []
  );

  const loadData = async (targetPage = page) => {
    if (!canUseApi) return;

    setLoading(true);
    setMessage("");
    try {
      const params = new URLSearchParams({
        page: String(targetPage),
        pageSize: String(pageSize),
        search: search.trim(),
        sortBy: "id",
        sortOrder: "asc",
      });

      if (includeInactive) {
        params.set("includeInactive", "1");
      }

      const res = await fetch(`${apiBaseUrl}/exams?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Error ${res.status}`);
      }

      const body = await res.json();
      setItems(Array.isArray(body?.items) ? body.items : []);
      setPagination(body?.pagination || { page: 1, totalPages: 1, totalItems: 0 });
      setPage(targetPage);
    } catch (error) {
      setMessage(`No se pudo cargar examenes: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllFilteredRows = async () => {
    if (!canUseApi) {
      return [];
    }

    const allRows = [];
    const exportPageSize = 100;
    let current = 1;
    let totalPages = 1;

    while (current <= totalPages) {
      const params = new URLSearchParams({
        page: String(current),
        pageSize: String(exportPageSize),
        search: search.trim(),
        sortBy: "id",
        sortOrder: "asc",
      });

      if (includeInactive) {
        params.set("includeInactive", "1");
      }

      const res = await fetch(`${apiBaseUrl}/exams?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Error ${res.status}`);
      }

      const body = await res.json();
      const pageRows = Array.isArray(body?.items) ? body.items : [];
      allRows.push(...pageRows);

      totalPages = Number(body?.pagination?.totalPages || 1);
      current += 1;
    }

    return allRows;
  };

  useEffect(() => {
    loadData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, includeInactive]);

  useEffect(() => {
    window.localStorage.setItem(
      EXPORT_PREFS_STORAGE_KEY,
      JSON.stringify({
        publico: exportPricePublico,
        convenio: exportPriceConvenio,
      })
    );
  }, [exportPricePublico, exportPriceConvenio]);

  const resetForm = () => setForm(EMPTY_FORM);

  const selectForEdit = (item) => {
    setForm({
      id: String(item.id),
      name: item.name || "",
      sample: item.sample || "",
      method: item.method || "",
      price1: String(item.price1 ?? ""),
      price2: String(item.price2 ?? ""),
      tube: item.tube || "",
      info: item.info || "",
      time: item.time || "",
      quantity: String(item.quantity ?? 1),
      active: String(item.active ?? 1),
    });
  };

  const buildPayload = () => ({
    name: form.name,
    sample: form.sample,
    method: form.method,
    price1: Number(form.price1 || 0),
    price2: Number(form.price2 || 0),
    tube: form.tube,
    info: form.info,
    time: form.time,
    quantity: Number(form.quantity || 1),
    active: Number(form.active || 1),
  });

  const createExam = async () => {
    if (!canUseApi) return;
    setMessage("");
    const res = await fetch(`${apiBaseUrl}/exams`, {
      method: "POST",
      headers: writeHeaders,
      credentials: "include",
      body: JSON.stringify(buildPayload()),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || `Error ${res.status}`);
    }

    setMessage("Examen creado correctamente.");
    resetForm();
    await loadData(1);
    notifyExamsUpdated();
  };

  const updateExam = async () => {
    if (!canUseApi || !form.id) return;
    setMessage("");
    const res = await fetch(`${apiBaseUrl}/exams/${form.id}`, {
      method: "PUT",
      headers: writeHeaders,
      credentials: "include",
      body: JSON.stringify(buildPayload()),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || `Error ${res.status}`);
    }

    setMessage("Examen actualizado correctamente.");
    await loadData(page);
    notifyExamsUpdated();
  };

  const deleteExam = async () => {
    if (!canUseApi || !form.id) return;
    if (!window.confirm("Deseas eliminar este examen?")) return;

    setMessage("");
    const res = await fetch(`${apiBaseUrl}/exams/${form.id}`, {
      method: "DELETE",
      headers: writeHeaders,
      credentials: "include",
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || `Error ${res.status}`);
    }

    setMessage("Examen eliminado.");
    resetForm();
    await loadData(1);
    notifyExamsUpdated();
  };

  const importExams = async () => {
    if (!canUseApi) return;

    let parsed;
    try {
      parsed = JSON.parse(importText);
    } catch {
      setMessage("JSON de importacion invalido.");
      return;
    }

    const itemsPayload = Array.isArray(parsed) ? parsed : parsed?.items;
    if (!Array.isArray(itemsPayload) || itemsPayload.length === 0) {
      setMessage("El JSON debe ser un array o un objeto con items[].");
      return;
    }

    setMessage("");
    const res = await fetch(`${apiBaseUrl}/exams/import`, {
      method: "POST",
      headers: writeHeaders,
      credentials: "include",
      body: JSON.stringify({
        items: itemsPayload,
        truncate: truncateImport,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || `Error ${res.status}`);
    }

    const result = await res.json();
    setMessage(`Importacion exitosa: ${result.imported} registros.`);
    await loadData(1);
    notifyExamsUpdated();
  };

  const runAction = async (fn) => {
    try {
      await fn();
    } catch (error) {
      setMessage(error.message || "Operacion fallida.");
    }
  };

  const exportPdf = async () => {
    try {
      if (!exportPricePublico && !exportPriceConvenio) {
        setMessage("Selecciona al menos un tipo de precio para exportar.");
        return;
      }

      const rows = await fetchAllFilteredRows();
      if (rows.length === 0) {
        setMessage("No hay datos para exportar.");
        return;
      }

      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "landscape" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 10;

      const columns = [
        { key: "id", title: "ID", width: 10, align: "center" },
        { key: "name", title: "Nombre", width: 70, align: "left" },
        { key: "sample", title: "Muestra", width: 34, align: "left" },
        { key: "method", title: "Metodo", width: 38, align: "left" },
        { key: "time", title: "Tiempo", width: 20, align: "left" },
        { key: "active", title: "Activo", width: 16, align: "center" },
      ];

      if (exportPricePublico) {
        columns.splice(4, 0, { key: "price1", title: "Publico", width: 24, align: "right" });
      }

      if (exportPriceConvenio) {
        const indexAfterPublic = exportPricePublico ? 5 : 4;
        columns.splice(indexAfterPublic, 0, { key: "price2", title: "Convenio", width: 24, align: "right" });
      }

      const renderHeader = (subtitle) => {
        doc.setFontSize(14);
        doc.setFont(undefined, "bold");
        doc.text("Listado de examenes", margin, 12);
        doc.setFontSize(9);
        doc.setFont(undefined, "normal");
        doc.text(subtitle, margin, 18);
      };

      const drawTableHeader = (topY) => {
        doc.setFontSize(8);
        doc.setFont(undefined, "bold");
        let x = margin;
        for (const col of columns) {
          doc.rect(x, topY, col.width, 7);
          doc.text(col.title, x + 1.5, topY + 4.8);
          x += col.width;
        }
      };

      const drawCellText = (text, x, y, width, align) => {
        if (align === "right") {
          doc.text(text, x + width - 1.5, y, { align: "right" });
          return;
        }
        if (align === "center") {
          doc.text(text, x + width / 2, y, { align: "center" });
          return;
        }
        doc.text(text, x + 1.5, y);
      };

      const totalItems = rows.length;
      const totalPages = Math.max(1, Math.ceil(totalItems / 28));
      let pageIndex = 1;
      let y = 26;

      renderHeader(`Total registros: ${totalItems} | Pagina ${pageIndex} de ${totalPages}`);
      drawTableHeader(y);
      y += 7;

      doc.setFontSize(8);
      doc.setFont(undefined, "normal");

      for (let i = 0; i < rows.length; i += 1) {
        const item = rows[i];
        if (y + 6 > pageHeight - margin) {
          doc.addPage("a4", "landscape");
          pageIndex += 1;
          y = 26;
          renderHeader(`Total registros: ${totalItems} | Pagina ${pageIndex} de ${totalPages}`);
          drawTableHeader(y);
          y += 7;
        }

        let x = margin;
        for (const col of columns) {
          doc.rect(x, y, col.width, 6);

          let value = item[col.key];
          if (col.key === "price1" || col.key === "price2") {
            value = `S/ ${formatMoney(value)}`;
          }
          if (col.key === "active") {
            value = Number(value) === 1 ? "SI" : "NO";
          }

          const text = truncateText(value, col.key === "name" ? 34 : 18);
          drawCellText(text, x, y + 4.2, col.width, col.align);
          x += col.width;
        }

        y += 6;
      }

      doc.save(`${buildExportFileName("examenes")}.pdf`);
      setMessage("Exportacion PDF generada.");
    } catch (error) {
      setMessage(`No se pudo exportar PDF: ${error.message}`);
    }
  };

  const exportExcel = async () => {
    try {
      if (!exportPricePublico && !exportPriceConvenio) {
        setMessage("Selecciona al menos un tipo de precio para exportar.");
        return;
      }

      const rows = await fetchAllFilteredRows();
      if (rows.length === 0) {
        setMessage("No hay datos para exportar.");
        return;
      }

      const ExcelJS = await import("exceljs");
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Examenes");

      const sheetColumns = [
        { header: "ID", key: "id", width: 8 },
        { header: "Nombre", key: "name", width: 42 },
        { header: "Muestra", key: "sample", width: 18 },
        { header: "Metodo", key: "method", width: 26 },
        { header: "Tiempo", key: "time", width: 14 },
        { header: "Activo", key: "active", width: 10 },
      ];

      if (exportPricePublico) {
        sheetColumns.splice(4, 0, { header: "Precio Publico", key: "price1", width: 16 });
      }

      if (exportPriceConvenio) {
        const indexAfterPublic = exportPricePublico ? 5 : 4;
        sheetColumns.splice(indexAfterPublic, 0, { header: "Precio Convenio", key: "price2", width: 16 });
      }

      sheet.columns = sheetColumns;

      rows.forEach((item) => {
        const row = {
          id: item.id,
          name: item.name,
          sample: item.sample || "",
          method: item.method || "",
          time: item.time || "",
          active: Number(item.active) === 1 ? "SI" : "NO",
        };

        if (exportPricePublico) {
          row.price1 = Number(item.price1 || 0);
        }

        if (exportPriceConvenio) {
          row.price2 = Number(item.price2 || 0);
        }

        sheet.addRow(row);
      });

      sheet.getRow(1).font = { bold: true };
      if (exportPricePublico) {
        sheet.getColumn("price1").numFmt = "#,##0.00";
      }
      if (exportPriceConvenio) {
        sheet.getColumn("price2").numFmt = "#,##0.00";
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([
        buffer,
      ], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      downloadBlob(blob, `${buildExportFileName("examenes")}.xlsx`);
      setMessage("Exportacion Excel generada.");
    } catch (error) {
      setMessage(`No se pudo exportar Excel: ${error.message}`);
    }
  };

  if (!canUseApi) {
    return (
      <div className="max-w-6xl mx-auto p-6 bg-white rounded-xl shadow-2xl border border-[#b2e4e5]">
        <h2 className="text-2xl font-extrabold text-[#01878A] mb-3">Admin de examenes</h2>
        <p className="text-gray-700 mb-4">
          Configura VITE_API_BASE_URL (desarrollo) o VITE_API_BASE_URL_PROD (produccion) para gestionar examenes desde la API.
        </p>
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={onBackHome}>
          Volver al panel admin
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6 bg-white rounded-xl shadow-2xl border border-[#b2e4e5]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#01878A]">Admin de examenes</h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold" onClick={onBackHome}>
          Volver al panel admin
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-3">
        <input
          className="border rounded px-3 py-2 text-sm sm:col-span-2"
          placeholder="Buscar por nombre, muestra o metodo"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm border rounded px-3 py-2">
          <input type="checkbox" checked={includeInactive} onChange={(e) => setIncludeInactive(e.target.checked)} />
          Incluir inactivos
        </label>
        <button
          className="px-3 py-2 rounded bg-[#01878A] text-white font-semibold hover:bg-[#016b6d]"
          onClick={() => loadData(page)}
          disabled={loading}
        >
          {loading ? "Cargando..." : "Refrescar"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <label className="flex items-center gap-2 px-3 py-2 rounded border text-sm bg-white">
          <input
            type="checkbox"
            checked={exportPricePublico}
            onChange={(e) => setExportPricePublico(e.target.checked)}
          />
          Precio publico
        </label>
        <label className="flex items-center gap-2 px-3 py-2 rounded border text-sm bg-white">
          <input
            type="checkbox"
            checked={exportPriceConvenio}
            onChange={(e) => setExportPriceConvenio(e.target.checked)}
          />
          Precio convenio
        </label>
        <button
          className="px-3 py-2 rounded bg-[#14532d] text-white font-semibold hover:bg-[#166534]"
          onClick={exportPdf}
          disabled={loading || items.length === 0}
        >
          Exportar PDF
        </button>
        <button
          className="px-3 py-2 rounded bg-[#0f766e] text-white font-semibold hover:bg-[#115e59]"
          onClick={exportExcel}
          disabled={loading || items.length === 0}
        >
          Exportar Excel
        </button>
      </div>

      {message && <div className="mb-3 text-sm font-semibold text-[#016b6d]">{message}</div>}

      <div className="overflow-x-auto border rounded-lg mb-4">
        <table className="min-w-[980px] w-full text-sm">
          <thead className="bg-[#eaf6f6]">
            <tr>
              <th className="border px-2 py-2 text-left">ID</th>
              <th className="border px-2 py-2 text-left">Nombre</th>
              <th className="border px-2 py-2 text-left">Muestra</th>
              <th className="border px-2 py-2 text-left">Publico</th>
              <th className="border px-2 py-2 text-left">Convenio</th>
              <th className="border px-2 py-2 text-left">Activo</th>
              <th className="border px-2 py-2 text-left">Accion</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td className="border px-2 py-1">{item.id}</td>
                <td className="border px-2 py-1">{item.name}</td>
                <td className="border px-2 py-1">{item.sample || "-"}</td>
                <td className="border px-2 py-1">S/ {formatMoney(item.price1)}</td>
                <td className="border px-2 py-1">S/ {formatMoney(item.price2)}</td>
                <td className="border px-2 py-1">{Number(item.active) === 1 ? "SI" : "NO"}</td>
                <td className="border px-2 py-1">
                  <button className="px-2 py-1 rounded bg-blue-500 text-white hover:bg-blue-600" onClick={() => selectForEdit(item)}>
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <button
          className="px-3 py-1 rounded border border-[#01878A] text-[#01878A] font-semibold disabled:opacity-50"
          disabled={page <= 1}
          onClick={() => loadData(page - 1)}
        >
          Anterior
        </button>
        <span className="text-sm font-semibold text-[#016b6d]">
          Pagina {pagination.page || page} de {pagination.totalPages || 1} ({pagination.totalItems || 0} registros)
        </span>
        <button
          className="px-3 py-1 rounded border border-[#01878A] text-[#01878A] font-semibold disabled:opacity-50"
          disabled={(pagination.page || page) >= (pagination.totalPages || 1)}
          onClick={() => loadData(page + 1)}
        >
          Siguiente
        </button>
      </div>

      <div className="border rounded-lg p-3 sm:p-4 mb-5">
        <h3 className="text-base sm:text-lg font-bold text-[#01878A] mb-3">Formulario de examen</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          <input className="border rounded px-3 py-2 text-sm bg-gray-100" placeholder="ID (solo lectura)" value={form.id} readOnly />
          <input className="border rounded px-3 py-2 text-sm" placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="border rounded px-3 py-2 text-sm" placeholder="Muestra" value={form.sample} onChange={(e) => setForm({ ...form, sample: e.target.value })} />
          <input className="border rounded px-3 py-2 text-sm" placeholder="Metodo" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} />
          <input className="border rounded px-3 py-2 text-sm" type="number" step="0.01" placeholder="Precio publico" value={form.price1} onChange={(e) => setForm({ ...form, price1: e.target.value })} />
          <input className="border rounded px-3 py-2 text-sm" type="number" step="0.01" placeholder="Precio convenio" value={form.price2} onChange={(e) => setForm({ ...form, price2: e.target.value })} />
          <input className="border rounded px-3 py-2 text-sm" placeholder="Tubo" value={form.tube} onChange={(e) => setForm({ ...form, tube: e.target.value })} />
          <input className="border rounded px-3 py-2 text-sm" placeholder="Tiempo" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
          <input className="border rounded px-3 py-2 text-sm" type="number" min="1" placeholder="Cantidad" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          <select className="border rounded px-3 py-2 text-sm" value={form.active} onChange={(e) => setForm({ ...form, active: e.target.value })}>
            <option value="1">Activo</option>
            <option value="0">Inactivo</option>
          </select>
          <input className="border rounded px-3 py-2 text-sm sm:col-span-2" placeholder="Info" value={form.info} onChange={(e) => setForm({ ...form, info: e.target.value })} />
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          <button className="px-3 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700" onClick={() => runAction(createExam)}>
            Crear
          </button>
          <button className="px-3 py-2 rounded bg-amber-500 text-white font-semibold hover:bg-amber-600" onClick={() => runAction(updateExam)} disabled={!form.id}>
            Actualizar
          </button>
          <button className="px-3 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700" onClick={() => runAction(deleteExam)} disabled={!form.id}>
            Eliminar
          </button>
          <button className="px-3 py-2 rounded bg-gray-500 text-white font-semibold hover:bg-gray-600" onClick={resetForm}>
            Limpiar
          </button>
        </div>
      </div>

      <div className="border rounded-lg p-3 sm:p-4">
        <h3 className="text-base sm:text-lg font-bold text-[#01878A] mb-3">Importacion masiva</h3>
        <label className="flex items-center gap-2 text-sm mb-2">
          <input type="checkbox" checked={truncateImport} onChange={(e) => setTruncateImport(e.target.checked)} />
          Vaciar tabla antes de importar
        </label>
        <textarea
          className="w-full min-h-[180px] border rounded px-3 py-2 text-sm font-mono"
          placeholder='Pega JSON: [{"id":1,"name":"...","price1":10,"price2":8}] o {"items":[...]}'
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
        />
        <div className="mt-3">
          <button className="px-3 py-2 rounded bg-[#01878A] text-white font-semibold hover:bg-[#016b6d]" onClick={() => runAction(importExams)}>
            Importar
          </button>
        </div>
      </div>
    </div>
  );
}

ExamsAdmin.propTypes = {
  onBackHome: PropTypes.func.isRequired,
};

export default ExamsAdmin;
