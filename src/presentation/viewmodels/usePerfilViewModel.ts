// src/presentation/viewmodels/usePerfilViewModel.ts
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../config/firebaseConfig";
import { crearUsuarioDesdePerfil, Rol } from "../../data/datasources/usuarioService";
import { ensureAdminProfile } from "../../data/datasources/adminProfileService";

const digits = (v: unknown) => String(v ?? "").replace(/\D+/g, "");
const validarTelefonoPE = (tel: string) => /^9\d{8}$/.test(tel);

type ResetPayload = { telefono: string; nuevaPassword: string };
type ResetResult = { ok: boolean; telefono: string };
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

export function usePerfilViewModel() {
  // Estado: crear usuario
  const [telefono, setTelefono] = useState("");
  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState<Rol>("congresal");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Estado: reset contraseña
  const [telefonoReset, setTelefonoReset] = useState("");
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmNuevaPassword, setConfirmNuevaPassword] = useState("");
  const [loadingReset, setLoadingReset] = useState(false);

  useEffect(() => {
    ensureAdminProfile().catch((err: unknown) => {
      console.error(err);
      toast.error("⚠️ No se pudo validar el perfil admin.");
    });
  }, []);

  const validarCrear = (): string | null => {
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

  const validarReset = (): string | null => {
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

  const handleResetPassword = async () => {
    if (loadingReset) return;
    const err = validarReset();
    if (err) return toast.error(err);

    const tel = digits(telefonoReset).slice(0, 9);
    setLoadingReset(true);
    try {
      const callable = httpsCallable<ResetPayload, ResetResult>(functions, "resetPasswordByTelefono");
      const resp = await callable({ telefono: tel, nuevaPassword: nuevaPassword.trim() });
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

  return {
    // Estado crear
    telefono, setTelefono: (v: string) => setTelefono(digits(v).slice(0, 9)),
    nombre, setNombre,
    rol, setRol,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    loading,
    handleCrear,
    // Estado reset
    telefonoReset, setTelefonoReset: (v: string) => setTelefonoReset(digits(v).slice(0, 9)),
    nuevaPassword, setNuevaPassword,
    confirmNuevaPassword, setConfirmNuevaPassword,
    loadingReset,
    handleResetPassword,
  };
}
