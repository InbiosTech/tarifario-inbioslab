import PropTypes from "prop-types";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import InfoIcon from '@mui/icons-material/Info';

const ProductsListGrid = ({ products, cart, tipoCotizacion, onAddToCart, onRemoveFromCart, onInfo }) => {
  return (
    <div className="grid gap-4">
      {products.map((item) => (
        <div
          key={item.id}
          className={`border-2 border-[#b2e4e5] rounded-xl shadow-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center hover:scale-[1.01] transition-transform duration-200 ${cart.some((p) => p.id === item.id && p.type !== 'promo') ? 'bg-[#e0f7fa] text-[#00bfae]' : 'bg-white'}`}
          id={`product-row-${item.id}`}
        >
          <div className="flex flex-col gap-1">
            <span className={`font-bold text-lg drop-shadow flex items-center gap-1 ${cart.some((p) => p.id === item.id && p.type !== 'promo') ? 'text-[#00bfae]' : 'text-[#01878A]'}`}>{item.name.toUpperCase()} {cart.some((p) => p.id === item.id && p.type !== 'promo') && <CheckCircleIcon style={{ fontSize: 18, color: '#00bfae' }} titleAccess="Agregado" />}</span>
            <span className={`text-xs ${cart.some((p) => p.id === item.id && p.type !== 'promo') ? 'text-[#00bfae]' : 'text-gray-700'}`}>Tiempo de proceso: <span className="font-bold text-[#01878A]">{item.time || "-"}</span></span>
          </div>
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <span className={`text-lg font-bold px-2 py-1 rounded shadow ${cart.some((p) => p.id === item.id && p.type !== 'promo') ? 'bg-[#b2e4e5] text-[#00bfae]' : 'bg-[#eaf6f6] text-[#01878A]'}`}>S/ {tipoCotizacion === "convenio" ? item.price2 : item.price1}</span>
            {cart.some((p) => p.id === item.id && p.type !== 'promo') ? (
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-1 border-2 rounded-xl font-bold shadow flex items-center gap-1 bg-[#b2e4e5] text-[#00bfae] border-[#00bfae] opacity-80 cursor-default text-sm"
                  disabled
                >
                  <AddCircleIcon style={{ fontSize: 20, color: 'currentColor' }} /> Agregado
                </button>
                <button
                  className="px-2 py-1 border-2 rounded-xl font-bold shadow flex items-center gap-1 bg-white text-red-500 border-red-300 hover:bg-red-100 hover:text-red-700 transition text-xs"
                  title="Quitar del carrito"
                  onClick={() => onRemoveFromCart(item.id)}
                >Quitar</button>
              </div>
            ) : (
              <button
                className="px-3 py-1 border-2 rounded-xl font-bold shadow flex items-center gap-1 bg-white text-[#01878A] border-[#01878A] hover:bg-[#01878A] hover:text-white hover:shadow-lg transition text-sm group"
                onClick={() => onAddToCart(item)}
              >
                <AddCircleIcon style={{ fontSize: 20, color: 'currentColor' }} className="group-hover:text-white" /> Agregar
              </button>
            )}
            <button
              className="px-2 py-1 bg-white border-2 border-[#01878A] rounded-xl text-[#01878A] font-bold shadow flex items-center gap-1 transition hover:bg-[#01878A] hover:text-white hover:shadow-lg text-xs group"
              title="Más información"
              onClick={() => onInfo(item)}
            ><InfoIcon style={{ fontSize: 18, color: 'currentColor' }} className="group-hover:text-white" /> Info</button>
          </div>
        </div>
      ))}
    </div>
  );
};

ProductsListGrid.propTypes = {
  products: PropTypes.array.isRequired,
  cart: PropTypes.array.isRequired,
  tipoCotizacion: PropTypes.string.isRequired,
  onAddToCart: PropTypes.func.isRequired,
  onRemoveFromCart: PropTypes.func.isRequired,
  onInfo: PropTypes.func.isRequired,
};

export default ProductsListGrid;
