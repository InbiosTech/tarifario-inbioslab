import { useEffect, useState } from "react";
import ProductsList from "./components/ProductsList";
import { dataSorted } from "./db/data.js";

const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || "").trim();
const EXAMS_UPDATED_STORAGE_KEY = "inbioslab_exams_updated_at";

function normalizePathname(value) {
  return String(value || "").replace(/\/+$/, "") || "/";
}

function isBaseRootPath(pathname, baseUrl) {
  const normalizedPath = normalizePathname(pathname);
  const normalizedBase = normalizePathname(baseUrl);
  return normalizedPath === normalizedBase;
}

function buildPublicRoute(baseUrl) {
  const normalizedBase = normalizePathname(baseUrl);
  return `${normalizedBase}/publico`;
}

function getPublicCanonicalRedirectTarget() {
  const params = new URLSearchParams(window.location.search || "");
  if (params.get("p")) {
    return "";
  }

  const base = String(import.meta.env.BASE_URL || "/").replace(/\/+$/, "");
  const currentPath = String(window.location.pathname || "/");
  if (!isBaseRootPath(currentPath, base)) {
    return "";
  }

  const publicPath = buildPublicRoute(base);
  const targetUrl = `${publicPath}${window.location.search || ""}${window.location.hash || ""}`;
  const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (targetUrl === currentUrl) {
    return "";
  }

  return targetUrl;
}

function restoreSpaPathFromQuery() {
  const params = new URLSearchParams(window.location.search || "");
  const redirectedPath = params.get("p");
  if (!redirectedPath) {
    return String(window.location.pathname || "/");
  }

  const base = String(import.meta.env.BASE_URL || "/").replace(/\/+$/, "");
  const redirectedQuery = params.get("q");
  const safePath = String(redirectedPath).startsWith("/")
    ? String(redirectedPath)
    : `/${String(redirectedPath)}`;

  const nextPath = `${base}${safePath}`;
  const nextSearch = redirectedQuery ? `?${redirectedQuery}` : "";
  const nextUrl = `${nextPath}${nextSearch}${window.location.hash || ""}`;

  if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== nextUrl) {
    window.history.replaceState(null, "", nextUrl);
  }

  return nextPath;
}

function resolveAppModeFromPath() {
  const searchParams = new URLSearchParams(window.location.search || "");
  const explicitMode = String(searchParams.get("mode") || "").toLowerCase().trim();
  if (["admin", "convenio", "publico"].includes(explicitMode)) {
    return explicitMode;
  }

  const restoredPath = restoreSpaPathFromQuery();
  const path = String(restoredPath || "/").toLowerCase().replace(/\/+$/, "") || "/";

  const hashPath = String(window.location.hash || "")
    .replace(/^#/, "")
    .toLowerCase()
    .replace(/\/+$/, "");

  if (hashPath.endsWith("/admin")) return "admin";
  if (hashPath.endsWith("/convenio")) return "convenio";
  if (hashPath.endsWith("/publico")) return "publico";
  if (path.endsWith("/admin")) return "admin";
  if (path.endsWith("/convenio")) return "convenio";
  if (path.endsWith("/publico")) return "publico";
  return "publico";
}

function App() {
  const [redirectTarget] = useState(getPublicCanonicalRedirectTarget);
  const [products, setProducts] = useState(dataSorted);
  const [appMode] = useState(() => (redirectTarget ? "publico" : resolveAppModeFromPath()));

  useEffect(() => {
    if (!redirectTarget) return;

    const timer = window.setTimeout(() => {
      window.location.replace(redirectTarget);
    }, 550);

    return () => {
      window.clearTimeout(timer);
    };
  }, [redirectTarget]);

  if (redirectTarget) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f6fcfc] via-white to-[#eaf6f6] px-4">
        <div className="max-w-md w-full rounded-2xl border border-[#b2e4e5] bg-white shadow-xl p-6 text-center">
          <h2 className="text-xl font-black text-[#017f82]">Redirigiendo a Tarifa Publico...</h2>
          <p className="mt-2 text-sm text-[#016b6d]">Un momento por favor.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (!API_BASE_URL) {
      setProducts(dataSorted);
      return;
    }

    let isCancelled = false;

    const fetchProducts = async () => {
      try {
        const allRows = [];
        let currentPage = 1;
        let totalPages = 1;

        // The API is paginated; iterate all pages to keep client search complete.
        while (currentPage <= totalPages) {
          const params = new URLSearchParams({
            page: String(currentPage),
            pageSize: "100",
            sortBy: "id",
            sortOrder: "asc",
          });

          const response = await fetch(`${API_BASE_URL}/exams?${params.toString()}`);
          if (!response.ok) {
            throw new Error(`API response ${response.status}`);
          }

          const body = await response.json();

          // Backward compatibility if API returns plain array.
          if (Array.isArray(body)) {
            allRows.push(...body);
            break;
          }

          const pageRows = Array.isArray(body?.items) ? body.items : [];
          allRows.push(...pageRows);

          totalPages = Number(body?.pagination?.totalPages || 1);
          currentPage += 1;
        }

        if (isCancelled || allRows.length === 0) {
          return;
        }

        setProducts(allRows);
      } catch (error) {
        console.warn("No se pudo cargar desde API; usando data local.", error);
        if (!isCancelled) {
          setProducts(dataSorted);
        }
      }
    };

    const handleExamsUpdated = () => {
      fetchProducts();
    };

    const handleExamsStorageUpdated = (event) => {
      if (event.key === EXAMS_UPDATED_STORAGE_KEY) {
        fetchProducts();
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchProducts();
      }
    };

    const examsRefreshIntervalId = window.setInterval(() => {
      if (!document.hidden) {
        fetchProducts();
      }
    }, 30000);

    window.addEventListener("inbioslab:exams-updated", handleExamsUpdated);
    window.addEventListener("storage", handleExamsStorageUpdated);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    fetchProducts();

    return () => {
      isCancelled = true;
      window.clearInterval(examsRefreshIntervalId);
      window.removeEventListener("inbioslab:exams-updated", handleExamsUpdated);
      window.removeEventListener("storage", handleExamsStorageUpdated);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return <ProductsList products={products} mode={appMode} />;
}

export default App;