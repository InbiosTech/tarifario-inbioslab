import PropTypes from "prop-types";

const PromotionsCarousel = ({ promociones, promoIndex, onPromoSelect }) => {
  if (!promociones || promociones.length === 0) {
    return (
      <div className="w-full flex justify-center mb-2">
        <div className="max-w-xs w-full bg-white rounded-lg shadow-md p-4 text-center text-[#01878A] text-xs">No hay promociones disponibles.</div>
      </div>
    );
  }
  const promo = promociones[promoIndex];
  return (
    <div className="w-full flex justify-center mb-2 pt-10 sm:pt-0">
      <div className="max-w-xs w-full bg-white rounded-lg shadow-md overflow-hidden flex flex-row items-center animate-fade-in relative p-2 gap-2 border-2 border-[#01878A]">
        <img src={promo.image} alt={promo.title} className="w-16 h-16 object-cover bg-[#b2e4e5] rounded" />
        <div className="flex-1 flex flex-col gap-1">
          <h2 className="text-sm font-bold text-[#01878A] leading-tight">{promo.title}</h2>
          <p className="text-xs text-gray-700 leading-tight">{promo.description}</p>
          <span className="text-[#01878A] font-bold text-xs">S/ {promo.price}</span>
          <button
            className="mt-1 px-2 py-1 bg-gradient-to-r from-[#b2e4e5] to-[#01878A] text-[#01878A] rounded hover:bg-[#01878A] hover:text-white text-xs font-semibold self-start border border-[#b2e4e5]"
            onClick={() => onPromoSelect(promo)}
          >Ver más</button>
        </div>
        <span className="absolute top-1 left-1 bg-[#b2e4e5] text-[#01878A] px-2 py-1 rounded text-[10px] font-bold shadow border border-[#01878A]">PROMO</span>
      </div>
    </div>
  );
};

PromotionsCarousel.propTypes = {
  promociones: PropTypes.array.isRequired,
  promoIndex: PropTypes.number.isRequired,
  onPromoSelect: PropTypes.func.isRequired,
};

export default PromotionsCarousel;
