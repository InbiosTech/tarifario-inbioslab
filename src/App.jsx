import { useEffect, useState } from "react";
import ProductsList from "./components/ProductsList";
import { dataSorted } from "./db/data.js";

const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || "").trim();

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

function restoreSpaPathFromQuery() {
  const params = new URLSearchParams(window.location.search || "");
  const redirectedPath = params.get("p");
  const base = String(import.meta.env.BASE_URL || "/").replace(/\/+$/, "");
  if (!redirectedPath) {
    const currentPath = String(window.location.pathname || "/");
    if (isBaseRootPath(currentPath, base)) {
      const publicPath = buildPublicRoute(base);
      const nextUrl = `${publicPath}${window.location.search || ""}${window.location.hash || ""}`;
      if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== nextUrl) {
        window.history.replaceState(null, "", nextUrl);
      }
      return publicPath;
    }

    return currentPath;
  }

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
  const [products, setProducts] = useState(dataSorted);
  const [appMode] = useState(resolveAppModeFromPath);

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

    window.addEventListener("inbioslab:exams-updated", handleExamsUpdated);

    fetchProducts();

    return () => {
      isCancelled = true;
      window.removeEventListener("inbioslab:exams-updated", handleExamsUpdated);
    };
  }, []);

  return <ProductsList products={products} mode={appMode} />;
}

export default App;