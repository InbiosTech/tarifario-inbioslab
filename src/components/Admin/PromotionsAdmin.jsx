import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";

const EMPTY_FORM = {
  id: "",
  examId: "",
  code: "",
  title: "",
  description: "",
  fundament: "",
  longDescription: "",
  name: "",
  image: "",
  imageCard: "",
  imageModal: "",
  basePrice: "",
  promoPrice: "",
  promoPricePublic: "",
  promoPriceConvenio: "",
  appliesTo: "publico",
  active: "1",
  displayOrder: "0",
};

const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || "").trim();
const PROMOTIONS_UPDATED_STORAGE_KEY = "inbioslab_promotions_updated_at";

function notifyPromotionsUpdated() {
  window.dispatchEvent(new Event("inbioslab:promotions-updated"));
  try {
    window.localStorage.setItem(PROMOTIONS_UPDATED_STORAGE_KEY, String(Date.now()));
  } catch (_error) {
    // Ignore storage sync errors (private mode/quota issues).
  }
}

function PromotionsAdmin({ onBackHome }) {
  const apiBaseUrl = API_BASE_URL;

  const [items, setItems] = useState([]);
  const [examOptions, setExamOptions] = useState([]);
  const [search, setSearch] = useState("");
  const [includeInactive, setIncludeInactive] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalItems: 0 });
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);

  const canUseApi = useMemo(() => Boolean(apiBaseUrl), [apiBaseUrl]);
  const writeHeaders = useMemo(
    () => ({
      "Content-Type": "application/json",
    }),
    []
  );

  const loadData = async (targetPage = page) => {
    if (!canUseApi) return;

    setLoading(true);
    setMessage("");
    try {
      const params = new URLSearchParams({
        page: String(targetPage),
        pageSize: String(pageSize),
        search: search.trim(),
        sortBy: "displayOrder",
        sortOrder: "asc",
      });

      if (includeInactive) {
        params.set("includeInactive", "1");
      }

      const res = await fetch(`${apiBaseUrl}/promotions/admin?${params.toString()}`, {
        credentials: "include",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Error ${res.status}`);
      }

      const body = await res.json();
      setItems(Array.isArray(body?.items) ? body.items : []);
      setPagination(body?.pagination || { page: 1, totalPages: 1, totalItems: 0 });
      setPage(targetPage);
    } catch (error) {
      setMessage(`No se pudo cargar promociones: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadExamOptions = async () => {
    if (!canUseApi) return;

    try {
      const all = [];
      let current = 1;
      let totalPages = 1;

      while (current <= totalPages) {
        const params = new URLSearchParams({
          page: String(current),
          pageSize: "100",
          sortBy: "name",
          sortOrder: "asc",
        });

        const res = await fetch(`${apiBaseUrl}/exams?${params.toString()}`);
        if (!res.ok) {
          throw new Error(`Error ${res.status}`);
        }

        const body = await res.json();
        const pageRows = Array.isArray(body?.items) ? body.items : [];
        all.push(...pageRows);
        totalPages = Number(body?.pagination?.totalPages || 1);
        current += 1;
      }

      setExamOptions(all);
    } catch (_error) {
      setExamOptions([]);
    }
  };

  useEffect(() => {
    loadData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, includeInactive]);

  useEffect(() => {
    loadExamOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUseApi]);

  const resetForm = () => setForm(EMPTY_FORM);

  const selectForEdit = (item) => {
    setForm({
      id: String(item.id),
      examId: String(item.examId || ""),
      code: item.code || "",
      title: item.title || "",
      description: item.description || "",
      fundament: item.fundament || "",
      longDescription: item.longDescription || "",
      name: item.name || "",
      image: item.image || "",
      imageCard: item.imageCard || item.image || "",
      imageModal: item.imageModal || item.image || "",
      basePrice: String(item.basePrice ?? item.price ?? ""),
      promoPrice: String(item.promoPrice ?? item.price ?? ""),
      promoPricePublic: String(item.promoPricePublic ?? item.promoPrice ?? item.price ?? ""),
      promoPriceConvenio: String(item.promoPriceConvenio ?? item.promoPrice ?? item.price ?? ""),
      appliesTo: String(item.appliesTo || "publico"),
      active: String(item.active ?? 1),
      displayOrder: String(item.displayOrder ?? 0),
    });
  };

  const buildPayload = () => ({
    examId: Number(form.examId || 0),
    code: form.code,
    title: form.title,
    description: form.description,
    fundament: form.fundament,
    longDescription: form.longDescription,
    name: form.name,
    image: form.imageModal || form.imageCard || form.image,
    imageCard: form.imageCard || form.image,
    imageModal: form.imageModal || form.image,
    appliesTo: String(form.appliesTo || "publico").toLowerCase(),
    price: Number(form.basePrice || 0),
    promoPrice: Number(form.promoPricePublic || form.promoPrice || 0),
    promoPricePublic: Number(form.promoPricePublic || 0),
    promoPriceConvenio: Number(form.promoPriceConvenio || 0),
    active: Number(form.active || 1),
    displayOrder: Number(form.displayOrder || 0),
  });

  const createPromotion = async () => {
    if (!canUseApi) return;
    setMessage("");

    const res = await fetch(`${apiBaseUrl}/promotions`, {
      method: "POST",
      headers: writeHeaders,
      credentials: "include",
      body: JSON.stringify(buildPayload()),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || `Error ${res.status}`);
    }

    setMessage("Promocion creada correctamente.");
    resetForm();
    await loadData(1);
    notifyPromotionsUpdated();
  };

  const updatePromotion = async () => {
    if (!canUseApi || !form.id) return;
    setMessage("");

    const res = await fetch(`${apiBaseUrl}/promotions/${form.id}`, {
      method: "PUT",
      headers: writeHeaders,
      credentials: "include",
      body: JSON.stringify(buildPayload()),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || `Error ${res.status}`);
    }

    setMessage("Promocion actualizada correctamente.");
    await loadData(page);
    notifyPromotionsUpdated();
  };

  const deletePromotion = async (id) => {
    if (!canUseApi) return;
    const ok = window.confirm("Deseas eliminar esta promocion?");
    if (!ok) return;

    setMessage("");
    const res = await fetch(`${apiBaseUrl}/promotions/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || `Error ${res.status}`);
    }

    setMessage("Promocion eliminada.");
    if (String(form.id) === String(id)) {
      resetForm();
    }
    await loadData(page);
    notifyPromotionsUpdated();
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    try {
      if (form.id) {
        await updatePromotion();
      } else {
        await createPromotion();
      }
    } catch (error) {
      setMessage(error.message || "No se pudo guardar la promocion.");
    }
  };

  const onExamChange = (value) => {
    const examId = String(value || "");
    const selectedExam = examOptions.find((item) => String(item.id) === examId);

    setForm((prev) => {
      if (!selectedExam) {
        return {
          ...prev,
          examId,
        };
      }

      const fundament = String(selectedExam.method || selectedExam.info || "").trim();
      const sample = String(selectedExam.sample || "").trim();
      const title = String(selectedExam.name || "").trim();

      return {
        ...prev,
        examId,
        title: title || prev.title,
        name: title || prev.name,
        description: sample || prev.description,
        fundament,
        longDescription: fundament || prev.longDescription,
        basePrice: String(Number(selectedExam.price1 || 0).toFixed(2)),
        promoPrice: prev.promoPrice || String(Number(selectedExam.price1 || 0).toFixed(2)),
        promoPricePublic: prev.promoPricePublic || String(Number(selectedExam.price1 || 0).toFixed(2)),
        promoPriceConvenio: prev.promoPriceConvenio || String(Number(selectedExam.price2 || selectedExam.price1 || 0).toFixed(2)),
      };
    });
  };

  const uploadImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !canUseApi) {
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    setUploadingImage(true);
    setMessage("Subiendo imagen...");

    try {
      const res = await fetch(`${apiBaseUrl}/promotions/upload-image`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error || `Error ${res.status}`);
      }

      const uploadedCardUrl = body?.cardUrl || body?.cardPath || "";
      const uploadedModalUrl = body?.modalUrl || body?.modalPath || body?.url || body?.path || "";
      if (!uploadedCardUrl || !uploadedModalUrl) {
        throw new Error("No se recibieron URLs de imagen (card/modal)");
      }

      setForm((prev) => ({
        ...prev,
        image: uploadedModalUrl,
        imageCard: uploadedCardUrl,
        imageModal: uploadedModalUrl,
      }));
      setMessage("Imagen subida correctamente (version card y modal). Ahora puedes guardar la promocion.");
    } catch (error) {
      setMessage(error.message || "No se pudo subir la imagen.");
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6 bg-white rounded-xl shadow-2xl border border-[#b2e4e5]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#01878A]">Admin de Promociones</h2>
        <button
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 font-semibold"
          onClick={onBackHome}
          type="button"
        >
          Volver al panel
        </button>
      </div>

      {!canUseApi && (
        <div className="mb-4 p-3 rounded border border-red-300 bg-red-50 text-red-700 text-sm font-medium">
          Configura VITE_API_BASE_URL para usar el modulo de promociones.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2"
          placeholder="Buscar por titulo o descripcion"
        />

        <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(event) => setIncludeInactive(event.target.checked)}
          />
          Incluir inactivas
        </label>

        <div className="text-sm text-gray-600 flex items-center">
          Total: {pagination.totalItems || 0}
        </div>
      </div>

      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 rounded-lg border border-[#b2e4e5] bg-[#f8ffff] mb-4">
        <select
          className="border border-gray-300 rounded px-3 py-2 md:col-span-2"
          value={form.examId}
          onChange={(event) => onExamChange(event.target.value)}
          required
        >
          <option value="">Selecciona un examen base</option>
          {examOptions.map((exam) => (
            <option key={exam.id} value={exam.id}>
              {exam.name} - S/ {Number(exam.price1 || 0).toFixed(2)}
            </option>
          ))}
        </select>
        <input
          className="border border-gray-300 rounded px-3 py-2"
          placeholder="Codigo interno (opcional)"
          value={form.code}
          onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
        />
        <input
          className="border border-gray-300 rounded px-3 py-2"
          placeholder="Titulo"
          value={form.title}
          onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
          required
        />
        <input
          className="border border-gray-300 rounded px-3 py-2"
          placeholder="Nombre corto para carrito (opcional)"
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
        />
        <input
          className="border border-gray-300 rounded px-3 py-2"
          placeholder="Imagen modal (auto)"
          value={form.image}
          onChange={(event) => setForm((prev) => ({ ...prev, image: event.target.value }))}
          readOnly
        />
        <label className="border border-dashed border-[#01878A] rounded px-3 py-2 text-sm text-[#016b6d] font-medium cursor-pointer hover:bg-[#f1fbfb]">
          {uploadingImage ? "Subiendo..." : "Subir imagen"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={uploadImage}
            disabled={!canUseApi || uploadingImage}
          />
        </label>
        <input
          className="border border-gray-300 rounded px-3 py-2"
          placeholder="Precio base (auto)"
          type="number"
          step="0.01"
          min="0"
          value={form.basePrice}
          onChange={(event) => setForm((prev) => ({ ...prev, basePrice: event.target.value }))}
          required
          readOnly
        />
        <input
          className="border border-gray-300 rounded px-3 py-2"
          placeholder="Promo publico"
          type="number"
          step="0.01"
          min="0"
          value={form.promoPricePublic}
          onChange={(event) => setForm((prev) => ({ ...prev, promoPricePublic: event.target.value }))}
          required
        />
        <input
          className="border border-gray-300 rounded px-3 py-2"
          placeholder="Promo convenio"
          type="number"
          step="0.01"
          min="0"
          value={form.promoPriceConvenio}
          onChange={(event) => setForm((prev) => ({ ...prev, promoPriceConvenio: event.target.value }))}
          required
        />
        <select
          className="border border-gray-300 rounded px-3 py-2"
          value={form.appliesTo}
          onChange={(event) => setForm((prev) => ({ ...prev, appliesTo: event.target.value }))}
        >
          <option value="publico">Solo publico</option>
          <option value="convenio">Solo convenio</option>
          <option value="ambos">Ambos canales</option>
        </select>
        <input
          className="border border-gray-300 rounded px-3 py-2"
          placeholder="Orden visual"
          type="number"
          step="1"
          value={form.displayOrder}
          onChange={(event) => setForm((prev) => ({ ...prev, displayOrder: event.target.value }))}
        />
        <select
          className="border border-gray-300 rounded px-3 py-2"
          value={form.active}
          onChange={(event) => setForm((prev) => ({ ...prev, active: event.target.value }))}
        >
          <option value="1">Activa</option>
          <option value="0">Inactiva</option>
        </select>
        <input className="hidden md:block" disabled value="" aria-hidden="true" />
        <textarea
          className="border border-gray-300 rounded px-3 py-2 md:col-span-2"
          placeholder="Fundamento de la prueba (auto desde examen)"
          value={form.fundament}
          onChange={(event) => setForm((prev) => ({ ...prev, fundament: event.target.value }))}
          rows={2}
          readOnly
        />
        <textarea
          className="border border-gray-300 rounded px-3 py-2 md:col-span-2"
          placeholder="Descripcion breve"
          value={form.description}
          onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          rows={2}
        />
        <textarea
          className="border border-gray-300 rounded px-3 py-2 md:col-span-2"
          placeholder="Descripcion larga"
          value={form.longDescription}
          onChange={(event) => setForm((prev) => ({ ...prev, longDescription: event.target.value }))}
          rows={4}
        />

        <div className="md:col-span-2 flex flex-wrap gap-2">
          <button
            type="submit"
            className="px-4 py-2 rounded bg-[#01878A] text-white font-semibold hover:bg-[#016b6d]"
            disabled={!canUseApi || uploadingImage}
          >
            {form.id ? "Actualizar" : "Crear"}
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300"
            onClick={resetForm}
          >
            Limpiar
          </button>
        </div>
      </form>

      {message && (
        <div className="mb-3 p-2 rounded border border-[#b2e4e5] bg-[#f1fbfb] text-[#016b6d] text-sm font-medium">
          {message}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-[#b2e4e5]">
        <table className="min-w-full text-sm">
          <thead className="bg-[#eaf6f6] text-[#016b6d]">
            <tr>
              <th className="text-left px-3 py-2">ID</th>
              <th className="text-left px-3 py-2">Titulo</th>
              <th className="text-left px-3 py-2">Precio</th>
              <th className="text-left px-3 py-2">Orden</th>
              <th className="text-left px-3 py-2">Estado</th>
              <th className="text-left px-3 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-3 py-3" colSpan={6}>Cargando...</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td className="px-3 py-3" colSpan={6}>Sin promociones.</td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-t border-[#e4f4f4]">
                  <td className="px-3 py-2">{item.id}</td>
                  <td className="px-3 py-2">
                    <div className="font-semibold text-[#015f61]">{item.title}</div>
                    <div className="text-xs text-gray-500">Examen ID: {item.examId || "-"}</div>
                  </td>
                  <td className="px-3 py-2">
                    {Number(item.basePrice || 0) > Number(item.price || 0) ? (
                      <div>
                        <span className="line-through text-gray-400 mr-2">S/ {Number(item.basePrice || 0).toFixed(2)}</span>
                        <span className="font-bold text-green-700">S/ {Number(item.price || 0).toFixed(2)}</span>
                      </div>
                    ) : (
                      <span>S/ {Number(item.price || 0).toFixed(2)}</span>
                    )}
                  </td>
                  <td className="px-3 py-2">{item.displayOrder || 0}</td>
                  <td className="px-3 py-2">{Number(item.active) === 1 ? "Activa" : "Inactiva"}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="px-2 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
                        onClick={() => selectForEdit(item)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600"
                        onClick={() => {
                          deletePromotion(item.id).catch((error) => {
                            setMessage(error.message || "No se pudo eliminar.");
                          });
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <button
          type="button"
          className="px-3 py-1 rounded bg-gray-200 text-gray-800 disabled:opacity-50"
          disabled={page <= 1 || loading}
          onClick={() => loadData(Math.max(1, page - 1))}
        >
          Anterior
        </button>
        <span className="text-sm text-gray-700">Pagina {pagination.page || page} de {pagination.totalPages || 1}</span>
        <button
          type="button"
          className="px-3 py-1 rounded bg-gray-200 text-gray-800 disabled:opacity-50"
          disabled={page >= (pagination.totalPages || 1) || loading}
          onClick={() => loadData(Math.min((pagination.totalPages || 1), page + 1))}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

PromotionsAdmin.propTypes = {
  onBackHome: PropTypes.func.isRequired,
};

export default PromotionsAdmin;
