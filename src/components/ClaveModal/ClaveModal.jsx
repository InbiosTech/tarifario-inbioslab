import PropTypes from "prop-types";

const ClaveModal = ({ show, claveInput, setClaveInput, onAccept, onCancel }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xs flex flex-col items-center">
        <h2 className="text-lg font-bold text-blue-700 mb-4">Ingrese clave de convenio</h2>
        <input
          type="password"
          className="border rounded px-3 py-2 mb-4 w-full text-center"
          placeholder="Clave"
          value={claveInput}
          onChange={e => setClaveInput(e.target.value)}
          autoFocus
        />
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
  claveInput: PropTypes.string.isRequired,
  setClaveInput: PropTypes.func.isRequired,
  onAccept: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default ClaveModal;
