import PropTypes from "prop-types";

function PromoModal({ promo, onAddToCart, onClose }) {
  if (!promo) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm flex flex-col">
        <h2 className="text-lg font-bold text-[#01878A] mb-2 flex items-center gap-2">
          {promo.title}
        </h2>
        <img src={promo.image} alt={promo.title} className="w-full h-40 object-cover rounded mb-2 bg-gray-100" />
        <p className="text-gray-700 text-sm mb-2">{promo.longDescription}</p>
        <span className="text-green-700 font-bold mb-2">S/ {promo.price}</span>
        <button
          className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold mb-2"
          onClick={() => onAddToCart(promo)}
        >Cotizar</button>
        <button
          className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
          onClick={onClose}
        >Cerrar</button>
      </div>
    </div>
  );
}

PromoModal.propTypes = {
  promo: PropTypes.object,
  onAddToCart: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default PromoModal;
