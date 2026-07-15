import PropTypes from "prop-types";

const PromotionsCarousel = ({ promociones, promoIndex, onPromoSelect, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="w-full flex justify-center mb-3 pt-1 sm:pt-0">
        <div className="max-w-md w-full rounded-2xl bg-[#00a8ad] p-2.5 shadow-lg animate-pulse">
          <div className="h-8 rounded-md bg-white/30 mb-2" />
          <div className="bg-white rounded-xl overflow-hidden grid grid-cols-[170px_1fr] sm:grid-cols-[180px_1fr] min-h-[136px] sm:min-h-[148px]">
            <div className="bg-[#eef8f8]" />
            <div className="p-2 sm:p-3 flex flex-col justify-between">
              <div className="h-4 bg-gray-200 rounded w-11/12" />
              <div className="h-6 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!promociones || promociones.length === 0) {
    return (
      <div className="w-full flex justify-center mb-2">
        <div className="max-w-xs w-full bg-white rounded-lg shadow-md p-4 text-center text-[#01878A] text-xs">No hay promociones disponibles.</div>
      </div>
    );
  }
  const promo = promociones[promoIndex];
  const cardImage = promo.imageCard || promo.imageModal || promo.image;
  const shortDescription = String(promo.description || "").trim();
  const cardDescription = shortDescription || "Conoce mas detalles en la vista completa de la promocion.";
  const hasDiscount = Number(promo.basePrice || 0) > Number(promo.price || 0);
  const discountPercent = hasDiscount
    ? Math.max(1, Math.round((1 - Number(promo.price || 0) / Number(promo.basePrice || 1)) * 100))
    : 0;

  return (
    <div className="w-full flex justify-center mb-3 pt-1 sm:pt-0">
      <div className="max-w-md w-full rounded-2xl bg-[#00a8ad] p-2.5 shadow-lg animate-fade-in">
        <div className="flex items-center justify-between text-white mb-2 px-1">
          <div className="flex items-center gap-2 min-w-0">
            <span className="bg-white/20 px-2 py-1 rounded-md text-[10px] font-extrabold tracking-wide">PROMO</span>
            <h2 className="text-sm sm:text-base font-extrabold truncate">{promo.title}</h2>
          </div>
          <button
            className="shrink-0 text-xs sm:text-sm font-bold underline underline-offset-2"
            onClick={() => onPromoSelect(promo)}
          >
            Ver más
          </button>
        </div>

        <div className="bg-white rounded-xl overflow-hidden grid grid-cols-[170px_1fr] sm:grid-cols-[180px_1fr] min-h-[136px] sm:min-h-[148px]">
          <div className="relative bg-[#eef8f8]">
            {cardImage ? (
              <>
                <img
                  src={cardImage}
                  alt={promo.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(event) => {
                    const img = event.currentTarget;
                    img.style.display = "none";
                    const placeholder = img.nextElementSibling;
                    if (placeholder) {
                      placeholder.style.display = "flex";
                    }
                  }}
                />
                <div
                  className="w-full h-full hidden items-center justify-center text-[#016b6d] text-xs font-semibold px-2 text-center"
                >
                  Imagen no disponible
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#016b6d] text-xs font-semibold">
                Sin imagen
              </div>
            )}

            {hasDiscount && (
              <span className="absolute top-2 right-2 bg-[#ffd34d] text-[#5f4600] px-2 py-1 rounded-md text-[10px] font-extrabold shadow">
                -{discountPercent}%
              </span>
            )}
          </div>

          <div className="p-2 sm:p-3 flex flex-col justify-between min-w-0">
            <p className="text-[11px] sm:text-xs leading-snug text-gray-700 line-clamp-4 sm:line-clamp-5 min-h-[56px] sm:min-h-[66px]">{cardDescription}</p>

            {hasDiscount ? (
              <div className="leading-tight">
                <span className="block text-[11px] text-gray-400 line-through">S/ {Number(promo.basePrice || 0).toFixed(2)}</span>
                <span className="block text-xl font-black text-[#008b46]">S/ {Number(promo.price || 0).toFixed(2)}</span>
              </div>
            ) : (
              <span className="block text-xl font-black text-[#007e82]">S/ {Number(promo.price || 0).toFixed(2)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

PromotionsCarousel.propTypes = {
  promociones: PropTypes.array.isRequired,
  promoIndex: PropTypes.number.isRequired,
  onPromoSelect: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

export default PromotionsCarousel;
