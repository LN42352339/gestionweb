// src/presentation/views/Perfil.tsx
import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { crearUsuarioDesdePerfil, Rol } from "../../data/datasources/usuarioService";
import { ensureAdminProfile } from "../../data/datasources/adminProfileService";

import { functions } from "../../config/firebaseConfig";
import { httpsCallable } from "firebase/functions";

const digits = (v: unknown) => String(v ?? "").replace(/\D+/g, "");
const validarTelefonoPE = (tel: string) => /^9\d{8}$/.test(tel);

type ResetPayload = { telefono: string; nuevaPassword: string };
type ResetResult = { ok: boolean; telefono: string };

// ✅ Tipado seguro para errores de Callable Functions (sin any)
type CallableError = { code?: string; message?: string };
const getCallableError = (e: unknown): CallableError => {
  if (typeof e === "object" && e !== null) {
    const obj = e as Record<string, unknown>;
    return {
      code: typeof obj.code === "string" ? obj.code : undefined,
      message: typeof obj.message === "string" ? obj.message : undefined,
    };
  }
  return {};
};

export default function Perfil() {
  // ====== Crear usuario móvil ======
  const [telefono, setTelefono] = useState("");
  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState<Rol>("congresal");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // ====== Reset contraseña móvil ======
  const [telefonoReset, setTelefonoReset] = useState("");
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmNuevaPassword, setConfirmNuevaPassword] = useState("");
  const [loadingReset, setLoadingReset] = useState(false);

  // ✅ Asegurar que el perfil admin exista en Firestore
  useEffect(() => {
    ensureAdminProfile().catch((err: unknown) => {
      console.error(err);
      toast.error("⚠️ No se pudo validar el perfil admin.");
    });
  }, []);

  // =========================
  // ✅ Validaciones Crear Usuario
  // =========================
  const validarCrear = () => {
    const tel = digits(telefono).slice(0, 9);

    if (!nombre.trim()) return "El nombre es obligatorio.";
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/.test(nombre.trim()))
      return "El nombre solo debe contener letras y espacios.";

    if (!validarTelefonoPE(tel))
      return "El teléfono debe tener 9 dígitos y comenzar con 9 (Perú).";

    if (!password.trim()) return "La contraseña es obligatoria.";
    if (password.trim().length < 6) return "La contraseña debe tener mínimo 6 caracteres.";

    if (password.trim() !== confirmPassword.trim()) return "Las contraseñas no coinciden.";

    return null;
  };

  // =========================
  // ✅ Crear Usuario Móvil
  // =========================
  const handleCrear = async () => {
    if (loading) return;

    const err = validarCrear();
    if (err) return toast.error(err);

    const tel = digits(telefono).slice(0, 9);

    setLoading(true);
    try {
      const res = await crearUsuarioDesdePerfil({
        telefono: tel,
        password: password.trim(),
        nombre: nombre.trim().toUpperCase(),
        rol,
      });

      const numero = res.email?.includes("@") ? res.email.split("@")[0] : res.email;
      toast.success(`✅ Usuario creado: ${numero}`);

      setTelefono("");
      setNombre("");
      setPassword("");
      setConfirmPassword("");
      setRol("congresal");
    } catch (e: unknown) {
      console.error(e);

      const code = (e as { code?: string })?.code ?? "";
      const msg = e instanceof Error ? e.message : String(e ?? "");

      if (code === "telefono/ya-existe") return toast.error("⚠️ Ese teléfono ya está registrado.");

      if (code === "auth/email-already-in-use" || msg.includes("auth/email-already-in-use"))
        return toast.error("⚠️ Ese teléfono ya está registrado.");

      if (code === "auth/weak-password" || msg.includes("auth/weak-password"))
        return toast.error("⚠️ Contraseña muy débil (mínimo 6 caracteres).");

      toast.error("❌ No se pudo crear el usuario. Revisa consola.");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // ✅ Validaciones Reset
  // =========================
  const validarReset = () => {
    const tel = digits(telefonoReset).slice(0, 9);

    if (!validarTelefonoPE(tel))
      return "El teléfono debe tener 9 dígitos y comenzar con 9 (Perú).";

    if (!nuevaPassword.trim()) return "La nueva contraseña es obligatoria.";
    if (nuevaPassword.trim().length < 6)
      return "La nueva contraseña debe tener mínimo 6 caracteres.";

    if (nuevaPassword.trim() !== confirmNuevaPassword.trim())
      return "Las nuevas contraseñas no coinciden.";

    return null;
  };

  // =========================
  // ✅ Reset contraseña (Cloud Function onCall)
  // =========================
  const handleResetPassword = async () => {
    if (loadingReset) return;

    const err = validarReset();
    if (err) return toast.error(err);

    const tel = digits(telefonoReset).slice(0, 9);

    setLoadingReset(true);
    try {
      const callable = httpsCallable<ResetPayload, ResetResult>(
        functions,
        "resetPasswordByTelefono"
      );

      const resp = await callable({
        telefono: tel,
        nuevaPassword: nuevaPassword.trim(),
      });

      if (resp.data?.ok) {
        toast.success(`✅ Contraseña reseteada para: ${resp.data.telefono}`);
        setTelefonoReset("");
        setNuevaPassword("");
        setConfirmNuevaPassword("");
      } else {
        toast.error("❌ No se pudo resetear la contraseña.");
      }
    } catch (e: unknown) {
      console.error(e);

      const { code, message } = getCallableError(e);

      if (code?.includes("unauthenticated"))
        return toast.error("❌ No autenticado. Inicia sesión como admin.");

      if (code?.includes("permission-denied"))
        return toast.error("❌ No autorizado. Solo admin puede resetear.");

      if (code?.includes("not-found"))
        return toast.error("⚠️ No existe un usuario con ese teléfono.");

      if (code?.includes("invalid-argument"))
        return toast.error("⚠️ Datos inválidos. Revisa teléfono y contraseña.");

      toast.error("❌ " + (message || "Error al resetear."));
    } finally {
      setLoadingReset(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <ToastContainer position="top-center" autoClose={3000} />

      {/* CONTENEDOR GENERAL: más ancho para evitar el “vacío” */}
      <div className="mx-auto max-w-6xl">
        {/* HEADER */}
        <div className="mb-4 bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Perfil</h1>
              <p className="text-sm text-gray-600 mt-1">
                Crear usuario para acceso móvil (Directorio) y resetear contraseña.
              </p>
            </div>

            {/* Badge informativo */}
            <div className="inline-flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs font-semibold px-3 py-1 rounded-full border border-red-200 bg-red-50 text-red-700">
                Panel de administración
              </span>
            </div>
          </div>
        </div>

        {/* GRID: 2 columnas en PC / 1 en móvil */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* =========================
              COLUMNA 1: CREAR USUARIO
             ========================= */}
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
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
                />
                <p className="text-xs text-gray-500 mt-1">Solo letras y espacios.</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Teléfono</label>
                <input
                  value={telefono}
                  onChange={(e) => setTelefono(digits(e.target.value).slice(0, 9))}
                  inputMode="numeric"
                  placeholder="9XXXXXXXX"
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
                />
                <p className="text-xs text-gray-500 mt-1">9 dígitos y empieza con 9 (Perú).</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Rol</label>
                <select
                  value={rol}
                  onChange={(e) => setRol(e.target.value as Rol)}
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
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
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Confirmar contraseña</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleCrear}
                disabled={loading}
                className={`rounded-xl px-5 py-2 text-sm font-semibold text-white transition
                  ${loading ? "bg-gray-400" : "bg-red-600 hover:bg-red-700"}`}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Creando...
                  </span>
                ) : (
                  "Crear usuario móvil"
                )}
              </button>
            </div>
          </section>

          {/* =========================
              COLUMNA 2: RESET PASSWORD
             ========================= */}
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
                  onChange={(e) => setTelefonoReset(digits(e.target.value).slice(0, 9))}
                  inputMode="numeric"
                  placeholder="9XXXXXXXX"
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-gray-600/20 focus:border-gray-400"
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
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-gray-600/20 focus:border-gray-400"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Confirmar nueva contraseña</label>
                <input
                  type="password"
                  value={confirmNuevaPassword}
                  onChange={(e) => setConfirmNuevaPassword(e.target.value)}
                  placeholder="Repite la nueva contraseña"
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-gray-600/20 focus:border-gray-400"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleResetPassword}
                disabled={loadingReset}
                className={`rounded-xl px-5 py-2 text-sm font-semibold text-white transition
                  ${loadingReset ? "bg-gray-400" : "bg-gray-800 hover:bg-black"}`}
              >
                {loadingReset ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Reseteando...
                  </span>
                ) : (
                  "Reset contraseña"
                )}
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs text-gray-600">
                <b>Nota:</b> Si sale “No autenticado”, inicia sesión como admin. Si sale “No existe”,
                ese teléfono no está registrado en Auth.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
