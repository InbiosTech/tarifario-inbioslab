import PropTypes from "prop-types";
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import MenuIcon from '@mui/icons-material/Menu';
import logo from "../../assets/logo.png";

const NavBar = ({ cartCount, tipoCotizacion, onTipoCotizacionChange, onCartClick, showSelectorMobile, onToggleSelectorMobile }) => {
  return (
    <nav className="flex flex-col sm:flex-row items-center justify-between px-2 sm:px-4 py-2 bg-gradient-to-r from-[#b2e4e5] via-white to-[#01878A] rounded-xl mb-16 shadow-2xl gap-2 sm:gap-0 border border-[#b2e4e5] z-40 fixed top-1 left-0 w-full sm:static">
      <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-center sm:justify-start">
        <img src={logo} alt="logo-inbioslab" className="w-20 h-20 sm:w-16 sm:h-16 md:w-20 md:h-20 object-center transition-all duration-300 bg-white rounded-full shadow border-4 border-[#01878A] mt-4 sm:mt-0 relative" style={{marginLeft: 0}} />
        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#01878A] drop-shadow-lg tracking-wide">TARIFARIO INBIOSLAB</h1>
      </div>
      <div className="flex items-center gap-4 w-full sm:w-auto justify-center sm:justify-end">
        {/* Icono hamburguesa solo en móvil */}
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
          <option value="publico">Cotizar precio público</option>
          <option value="convenio">Cotizar precio convenio</option>
        </select>
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
  tipoCotizacion: PropTypes.string.isRequired,
  onTipoCotizacionChange: PropTypes.func.isRequired,
  onCartClick: PropTypes.func.isRequired,
  showSelectorMobile: PropTypes.bool,
  onToggleSelectorMobile: PropTypes.func,
};

export default NavBar;
