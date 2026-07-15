import { jsPDF } from "jspdf";
import { useState, useEffect, Suspense, lazy, useRef } from "react";
import InfoModal from "./InfoModal/InfoModal";
import PromoModal from "./PromoModal/PromoModal";
import CartModal from "./CartModal/CartModal";
import FloatingWhatsappButton from "./FloatingWhatsappButton/FloatingWhatsappButton";
import ProductsListGrid from "./ProductsListGrid/ProductsListGrid";
import NavBar from "./NavBar/NavBar";
import PromotionsCarousel from "./PromotionsCarousel/PromotionsCarousel";
import ProductSearch from "./ProductSearch/ProductSearch";
import AdminHome from "./Admin/AdminHome";
import AdminLogin from "./Admin/AdminLogin";
import { drawPdfHeader, drawPdfPatientData, drawPdfQuotationTable, drawPdfFooter } from "../utils/pdfUtils";

const MovilidadForm = lazy(() => import("./Admin/MovilidadForm"));
const ExamsAdmin = lazy(() => import("./Admin/ExamsAdmin"));
const PromotionsAdmin = lazy(() => import("./Admin/PromotionsAdmin"));
const InventoryAdmin = lazy(() => import("./Admin/InventoryAdmin"));
const SettingsAdmin = lazy(() => import("./Admin/SettingsAdmin"));

const ADMIN_ROUTE_STORAGE_KEY = "inbioslab_admin_route";
const PROMOTIONS_UPDATED_STORAGE_KEY = "inbioslab_promotions_updated_at";
const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || "").trim();
const APP_BASE_URL = String(import.meta.env.BASE_URL || "/").replace(/^\/+|\/+$/g, "");

function getApiOrigin() {
  if (!API_BASE_URL) return "";
  try {
    return new URL(API_BASE_URL).origin;
  } catch (_error) {
    return "";
  }
}

function resolvePromotionImageUrl(rawValue) {
  const value = String(rawValue || "").trim();
  if (!value) return "";

  if (/^(https?:|data:|blob:)/i.test(value)) {
    try {
      const parsed = new URL(value);
      const isSecurePage = typeof window !== "undefined" && window.location.protocol === "https:";
      if (isSecurePage && parsed.protocol === "http:") {
        parsed.protocol = "https:";
        return parsed.toString();
      }
    } catch (_error) {
      // keep original URL if parsing fails
    }
    return value;
  }

  const apiOrigin = getApiOrigin();
  const siteOrigin = typeof window !== "undefined" ? window.location.origin : "";

  if (value.startsWith("/uploads/")) {
    return apiOrigin ? `${apiOrigin}${value}` : value;
  }

  if (value.startsWith(`/${APP_BASE_URL}/`) || value.startsWith("/promos/")) {
    return siteOrigin ? `${siteOrigin}${value}` : value;
  }

  if (value.startsWith("/")) {
    return apiOrigin ? `${apiOrigin}${value}` : value;
  }

  return `${import.meta.env.BASE_URL}${value.replace(/^\/+/, "")}`;
}

function pickFirstValidImage(...candidates) {
  const first = candidates.find((item) => String(item || "").trim());
  return resolvePromotionImageUrl(first);
}

async function isImageReachable(imageUrl) {
  const url = String(imageUrl || "").trim();
  if (!url) return false;

  try {
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });
    if (!res.ok) return false;

    const contentType = String(res.headers.get("content-type") || "").toLowerCase();
    return contentType.startsWith("image/");
  } catch (_error) {
    return false;
  }
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function normalizePromotion(value) {
  const title = String(value?.title || "").trim();
  const basePrice = Number(value?.basePrice ?? value?.price1 ?? value?.price ?? 0);
  const promoPrice = Number(value?.promoPrice ?? value?.promo_price ?? value?.price ?? basePrice);
  const price = Number.isFinite(promoPrice) ? promoPrice : basePrice;
  const fundament = String(value?.fundament || "").trim();

  return {
    id: value?.id,
    examId: value?.examId,
    title,
    description: String(value?.description || "").trim(),
    fundament,
    longDescription: String(value?.longDescription || value?.long_description || fundament).trim(),
    price: Number.isFinite(price) ? price : 0,
    basePrice: Number.isFinite(basePrice) ? basePrice : 0,
    promoPrice: Number.isFinite(promoPrice) ? promoPrice : (Number.isFinite(basePrice) ? basePrice : 0),
    price1: Number.isFinite(price) ? price : 0,
    price2: Number.isFinite(price) ? price : 0,
    name: String(value?.name || title).trim() || title,
    image: pickFirstValidImage(value?.image, value?.image_url, value?.imageModal, value?.imageCard),
    imageCard: pickFirstValidImage(value?.imageCard, value?.image_card_url, value?.image, value?.image_url),
    imageModal: pickFirstValidImage(value?.imageModal, value?.image_modal_url, value?.image, value?.image_url),
    active: Number(value?.active ?? value?.is_active ?? 1) === 0 ? 0 : 1,
  };
}

