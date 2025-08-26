import { jsPDF } from "jspdf";
import { dataSorted as data } from "../db/data";
import { useState, useEffect } from "react";
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import MenuIcon from '@mui/icons-material/Menu';
// ...existing code...
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SearchIcon from '@mui/icons-material/Search';
import InfoIcon from '@mui/icons-material/Info';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import logo from "../assets/logo.png";

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
  const handleClearCart = () => setCart([]);
  const handleClearAll = () => {
    setCart([]);
    setPaciente({ nombre: "", edad: "", sexo: "", codigo: "", empresa: "" });
  };
  const handleChangeQty = (id, qty) => {
    setCart((prev) => prev.map(item => item.id === id ? { ...item, qty: Math.max(1, qty) } : item));
  };

  // Renderizar productos
  const renderProducts = (list) => {
    if (!list || list.length === 0) {
      return <div className="text-center text-gray-500 py-8">No hay productos para mostrar.</div>;
    }
    return list.map((item) => (
      <div key={item.id} className="bg-white rounded-lg shadow p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-200 hover:bg-blue-50 transition">
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-blue-700 text-lg">{item.name.toUpperCase()}</span>
          <span className="text-xs text-gray-500">Tiempo de proceso: <span className="font-bold text-blue-600">{item.time || "-"}</span></span>
        </div>
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <span className="text-lg font-bold text-green-700">S/ {tipoCotizacion === "convenio" ? item.price2 : item.price1}</span>
          <button
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-semibold shadow"
            onClick={() => {
              setCart((prev) => {
                const exists = prev.some((p) => p.id === item.id && p.type !== "promo");
                if (exists) return prev;
                return [...prev, { ...item, qty: 1, type: "producto" }];
              });
            }}
          >Agregar</button>
          <button
            className="px-2 py-1 bg-cyan-500 text-white rounded hover:bg-cyan-600 text-xs font-semibold flex items-center gap-1"
            title="Más información"
            onClick={() => {
              setInfoModalContent(item);
              setShowInfoModal(true);
            }}
          ><FaInfoCircle className="inline-block" /> Info</button>
        </div>
      </div>
    ));
  };

  return (
  <div className="max-w-4xl mx-auto p-2 sm:p-4 bg-gradient-to-br from-[#f6fcfc] via-white to-[#eaf6f6] rounded-xl shadow-2xl border border-[#b2e4e5] pt-40 sm:pt-0">
      {/* Modal Info Producto */}
      {showInfoModal && infoModalContent && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm flex flex-col">
            <h2 className="text-lg font-bold text-[#01878A] mb-2 flex items-center gap-2"><InfoIcon style={{ fontSize: 22, color: '#01878A' }} /> {infoModalContent.name}</h2>
            <p className="text-gray-700 text-sm mb-2">{infoModalContent.info ? `INFO: ${infoModalContent.info.toUpperCase()}` : "SIN DESCRIPCIÓN"}</p>
            <span className="text-green-700 font-bold mb-2">S/ {tipoCotizacion === "convenio" ? infoModalContent.price2 : infoModalContent.price1}</span>
            <span className="text-xs text-gray-500 mb-2">Tiempo de proceso: <span className="font-bold text-blue-600">{infoModalContent.time || "-"}</span></span>
            <button
              className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold mb-2"
              onClick={() => {
                setCart((prev) => {
                  const exists = prev.some((p) => p.id === infoModalContent.id && p.type !== "promo");
                  if (exists) return prev;
                  return [...prev, { ...infoModalContent, qty: 1, type: "producto" }];
                });
                setShowInfoModal(false);
                setInfoModalContent(null);
                setShowCart(true);
              }}
            >Cotizar</button>
            <button
              className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
              onClick={() => setShowInfoModal(false)}
            >Cerrar</button>
          </div>
        </div>
      )}
      {/* Modal para descripción larga de promoción */}
      {showPromoModal && promoModalContent && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm flex flex-col">
            <h2 className="text-lg font-bold text-[#01878A] mb-2 flex items-center gap-2"><InfoIcon style={{ fontSize: 22, color: '#01878A' }} /> {promoModalContent.title}</h2>
            <img src={promoModalContent.image} alt={promoModalContent.title} className="w-full h-40 object-cover rounded mb-2 bg-gray-100" />
            <p className="text-gray-700 text-sm mb-2">{promoModalContent.longDescription}</p>
            <span className="text-green-700 font-bold mb-2">S/ {promoModalContent.price}</span>
            <button
              className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold mb-2"
              onClick={() => {
                setCart((prev) => {
                  const exists = prev.some((p) => p.id === promoModalContent.id && p.type === "promo");
                  if (exists) return prev;
                  return [...prev, { ...promoModalContent, qty: 1, type: "promo" }];
                });
                setShowPromoModal(false);
                setPromoModalContent(null);
                setShowCart(true);
              }}
            >Cotizar</button>
            <button
              className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
              onClick={() => setShowPromoModal(false)}
            >Cerrar</button>
          </div>
        </div>
      )}
      {/* NAV principal dentro del componente */}
  <nav className="flex flex-col sm:flex-row items-center justify-between px-2 sm:px-4 py-2 bg-gradient-to-r from-[#b2e4e5] via-white to-[#01878A] rounded-xl mb-16 shadow-2xl gap-2 sm:gap-0 border border-[#b2e4e5] z-40 fixed top-1 left-0 w-full sm:static">
        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-center sm:justify-start">
          <img src={logo} alt="logo-inbioslab" className="w-20 h-20 sm:w-16 sm:h-16 md:w-20 md:h-20 object-center transition-all duration-300 bg-white rounded-full shadow border-4 border-[#01878A] mt-4 sm:mt-0 relative" style={{marginLeft: 0}} />
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#01878A] drop-shadow-lg tracking-wide">TARIFARIO INBIOSLAB</h1>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto justify-center sm:justify-end">
          {/* Icono hamburguesa solo en móvil */}
          <button
            className="sm:hidden bg-white rounded-full p-2 shadow border-2 border-[#01878A] hover:scale-105 transition"
            onClick={() => setShowSelectorMobile((prev) => !prev)}
            aria-label="Mostrar opciones"
          >
            <MenuIcon style={{ fontSize: 32, color: '#01878A' }} />
          </button>
          {/* Selector solo en desktop/tablet o si está abierto en móvil */}
          <select
            className={`px-3 py-2 rounded bg-[#01878A] text-white font-bold shadow border border-[#01878A] focus:outline-none transition-all duration-300 sm:block ${showSelectorMobile ? 'block animate-fade-in' : 'hidden'} sm:animate-none`}
            value={tipoCotizacion}
            onChange={e => {
              if (e.target.value === "convenio") {
                setShowClaveModal(true);
              } else {
                setTipoCotizacion("publico");
              }
            }}
          >
            <option value="publico">Cotizar precio público</option>
            <option value="convenio">Cotizar precio convenio</option>
          </select>
          <div
            className={`relative cursor-pointer bg-white rounded-full p-2 shadow border-2 border-[#01878A] hover:scale-105 transition ${cart.length > 0 ? 'animate-bounce-short' : 'animate-pulse-slow'}`}
            onClick={() => setShowCart(true)}
          >
            <ShoppingCartIcon
              style={{
                fontSize: 32,
                color: cart.length > 0 ? '#00bfae' : '#01878A',
                filter: 'drop-shadow(0 1px 2px #b2e4e5)'
              }}
            />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#01878A] text-white rounded-full px-2 text-xs font-bold border border-white shadow">{cart.length}</span>
            )}
          </div>
        </div>
      </nav>
      {/* Carrusel de promociones debajo del nav */}
      {promociones.length > 0 ? (
  <div className="w-full flex justify-center mb-2 pt-10 sm:pt-0">
          <div className="max-w-xs w-full bg-white rounded-lg shadow-md overflow-hidden flex flex-row items-center animate-fade-in relative p-2 gap-2 border-2 border-[#01878A]">
            <img src={promociones[promoIndex].image} alt={promociones[promoIndex].title} className="w-16 h-16 object-cover bg-[#b2e4e5] rounded" />
            <div className="flex-1 flex flex-col gap-1">
              <h2 className="text-sm font-bold text-[#01878A] leading-tight">{promociones[promoIndex].title}</h2>
              <p className="text-xs text-gray-700 leading-tight">{promociones[promoIndex].description}</p>
              <span className="text-[#01878A] font-bold text-xs">S/ {promociones[promoIndex].price}</span>
              <button
                className="mt-1 px-2 py-1 bg-gradient-to-r from-[#b2e4e5] to-[#01878A] text-[#01878A] rounded hover:bg-[#01878A] hover:text-white text-xs font-semibold self-start border border-[#b2e4e5]"
                onClick={() => {
                  setPromoModalContent(promociones[promoIndex]);
                  setShowPromoModal(true);
                }}
              >Ver más</button>
            </div>
            <span className="absolute top-1 left-1 bg-[#b2e4e5] text-[#01878A] px-2 py-1 rounded text-[10px] font-bold shadow border border-[#01878A]">PROMO</span>
          </div>
        </div>
      ) : (
        <div className="w-full flex justify-center mb-2">
          <div className="max-w-xs w-full bg-white rounded-lg shadow-md p-4 text-center text-[#01878A] text-xs">No hay promociones disponibles.</div>
        </div>
      )}
      <div className="mb-6">
        <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto">
          <input
            className="border-2 border-[#01878A] rounded-full px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#01878A] shadow-md text-base pr-10 bg-[#e6f7f7] text-black"
            type="text"
            placeholder="Buscar prueba..."
            name="search"
            value={search}
            onChange={(ev) => {
              setSearch(ev.target.value);
              setCurrentPage(1);
            }}
          />
          <SearchIcon className="absolute right-4 top-1/2 transform -translate-y-1/2" style={{ color: '#01878A', fontSize: 20 }} />
        </div>
      </div>
      <div className="grid gap-4">
        {paginatedProducts.map((item) => (
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
                    onClick={() => {
                      const row = document.getElementById(`product-row-${item.id}`);
                      if (row) {
                        row.classList.add('animate-shake');
                        setTimeout(() => {
                          row.classList.remove('animate-shake');
                          setCart(prev => prev.filter(p => p.id !== item.id));
                        }, 400);
                      } else {
                        setCart(prev => prev.filter(p => p.id !== item.id));
                      }
                    }}
                  >Quitar</button>
                </div>
              ) : (
                <button
                  className="px-3 py-1 border-2 rounded-xl font-bold shadow flex items-center gap-1 bg-white text-[#01878A] border-[#01878A] hover:bg-[#01878A] hover:text-white hover:shadow-lg transition text-sm group"
                  onClick={() => {
                    setCart((prev) => {
                      const exists = prev.some((p) => p.id === item.id && p.type !== "promo");
                      if (exists) return prev;
                      return [...prev, { ...item, qty: 1, type: "producto" }];
                    });
                  }}
                >
                  <AddCircleIcon style={{ fontSize: 20, color: 'currentColor' }} className="group-hover:text-white" /> Agregar
                </button>
              )}
              <button
                className="px-2 py-1 bg-white border-2 border-[#01878A] rounded-xl text-[#01878A] font-bold shadow flex items-center gap-1 transition hover:bg-[#01878A] hover:text-white hover:shadow-lg text-xs group"
                title="Más información"
                onClick={() => {
                  setInfoModalContent(item);
                  setShowInfoModal(true);
                }}
              ><InfoIcon style={{ fontSize: 18, color: 'currentColor' }} className="group-hover:text-white" /> Info</button>
            </div>
          </div>
        ))}
      </div>
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
      {/* Modal para carrito */}
      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md flex flex-col mt-16">
            <h2 className="text-xl font-bold text-[#01878A] mb-4 flex items-center gap-2">
              <ShoppingCartIcon style={{ fontSize: 28, color: '#01878A' }} /> Carrito de pruebas
            </h2>
            <div className="mb-4 grid grid-cols-1 gap-2">
              <input
                type="text"
                className="border rounded px-3 py-2 w-full text-sm"
                placeholder="Nombre del paciente"
                value={paciente.nombre}
                onChange={e => setPaciente(p => ({ ...p, nombre: e.target.value }))}
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  className="border rounded px-3 py-2 w-1/2 text-sm"
                  placeholder="Edad"
                  value={paciente.edad}
                  onChange={e => setPaciente(p => ({ ...p, edad: e.target.value }))}
                />
                <select
                  className="border rounded px-3 py-2 w-1/2 text-sm"
                  value={paciente.sexo}
                  onChange={e => setPaciente(p => ({ ...p, sexo: e.target.value }))}
                >
                  <option value="">Sexo</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
              </div>
              <input
                type="text"
                className="border rounded px-3 py-2 w-full text-sm"
                placeholder="Código/DNI"
                value={paciente.codigo}
                onChange={e => setPaciente(p => ({ ...p, codigo: e.target.value }))}
              />
              {tipoCotizacion === "convenio" && (
                <input
                  type="text"
                  className="border rounded px-3 py-2 w-full text-sm"
                  placeholder="Empresa que cotiza"
                  value={paciente.empresa}
                  onChange={e => setPaciente(p => ({ ...p, empresa: e.target.value }))}
                />
              )}
            </div>
            {cart.length === 0 ? (
              <div className="text-gray-500 text-center py-8">No hay productos en el carrito.</div>
            ) : (
              <div className="space-y-2 mb-4 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-white rounded p-2 shadow">
                    <div className="flex flex-col">
                      <span className="font-semibold text-blue-700">{item.name.toUpperCase()}</span>
                      <span className="text-xs text-gray-500">ID: {item.id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        value={item.qty}
                        className="w-14 px-2 py-1 border rounded text-center"
                        onChange={e => handleChangeQty(item.id, Number(e.target.value))}
                      />
                      <span className="text-green-700 font-bold">S/ {tipoCotizacion === "convenio" ? item.price2 : item.price1}</span>
                      <button
                        className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs font-semibold"
                        onClick={() => setCart(prev => prev.filter(p => p.id !== item.id))}
                      >Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Total del carrito */}
            <div className="w-full flex justify-end items-center mb-2">
              <span className="font-bold text-lg text-[#01878A] bg-[#eaf6f6] px-4 py-2 rounded shadow">
                Total: S/ {cart.reduce((acc, item) => acc + (tipoCotizacion === "convenio" ? item.price2 : item.price1) * item.qty, 0).toFixed(2)}
              </span>
            </div>
            <div className="flex gap-2 mt-2">
              <button
                className="w-full py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 font-semibold"
                onClick={() => setShowCart(false)}
              >Cerrar</button>
              <button
                className="w-full py-2 bg-red-500 text-white rounded hover:bg-red-600 font-semibold"
                onClick={handleClearAll}
                disabled={cart.length === 0 && !paciente.nombre && !paciente.edad && !paciente.sexo && !paciente.codigo && !paciente.empresa}
              >Limpiar carrito</button>
              <button
                className="w-full py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 font-semibold"
                onClick={async () => {
                  // Generar PDF formal con jsPDF y logo embebido
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
                  // Encabezado y logo
                  // Encabezado y logo
                  doc.setFont('helvetica', 'bold');
                  doc.addImage(logoBase64, 'PNG', 20, 12, 22, 22);
                  doc.setFontSize(15);
                  doc.text('LABORATORIO CLÍNICO INBIOSLAB', 45, 20);
                  doc.setFontSize(10);
                  doc.setFont('helvetica', 'normal');
                  doc.text('RUC 20603096046', 45, 26);
                  doc.text('Jr Calleria 135', 45, 30);
                  doc.text('Referencia: por la polleria la shapajita', 45, 34);
                  doc.text('Cel: 945241093 / 945241682', 45, 38);
                  doc.setDrawColor(60, 60, 60);
                  doc.setLineWidth(0.5);
                  doc.line(20, 42, 190, 42);
                  // Datos paciente
                  let y = 48;
                  doc.setFontSize(11);
                  doc.setFont('helvetica', 'bold');
                  doc.text(`Paciente:`, 20, y);
                  doc.setFont('helvetica', 'normal');
                  doc.text(`${paciente.nombre || "-"}` , 45, y);
                  doc.setFont('helvetica', 'bold');
                  doc.text(`Edad:`, 100, y);
                  doc.setFont('helvetica', 'normal');
                  doc.text(`${paciente.edad || "-"}` , 115, y);
                  doc.setFont('helvetica', 'bold');
                  doc.text(`Sexo:`, 140, y);
                  doc.setFont('helvetica', 'normal');
                  doc.text(`${paciente.sexo || "-"}` , 155, y);
                  y += 6;
                  doc.setFont('helvetica', 'bold');
                  doc.text(`Código/DNI:`, 20, y);
                  doc.setFont('helvetica', 'normal');
                  doc.text(`${paciente.codigo || "-"}` , 45, y);
                  if (tipoCotizacion === "convenio") {
                    doc.setFont('helvetica', 'bold');
                    doc.text(`Empresa:`, 100, y);
                    doc.setFont('helvetica', 'normal');
                    doc.text(`${paciente.empresa || "-"}` , 120, y);
                  }
                  y += 6;
                  doc.setFont('helvetica', 'bold');
                  doc.text(`Fecha:`, 20, y);
                  doc.setFont('helvetica', 'normal');
                  doc.text(`${new Date().toLocaleDateString()}` , 45, y);
                  doc.setFont('helvetica', 'bold');
                  doc.text(`Hora:`, 100, y);
                  doc.setFont('helvetica', 'normal');
                  doc.text(`${new Date().toLocaleTimeString()}` , 115, y);
                  y += 10;
                  // Tabla de cotización
                  doc.setFontSize(11);
                  doc.setFont('helvetica', 'bold');
                  doc.text('Cotización:', 20, y);
                  y += 6;
                  // Encabezado tabla
                  doc.setFillColor(224, 231, 255);
                  doc.rect(20, y - 5, 170, 8, 'F');
                  doc.setDrawColor(180, 180, 180);
                  doc.setLineWidth(0.2);
                  doc.rect(20, y - 5, 170, 8);
                  doc.text('#', 23, y);
                  doc.text('Examen', 30, y);
                  doc.text('Cant.', 100, y);
                  doc.text('Precio', 120, y);
                  doc.text('Subtotal', 150, y);
                  y += 7;
                  doc.setFont('helvetica', 'normal');
                  cart.forEach((item, idx) => {
                    doc.rect(20, y - 5, 170, 8);
                    doc.text(String(idx + 1), 23, y);
                    doc.text(item.name.toUpperCase(), 30, y);
                    doc.text(String(item.qty), 100, y);
                    const precio = (tipoCotizacion === "convenio" ? item.price2 : item.price1).toFixed(2);
                    doc.text(`S/ ${precio}`, 120, y);
                    doc.text(`S/ ${(item.qty * (tipoCotizacion === "convenio" ? item.price2 : item.price1)).toFixed(2)}`, 150, y);
                    y += 8;
                  });
                  // Total
                  doc.setFont('helvetica', 'bold');
                  doc.text('Total', 120, y);
                  doc.text(`S/ ${cart.reduce((acc, item) => acc + (tipoCotizacion === "convenio" ? item.price2 : item.price1) * item.qty, 0).toFixed(2)}`, 150, y);
                  y += 10;
                  doc.setFont('helvetica', 'normal');
                  doc.setFontSize(9);
                  doc.text('Esta cotización es referencial y válida solo para el día de emisión.', 20, y);
                  doc.save(`cotizacion_inbioslab_${Date.now()}.pdf`);
                }}
                disabled={cart.length === 0 || !paciente.nombre}
              >Descargar PDF</button>
            </div>
          </div>
        </div>
      )}
      {/* Modal para clave de convenio */}
      {showClaveModal && (
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
                onClick={() => {
                  if (claveInput === "inbios") {
                    setTipoCotizacion("convenio");
                    setShowClaveModal(false);
                    setClaveInput("");
                  } else {
                    alert("Clave incorrecta");
                  }
                }}
              >Aceptar</button>
              <button
                className="w-full py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 font-semibold"
                onClick={() => {
                  setShowClaveModal(false);
                  setClaveInput("");
                }}
              >Cancelar</button>
            </div>
          </div>
        </div>
      )}
    {/* Botón WhatsApp fijo abajo derecha */}
    {/* Botón WhatsApp colapsable y más arriba */}
    <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end">
      {!showWhatsapp ? (
        <button
          className="bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg p-2 flex items-center transition-all"
          style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.18)" }}
          onClick={() => setShowWhatsapp(true)}
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
            onClick={e => { e.preventDefault(); setShowWhatsapp(false); }}
            aria-label="Cerrar WhatsApp"
          >✕</button>
        </a>
      )}
    </div>
    </div>
  );
}

export default ProductsList;