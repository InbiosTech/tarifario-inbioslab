import PropTypes from "prop-types";

function PromoModal({ promo, onAddToCart, onClose }) {
  if (!promo) return null;
  const modalImage = promo.imageModal || promo.imageCard || promo.image;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm flex flex-col">
        <h2 className="text-lg font-bold text-[#01878A] mb-2 flex items-center gap-2">
          {promo.title}
        </h2>
        {modalImage ? (
          <>
            <img
              src={modalImage}
              alt={promo.title}
              className="w-full h-40 object-cover rounded mb-2 bg-gray-100"
              onError={(event) => {
                const img = event.currentTarget;
                img.style.display = "none";
                const placeholder = img.nextElementSibling;
                if (placeholder) {
                  placeholder.style.display = "flex";
                }
              }}
            />
            <div className="w-full h-40 rounded mb-2 bg-gray-100 text-[#016b6d] text-sm font-semibold hidden items-center justify-center">
              Imagen no disponible
            </div>
          </>
        ) : (
          <div className="w-full h-40 rounded mb-2 bg-gray-100 text-[#016b6d] text-sm font-semibold flex items-center justify-center">
            Sin imagen
          </div>
        )}
        {promo.fundament && (
          <p className="text-[#016b6d] text-xs mb-2 font-medium">Fundamento: {promo.fundament}</p>
        )}
        <p className="text-gray-700 text-sm mb-2">{promo.longDescription}</p>
        {Number(promo.basePrice || 0) > Number(promo.price || 0) ? (
          <div className="mb-2">
            <span className="line-through text-gray-400 mr-2">S/ {Number(promo.basePrice || 0).toFixed(2)}</span>
            <span className="text-green-700 font-bold">S/ {Number(promo.price || 0).toFixed(2)}</span>
          </div>
        ) : (
          <span className="text-green-700 font-bold mb-2">S/ {Number(promo.price || 0).toFixed(2)}</span>
        )}
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
