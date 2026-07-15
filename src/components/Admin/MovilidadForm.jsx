import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";

const MOVILIDAD_STORAGE_KEY = "inbioslab_movilidad_form";

function createEmptyRow(defaultDate) {
  return {
    id: `row-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    fecha: defaultDate,
    destino: "",
    motivo: "",
    importe: "",
  };
}

function sumImportes(rows) {
  return rows.reduce((acc, row) => {
    const amount = Number(row?.importe);
    return Number.isFinite(amount) ? acc + amount : acc;
  }, 0);
}

const EMPRESAS = [
  { razonSocial: "UNITED TRADING", ruc: "20153361968" },
  { razonSocial: "COMERCIAL IMPORTADORA SUDAMERICANA S.A.C", ruc: "20137015987" },
];

function MovilidadForm({ onBackHome }) {
  const today = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const [header, setHeader] = useState(() => {
    const fallbackHeader = {
      razonSocial: "",
      ruc: "",
      trabajador: "",
      dni: "",
      area: "",
      cargo: "",
      fechaEmision: today,
    };

    try {
      const saved = localStorage.getItem(MOVILIDAD_STORAGE_KEY);
      if (!saved) {
        return fallbackHeader;
      }
      const parsed = JSON.parse(saved);
      return {
        ...fallbackHeader,
        ...parsed?.header,
      };
    } catch {
      return fallbackHeader;
    }
  });

  const [rows, setRows] = useState(() => {
    try {
      const saved = localStorage.getItem(MOVILIDAD_STORAGE_KEY);
      if (!saved) {
        return [createEmptyRow(today)];
      }
      const parsed = JSON.parse(saved);
      const savedRows = Array.isArray(parsed?.rows) ? parsed.rows : [];
      if (savedRows.length === 0) {
        return [createEmptyRow(today)];
      }

      return savedRows.map((row) => ({
        id: row.id || `row-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        fecha: row.fecha || today,
        destino: row.destino || "",
        motivo: row.motivo || "",
        importe: row.importe || "",
      }));
    } catch {
      return [createEmptyRow(today)];
    }
  });

  useEffect(() => {
    localStorage.setItem(MOVILIDAD_STORAGE_KEY, JSON.stringify({ header, rows }));
  }, [header, rows]);

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      createEmptyRow(today),
    ]);
  };

  const updateRow = (id, field, value) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const removeRow = (id) => {
    setRows((prev) => prev.filter((row) => row.id !== id));
  };

  const validateRows = () => {
    const rowsWithData = rows.filter((row) => row.fecha || row.destino || row.motivo || row.importe);
    if (rowsWithData.length === 0) {
      alert("Agrega al menos una fila con datos para generar la planilla.");
      return false;
    }
    return true;
  };

  const totalImporte = useMemo(() => sumImportes(rows), [rows]);

  const handleGeneratePdf = async () => {
    if (!validateRows()) {
      return;
    }
    const { generateMovilidadPdf } = await import("../../utils/movilidadPdfExport");
    await generateMovilidadPdf(header, rows, `${import.meta.env.BASE_URL}firma.png`);
  };

  const handleGenerateWord = async () => {
    if (!validateRows()) {
      return;
    }
    const { generateMovilidadWord } = await import("../../utils/movilidadWordExport");
    await generateMovilidadWord(header, rows, `${import.meta.env.BASE_URL}firma.png`);
  };

  const handleGenerateExcel = async () => {
    if (!validateRows()) {
      return;
    }
    const { generateMovilidadExcel } = await import("../../utils/movilidadExcelExport");
    await generateMovilidadExcel(header, rows, `${import.meta.env.BASE_URL}firma.png`);
  };

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6 bg-white rounded-xl shadow-2xl border border-[#b2e4e5]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#01878A]">Planilla de Movilidad</h2>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
          onClick={onBackHome}
        >
          Volver al panel admin
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 mb-4">
        <select
          className="border rounded px-3 py-2 text-sm"
          value={header.razonSocial}
          onChange={(e) => {
            const selected = EMPRESAS.find((empresa) => empresa.razonSocial === e.target.value);
            setHeader({
              ...header,
              razonSocial: selected ? selected.razonSocial : "",
              ruc: selected ? selected.ruc : "",
            });
          }}
        >
          <option value="">Selecciona razon social</option>
          {EMPRESAS.map((empresa) => (
            <option key={empresa.ruc} value={empresa.razonSocial}>{empresa.razonSocial}</option>
          ))}
        </select>
        <input className="border rounded px-3 py-2 text-sm bg-gray-100" placeholder="RUC" value={header.ruc} readOnly />
        <input className="border rounded px-3 py-2 text-sm" placeholder="Trabajador" value={header.trabajador} onChange={(e) => setHeader({ ...header, trabajador: e.target.value.toUpperCase() })} />
        <input className="border rounded px-3 py-2 text-sm" placeholder="DNI" value={header.dni} onChange={(e) => setHeader({ ...header, dni: e.target.value })} />
        <input className="border rounded px-3 py-2 text-sm" placeholder="Area" value={header.area} onChange={(e) => setHeader({ ...header, area: e.target.value.toUpperCase() })} />
        <input className="border rounded px-3 py-2 text-sm" placeholder="Cargo" value={header.cargo} onChange={(e) => setHeader({ ...header, cargo: e.target.value.toUpperCase() })} />
      </div>

      <div className="mb-4">
        <label className="text-sm font-semibold text-gray-700">Fecha de emision</label>
        <input className="border rounded px-3 py-2 text-sm w-full sm:w-auto sm:ml-2" type="date" value={header.fechaEmision} onChange={(e) => setHeader({ ...header, fechaEmision: e.target.value })} />
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-[780px] w-full text-sm">
          <thead className="bg-[#eaf6f6]">
            <tr>
              <th className="border px-2 py-2 text-left">Fecha</th>
              <th className="border px-2 py-2 text-left">Destino</th>
              <th className="border px-2 py-2 text-left">Motivo del desplazamiento</th>
              <th className="border px-2 py-2 text-left">Importe</th>
              <th className="border px-2 py-2 text-left">Accion</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="border px-2 py-1">
                  <input type="date" className="border rounded px-2 py-1 w-full" value={row.fecha} onChange={(e) => updateRow(row.id, "fecha", e.target.value)} />
                </td>
                <td className="border px-2 py-1">
                  <input type="text" className="border rounded px-2 py-1 w-full" value={row.destino} onChange={(e) => updateRow(row.id, "destino", e.target.value.toUpperCase())} />
                </td>
                <td className="border px-2 py-1">
                  <input type="text" className="border rounded px-2 py-1 w-full" value={row.motivo} onChange={(e) => updateRow(row.id, "motivo", e.target.value.toUpperCase())} />
                </td>
                <td className="border px-2 py-1">
                  <input type="number" min={0} step="0.01" className="border rounded px-2 py-1 w-full" value={row.importe} onChange={(e) => updateRow(row.id, "importe", e.target.value)} />
                </td>
                <td className="border px-2 py-1">
                  <button className="w-full px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600" onClick={() => removeRow(row.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-[#f6fcfc]">
              <td className="border px-2 py-2 text-right font-bold text-[#016b6d]" colSpan={3}>TOTAL</td>
              <td className="border px-2 py-2 font-bold text-[#016b6d]">
                S/ {totalImporte.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="border px-2 py-2" />
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mt-4">
        <button className="px-4 py-2 bg-[#01878A] text-white rounded hover:bg-[#016b6d] font-semibold" onClick={addRow}>Agregar fila</button>
        <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold" onClick={handleGeneratePdf}>Generar PDF</button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold" onClick={handleGenerateWord}>Generar Word</button>
        <button className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 font-semibold" onClick={handleGenerateExcel}>Generar Excel</button>
      </div>
    </div>
  );
}

MovilidadForm.propTypes = {
  onBackHome: PropTypes.func.isRequired,
};

export default MovilidadForm;
