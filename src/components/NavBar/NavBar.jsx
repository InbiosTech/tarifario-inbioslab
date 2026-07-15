import PropTypes from "prop-types";
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import MenuIcon from '@mui/icons-material/Menu';
import logo from "../../assets/logo.png";

const NavBar = ({ cartCount, cartTotal, tipoCotizacion, onTipoCotizacionChange, onCartClick, showSelectorMobile, onToggleSelectorMobile, showModeSelector = true, modeBadgeText = "" }) => {
  const formattedTotal = Number(cartTotal || 0).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <nav className="flex flex-col sm:flex-row items-center justify-between px-3 sm:px-5 py-3 bg-gradient-to-r from-[#d8f1f1] via-white to-[#019598] rounded-2xl mb-9 sm:mb-8 shadow-[0_16px_42px_rgba(1,123,126,0.3)] gap-3 sm:gap-0 border border-[#9edfe0] z-40 fixed top-1 left-0 w-full sm:static backdrop-blur-sm">
      <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-center sm:justify-start">
        <div className="relative mt-2 sm:mt-0">
          <div className="absolute -inset-1 rounded-[28px] bg-gradient-to-br from-[#00aeb1] to-[#01767a] blur-sm opacity-55" aria-hidden="true" />
          <div className="relative w-[86px] h-[86px] sm:w-[82px] sm:h-[82px] md:w-[94px] md:h-[94px] rounded-[26px] p-1.5 bg-white border-[3px] border-[#017e81] shadow-[0_8px_18px_rgba(1,107,109,0.35)] overflow-hidden">
            <img
              src={logo}
              alt="logo-laboratorio-clinico-inbioslab"
              className="w-full h-full object-contain rounded-[20px]"
            />
            <div className="absolute bottom-0 left-0 right-0 px-1 py-[2px] bg-gradient-to-r from-[#005d60]/95 via-[#017f82]/95 to-[#009ca0]/95 text-[9px] leading-none text-white font-extrabold tracking-[0.1em] text-center uppercase">
              Inbioslab
            </div>
          </div>
        </div>
        <div className="flex flex-col leading-tight text-center sm:text-left">
          <span className="text-[11px] sm:text-xs font-bold tracking-[0.22em] text-[#0f6b6d] uppercase">Laboratorio Clínico</span>
          <h1 className="text-[26px] sm:text-[31px] md:text-[35px] font-black text-[#007f82] drop-shadow-[0_2px_8px_rgba(0,99,103,0.25)] tracking-[0.04em]">INBIOSLAB</h1>
          <span className="text-[10px] sm:text-[11px] font-semibold text-[#0f8d90] tracking-[0.14em] uppercase">Aplicativo Premium de Cotizaciones</span>
        </div>
      </div>
      <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-center sm:justify-end flex-wrap sm:flex-nowrap">
        {/* Icono hamburguesa solo en móvil */}
        {showModeSelector && (
          <>
            <button
              className="sm:hidden bg-white rounded-full p-2 shadow border-2 border-[#01878A] hover:scale-105 transition"
              onClick={onToggleSelectorMobile}
              aria-label="Mostrar opciones"
            >
              <MenuIcon style={{ fontSize: 32, color: '#01878A' }} />
            </button>
            {/* Selector solo en desktop/tablet o si está abierto en móvil */}
            <select
              className={`px-3 py-2 rounded bg-[#01878A] text-white font-bold shadow border border-[#01878A] focus:outline-none transition-all duration-300 sm:block ${showSelectorMobile ? 'block animate-fade-in' : 'hidden'} sm:animate-none`}
              value={tipoCotizacion}
              onChange={onTipoCotizacionChange}
            >
              <option value="convenio">Cotizar precio convenio</option>
              <option value="publico">Cotizar precio publico (con clave)</option>
              <option value="admin">Ingresar como admin</option>
            </select>
          </>
        )}
        {modeBadgeText && (
          <div className="px-3 py-1 rounded-full bg-white/90 border border-[#81d6d8] text-[#016b6d] font-bold text-xs sm:text-sm shadow-sm whitespace-nowrap">
            {modeBadgeText}
          </div>
        )}
        <div className="bg-white border-2 border-[#01878A] rounded-xl px-3 py-1 shadow min-w-[120px] text-center">
          <div className="text-[10px] sm:text-xs font-semibold text-[#016b6d]">Total</div>
          <div className="text-sm sm:text-base font-extrabold text-[#01878A] leading-tight">S/ {formattedTotal}</div>
        </div>
        <div
          className={`relative cursor-pointer bg-white rounded-full p-2 shadow border-2 border-[#01878A] hover:scale-105 transition ${cartCount > 0 ? 'animate-bounce-short' : 'animate-pulse-slow'}`}
          onClick={onCartClick}
        >
          <ShoppingCartIcon
            style={{
              fontSize: 32,
              color: cartCount > 0 ? '#00bfae' : '#01878A',
              filter: 'drop-shadow(0 1px 2px #b2e4e5)'
            }}
          />
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-[#01878A] text-white rounded-full px-2 text-xs font-bold border border-white shadow">{cartCount}</span>
          )}
        </div>
      </div>
    </nav>
  );
};

NavBar.propTypes = {
  cartCount: PropTypes.number.isRequired,
  cartTotal: PropTypes.number,
  tipoCotizacion: PropTypes.string.isRequired,
  onTipoCotizacionChange: PropTypes.func.isRequired,
  onCartClick: PropTypes.func.isRequired,
  showSelectorMobile: PropTypes.bool,
  onToggleSelectorMobile: PropTypes.func,
  showModeSelector: PropTypes.bool,
  modeBadgeText: PropTypes.string,
};

export default NavBar;
