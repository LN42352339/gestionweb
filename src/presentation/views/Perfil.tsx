// src/presentation/views/Perfil.tsx
import { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import {
  crearUsuarioDesdePerfil,
  Rol,
} from "../../data/datasources/usuarioService"; // ✅ ajusta ruta si cambió

const digits = (v: unknown) => String(v ?? "").replace(/\D+/g, "");

export default function Perfil() {
  const [telefono, setTelefono] = useState("");
  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState<Rol>("congresal");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Validaciones simples y claras
  const validar = () => {
    const tel = digits(telefono);

    if (!nombre.trim()) return "El nombre es obligatorio.";
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/.test(nombre.trim()))
      return "El nombre solo debe contener letras y espacios.";

    if (!/^9\d{8}$/.test(tel))
      return "El teléfono debe tener 9 dígitos y comenzar con 9 (Perú).";

    if (!password.trim()) return "La contraseña es obligatoria.";
    if (password.trim().length < 6)
      return "La contraseña debe tener mínimo 6 caracteres.";

    return null;
  };

  const handleCrear = async () => {
    const err = validar();
    if (err) return toast.error(err);

    setLoading(true);
    try {
      const res = await crearUsuarioDesdePerfil({
        telefono: digits(telefono),
        password: password.trim(),
        nombre: nombre.trim().toUpperCase(),
        rol,
      });

      toast.success(`✅ Usuario creado: ${res.email}`);

      // limpiar form
      setTelefono("");
      setNombre("");
      setPassword("");
      setRol("congresal");
    } catch (e: any) {
      console.error(e);

      // mensajes comunes de Firebase (más amigables)
      const msg = String(e?.message ?? "");
      if (msg.includes("auth/email-already-in-use"))
        return toast.error("⚠️ Ese teléfono ya está registrado.");
      if (msg.includes("auth/weak-password"))
        return toast.error("⚠️ Contraseña muy débil (mínimo 6 caracteres).");

      toast.error("❌ No se pudo crear el usuario. Revisa consola.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <ToastContainer position="top-center" autoClose={3000} />

      <div className="mx-auto max-w-2xl bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-800">Perfil</h1>
        <p className="text-sm text-gray-600 mt-1">
          Crear usuario para acceso móvil (Directorio).
        </p>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nombre */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700">
              Nombre completo
            </label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: MANUEL INGA"
              className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
            />
          </div>

          {/* Teléfono */}
          <div>
            <label className="text-sm font-medium text-gray-700">Teléfono</label>
            <input
              value={telefono}
              onChange={(e) => {
                const v = digits(e.target.value).slice(0, 9);
                setTelefono(v);
              }}
              inputMode="numeric"
              placeholder="9XXXXXXXX"
              className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
            />
            <p className="text-xs text-gray-500 mt-1">
              Debe tener 9 dígitos y empezar con 9 (Perú).
            </p>
          </div>

          {/* Rol */}
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
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Password */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
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
            {loading ? "Creando..." : "Crear usuario móvil"}
          </button>
        </div>
      </div>
    </div>
  );
}
