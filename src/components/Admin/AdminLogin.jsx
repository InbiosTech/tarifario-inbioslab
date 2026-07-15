import PropTypes from "prop-types";
import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || "").trim();

function AdminLogin({ onAuthenticated }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${API_BASE_URL}/auth/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error || "No se pudo iniciar sesion");
      }

      setPassword("");
      onAuthenticated();
    } catch (error) {
      setMessage(error.message || "Credenciales invalidas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 sm:p-6 bg-white rounded-2xl shadow-2xl border border-[#b2e4e5]">
      <div className="mb-4 text-center">
        <h2 className="text-2xl font-black text-[#017f82]">Ingreso Administrador</h2>
        <p className="text-sm text-[#016b6d] mt-1">Acceso restringido al panel interno.</p>
      </div>

      <form onSubmit={onSubmit} className="grid gap-3">
        <input
          className="border border-gray-300 rounded px-3 py-2"
          placeholder="Usuario"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
        />
        <div className="relative">
          <input
            className="w-full border border-gray-300 rounded px-3 py-2 pr-11"
            type={showPassword ? "text" : "password"}
            placeholder="Contrasena"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 px-3 text-[#016b6d] hover:text-[#01878A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#01878A] focus-visible:ring-offset-1 rounded-r"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
            aria-pressed={showPassword}
            title={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
          >
            {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
          </button>
        </div>
        <button
          type="submit"
          className="px-4 py-2 rounded bg-[#01878A] text-white font-semibold hover:bg-[#016b6d] disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Validando..." : "Ingresar"}
        </button>
      </form>

      {message && (
        <div className="mt-3 p-2 rounded border border-red-200 bg-red-50 text-red-700 text-sm">
          {message}
        </div>
      )}
    </div>
  );
}

AdminLogin.propTypes = {
  onAuthenticated: PropTypes.func.isRequired,
};

export default AdminLogin;
