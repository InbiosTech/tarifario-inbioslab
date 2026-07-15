import PropTypes from "prop-types";

function AdminHome({ onGoMovilidad, onGoExams, onGoPromotions, onGoInventory, onGoSettings, onGoConvenio, onGoPublico, onLogout }) {
  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-6 bg-gradient-to-br from-[#f6fcfc] via-white to-[#eaf6f6] rounded-xl shadow-2xl border border-[#b2e4e5] min-h-[70vh]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#01878A]">Panel Admin</h1>
        <button
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 font-semibold"
          onClick={onLogout}
        >
          Cerrar sesion
        </button>
      </div>

      <p className="text-sm sm:text-base text-gray-700 mb-5">
        Selecciona un modulo para continuar.
      </p>

      <div className="flex flex-wrap gap-3 mb-5">
        <button
          type="button"
          className="px-4 py-2 rounded-lg border border-[#01878A] bg-white text-[#017f82] font-semibold hover:bg-[#eff9f9] transition"
          onClick={onGoConvenio}
        >
          Ir a vista Convenio
        </button>
        <button
          type="button"
          className="px-4 py-2 rounded-lg border border-[#01878A] bg-white text-[#017f82] font-semibold hover:bg-[#eff9f9] transition"
          onClick={onGoPublico}
        >
          Ir a vista Publico
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <button
          className="w-full p-4 sm:p-5 rounded-xl border border-[#01878A] bg-white text-left hover:shadow-md transition"
          onClick={onGoMovilidad}
        >
          <span className="block text-lg sm:text-xl font-bold text-[#01878A]">Movilidad</span>
          <span className="block text-sm text-gray-600 mt-1">Registrar y gestionar planilla de movilidad</span>
        </button>
        <button
          className="w-full p-4 sm:p-5 rounded-xl border border-[#01878A] bg-white text-left hover:shadow-md transition"
          onClick={onGoExams}
        >
          <span className="block text-lg sm:text-xl font-bold text-[#01878A]">Examenes</span>
          <span className="block text-sm text-gray-600 mt-1">Crear, editar, eliminar e importar examenes desde API</span>
        </button>
        <button
          className="w-full p-4 sm:p-5 rounded-xl border border-[#01878A] bg-white text-left hover:shadow-md transition"
          onClick={onGoPromotions}
        >
          <span className="block text-lg sm:text-xl font-bold text-[#01878A]">Promociones</span>
          <span className="block text-sm text-gray-600 mt-1">Gestionar tarjetas del carrusel y su estado en tiempo real</span>
        </button>
        <button
          className="w-full p-4 sm:p-5 rounded-xl border border-[#01878A] bg-white text-left hover:shadow-md transition"
          onClick={onGoInventory}
        >
          <span className="block text-lg sm:text-xl font-bold text-[#01878A]">Inventario</span>
          <span className="block text-sm text-gray-600 mt-1">Registrar equipos, accesorios y mantenimientos programados</span>
        </button>
        <button
          className="w-full p-4 sm:p-5 rounded-xl border border-[#01878A] bg-white text-left hover:shadow-md transition"
          onClick={onGoSettings}
        >
          <span className="block text-lg sm:text-xl font-bold text-[#01878A]">Configuracion</span>
          <span className="block text-sm text-gray-600 mt-1">Editar numero destino de WhatsApp para cotizaciones</span>
        </button>
      </div>
    </div>
  );
}

AdminHome.propTypes = {
  onGoMovilidad: PropTypes.func.isRequired,
  onGoExams: PropTypes.func.isRequired,
  onGoPromotions: PropTypes.func.isRequired,
  onGoInventory: PropTypes.func.isRequired,
  onGoSettings: PropTypes.func.isRequired,
  onGoConvenio: PropTypes.func.isRequired,
  onGoPublico: PropTypes.func.isRequired,
  onLogout: PropTypes.func.isRequired,
};

export default AdminHome;
