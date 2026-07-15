import PropTypes from "prop-types";
import { useState } from "react";

const ClaveModal = ({ show, title, claveInput, setClaveInput, onAccept, onCancel }) => {
  const [showPassword, setShowPassword] = useState(false);

  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xs flex flex-col items-center">
        <h2 className="text-lg font-bold text-blue-700 mb-4">{title || "Ingrese clave"}</h2>
        <input
          type="text"
          name="usuario-fake"
          autoComplete="username"
          tabIndex={-1}
          aria-hidden="true"
          className="absolute opacity-0 pointer-events-none h-0 w-0"
          value=""
          onChange={() => {}}
        />
        <input
          type={showPassword ? "text" : "password"}
          name="clave-acceso"
          autoComplete="new-password"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          className="border rounded px-3 py-2 mb-4 w-full text-center"
          placeholder="Clave"
          value={claveInput}
          onChange={e => setClaveInput(e.target.value)}
          autoFocus
        />
        <button
          type="button"
          className="text-sm text-blue-700 font-semibold mb-4"
          onClick={() => setShowPassword(prev => !prev)}
        >
          {showPassword ? "Ocultar clave" : "Ver clave"}
        </button>
        <div className="flex gap-2 w-full">
          <button
            className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
            onClick={onAccept}
          >Aceptar</button>
          <button
            className="w-full py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 font-semibold"
            onClick={onCancel}
          >Cancelar</button>
        </div>
      </div>
    </div>
  );
};

ClaveModal.propTypes = {
  show: PropTypes.bool.isRequired,
  title: PropTypes.string,
  claveInput: PropTypes.string.isRequired,
  setClaveInput: PropTypes.func.isRequired,
  onAccept: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default ClaveModal;
