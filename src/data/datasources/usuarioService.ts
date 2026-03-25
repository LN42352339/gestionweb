import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { db, secondaryAuth } from "../../config/firebaseConfig";

export type Rol = "admin" | "congresal" | "parlamento";

export interface Usuario {
  id?: string; // normalmente será el UID (docId)
  telefono: string;
  rol: Rol;
  nombre?: string;
  email?: string;
  activo?: boolean;
}

/**
 * Error tipado para evitar `any` y poder leer `.code` de forma segura.
 */
interface AppError extends Error {
  code?: string;
}

const digits = (v: unknown): string => String(v ?? "").replace(/\D+/g, "");

function buildEmailFromPhone(phone: string): string {
  return `${digits(phone)}@conectape.pe`;
}

// ✅ Obtener usuario por teléfono (para login móvil o validación)
export async function obtenerUsuarioPorTelefono(
  telefono: string
): Promise<Usuario | null> {
  const tel = digits(telefono);

  const usuariosRef = collection(db, "usuarios");
  const q = query(usuariosRef, where("telefono", "==", tel));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const d = snapshot.docs[0];
  return { id: d.id, ...(d.data() as Usuario) };
}

// ✅ Crear usuario desde perfil (admin web) sin cerrar tu sesión admin
export async function crearUsuarioDesdePerfil(params: {
  telefono: string;
  password: string;
  nombre: string;
  rol: Rol;
}): Promise<{ uid: string; email: string }> {
  const telefonoClean = digits(params.telefono);

  // Validación Perú (9 dígitos y empieza en 9)
  if (!/^9\d{8}$/.test(telefonoClean)) {
    throw new Error("El teléfono debe tener 9 dígitos y comenzar con 9 (Perú).");
  }

  // ✅ 0) Validar si ya existe en Firestore por teléfono
  const existente = await obtenerUsuarioPorTelefono(telefonoClean);
  if (existente) {
    const err: AppError = new Error("Ese teléfono ya está registrado.");
    err.code = "telefono/ya-existe";
    throw err;
  }

  const email = buildEmailFromPhone(telefonoClean);

  // 1) Crear usuario en Auth con auth secundario
  const cred = await createUserWithEmailAndPassword(
    secondaryAuth,
    email,
    params.password
  );

  const uid = cred.user.uid;

  // 2) Guardar en Firestore (docId = uid)
  await setDoc(doc(db, "usuarios", uid), {
    uid,
    email,
    telefono: telefonoClean,
    nombre: params.nombre,
    rol: params.rol,
    activo: true,
    createdAt: serverTimestamp(),
  });

  // 3) Cerrar SOLO la sesión del auth secundario
  await signOut(secondaryAuth);

  return { uid, email };
}
