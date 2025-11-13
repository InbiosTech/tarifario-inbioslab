import PropTypes from "prop-types";

const FloatingWhatsappButton = ({ showWhatsapp, onOpen, onClose }) => {
  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end">
      {!showWhatsapp ? (
        <button
          className="bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg p-2 flex items-center transition-all"
          style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.18)" }}
          onClick={onOpen}
          aria-label="Abrir WhatsApp"
        >
          <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="w-8 h-8" />
        </button>
      ) : (
        <a
          href="https://wa.me/51945241682"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg flex items-center gap-2 px-4 py-2 transition-all"
          style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.18)" }}
        >
          <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="w-6 h-6" />
          <span className="font-bold">WhatsApp</span>
          <button
            className="ml-2 bg-white text-green-600 rounded-full p-1 hover:bg-gray-100 border border-green-500"
            onClick={e => { e.preventDefault(); onClose(); }}
            aria-label="Cerrar WhatsApp"
          >✕</button>
        </a>
      )}
    </div>
  );
};

FloatingWhatsappButton.propTypes = {
  showWhatsapp: PropTypes.bool.isRequired,
  onOpen: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default FloatingWhatsappButton;
