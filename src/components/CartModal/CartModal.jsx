import PropTypes from "prop-types";
import { useState } from "react";

function CartModal({ cart, tipoCotizacion, whatsappQuoteNumber, onAddCustomItem, onChangeItemName, onRemoveItem, onClose, onClearAll, onExportPDF }) {
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customNombre, setCustomNombre] = useState("");
  const [customPrecio, setCustomPrecio] = useState("");
  const [showDownloadPrompt, setShowDownloadPrompt] = useState(false);
  const [downloadData, setDownloadData] = useState({
    nombre: "",
    edad: "",
    dni: "",
  });
  const [downloadError, setDownloadError] = useState("");

  const subtotalBase = cart.reduce((acc, item) => {
    const precioBase = tipoCotizacion === "convenio" ? item.price2 : item.price1;
    return acc + Number(precioBase || 0) * Number(item.qty || 0);
  }, 0);
  const totalFinal = subtotalBase;

  // Función para abrir WhatsApp Web con el número y mensaje
  const handleSendWhatsApp = () => {
    const targetRaw = String(whatsappQuoteNumber || "").replace(/\D/g, "").trim();
    if (!targetRaw) {
      alert("No hay numero de WhatsApp configurado en el panel admin.");
      return;
    }

    const target = targetRaw.startsWith("51") ? targetRaw : `51${targetRaw}`;
    const servicios = cart.map((item) => `- ${String(item.name || "").toUpperCase()} (S/ ${Number(tipoCotizacion === "convenio" ? item.price2 : item.price1).toFixed(2)})`).join("\n");
    const mensaje = encodeURIComponent(
      `Hola, comparto mi cotización de INBIOSLAB:\n\n${servicios}\n\nTotal: S/ ${totalFinal.toFixed(2)}`
    );
    window.open(`https://wa.me/${target}?text=${mensaje}`, "_blank");
  };

  const handleAddCustomSubmit = () => {
    const nombre = customNombre.trim();
    const precio = Number(customPrecio);
    if (!nombre) {
      alert("Ingresa el nombre de la prueba.");
      return;
    }
    if (Number.isNaN(precio) || precio < 0) {
      alert("Ingresa un precio valido.");
      return;
    }
    onAddCustomItem({ name: nombre, price: precio });
    setCustomNombre("");
    setCustomPrecio("");
    setShowCustomForm(false);
  };

  const openDownloadPrompt = () => {
    if (cart.length === 0) {
      alert("Agrega al menos un servicio para descargar la cotizacion.");
      return;
    }

    if (cart.some((item) => !item.name || !String(item.name).trim())) {
      alert("Completa el nombre de todos los servicios antes de descargar.");
      return;
    }

    setDownloadError("");
    setShowDownloadPrompt(true);
  };

  const confirmDownload = async () => {
    const nombre = String(downloadData.nombre || "").trim();
    const edad = String(downloadData.edad || "").trim();
    const dni = String(downloadData.dni || "").trim();

    if (!nombre) {
      setDownloadError("Ingresa el nombre del paciente.");
      return;
    }

    if (!edad || Number.isNaN(Number(edad)) || Number(edad) <= 0) {
      setDownloadError("Ingresa una edad valida.");
      return;
    }

    if (!dni) {
      setDownloadError("Ingresa el DNI.");
      return;
    }

    setDownloadError("");
    await onExportPDF({ nombre, edad, dni });
    setShowDownloadPrompt(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[80] px-2 sm:px-4 py-2">
      <div className="bg-white rounded-3xl border border-[#d9dee8] shadow-2xl p-2.5 sm:p-3 w-full max-w-md lg:max-w-2xl flex flex-col max-h-[96dvh] sm:max-h-[92vh] overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl sm:text-2xl leading-tight font-extrabold text-[#111827]">Servicios seleccionados</h2>
          <button
            type="button"
            className="w-8 h-8 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 text-2xl leading-none flex items-center justify-center"
            onClick={onClose}
            aria-label="Cerrar carrito"
          >
            ×
          </button>
        </div>
        <div className="border-t border-[#e5e7eb] mb-2" />
        <div className="mb-1" />
        {tipoCotizacion === "convenio" && (
          <div className="mb-3">
            <button
              className="px-3 py-2 bg-[#01878A] text-white rounded hover:bg-[#016b6d] font-semibold text-sm"
              onClick={() => setShowCustomForm(prev => !prev)}
            >Nuevo</button>
            {showCustomForm && (
              <div className="mt-2 p-2 border border-[#b2e4e5] rounded bg-[#f6fcfc] grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  className="border rounded px-2 py-2 text-sm sm:col-span-2"
                  placeholder="Nombre de la prueba"
                  value={customNombre}
                  onChange={e => setCustomNombre(e.target.value.toUpperCase())}
                />
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className="border rounded px-2 py-2 text-sm"
                  placeholder="Precio"
                  value={customPrecio}
                  onChange={e => setCustomPrecio(e.target.value)}
                />
                <button
                  className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold text-sm"
                  onClick={handleAddCustomSubmit}
                >Agregar</button>
              </div>
            )}
          </div>
        )}
        <div className="mb-2">
          {cart.length === 0 ? (
            <div className="border border-dashed border-[#d8dee9] rounded-2xl bg-[#fbfcff] text-gray-500 text-center flex items-center justify-center px-4 py-10">
              No hay productos en el carrito.
            </div>
          ) : (
            <div className="overflow-y-auto border border-dashed border-[#d8dee9] rounded-2xl p-2 bg-[#fbfcff] max-h-[46dvh] sm:max-h-[52vh]">
              <div className="text-sm sm:text-base font-bold text-[#667085] px-1 mb-1.5">Laboratorio y Domicilio</div>
              <div className="space-y-1.5">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-2 bg-white rounded-xl p-2 border border-[#e5e7eb]">
                    <div className="flex flex-col min-w-0 pr-2 gap-0.5">
                      <div className="flex items-center gap-2 min-w-0">
                        {item.image && (
                          <img src={item.image} alt={item.name} className="w-7 h-7 object-cover rounded" />
                        )}
                        {item.type === "custom" ? (
                          <input
                            type="text"
                            className="border rounded px-2 py-1 text-xs sm:text-sm font-semibold text-blue-700 w-full"
                            placeholder="Nombre de la prueba"
                            value={item.name}
                            onChange={e => onChangeItemName(item.id, e.target.value.toUpperCase())}
                          />
                        ) : (
                          <span className="text-sm sm:text-base leading-tight font-bold text-[#243b63] break-words">{item.name.toUpperCase()}</span>
                        )}
                      </div>
                      <span className="text-[11px] sm:text-xs text-[#98a2b3]">Precio</span>
                      <span className="text-base sm:text-lg font-bold text-[#101828] leading-tight">S/ {(tipoCotizacion === "convenio" ? Number(item.price2 || 0) : Number(item.price1 || 0)).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center shrink-0">
                      <button
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-[#667085] hover:bg-[#f2f4f7] flex items-center justify-center"
                        onClick={() => onRemoveItem(item.id)}
                        aria-label={`Eliminar ${item.name}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                          <path d="M3 6h18" />
                          <path d="M8 6V4h8v2" />
                          <path d="M19 6l-1 14H6L5 6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="border-t border-[#e5e7eb] pt-2 mt-1">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-xs sm:text-sm text-[#667085]">{cart.length} servicios</div>
              <div className="text-2xl sm:text-3xl leading-none font-bold text-[#101828]">S/ {totalFinal.toFixed(2)}</div>
            </div>
            <button
              className="text-xs sm:text-sm font-semibold text-[#1570ef] hover:text-[#175cd3]"
              onClick={openDownloadPrompt}
            >
              Descargar cotizacion
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-2">
            <button
              className="w-full sm:w-auto px-3 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E] font-semibold flex items-center justify-center gap-2 text-xs sm:text-sm"
            onClick={handleSendWhatsApp}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="20" height="20" fill="currentColor"><path d="M16 3C9.373 3 4 8.373 4 15c0 2.385.832 4.58 2.236 6.364L4 29l7.818-2.236A11.96 11.96 0 0 0 16 27c6.627 0 12-5.373 12-12S22.627 3 16 3zm0 22c-1.97 0-3.85-.57-5.438-1.553l-.387-.236-4.646 1.33 1.324-4.527-.252-.393A9.96 9.96 0 0 1 6 15c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10zm5.13-7.47c-.28-.14-1.65-.81-1.9-.9-.25-.09-.43-.14-.61.14-.18.28-.7.9-.86 1.08-.16.18-.32.2-.6.07-.28-.14-1.18-.44-2.25-1.4-.83-.74-1.39-1.65-1.55-1.93-.16-.28-.02-.43.12-.57.13-.13.28-.34.42-.51.14-.17.18-.29.28-.48.09-.19.05-.36-.02-.5-.07-.14-.61-1.47-.84-2.01-.22-.53-.45-.46-.61-.47-.16-.01-.36-.01-.56-.01-.19 0-.5.07-.76.36-.26.28-1 1-.97 2.43.03 1.43 1.04 2.81 1.19 3 .15.19 2.05 3.14 5.01 4.28.7.3 1.25.48 1.68.61.71.23 1.36.2 1.87.12.57-.09 1.65-.67 1.88-1.32.23-.65.23-1.21.16-1.32-.07-.11-.25-.18-.53-.32z"/></svg>
              Enviar por WhatsApp
            </button>
            <button
              className="w-full sm:w-auto px-3 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 font-semibold text-xs sm:text-sm"
              onClick={onClearAll}
            >
              Limpiar todo
            </button>
          </div>
        </div>

        {showDownloadPrompt && (
          <div className="absolute inset-0 bg-black/40 rounded-3xl flex items-center justify-center p-4 z-10">
            <div className="w-full max-w-md bg-white rounded-2xl border border-[#d9dee8] shadow-xl p-4">
              <h3 className="text-lg font-bold text-[#111827]">Descargar cotizacion</h3>
              <p className="text-sm text-[#667085] mt-1">Antes de generar el PDF, completa estos datos.</p>
              <div className="mt-3 space-y-2">
                <input
                  type="text"
                  className="w-full border border-[#d0d5dd] rounded-lg px-3 py-2 text-sm"
                  placeholder="Nombre del paciente"
                  value={downloadData.nombre}
                  onChange={(e) => setDownloadData((prev) => ({ ...prev, nombre: e.target.value.toUpperCase() }))}
                />
                <input
                  type="number"
                  min={1}
                  className="w-full border border-[#d0d5dd] rounded-lg px-3 py-2 text-sm"
                  placeholder="Edad"
                  value={downloadData.edad}
                  onChange={(e) => setDownloadData((prev) => ({ ...prev, edad: e.target.value }))}
                />
                <input
                  type="text"
                  className="w-full border border-[#d0d5dd] rounded-lg px-3 py-2 text-sm"
                  placeholder="DNI"
                  value={downloadData.dni}
                  onChange={(e) => setDownloadData((prev) => ({ ...prev, dni: e.target.value }))}
                />
              </div>
              {downloadError && (
                <div className="mt-2 text-sm text-red-600 font-medium">{downloadError}</div>
              )}
              <div className="mt-4 flex gap-2 justify-end">
                <button
                  type="button"
                  className="px-3 py-2 rounded-lg border border-[#d0d5dd] text-[#344054] hover:bg-[#f9fafb] text-sm font-semibold"
                  onClick={() => {
                    setShowDownloadPrompt(false);
                    setDownloadError("");
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="px-3 py-2 rounded-lg bg-[#1570ef] text-white hover:bg-[#175cd3] text-sm font-semibold"
                  onClick={confirmDownload}
                >
                  Descargar PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

CartModal.propTypes = {
  cart: PropTypes.array.isRequired,
  tipoCotizacion: PropTypes.string.isRequired,
  whatsappQuoteNumber: PropTypes.string,
  onAddCustomItem: PropTypes.func.isRequired,
  onChangeItemName: PropTypes.func.isRequired,
  onRemoveItem: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onClearAll: PropTypes.func.isRequired,
  onExportPDF: PropTypes.func.isRequired,
};

export default CartModal;
