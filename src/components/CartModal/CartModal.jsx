import PropTypes from "prop-types";

function CartModal({ cart, paciente, tipoCotizacion, cuponInput, cuponDescuento, onChangePaciente, onChangeQty, onRemoveItem, onApplyCupon, onClose, onClearAll, onExportPDF }) {
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
            value={paciente.nombre}
            onChange={e => onChangePaciente({ ...paciente, nombre: e.target.value })}
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
                  <span className="font-semibold text-blue-700">{item.name.toUpperCase()}</span>
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
                  <span className="text-green-700 font-bold">S/ {tipoCotizacion === "convenio" ? item.price2 : item.price1}</span>
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
  onApplyCupon: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onClearAll: PropTypes.func.isRequired,
  onExportPDF: PropTypes.func.isRequired,
};

export default CartModal;
