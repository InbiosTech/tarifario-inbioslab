import PropTypes from "prop-types";
import SearchIcon from '@mui/icons-material/Search';

const ProductSearch = ({ search, onSearchChange, onSearchEnter, inputRef }) => {
  // ...aquí va la UI del input de búsqueda...
  return (
    <div className="mb-6">
      <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto">
        <input
          className="border-2 border-[#01878A] rounded-full px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#01878A] shadow-md text-base pr-10 bg-[#e6f7f7] text-black"
          type="text"
          placeholder="Buscar prueba..."
          name="product-search"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          value={search}
          onChange={ev => onSearchChange(ev.target.value)}
          onKeyDown={ev => {
            if (ev.key === "Enter") {
              ev.preventDefault();
              onSearchEnter();
            }
          }}
          ref={inputRef}
        />
        <SearchIcon className="absolute right-4 top-1/2 transform -translate-y-1/2" style={{ color: '#01878A', fontSize: 20 }} />
      </div>
    </div>
  );

}

ProductSearch.propTypes = {
  search: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  onSearchEnter: PropTypes.func.isRequired,
  inputRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.any }),
  ]),
};

export default ProductSearch;