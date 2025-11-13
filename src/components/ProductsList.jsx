import { jsPDF } from "jspdf";
import { useState, useEffect } from "react";
import InfoModal from "./InfoModal/InfoModal";
import PromoModal from "./PromoModal/PromoModal";
import ClaveModal from "./ClaveModal/ClaveModal";
import CartModal from "./CartModal/CartModal";
import FloatingWhatsappButton from "./FloatingWhatsappButton/FloatingWhatsappButton";
import ProductsListGrid from "./ProductsListGrid/ProductsListGrid";
import NavBar from "./NavBar/NavBar";
import PromotionsCarousel from "./PromotionsCarousel/PromotionsCarousel";
import ProductSearch from "./ProductSearch/ProductSearch";
import { drawPdfHeader, drawPdfPatientData, drawPdfQuotationTable, drawPdfFooter } from "../utils/pdfUtils";

const ProductsList = ({ products }) => {
  // Estado para mostrar/desplegar el botón de WhatsApp
  const [showWhatsapp, setShowWhatsapp] = useState(false);
  // Estado para mostrar el selector en móvil
  const [showSelectorMobile, setShowSelectorMobile] = useState(false);
  // Carrusel de promociones dinámico
  const [promociones, setPromociones] = useState([]);
  const [promoIndex, setPromoIndex] = useState(0);
  useEffect(() => {
    fetch(import.meta.env.BASE_URL + 'promotions.json')
      .then(res => res.json())
      .then(data => setPromociones(data))
      .catch(() => setPromociones([]));
  }, []);
  useEffect(() => {
    if (promociones.length === 0) return;
    const timer = setInterval(() => {
      setPromoIndex((prev) => (prev + 1) % promociones.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [promociones]);

  // Estados principales
  const [cart, setCart] = useState([]);
  // Datos del paciente y empresa
  const [paciente, setPaciente] = useState({
    nombre: "",
    edad: "",
    sexo: "",
    codigo: "",
    empresa: ""
  });
  const [showCart, setShowCart] = useState(false);
  const [tipoCotizacion, setTipoCotizacion] = useState("publico");
  const [showClaveModal, setShowClaveModal] = useState(false);
  const [claveInput, setClaveInput] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoModalContent, setPromoModalContent] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoModalContent, setInfoModalContent] = useState(null);
  // Estado para cupón
  const [cuponInput, setCuponInput] = useState("");
  const [cuponDescuento, setCuponDescuento] = useState(0);
  const pageSize = 5;
  const filteredProducts = products ? (
    search.trim() === ""
      ? products
      : products.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()))
  ) : [];
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Handlers
  const handlePrev = () => setCurrentPage((prev) => Math.max(1, prev - 1));
  const handleNext = () => setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  
  const handleClearAll = () => {
    setCart([]);
    setPaciente({ nombre: "", edad: "", sexo: "", codigo: "", empresa: "" });
  };
  const handleChangeQty = (id, qty) => {
    setCart((prev) => prev.map(item => item.id === id ? { ...item, qty: Math.max(1, qty) } : item));
  };

  

  return (
  <div className="max-w-4xl mx-auto p-2 sm:p-4 bg-gradient-to-br from-[#f6fcfc] via-white to-[#eaf6f6] rounded-xl shadow-2xl border border-[#b2e4e5] pt-40 sm:pt-0">
      {/* Modal Info Producto */}
      {showInfoModal && infoModalContent && (
        <InfoModal
          product={infoModalContent}
          tipoCotizacion={tipoCotizacion}
          onAddToCart={(product) => {
            setCart((prev) => {
              const exists = prev.some((p) => p.id === product.id && p.type !== "promo");
              if (exists) return prev;
              return [...prev, { ...product, qty: 1, type: "producto" }];
            });
            setShowInfoModal(false);
            setInfoModalContent(null);
            setShowCart(true);
          }}
          onClose={() => {
            setShowInfoModal(false);
            setInfoModalContent(null);
          }}
        />
      )}
      {/* Modal para descripción larga de promoción */}
      {showPromoModal && promoModalContent && (
        <PromoModal
          promo={promoModalContent}
          onAddToCart={(promo) => {
            setCart((prev) => {
              const exists = prev.some((p) => p.id === promo.id && p.type === "promo");
              if (exists) return prev;
              return [...prev, { ...promo, qty: 1, type: "promo" }];
            });
            setShowPromoModal(false);
            setPromoModalContent(null);
            setShowCart(true);
          }}
          onClose={() => {
            setShowPromoModal(false);
            setPromoModalContent(null);
          }}
        />
      )}
      {/* NAV principal dentro del componente */}
      <NavBar
        cartCount={cart.length}
        tipoCotizacion={tipoCotizacion}
        onTipoCotizacionChange={e => {
          if (e.target.value === "convenio") {
            setShowClaveModal(true);
          } else {
            setTipoCotizacion("publico");
          }
        }}
        onCartClick={() => setShowCart(true)}
        showSelectorMobile={showSelectorMobile}
        onToggleSelectorMobile={() => setShowSelectorMobile(prev => !prev)}
      />
      {/* Carrusel de promociones modularizado */}
      <PromotionsCarousel
        promociones={promociones}
        promoIndex={promoIndex}
        onPromoSelect={promo => {
          setPromoModalContent(promo);
          setShowPromoModal(true);
        }}
      />
      {/* Componente modularizado ProductSearch */}
      <ProductSearch
        search={search}
        onSearchChange={value => {
          setSearch(value);
          setCurrentPage(1);
        }}
      />
      {/* Componente modularizado ProductsListGrid */}
      <ProductsListGrid
        products={paginatedProducts}
        cart={cart}
        tipoCotizacion={tipoCotizacion}
        onAddToCart={item => {
          setCart((prev) => {
            const exists = prev.some((p) => p.id === item.id && p.type !== "promo");
            if (exists) return prev;
            return [...prev, { ...item, qty: 1, type: "producto" }];
          });
        }}
        onRemoveFromCart={id => {
          const row = document.getElementById(`product-row-${id}`);
          if (row) {
            row.classList.add('animate-shake');
            setTimeout(() => {
              row.classList.remove('animate-shake');
              setCart(prev => prev.filter(p => p.id !== id));
            }, 400);
          } else {
            setCart(prev => prev.filter(p => p.id !== id));
          }
        }}
        onInfo={item => {
          setInfoModalContent(item);
          setShowInfoModal(true);
        }}
      />
      {totalPages > 1 && (
        <nav className="flex justify-center items-center mt-6 gap-2 max-w-full" aria-label="Paginación">
          <button
            className="px-3 py-1 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition disabled:bg-gray-300 disabled:text-gray-500 flex items-center"
            onClick={handlePrev}
            disabled={currentPage === 1}
            aria-label="Página anterior"
          >
            <span className="mr-1">←</span> Anterior
          </button>
          <span className="mx-2 text-blue-700 font-bold">Página {currentPage} de {totalPages}</span>
          <button
            className="px-3 py-1 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition disabled:bg-gray-300 disabled:text-gray-500 flex items-center"
            onClick={handleNext}
            disabled={currentPage === totalPages}
            aria-label="Página siguiente"
          >
            Siguiente <span className="ml-1">→</span>
          </button>
        </nav>
      )}
      {/* Modal para carrito modularizado */}
      {showCart && (
        <CartModal
          cart={cart}
          paciente={paciente}
          tipoCotizacion={tipoCotizacion}
          cuponInput={cuponInput}
          cuponDescuento={cuponDescuento}
          onChangePaciente={setPaciente}
          onChangeQty={handleChangeQty}
          onRemoveItem={id => setCart(prev => prev.filter(p => p.id !== id))}
          onChangePrice={(id, value, tipo) => {
            setCart(prev => prev.map(item => {
              if (item.id !== id) return item;
              if (tipo === "convenio") {
                return { ...item, price2: value };
              } else {
                return { ...item, price1: value };
              }
            }));
          }}
          onApplyCupon={value => {
            if (typeof value === 'string') {
              setCuponInput(value);
            } else {
              // Si es click en botón, aplicar el cupón
              const code = cuponInput.trim().toUpperCase();
              if (code === "A5B7C") {
                setCuponDescuento(0.05);
              } else if (code === "X9Z2Q") {
                setCuponDescuento(0.10);
              } else {
                setCuponDescuento(0);
              }
            }
          }}
          onClose={() => setShowCart(false)}
          onClearAll={handleClearAll}
          onExportPDF={async () => {
            if (cart.length === 0) {
              alert("Agrega al menos un producto al carrito para descargar la cotización.");
              return;
            }
            if (!paciente.nombre) {
              alert("Completa el nombre del paciente para descargar la cotización.");
              return;
            }
            const doc = new jsPDF();
            // Cargar logo como base64
            const getBase64Logo = async () => {
              const response = await fetch(import.meta.env.BASE_URL + 'logo.png');
              const blob = await response.blob();
              return new Promise((resolve) => {
                const reader = new window.FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
              });
            };
            const logoBase64 = await getBase64Logo();
            // Encabezado y logo modularizado
            drawPdfHeader(doc, logoBase64);
            // Modularizar datos paciente
            let y = drawPdfPatientData(doc, paciente, tipoCotizacion);
            y = drawPdfQuotationTable(doc, cart, tipoCotizacion, cuponDescuento, y);
            drawPdfFooter(doc, tipoCotizacion, cuponDescuento, cuponInput, y);
            const fecha = new Date();
            const fechaStr = `${fecha.getFullYear()}-${String(fecha.getMonth()+1).padStart(2,'0')}-${String(fecha.getDate()).padStart(2,'0')}`;
            const nombrePaciente = paciente.nombre ? paciente.nombre.replace(/\s+/g, '_').toUpperCase() : 'PACIENTE';
            doc.save(`cotizacion_${nombrePaciente}_${fechaStr}.pdf`);
          }}
        />
      )}
      {/* Modal para clave de convenio modularizado */}
      <ClaveModal
        show={showClaveModal}
        claveInput={claveInput}
        setClaveInput={setClaveInput}
        onAccept={() => {
          if (claveInput === "inbios") {
            setTipoCotizacion("convenio");
            setShowClaveModal(false);
            setClaveInput("");
          } else {
            alert("Clave incorrecta");
          }
        }}
        onCancel={() => {
          setShowClaveModal(false);
          setClaveInput("");
        }}
      />
    {/* Botón WhatsApp modularizado */}
    <FloatingWhatsappButton
      showWhatsapp={showWhatsapp}
      onOpen={() => setShowWhatsapp(true)}
      onClose={() => setShowWhatsapp(false)}
    />
    </div>
  );
}


import PropTypes from "prop-types";

ProductsList.propTypes = {
  products: PropTypes.array.isRequired,
};

export default ProductsList;