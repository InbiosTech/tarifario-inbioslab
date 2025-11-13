import PropTypes from "prop-types";
import { useRef, useEffect } from "react";

function CartModal({ cart, paciente, tipoCotizacion, cuponInput, cuponDescuento, onChangePaciente, onChangeQty, onRemoveItem, onChangePrice, onApplyCupon, onClose, onClearAll, onExportPDF }) {
  const nombreInputRef = useRef(null);
  useEffect(() => {
    if (nombreInputRef.current) {
      nombreInputRef.current.focus();
    }
  }, []);

  // Función para abrir WhatsApp Web con el número y mensaje
  const handleSendWhatsApp = () => {
    if (!paciente.celular) {
      alert("Por favor ingresa el número de celular del paciente.");
      return;
    }
    // Formato internacional: +51 para Perú, quitar ceros y espacios
    let numero = paciente.celular.replace(/\D/g, "");
    if (!numero.startsWith("51")) {
      numero = "51" + numero;
    }
    const mensaje = encodeURIComponent(
      `Estimado/a ${paciente.nombre.toUpperCase()},\n\nAdjuntamos la cotización de tus pruebas solicitadas en INBIOSLAB.\n\nPor favor revisa el archivo PDF descargado y si tienes alguna consulta, no dudes en contactarnos.\n\nGracias por confiar en nuestro laboratorio clínico.\n\nSaludos,\nINBIOSLAB`
    );
    window.open(`https://wa.me/${numero}?text=${mensaje}`, "_blank");
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md flex flex-col mt-16">
        <h2 className="text-xl font-bold text-[#01878A] mb-4 flex items-center gap-2">
          Carrito de pruebas
        </h2>
        <div className="mb-4 grid grid-cols-1 gap-2">
          <input
            type="text"
            className="border rounded px-3 py-2 w-full text-sm"
            placeholder="Nombre del paciente"
            value={paciente.nombre.toUpperCase()}
            onChange={e => onChangePaciente({ ...paciente, nombre: e.target.value.toUpperCase() })}
            ref={nombreInputRef}
          />
          <div className="flex gap-2">
            <input
              type="number"
              className="border rounded px-3 py-2 w-1/2 text-sm"
              placeholder="Edad"
              value={paciente.edad}
              onChange={e => onChangePaciente({ ...paciente, edad: e.target.value })}
            />
            <select
              className="border rounded px-3 py-2 w-1/2 text-sm"
              value={paciente.sexo}
              onChange={e => onChangePaciente({ ...paciente, sexo: e.target.value })}
            >
              <option value="">Sexo</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
          </div>
          <input
            type="tel"
            className="border rounded px-3 py-2 w-full text-sm"
            placeholder="Celular"
            value={paciente.celular || ""}
            onChange={e => onChangePaciente({ ...paciente, celular: e.target.value })}
          />
          <input
            type="text"
            className="border rounded px-3 py-2 w-full text-sm"
            placeholder="Código/DNI"
            value={paciente.codigo}
            onChange={e => onChangePaciente({ ...paciente, codigo: e.target.value })}
          />
          {tipoCotizacion === "convenio" && (
            <input
              type="text"
              className="border rounded px-3 py-2 w-full text-sm"
              placeholder="Empresa"
              value={paciente.empresa}
              onChange={e => onChangePaciente({ ...paciente, empresa: e.target.value })}
            />
          )}
        </div>
        {/* Selector de cupón solo para público */}
        {tipoCotizacion === "publico" && (
          <div className="flex gap-2 items-center mb-4">
            <input
              type="password"
              className="border rounded px-3 py-2 text-sm"
              placeholder="Ingresa tu cupón"
              value={cuponInput}
              onChange={e => onApplyCupon(e.target.value)}
            />
            <button
              className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
              onClick={onApplyCupon}
            >Aplicar cupón</button>
            {cuponDescuento > 0 && (
              <span className="text-green-700 font-bold">Descuento aplicado: {cuponDescuento * 100}%</span>
            )}
          </div>
        )}
        {cart.length === 0 ? (
          <div className="text-gray-500 text-center py-8">No hay productos en el carrito.</div>
        ) : (
          <div className="space-y-2 mb-4 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-white rounded p-2 shadow">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    {item.image && (
                      <img src={item.image} alt={item.name} className="w-8 h-8 object-cover rounded" />
                    )}
                    <span className="font-semibold text-blue-700">{item.name.toUpperCase()}</span>
                  </div>
                  <span className="text-xs text-gray-500">ID: {item.id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={item.qty}
                    className="w-14 px-2 py-1 border rounded text-center"
                    onChange={e => onChangeQty(item.id, Number(e.target.value))}
                  />
                  <input
                    type="number"
                    min={0}
                    value={tipoCotizacion === "convenio" ? item.price2 : item.price1}
                    className="w-20 px-2 py-1 border rounded text-center font-bold text-green-700"
                    onChange={e => onChangePrice(item.id, Number(e.target.value), tipoCotizacion)}
                  />
                  <span className="text-xs text-gray-500">S/</span>
                  <button
                    className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs font-semibold"
                    onClick={() => onRemoveItem(item.id)}
                  >Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        )}
        {/* Total del carrito */}
        <div className="w-full flex justify-end items-center mb-2">
          <span className="font-bold text-lg text-[#01878A] bg-[#eaf6f6] px-4 py-2 rounded shadow">
            Total: S/ {
              cart.reduce((acc, item) => {
                const precioBase = tipoCotizacion === "convenio" ? item.price2 : item.price1;
                const precioFinal = tipoCotizacion === "publico" ? precioBase * (1 - cuponDescuento) : precioBase;
                return acc + precioFinal * item.qty;
              }, 0).toFixed(2)
            }
          </span>
        </div>
        <div className="flex gap-2 mt-2">
          <button
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold"
            onClick={onExportPDF}
          >Exportar PDF</button>
          <button
            className="px-4 py-2 bg-[#25D366] text-white rounded hover:bg-[#128C7E] font-semibold flex items-center gap-2"
            onClick={handleSendWhatsApp}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="20" height="20" fill="currentColor"><path d="M16 3C9.373 3 4 8.373 4 15c0 2.385.832 4.58 2.236 6.364L4 29l7.818-2.236A11.96 11.96 0 0 0 16 27c6.627 0 12-5.373 12-12S22.627 3 16 3zm0 22c-1.97 0-3.85-.57-5.438-1.553l-.387-.236-4.646 1.33 1.324-4.527-.252-.393A9.96 9.96 0 0 1 6 15c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10zm5.13-7.47c-.28-.14-1.65-.81-1.9-.9-.25-.09-.43-.14-.61.14-.18.28-.7.9-.86 1.08-.16.18-.32.2-.6.07-.28-.14-1.18-.44-2.25-1.4-.83-.74-1.39-1.65-1.55-1.93-.16-.28-.02-.43.12-.57.13-.13.28-.34.42-.51.14-.17.18-.29.28-.48.09-.19.05-.36-.02-.5-.07-.14-.61-1.47-.84-2.01-.22-.53-.45-.46-.61-.47-.16-.01-.36-.01-.56-.01-.19 0-.5.07-.76.36-.26.28-1 1-.97 2.43.03 1.43 1.04 2.81 1.19 3 .15.19 2.05 3.14 5.01 4.28.7.3 1.25.48 1.68.61.71.23 1.36.2 1.87.12.57-.09 1.65-.67 1.88-1.32.23-.65.23-1.21.16-1.32-.07-.11-.25-.18-.53-.32z"/></svg>
            Enviar por WhatsApp
          </button>
          <button
            className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 font-semibold"
            onClick={onClearAll}
          >Limpiar todo</button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
            onClick={onClose}
          >Cerrar</button>
        </div>
      </div>
    </div>
  );
}

CartModal.propTypes = {
  cart: PropTypes.array.isRequired,
  paciente: PropTypes.object.isRequired,
  tipoCotizacion: PropTypes.string.isRequired,
  cuponInput: PropTypes.string.isRequired,
  cuponDescuento: PropTypes.number.isRequired,
  onChangePaciente: PropTypes.func.isRequired,
  onChangeQty: PropTypes.func.isRequired,
  onRemoveItem: PropTypes.func.isRequired,
  onChangePrice: PropTypes.func.isRequired,
  onApplyCupon: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onClearAll: PropTypes.func.isRequired,
  onExportPDF: PropTypes.func.isRequired,
};

export default CartModal;
