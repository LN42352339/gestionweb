import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

admin.initializeApp();

type ResetPayload = {
  telefono: string;
  nuevaPassword: string;
};

const digits = (v: unknown) => String(v ?? "").replace(/\D+/g, "");

// ⚠️ MISMO dominio que usas al crear usuarios en tu web: @conectape.pe
function buildEmailFromPhone(phone: string) {
  return `${digits(phone)}@conectape.pe`;
}

export const resetPasswordByTelefono = onCall<ResetPayload>(async (request) => {
  // 1) Debe estar autenticado
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "No autenticado.");
  }

  // 2) Solo admin (custom claim)
  const rol = (request.auth.token as any)?.rol;
  if (rol !== "admin") {
    throw new HttpsError("permission-denied", "No autorizado.");
  }

  const telefono = digits(request.data?.telefono).slice(0, 9);
  const nuevaPassword = String(request.data?.nuevaPassword ?? "").trim();

  if (!/^9\d{8}$/.test(telefono)) {
    throw new HttpsError("invalid-argument", "Teléfono inválido.");
  }
  if (nuevaPassword.length < 6) {
    throw new HttpsError("invalid-argument", "Contraseña mínimo 6 caracteres.");
  }

  const email = buildEmailFromPhone(telefono);

  // 3) Buscar usuario por email y cambiar contraseña
  const user = await admin.auth().getUserByEmail(email);
  await admin.auth().updateUser(user.uid, { password: nuevaPassword });

  // (Opcional) Marca en Firestore
  await admin.firestore().collection("usuarios").doc(user.uid).set(
    {
      passwordReseteadaPorAdmin: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return { ok: true, telefono };
});
