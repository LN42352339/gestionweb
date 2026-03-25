// src/data/datasources/adminProfileService.ts
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../../config/firebaseConfig";

// Ajusta si en tu firebaseConfig exportas distinto:
// export const auth = getAuth(app);
// export const db = getFirestore(app);

export type Rol = "admin" | "congresal" | "parlamento";

export const ensureAdminProfile = async (): Promise<void> => {
  const user = auth.currentUser;
  if (!user) return;

  const ref = doc(db, "usuarios", user.uid);
  const snap = await getDoc(ref);

  // Si no existe, lo creamos con rol admin (tu caso web admin)
  if (!snap.exists()) {
    await setDoc(
      ref,
      {
        email: user.email ?? "",
        nombre: user.displayName ?? "ADMIN",
        rol: "admin" as Rol,
        activo: true,
        creadoEn: serverTimestamp(),
        actualizadoEn: serverTimestamp(),
      },
      { merge: true }
    );
    return;
  }

  // Si existe, solo aseguramos activo y timestamps (y NO tocamos rol si ya existe)
  await setDoc(
    ref,
    {
      email: user.email ?? "",
      activo: true,
      actualizadoEn: serverTimestamp(),
    },
    { merge: true }
  );
};
