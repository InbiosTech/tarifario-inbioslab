import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";

const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || "").trim();

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "").trim();
}

function SettingsAdmin({ onBackHome }) {
  const apiBaseUrl = API_BASE_URL;
  const canUseApi = useMemo(() => Boolean(apiBaseUrl), [apiBaseUrl]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [whatsappQuoteNumber, setWhatsappQuoteNumber] = useState("");

  const loadSettings = async () => {
    if (!canUseApi) return;

    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${apiBaseUrl}/settings/admin`, {
        credentials: "include",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error || `Error ${res.status}`);
      }

      setWhatsappQuoteNumber(String(body?.whatsappQuoteNumber || ""));
    } catch (error) {
      setMessage(error.message || "No se pudo cargar configuracion.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUseApi]);

  const onSave = async (event) => {
    event.preventDefault();
    if (!canUseApi) return;

    const normalized = normalizePhone(whatsappQuoteNumber);
    if (!normalized) {
      setMessage("Ingresa un numero de WhatsApp valido.");
      return;
    }

    if (normalized.length < 9 || normalized.length > 15) {
      setMessage("El numero debe tener entre 9 y 15 digitos.");
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`${apiBaseUrl}/settings/admin/whatsapp-number`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          whatsappQuoteNumber: normalized,
        }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error || `Error ${res.status}`);
      }

      setWhatsappQuoteNumber(String(body?.whatsappQuoteNumber || normalized));
      setMessage("Numero de WhatsApp actualizado correctamente.");
      window.dispatchEvent(new Event("inbioslab:settings-updated"));
    } catch (error) {
      setMessage(error.message || "No se pudo guardar configuracion.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-6 bg-white rounded-xl shadow-2xl border border-[#b2e4e5]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#01878A]">Configuracion</h2>
        <button
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 font-semibold"
          onClick={onBackHome}
          type="button"
        >
          Volver al panel
        </button>
      </div>

      {!canUseApi && (
        <div className="mb-4 p-3 rounded border border-red-300 bg-red-50 text-red-700 text-sm font-medium">
          Configura VITE_API_BASE_URL para editar configuraciones.
        </div>
      )}

      <form onSubmit={onSave} className="grid grid-cols-1 gap-3 p-3 rounded-lg border border-[#b2e4e5] bg-[#f8ffff]">
        <label className="text-sm font-semibold text-[#016b6d]">Numero destino para "Enviar por WhatsApp"</label>
        <input
          className="border border-gray-300 rounded px-3 py-2"
          placeholder="Ejemplo: 51945241682"
          value={whatsappQuoteNumber}
          onChange={(event) => setWhatsappQuoteNumber(event.target.value)}
          disabled={loading || saving}
        />
        <p className="text-xs text-gray-500">Usa formato internacional recomendado: 51 + numero.</p>
        <div>
          <button
            type="submit"
            className="px-4 py-2 rounded bg-[#01878A] text-white font-semibold hover:bg-[#016b6d] disabled:opacity-60"
            disabled={!canUseApi || loading || saving}
          >
            {saving ? "Guardando..." : "Guardar numero"}
          </button>
        </div>
      </form>

      {message && (
        <div className="mt-3 p-2 rounded border border-[#b2e4e5] bg-[#f1fbfb] text-[#016b6d] text-sm font-medium">
          {message}
        </div>
      )}
    </div>
  );
}

SettingsAdmin.propTypes = {
  onBackHome: PropTypes.func.isRequired,
};

export default SettingsAdmin;
