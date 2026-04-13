import PropTypes from "prop-types";

function AdminHome({ onGoMovilidad, onBackTarifario }) {
  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-6 bg-gradient-to-br from-[#f6fcfc] via-white to-[#eaf6f6] rounded-xl shadow-2xl border border-[#b2e4e5] min-h-[70vh]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#01878A]">Panel Admin</h1>
        <button
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 font-semibold"
          onClick={onBackTarifario}
        >
          Volver al tarifario
        </button>
      </div>

      <p className="text-sm sm:text-base text-gray-700 mb-5">
        Selecciona un modulo para continuar.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <button
          className="w-full p-4 sm:p-5 rounded-xl border border-[#01878A] bg-white text-left hover:shadow-md transition"
          onClick={onGoMovilidad}
        >
          <span className="block text-lg sm:text-xl font-bold text-[#01878A]">Movilidad</span>
          <span className="block text-sm text-gray-600 mt-1">Registrar y gestionar planilla de movilidad</span>
        </button>
      </div>
    </div>
  );
}

AdminHome.propTypes = {
  onGoMovilidad: PropTypes.func.isRequired,
  onBackTarifario: PropTypes.func.isRequired,
};

export default AdminHome;