const ProductsList = ({ products, mode = "publico" }) => {
  const currentMode = String(mode || "publico").toLowerCase();
  const isPublicMode = currentMode === "publico";
  const isConvenioMode = currentMode === "convenio";
  const isAdminMode = currentMode === "admin";

  // Estado para mostrar/desplegar el botón de WhatsApp
  const [showWhatsapp, setShowWhatsapp] = useState(false);
  // Estado para mostrar el selector en móvil
  const [showSelectorMobile, setShowSelectorMobile] = useState(false);
  // Carrusel de promociones dinámico
  const [promociones, setPromociones] = useState([]);
  const [promotionsLoading, setPromotionsLoading] = useState(true);
  const [promoIndex, setPromoIndex] = useState(0);

  useEffect(() => {
    if (isAdminMode) {
      setPromotionsLoading(false);
      return;
    }

    let mounted = true;

    const loadPromotions = async () => {
      try {
        if (mounted) setPromotionsLoading(true);

        if (API_BASE_URL) {
          const audience = isConvenioMode ? "convenio" : "publico";
          const apiRes = await fetch(`${API_BASE_URL}/promotions?audience=${audience}`);
          if (apiRes.ok) {
            const apiData = await apiRes.json();
            if (Array.isArray(apiData) && apiData.length > 0) {
              const normalizedApiPromotions = apiData.map(normalizePromotion);
              const validatedApiPromotions = await Promise.all(
                normalizedApiPromotions.map(async (promo) => {
                  const promoImage = promo.imageCard || promo.imageModal || promo.image;
                  if (!promoImage) return promo;

                  const imageOk = await isImageReachable(promoImage);
                  if (imageOk) return promo;

                  return {
                    ...promo,
                    image: "",
                    imageCard: "",
                    imageModal: "",
                  };
                })
              );

              if (!mounted) return;
              setPromociones(validatedApiPromotions);
              setPromoIndex(0);
              setPromotionsLoading(false);
              return;
            }
          }

          if (!mounted) return;
          setPromociones([]);
          setPromoIndex(0);
          setPromotionsLoading(false);
          return;
        }

        if (!mounted) return;
        setPromociones([]);
        setPromoIndex(0);
        setPromotionsLoading(false);
      } catch {
        if (mounted) {
          setPromociones([]);
          setPromoIndex(0);
          setPromotionsLoading(false);
        }
      }
    };

    const onPromotionsUpdated = () => {
      loadPromotions();
    };

    const onPromotionsStorageUpdated = (event) => {
      if (event.key === PROMOTIONS_UPDATED_STORAGE_KEY) {
        loadPromotions();
      }
    };

    const onVisibilityChange = () => {
      if (!document.hidden) {
        loadPromotions();
      }
    };

    const promotionsRefreshIntervalId = window.setInterval(() => {
      if (!document.hidden) {
        loadPromotions();
      }
    }, 30000);

    loadPromotions();
    window.addEventListener("inbioslab:promotions-updated", onPromotionsUpdated);
    window.addEventListener("storage", onPromotionsStorageUpdated);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      mounted = false;
      window.clearInterval(promotionsRefreshIntervalId);
      window.removeEventListener("inbioslab:promotions-updated", onPromotionsUpdated);
      window.removeEventListener("storage", onPromotionsStorageUpdated);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [isAdminMode, isConvenioMode]);

  useEffect(() => {
    if (promociones.length === 0) return;
    const timer = setInterval(() => {
      setPromoIndex((prev) => (prev + 1) % promociones.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [promociones]);

  // Estados principales
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [tipoCotizacion, setTipoCotizacion] = useState(isPublicMode ? "publico" : (isAdminMode ? "admin" : "convenio"));
  const [adminView, setAdminView] = useState(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoModalContent, setPromoModalContent] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoModalContent, setInfoModalContent] = useState(null);
  const [enterAddToast, setEnterAddToast] = useState("");
  const [adminAuthStatus, setAdminAuthStatus] = useState("idle");
  const [whatsappQuoteNumber, setWhatsappQuoteNumber] = useState("945241682");
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (!API_BASE_URL) return;

    let mounted = true;

    const loadPublicSettings = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/settings/public`);
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          return;
        }

        const incoming = String(body?.whatsappQuoteNumber || "").trim();
        if (mounted && incoming) {
          setWhatsappQuoteNumber(incoming);
        }
      } catch (_error) {
        // Keep default when endpoint is not available.
      }
    };

    const onSettingsUpdated = () => {
      loadPublicSettings();
    };

    loadPublicSettings();
    window.addEventListener("inbioslab:settings-updated", onSettingsUpdated);

    return () => {
      mounted = false;
      window.removeEventListener("inbioslab:settings-updated", onSettingsUpdated);
    };
  }, []);

  const checkAdminSession = async () => {
    if (!API_BASE_URL) {
      setAdminAuthStatus("unauthenticated");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/session`, {
        credentials: "include",
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body?.authenticated === true && body?.role === "admin") {
        setAdminAuthStatus("authenticated");
      } else {
        setAdminAuthStatus("unauthenticated");
      }
    } catch (_error) {
      setAdminAuthStatus("unauthenticated");
    }
  };

  const logoutAdminSession = async () => {
    if (!API_BASE_URL) return;
    try {
      await fetch(`${API_BASE_URL}/auth/admin/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (_error) {
      // No-op on logout best effort.
    }
  };

  useEffect(() => {
    if (isAdminMode) {
      setAdminAuthStatus("checking");
      checkAdminSession();

      const savedAdminRoute = window.sessionStorage.getItem(ADMIN_ROUTE_STORAGE_KEY);
      if (savedAdminRoute === "home" || savedAdminRoute === "movilidad" || savedAdminRoute === "exams" || savedAdminRoute === "promotions" || savedAdminRoute === "inventory" || savedAdminRoute === "settings") {
        setAdminView(savedAdminRoute);
      } else {
        setAdminView("home");
      }
      setTipoCotizacion("admin");
      return;
    }

    setAdminView(null);
    setAdminAuthStatus("idle");
    setTipoCotizacion(isPublicMode ? "publico" : "convenio");

    const savedAdminRoute = window.sessionStorage.getItem(ADMIN_ROUTE_STORAGE_KEY);
    if (savedAdminRoute) {
      window.sessionStorage.removeItem(ADMIN_ROUTE_STORAGE_KEY);
    }
  }, [isAdminMode, isPublicMode]);

  useEffect(() => {
    if (adminView === "home" || adminView === "movilidad" || adminView === "exams" || adminView === "promotions" || adminView === "inventory" || adminView === "settings") {
      window.sessionStorage.setItem(ADMIN_ROUTE_STORAGE_KEY, adminView);
      return;
    }
    window.sessionStorage.removeItem(ADMIN_ROUTE_STORAGE_KEY);
  }, [adminView]);

  const pageSize = 5;
  const filteredProducts = products ? (
    search.trim() === ""
      ? products
      : products.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()))
  ) : [];
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const subtotalBase = cart.reduce((acc, item) => {
    const precioBase = tipoCotizacion === "convenio" ? item.price2 : item.price1;
    return acc + Number(precioBase || 0) * Number(item.qty || 0);
  }, 0);
  const totalCotizador = subtotalBase;

  // Handlers
  const handlePrev = () => setCurrentPage((prev) => Math.max(1, prev - 1));
  const handleNext = () => setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  
  const handleClearAll = () => {
    setCart([]);
  };
  const handleChangeQty = (id, qty) => {
    setCart((prev) => prev.map(item => item.id === id ? { ...item, qty: Math.max(1, qty) } : item));
  };
  const handleAddCustomItem = ({ name, price }) => {
    const customId = `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    setCart((prev) => [
      ...prev,
      {
        id: customId,
        name: (name || "").toUpperCase(),
        qty: 1,
        price1: Number(price) || 0,
        price2: Number(price) || 0,
        type: "custom",
      },
    ]);
  };
  const handleChangeItemName = (id, name) => {
    setCart((prev) => prev.map(item => item.id === id ? { ...item, name } : item));
  };

  const handleSearchEnterAdd = () => {
    const query = normalizeText(search);
    if (!query) return;

    const exactMatch = filteredProducts.find((item) => normalizeText(item.name) === query);
    const productToAdd = exactMatch || filteredProducts[0];
    if (!productToAdd) return;

    setCart((prev) => {
      const existingIndex = prev.findIndex((p) => p.id === productToAdd.id && p.type !== "promo");
      if (existingIndex >= 0) {
        const next = [...prev];
        const nextQty = Math.max(1, Number(next[existingIndex].qty || 1) + 1);
        next[existingIndex] = {
          ...next[existingIndex],
          qty: nextQty,
        };
        setEnterAddToast(`Agregado: ${productToAdd.name.toUpperCase()} (x${nextQty})`);
        return next;
      }
      setEnterAddToast(`Agregado: ${productToAdd.name.toUpperCase()} (x1)`);
      return [...prev, { ...productToAdd, qty: 1, type: "producto" }];
    });

    setSearch("");
    setCurrentPage(1);

    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }

    window.setTimeout(() => {
      setEnterAddToast("");
    }, 1500);
  };

  

  if (isAdminMode && adminAuthStatus !== "authenticated") {
    return (
      <div className="max-w-4xl mx-auto p-2 sm:p-4 bg-gradient-to-br from-[#f6fcfc] via-white to-[#eaf6f6] rounded-xl shadow-2xl border border-[#b2e4e5] pt-56 sm:pt-4">
        {adminAuthStatus === "checking" ? (
          <div className="max-w-xl mx-auto p-6 bg-white rounded-2xl border border-[#b2e4e5] text-center text-[#016b6d] font-semibold shadow">
            Verificando sesion de administrador...
          </div>
        ) : (
          <AdminLogin
            onAuthenticated={() => {
              setAdminAuthStatus("authenticated");
              setAdminView("home");
            }}
          />
        )}
      </div>
    );
  }

  if (isAdminMode && adminView === "home") {
    return (
      <AdminHome
        onGoMovilidad={() => setAdminView("movilidad")}
        onGoExams={() => setAdminView("exams")}
        onGoPromotions={() => setAdminView("promotions")}
        onGoInventory={() => setAdminView("inventory")}
        onGoSettings={() => setAdminView("settings")}
        onGoConvenio={async () => {
          await logoutAdminSession();
          window.location.href = `${import.meta.env.BASE_URL}convenio`;
        }}
        onGoPublico={async () => {
          await logoutAdminSession();
          window.location.href = `${import.meta.env.BASE_URL}publico`;
        }}
        onLogout={async () => {
          await logoutAdminSession();
          window.location.href = `${import.meta.env.BASE_URL}admin`;
        }}
      />
    );
  }

  if (isAdminMode && adminView === "movilidad") {
    return (
      <Suspense
        fallback={
          <div className="max-w-6xl mx-auto p-6 bg-white rounded-xl shadow-2xl border border-[#b2e4e5] text-center text-[#01878A] font-semibold">
            Cargando modulo de movilidad...
          </div>
        }
      >
        <MovilidadForm onBackHome={() => setAdminView("home")} />
      </Suspense>
    );
  }

  if (isAdminMode && adminView === "exams") {
    return (
      <Suspense
        fallback={
          <div className="max-w-6xl mx-auto p-6 bg-white rounded-xl shadow-2xl border border-[#b2e4e5] text-center text-[#01878A] font-semibold">
            Cargando modulo de examenes...
          </div>
        }
      >
        <ExamsAdmin onBackHome={() => setAdminView("home")} />
      </Suspense>
    );
  }

  if (isAdminMode && adminView === "promotions") {
    return (
      <Suspense
        fallback={
          <div className="max-w-6xl mx-auto p-6 bg-white rounded-xl shadow-2xl border border-[#b2e4e5] text-center text-[#01878A] font-semibold">
            Cargando modulo de promociones...
          </div>
        }
      >
        <PromotionsAdmin onBackHome={() => setAdminView("home")} />
      </Suspense>
    );
  }

  if (isAdminMode && adminView === "inventory") {
    return (
      <Suspense
        fallback={
          <div className="max-w-6xl mx-auto p-6 bg-white rounded-xl shadow-2xl border border-[#b2e4e5] text-center text-[#01878A] font-semibold">
            Cargando inventario...
          </div>
        }
      >
        <InventoryAdmin onBackHome={() => setAdminView("home")} />
      </Suspense>
    );
  }

  if (isAdminMode && adminView === "settings") {
    return (
      <Suspense
        fallback={
          <div className="max-w-6xl mx-auto p-6 bg-white rounded-xl shadow-2xl border border-[#b2e4e5] text-center text-[#01878A] font-semibold">
            Cargando configuracion...
          </div>
        }
      >
        <SettingsAdmin onBackHome={() => setAdminView("home")} />
      </Suspense>
    );
  }

  return (
  <div className="max-w-4xl mx-auto p-2 sm:p-4 bg-gradient-to-br from-[#f6fcfc] via-white to-[#eaf6f6] rounded-xl shadow-2xl border border-[#b2e4e5] pt-56 sm:pt-0">
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
        cartTotal={totalCotizador}
        tipoCotizacion={tipoCotizacion}
        onTipoCotizacionChange={() => {}}
        onCartClick={() => setShowCart(true)}
        showSelectorMobile={showSelectorMobile}
        onToggleSelectorMobile={() => setShowSelectorMobile(prev => !prev)}
        showModeSelector={false}
        modeBadgeText={tipoCotizacion === "publico" ? "Tarifa Publico" : "Tarifa Convenio"}
      />
      {enterAddToast && (
        <div className="mb-3 flex justify-center">
          <div className="px-4 py-2 rounded-lg bg-green-50 border border-green-300 text-green-800 font-semibold text-xs sm:text-sm shadow">
            {enterAddToast}
          </div>
        </div>
      )}
      {/* Carrusel de promociones modularizado */}
      <PromotionsCarousel
        promociones={promociones}
        isLoading={promotionsLoading}
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
        onSearchEnter={handleSearchEnterAdd}
        inputRef={searchInputRef}
      />
      {/* Componente modularizado ProductsListGrid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-8 text-sm sm:text-base text-[#016b6d] font-semibold bg-[#f6fcfc] border border-[#b2e4e5] rounded-xl shadow">
          No se encontraron pruebas para "{search}". Limpia el buscador para ver toda la lista.
        </div>
      ) : (
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
      )}
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
          tipoCotizacion={tipoCotizacion}
          whatsappQuoteNumber={whatsappQuoteNumber}
          onAddCustomItem={handleAddCustomItem}
          onChangeItemName={handleChangeItemName}
          onRemoveItem={id => setCart(prev => prev.filter(p => p.id !== id))}
          onClose={() => setShowCart(false)}
          onClearAll={handleClearAll}
          onExportPDF={async ({ nombre, edad, dni }) => {
            if (cart.length === 0) {
              alert("Agrega al menos un producto al carrito para descargar la cotización.");
              return;
            }
            if (cart.some(item => !item.name || !item.name.trim())) {
              alert("Completa el nombre de todas las pruebas antes de exportar.");
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
            const pacientePayload = {
              nombre: String(nombre || "CLIENTE").toUpperCase(),
              edad: String(edad || ""),
              sexo: "",
              codigo: String(dni || ""),
              empresa: "",
              medicoReferencia: "",
            };
            let y = drawPdfPatientData(doc, pacientePayload, tipoCotizacion);
            y = drawPdfQuotationTable(doc, cart, tipoCotizacion, 0, 0, y);
            drawPdfFooter(doc, cart, tipoCotizacion, 0, "", 0, y);
            const fecha = new Date();
            const fechaStr = `${fecha.getFullYear()}-${String(fecha.getMonth()+1).padStart(2,'0')}-${String(fecha.getDate()).padStart(2,'0')}`;
            const nombrePaciente = pacientePayload.nombre || "CLIENTE";
            doc.save(`cotizacion_${nombrePaciente}_${fechaStr}.pdf`);
          }}
        />
      )}
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
  mode: PropTypes.oneOf(["publico", "convenio", "admin"]),
};

export default ProductsList;