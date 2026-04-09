// src/presentation/views/Perfil.tsx
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { usePerfilViewModel } from "../viewmodels/usePerfilViewModel";
import { Rol } from "../../data/datasources/usuarioService";

export default function Perfil() {
  const {
    telefono, setTelefono,
    nombre, setNombre,
    rol, setRol,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    loading, handleCrear,
    telefonoReset, setTelefonoReset,
    nuevaPassword, setNuevaPassword,
    confirmNuevaPassword, setConfirmNuevaPassword,
    loadingReset, handleResetPassword,
  } = usePerfilViewModel();

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <ToastContainer position="top-center" autoClose={3000} />

      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-4 bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Perfil</h1>
              <p className="text-sm text-gray-600 mt-1">
                Crear usuario para acceso móvil (Directorio) y resetear contraseña.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs font-semibold px-3 py-1 rounded-full border border-red-200 bg-red-50 text-red-700">
                Panel de administración
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Crear usuario móvil */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Crear usuario móvil</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Crea acceso para la app móvil usando teléfono + contraseña.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-600 text-white">
                Principal
              </span>
            </div>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Nombre completo</label>
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: MANUEL INGA"
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
                />
                <p className="text-xs text-gray-500 mt-1">Solo letras y espacios.</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Teléfono</label>
                <input
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  inputMode="numeric"
                  placeholder="9XXXXXXXX"
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
                />
                <p className="text-xs text-gray-500 mt-1">9 dígitos y empieza con 9 (Perú).</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Rol</label>
                <select
                  value={rol}
                  onChange={(e) => setRol(e.target.value as Rol)}
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
                >
                  <option value="congresal">Congresal</option>
                  <option value="parlamento">Parlamento</option>
                  <option value="admin">Administrador</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Define permisos en la app móvil.</p>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Confirmar contraseña</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleCrear}
                disabled={loading}
                className={`rounded-xl px-5 py-2 text-sm font-semibold text-white transition ${loading ? "bg-gray-400" : "bg-red-600 hover:bg-red-700"}`}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Creando...
                  </span>
                ) : "Crear usuario móvil"}
              </button>
            </div>
          </section>

          {/* Reset contraseña */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Reset contraseña móvil</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Solo el admin puede resetear la contraseña por teléfono.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-900 text-white">
                Admin
              </span>
            </div>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Teléfono</label>
                <input
                  value={telefonoReset}
                  onChange={(e) => setTelefonoReset(e.target.value)}
                  inputMode="numeric"
                  placeholder="9XXXXXXXX"
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-600/20 focus:border-gray-400"
                />
                <p className="text-xs text-gray-500 mt-1">Debe existir el usuario con ese teléfono.</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Nueva contraseña</label>
                <input
                  type="password"
                  value={nuevaPassword}
                  onChange={(e) => setNuevaPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-600/20 focus:border-gray-400"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Confirmar nueva contraseña</label>
                <input
                  type="password"
                  value={confirmNuevaPassword}
                  onChange={(e) => setConfirmNuevaPassword(e.target.value)}
                  placeholder="Repite la nueva contraseña"
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-600/20 focus:border-gray-400"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleResetPassword}
                disabled={loadingReset}
                className={`rounded-xl px-5 py-2 text-sm font-semibold text-white transition ${loadingReset ? "bg-gray-400" : "bg-gray-800 hover:bg-black"}`}
              >
                {loadingReset ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Reseteando...
                  </span>
                ) : "Reset contraseña"}
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs text-gray-600">
                <b>Nota:</b> Si sale "No autenticado", inicia sesión como admin. Si sale "No existe",
                ese teléfono no está registrado en Auth.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
