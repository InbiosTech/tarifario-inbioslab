import PropTypes from "prop-types";

function InfoModal({ product, tipoCotizacion, onAddToCart, onClose }) {
  if (!product) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm flex flex-col">
        <h2 className="text-lg font-bold text-[#01878A] mb-2 flex items-center gap-2">
          {product.name ? product.name.toUpperCase() : ""}
        </h2>
        <p className="text-gray-700 text-sm mb-2">{product.info ? `INFO: ${product.info.toUpperCase()}` : "SIN DESCRIPCIÓN"}</p>
        <span className="text-green-700 font-bold mb-2">S/ {tipoCotizacion === "convenio" ? product.price2 : product.price1}</span>
        <span className="text-xs text-gray-500 mb-2">Tiempo de proceso: <span className="font-bold text-blue-600">{product.time || "-"}</span></span>
        {tipoCotizacion === "convenio" && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-2 rounded mb-2 mt-2">
            <div className="text-xs text-blue-900 mb-1"><b>Muestra:</b> {product.sample || "-"}</div>
            <div className="text-xs text-blue-900 mb-1"><b>Método:</b> {product.method || "-"}</div>
            <div className="text-xs text-blue-900"><b>Tubo:</b> {product.tube || "-"}</div>
          </div>
        )}
        <button
          className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold mb-2"
          onClick={() => onAddToCart(product)}
        >Cotizar</button>
        <button
          className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
          onClick={onClose}
        >Cerrar</button>
      </div>
    </div>
  );
}

InfoModal.propTypes = {
  product: PropTypes.object,
  tipoCotizacion: PropTypes.string.isRequired,
  onAddToCart: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default InfoModal;
